import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConfigured, getSubscription } from "@/lib/db";
import { BILLING_ENABLED, appUrl, stripe } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Opens the Stripe Customer Portal (change card, cancel, invoices).
export async function POST(req: Request) {
  if (!BILLING_ENABLED) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const row = await getSubscription(email);
  if (!row?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription on this account yet." }, { status: 400 });
  }
  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: row.stripeCustomerId,
      return_url: `${appUrl(req)}/settings`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("Stripe portal error:", e);
    return NextResponse.json({ error: "Could not open billing portal." }, { status: 500 });
  }
}
