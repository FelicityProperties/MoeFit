import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { dbConfigured, getState, putState } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_AUTH = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

// Identify whose data this is. In Google mode the row is keyed by the signed-in
// email (so each account has its own data on every device). In passcode mode
// there's a single shared user ("default").
async function resolveUserId(): Promise<string | null> {
  if (GOOGLE_AUTH) {
    const session = await auth();
    return session?.user?.email ?? null;
  }
  return isAuthed() ? "default" : null;
}

export async function GET() {
  if (!dbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const stored = await getState(userId);
    return NextResponse.json(stored ?? { data: null, updatedAt: null });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to read state.", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  if (!dbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured." }, { status: 503 });
  }
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid state payload." }, { status: 400 });
  }
  try {
    const stored = await putState(data, userId);
    return NextResponse.json({ ok: true, updatedAt: stored.updatedAt });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to save state.", detail: String(e) },
      { status: 500 }
    );
  }
}
