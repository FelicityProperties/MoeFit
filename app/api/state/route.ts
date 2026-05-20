import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { dbConfigured, getState, putState } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guard(): NextResponse | null {
  if (!dbConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured." },
      { status: 503 }
    );
  }
  if (!isAuthed()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const blocked = guard();
  if (blocked) return blocked;
  try {
    const stored = await getState();
    return NextResponse.json(stored ?? { data: null, updatedAt: null });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to read state.", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const blocked = guard();
  if (blocked) return blocked;
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
    const stored = await putState(data);
    return NextResponse.json({ ok: true, updatedAt: stored.updatedAt });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to save state.", detail: String(e) },
      { status: 500 }
    );
  }
}
