// Server-only Stripe billing + entitlement logic for FeliHealth Pro.
//
// Model: Free = full manual tracker + built-in coach. Pro = everything that
// runs on Claude (AI coach, photo analysis, meal plans, AI daily review) — i.e.
// every paid feature is one that costs money to serve.
//
// Billing is only active when STRIPE_SECRET_KEY + STRIPE_PRICE_ID are set AND
// the app runs in Google-auth mode (billing needs a per-user identity). With
// billing off, signed-in users keep full access — so the app still works as a
// personal tool until you flip it on.

import Stripe from "stripe";
import {
  dbConfigured,
  getSubscription,
  upsertSubscription,
  type SubscriptionRow,
} from "./db";

export const BILLING_ENABLED = Boolean(
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID
);

let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}

export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id) throw new Error("STRIPE_PRICE_ID is not set");
  return id;
}

/** Owner/admin accounts always have Pro (comma-separated ADMIN_EMAILS). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export interface Entitlement {
  plan: "pro" | "free";
  isAdmin: boolean;
  status: string;
  currentPeriodEnd: string | null;
  customerId: string | null;
}

const GRACE_MS = 24 * 60 * 60 * 1000; // tolerate webhook lag around renewal

/** Resolve what a signed-in user is entitled to. */
export async function getEntitlement(email: string): Promise<Entitlement> {
  if (isAdminEmail(email)) {
    return { plan: "pro", isAdmin: true, status: "admin", currentPeriodEnd: null, customerId: null };
  }
  if (!BILLING_ENABLED) {
    // Billing off -> everyone signed in is effectively Pro (personal mode).
    return { plan: "pro", isAdmin: false, status: "billing_disabled", currentPeriodEnd: null, customerId: null };
  }
  if (!dbConfigured()) {
    return { plan: "free", isAdmin: false, status: "no_db", currentPeriodEnd: null, customerId: null };
  }
  const row = await getSubscription(email);
  if (!row) {
    return { plan: "free", isAdmin: false, status: "none", currentPeriodEnd: null, customerId: null };
  }
  const active =
    row.plan === "pro" &&
    (!row.currentPeriodEnd ||
      new Date(row.currentPeriodEnd).getTime() + GRACE_MS > Date.now());
  return {
    plan: active ? "pro" : "free",
    isAdmin: false,
    status: row.status,
    currentPeriodEnd: row.currentPeriodEnd,
    customerId: row.stripeCustomerId,
  };
}

/**
 * Stripe moved current_period_end from the subscription onto its items in
 * newer API versions; read whichever is present.
 */
function periodEndOf(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  const legacy = sub as unknown as { current_period_end?: number };
  const ts = item?.current_period_end ?? legacy.current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
}

/** Persist a Stripe subscription's state for a user. */
export async function syncSubscription(
  email: string,
  sub: Stripe.Subscription,
  customerId: string | null
): Promise<SubscriptionRow> {
  const status = sub.status;
  const plan: "pro" | "free" = status === "active" || status === "trialing" ? "pro" : "free";
  const row: SubscriptionRow = {
    email: email.toLowerCase(),
    stripeCustomerId:
      customerId ?? (typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null),
    stripeSubscriptionId: sub.id,
    status,
    plan,
    currentPeriodEnd: periodEndOf(sub),
  };
  await upsertSubscription(row);
  return row;
}

// --- Pro price (for display), cached so the landing page doesn't hit Stripe on every load ---

export interface PriceInfo {
  amount: number; // in major units, e.g. 9.99
  currency: string; // e.g. "usd"
  interval: string; // "month" | "year"
  label: string; // "$9.99/month"
}

let priceCache: { at: number; value: PriceInfo | null } | null = null;
const PRICE_TTL_MS = 10 * 60 * 1000;

export async function getProPrice(): Promise<PriceInfo | null> {
  if (!BILLING_ENABLED) return null;
  if (priceCache && Date.now() - priceCache.at < PRICE_TTL_MS) return priceCache.value;
  try {
    const p = await stripe().prices.retrieve(proPriceId());
    const amount = (p.unit_amount ?? 0) / 100;
    const currency = (p.currency ?? "usd").toLowerCase();
    const interval = p.recurring?.interval ?? "month";
    const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() });
    const value: PriceInfo = { amount, currency, interval, label: `${fmt.format(amount)}/${interval}` };
    priceCache = { at: Date.now(), value };
    return value;
  } catch (e) {
    console.error("Stripe price lookup failed:", e);
    priceCache = { at: Date.now(), value: null };
    return null;
  }
}

/** Public base URL for Stripe redirects (custom domain aware). */
export function appUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
