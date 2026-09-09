// Server-side guard for the AI routes (/api/coach, /api/order, /api/meals,
// /api/review). These endpoints spend Anthropic API credits, so on a deployed
// site they must only be callable by the signed-in owner.
//
// The gate mirrors the app's auth mode exactly:
// - Cloud + Google mode  -> requires a NextAuth session
// - Cloud + passcode mode -> requires the passcode cookie
// - Local-only mode (no cloud configured) -> open (there is no auth UI to
//   satisfy, and no public deployment implied)

import { isAuthed, passcodeConfigured } from "./auth";
import { auth } from "@/auth";

const CLOUD = process.env.NEXT_PUBLIC_CLOUD_ENABLED === "true";
const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

export async function aiCallAllowed(): Promise<boolean> {
  if (!CLOUD) return true;
  if (GOOGLE) {
    const session = await auth();
    return Boolean(session?.user?.email);
  }
  if (passcodeConfigured()) return await isAuthed();
  // Cloud flag on but nothing configured — fail open so the app isn't bricked
  // during setup (the state endpoint still refuses without auth).
  return true;
}
