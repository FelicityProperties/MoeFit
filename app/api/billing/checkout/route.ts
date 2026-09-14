import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConfigured, getSubscription } from "@/lib/db";
import { BILLING_ENABLED, appUrl, proPriceId, stripe } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Starts a Stripe Checkout session for FeliHealth Pro and returns its URL.
export async function POST(req: Request) {
  if (!BILLING_ENABLED) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const base = appUrl(req);
  try {
    // Reuse the Stripe customer if this user already has one.
    const existing = dbConfigured() ? await getSubscription(email) : null;

    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: proPriceId(), quantity: 1 }],
      ...(existing?.stripeCustomerId
        ? { customer: existing.stripeCustomerId }
        : { customer_email: email }),
      client_reference_id: email,
      metadata: { email },
      subscription_data: { metadata: { email } },
      allow_promotion_codes: true,
      success_url: `${base}/settings?billing=success`,
      cancel_url: `${base}/settings?billing=cancel`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
