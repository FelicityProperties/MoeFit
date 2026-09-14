import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { BILLING_ENABLED, getEntitlement, getProPrice } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

// Public: safe to call signed-out (the landing page shows the live price).
export async function GET() {
  const price = await getProPrice();
  const session = GOOGLE ? await auth() : null;
  const email = session?.user?.email ?? null;

  if (!email) {
    return NextResponse.json({
      enabled: BILLING_ENABLED,
      authenticated: false,
      email: null,
      plan: "free",
      isAdmin: false,
      status: "signed_out",
      currentPeriodEnd: null,
      hasCustomer: false,
      price,
    });
  }

  const ent = await getEntitlement(email);
  return NextResponse.json({
    enabled: BILLING_ENABLED,
    authenticated: true,
    email,
    plan: ent.plan,
    isAdmin: ent.isAdmin,
    status: ent.status,
    currentPeriodEnd: ent.currentPeriodEnd,
    hasCustomer: Boolean(ent.customerId),
    price,
  });
}
