"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Flame, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";

/** Renders children only after localStorage has hydrated, to avoid mismatches. */
export function HydrationGate({ children }: { children: ReactNode }) {
  const { hydrated } = useStore();
  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-accent/20 text-accent">
          <Flame size={24} />
        </div>
        <p className="text-sm text-faint">Loading your command center…</p>
      </div>
    );
  }
  return <>{children}</>;
}

/** Shown on the dashboard until the user has entered their profile. */
export function SetupPrompt() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark shadow-accent">
        <Flame size={30} className="text-white" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">
          Welcome to MoeFit Command Center
        </h1>
        <p className="max-w-md text-sm text-muted">
          Your personal operating system for weight loss, food control,
          discipline, and daily structure. Let&apos;s set up your profile so I
          can build your plan and coach you properly.
        </p>
      </div>
      <Link href="/settings" className="btn-accent">
        Set up my profile <ArrowRight size={16} />
      </Link>
      <p className="text-xs text-faint">
        Everything is saved locally on this device. No account needed.
      </p>
    </div>
  );
}
