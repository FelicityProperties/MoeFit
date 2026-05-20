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
