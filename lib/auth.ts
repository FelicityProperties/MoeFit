// Server-only passcode auth. A single shared passcode (APP_PASSCODE) gates the
// app. On success we set an httpOnly cookie whose value is sha256(passcode), and
// every protected request is checked against that hash.
//
// This is intentionally simple — fine for a personal, single-user app. For real
// multi-user accounts, swap this for Auth.js / Clerk.

import { createHash } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "moefit_auth";

export function passcodeConfigured(): boolean {
  return Boolean(process.env.APP_PASSCODE);
}

export function expectedToken(): string | null {
  const pass = process.env.APP_PASSCODE;
  if (!pass) return null;
  return createHash("sha256").update(pass).digest("hex");
}

export function tokenFor(passcode: string): string {
  return createHash("sha256").update(passcode).digest("hex");
}

export function isAuthed(): boolean {
  const token = expectedToken();
  if (!token) return false; // no passcode configured -> nothing is authorized
  const cookie = cookies().get(AUTH_COOKIE)?.value;
  return Boolean(cookie) && cookie === token;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};
