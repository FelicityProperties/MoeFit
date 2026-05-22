"use client";

import { ReactNode, useEffect, useState } from "react";
import { Flame, Lock, Loader2, AlertTriangle } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { CLOUD_ENABLED, GOOGLE_AUTH } from "@/lib/store";

export function AuthGate({ children }: { children: ReactNode }) {
  // Cloud sync off -> no gate, pure localStorage app.
  if (!CLOUD_ENABLED) return <>{children}</>;
  if (GOOGLE_AUTH) return <GoogleGate>{children}</GoogleGate>;
  return <PasscodeGate>{children}</PasscodeGate>;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark shadow-accent">
        <Flame size={30} className="text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">
          MoeFit Command Center
        </h1>
        <p className="text-sm text-accent">
          Sign in to sync your data across devices
        </p>
      </div>
      {children}
    </div>
  );
}

// --- Google sign-in (Auth.js) ---
function GoogleGate({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === "authenticated") return <>{children}</>;

  return (
    <Shell>
      {status === "loading" ? (
        <Loader2 size={24} className="animate-spin text-faint" />
      ) : (
        <div className="w-full max-w-xs space-y-3 text-center">
          <button
            onClick={() => signIn("google")}
            className="btn bg-white text-strong shadow-soft hover:bg-panel w-full border border-line"
          >
            <GoogleIcon /> Continue with Google
          </button>
          <p className="text-[11px] text-faint">
            Your data is saved to your account so it&apos;s the same on every
            device.
          </p>
        </div>
      )}
    </Shell>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
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
    <Shell>
      {phase === "checking" && (
        <Loader2 size={24} className="animate-spin text-faint" />
      )}

      {phase === "unconfigured" && (
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="mb-1 flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} /> Cloud sync is on, but no passcode is set.
          </p>
          <p className="text-amber-700">
            Set the <code className="rounded bg-black/10 px-1">APP_PASSCODE</code>{" "}
            and <code className="rounded bg-black/10 px-1">DATABASE_URL</code>{" "}
            environment variables in Vercel, then redeploy.
          </p>
        </div>
      )}

      {phase === "out" && (
        <div className="w-full max-w-xs space-y-3">
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
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
    </Shell>
  );
}
