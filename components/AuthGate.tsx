"use client";

import { ReactNode, useEffect, useState } from "react";
import { Flame, Lock, Loader2, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { CLOUD_ENABLED, GOOGLE_AUTH } from "@/lib/store";
import { Landing } from "./Landing";

export function AuthGate({ children }: { children: ReactNode }) {
  // Cloud sync off -> no gate, pure localStorage app.
  if (!CLOUD_ENABLED) return <>{children}</>;
  if (GOOGLE_AUTH) return <GoogleGate>{children}</GoogleGate>;
  return <PasscodeGate>{children}</PasscodeGate>;
}

function Splash({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark shadow-accent">
        <Flame size={30} className="text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">FeliHealth</h1>
        <p className="text-sm text-accent">Enter your passcode to continue</p>
      </div>
      {children}
    </div>
  );
}

// --- Google sign-in (Auth.js): signed-out visitors get the public landing page ---
function GoogleGate({ children }: { children: ReactNode }) {
  const { status } = useSession();
  if (status === "authenticated") return <>{children}</>;
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-faint" />
      </div>
    );
  }
  return <Landing />;
}

// --- Passcode (single shared secret) ---
type Phase = "checking" | "in" | "out" | "unconfigured";

function PasscodeGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/passcode", { cache: "no-store" });
        const json = await res.json();
        if (!json.configured) setPhase("unconfigured");
        else setPhase(json.authenticated ? "in" : "out");
      } catch {
        setPhase("out");
      }
    })();
  }, []);

  const submit = async () => {
    if (!passcode.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setPhase("in");
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Incorrect passcode.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "in") return <>{children}</>;

  return (
    <Splash>
      {phase === "checking" && <Loader2 size={24} className="animate-spin text-faint" />}

      {phase === "unconfigured" && (
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="mb-1 flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} /> Cloud sync is on, but no passcode is set.
          </p>
          <p className="text-amber-700">
            Set the <code className="rounded bg-black/10 px-1">APP_PASSCODE</code> and{" "}
            <code className="rounded bg-black/10 px-1">DATABASE_URL</code> environment
            variables in Vercel, then redeploy.
          </p>
        </div>
      )}

      {phase === "out" && (
        <div className="w-full max-w-xs space-y-3">
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="password"
              autoFocus
              className="input pl-9"
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={submit} disabled={submitting} className="btn-accent w-full">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : "Unlock"}
          </button>
        </div>
      )}
    </Splash>
  );
}
