// Server-only passcode auth. A single shared passcode (APP_PASSCODE) gates the
// app. On success we set an httpOnly cookie whose value is a salted
// sha256(passcode), and every protected request is checked against that hash
// using constant-time comparison.
//
// This is intentionally simple — fine for a personal, single-user app. For real
// multi-user accounts, use the Google sign-in mode (NEXT_PUBLIC_GOOGLE_AUTH).

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "moefit_auth";

// Static salt so the cookie isn't a bare unsalted hash of the passcode.
const SALT = "moefit:v1:";

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function passcodeConfigured(): boolean {
  return Boolean(process.env.APP_PASSCODE);
}

export function tokenFor(passcode: string): string {
  return createHash("sha256").update(SALT + passcode).digest("hex");
}

export function expectedToken(): string | null {
  const pass = process.env.APP_PASSCODE;
  if (!pass) return null;
  return tokenFor(pass);
}

/** Constant-time passcode check (compares digests so lengths always match). */
export function passcodeMatches(input: string): boolean {
  const pass = process.env.APP_PASSCODE;
  if (!pass) return false;
  return timingSafeEqual(sha256(input), sha256(pass));
}

export async function isAuthed(): Promise<boolean> {
  const token = expectedToken();
  if (!token) return false; // no passcode configured -> nothing is authorized
  // Next 15: cookies() is async.
  const jar = await cookies();
  const cookie = jar.get(AUTH_COOKIE)?.value ?? "";
  if (cookie.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(token));
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};
