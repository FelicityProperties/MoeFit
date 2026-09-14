// Server-only Neon Postgres access. Stores the entire AppState as a single
// JSONB row (id = "default" for the single passcode-protected user).
//
// Requires the DATABASE_URL env var (Vercel's Neon integration sets this for
// you). Never import this from a client component — it would leak credentials.

import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function sql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_sql) _sql = neon(url);
  return _sql;
}

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  const q = sql();
  await q`
    CREATE TABLE IF NOT EXISTS user_state (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export interface StoredState {
  data: unknown;
  updatedAt: string;
}

export async function getState(id = "default"): Promise<StoredState | null> {
  await ensureTable();
  const q = sql();
  const rows = (await q`
    SELECT data, updated_at FROM user_state WHERE id = ${id}
  `) as { data: unknown; updated_at: string }[];
  if (rows.length === 0) return null;
  return { data: rows[0].data, updatedAt: new Date(rows[0].updated_at).toISOString() };
}

export async function putState(data: unknown, id = "default"): Promise<StoredState> {
  await ensureTable();
  const q = sql();
  const rows = (await q`
    INSERT INTO user_state (id, data, updated_at)
    VALUES (${id}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    RETURNING updated_at
  `) as { updated_at: string }[];
  return { data, updatedAt: new Date(rows[0].updated_at).toISOString() };
}

// ---------------------------------------------------------------------------
// Subscriptions (Stripe) — one row per user email.
// ---------------------------------------------------------------------------

export interface SubscriptionRow {
  email: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  /** Stripe status: active | trialing | past_due | canceled | incomplete | ... */
  status: string;
  plan: "pro" | "free";
  currentPeriodEnd: string | null; // ISO
}

let subsTableReady = false;

async function ensureSubscriptionsTable() {
  if (subsTableReady) return;
  const q = sql();
  await q`
    CREATE TABLE IF NOT EXISTS subscriptions (
      email text PRIMARY KEY,
      stripe_customer_id text,
      stripe_subscription_id text,
      status text NOT NULL DEFAULT 'none',
      plan text NOT NULL DEFAULT 'free',
      current_period_end timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await q`CREATE INDEX IF NOT EXISTS subscriptions_customer_idx ON subscriptions (stripe_customer_id)`;
  subsTableReady = true;
}

interface SubRawRow {
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan: string;
  current_period_end: string | null;
}

function toSubRow(r: SubRawRow): SubscriptionRow {
  return {
    email: r.email,
    stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    status: r.status,
    plan: r.plan === "pro" ? "pro" : "free",
    currentPeriodEnd: r.current_period_end
      ? new Date(r.current_period_end).toISOString()
      : null,
  };
}

export async function getSubscription(email: string): Promise<SubscriptionRow | null> {
  await ensureSubscriptionsTable();
  const q = sql();
  const rows = (await q`
    SELECT email, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end
    FROM subscriptions WHERE email = ${email.toLowerCase()}
  `) as SubRawRow[];
  return rows.length ? toSubRow(rows[0]) : null;
}

export async function findSubscriptionByCustomer(
  customerId: string
): Promise<SubscriptionRow | null> {
  await ensureSubscriptionsTable();
  const q = sql();
  const rows = (await q`
    SELECT email, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end
    FROM subscriptions WHERE stripe_customer_id = ${customerId} LIMIT 1
  `) as SubRawRow[];
  return rows.length ? toSubRow(rows[0]) : null;
}

export async function upsertSubscription(row: SubscriptionRow): Promise<void> {
  await ensureSubscriptionsTable();
  const q = sql();
  await q`
    INSERT INTO subscriptions
      (email, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end, updated_at)
    VALUES
      (${row.email.toLowerCase()}, ${row.stripeCustomerId}, ${row.stripeSubscriptionId},
       ${row.status}, ${row.plan}, ${row.currentPeriodEnd}, now())
    ON CONFLICT (email) DO UPDATE SET
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      plan = EXCLUDED.plan,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now()
  `;
}
