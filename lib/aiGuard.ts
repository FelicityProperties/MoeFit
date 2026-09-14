// Server-side guard for the AI routes (/api/coach, /api/order, /api/meals,
// /api/review). These endpoints spend Anthropic API credits, so they must
// only be callable by an authenticated user who is entitled to them.
//
// The gate mirrors the app's modes:
// - Local-only (no cloud)      -> open (no auth UI exists; not a public deploy)
// - Cloud + passcode           -> requires the passcode cookie
// - Cloud + Google             -> requires a session; if Stripe billing is
//                                 configured, additionally requires Pro
//                                 (402 Payment Required otherwise)

import { NextResponse } from "next/server";
import { isAuthed, passcodeConfigured } from "./auth";
import { auth } from "@/auth";
import { BILLING_ENABLED, getEntitlement } from "./billing";

const CLOUD = process.env.NEXT_PUBLIC_CLOUD_ENABLED === "true";
const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

export type AiAccess =
  | { ok: true; email: string | null }
  | { ok: false; status: 401 | 402; error: string };

export async function checkAiAccess(): Promise<AiAccess> {
  if (!CLOUD) return { ok: true, email: null };

  if (GOOGLE) {
    const session = await auth();
    const email = session?.user?.email ?? null;
    if (!email) return { ok: false, status: 401, error: "Sign in required." };
    if (BILLING_ENABLED) {
      const ent = await getEntitlement(email);
      if (ent.plan !== "pro") {
        return {
          ok: false,
          status: 402,
          error: "FeliHealth Pro required for AI features.",
        };
      }
    }
    return { ok: true, email };
  }

  if (passcodeConfigured()) {
    return (await isAuthed())
      ? { ok: true, email: null }
      : { ok: false, status: 401, error: "Unauthorized." };
  }
  // Cloud flag on but nothing configured — fail open so the app isn't bricked
  // during setup (the state endpoint still refuses without auth).
  return { ok: true, email: null };
}

/** Convenience for route handlers: returns a JSON error response or null. */
export async function aiGuardResponse(): Promise<NextResponse | null> {
  const access = await checkAiAccess();
  if (access.ok) return null;
  return NextResponse.json(
    { error: access.error, upgrade: access.status === 402 },
    { status: access.status }
  );
}

/** @deprecated use aiGuardResponse(); kept for compatibility. */
export async function aiCallAllowed(): Promise<boolean> {
  return (await checkAiAccess()).ok;
}
