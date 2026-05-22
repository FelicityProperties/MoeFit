import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  cookieOptions,
  isAuthed,
  passcodeConfigured,
  tokenFor,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Status check used by the client AuthGate on load.
export async function GET() {
  return NextResponse.json({
    authenticated: isAuthed(),
    configured: passcodeConfigured(),
  });
}

// Login: exchange a passcode for an auth cookie.
export async function POST(req: Request) {
  if (!passcodeConfigured()) {
    return NextResponse.json(
      { error: "Passcode not configured on the server." },
      { status: 503 }
    );
  }
  let body: { passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const passcode = (body.passcode ?? "").trim();
  if (!passcode || passcode !== process.env.APP_PASSCODE) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }
  cookies().set(AUTH_COOKIE, tokenFor(passcode), cookieOptions);
  return NextResponse.json({ ok: true });
}

// Logout.
export async function DELETE() {
  cookies().set(AUTH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
