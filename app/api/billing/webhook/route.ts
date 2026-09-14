import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { findSubscriptionByCustomer } from "@/lib/db";
import { BILLING_ENABLED, stripe, syncSubscription } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe -> us. Verifies the signature against STRIPE_WEBHOOK_SECRET and keeps
// the subscriptions table in sync. Configure the endpoint in Stripe as
//   https://YOUR-DOMAIN/api/billing/webhook
// with events: checkout.session.completed, customer.subscription.created,
// customer.subscription.updated, customer.subscription.deleted.

function customerIdOf(c: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!BILLING_ENABLED || !secret) {
    return NextResponse.json({ error: "Billing webhook not configured." }, { status: 503 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Must verify against the RAW body — never a re-serialized JSON object.
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error("Stripe signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode !== "subscription") break;
        const email =
          s.metadata?.email ||
          s.customer_details?.email ||
          s.customer_email ||
          s.client_reference_id ||
          null;
        const customerId = customerIdOf(s.customer);
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (email && subId) {
          const sub = await stripe().subscriptions.retrieve(subId);
          await syncSubscription(email, sub, customerId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = customerIdOf(sub.customer);
        let email: string | null = sub.metadata?.email ?? null;
        if (!email && customerId) {
          email = (await findSubscriptionByCustomer(customerId))?.email ?? null;
        }
        if (!email && customerId) {
          const cust = await stripe().customers.retrieve(customerId);
          if (!("deleted" in cust && cust.deleted)) email = (cust as Stripe.Customer).email ?? null;
        }
        if (email) await syncSubscription(email, sub, customerId);
        break;
      }
      default:
        // Other events are acknowledged but ignored.
        break;
    }
  } catch (e) {
    console.error(`Webhook handler error for ${event.type}:`, e);
    // 500 makes Stripe retry, which is what we want for transient DB errors.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
