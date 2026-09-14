"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { StoreProvider, GOOGLE_AUTH } from "@/lib/store";
import { AuthGate } from "./AuthGate";
import { AppShell } from "./AppShell";

// Pages that must be reachable signed-out (Stripe and Google OAuth require
// public Terms/Privacy links). They render without the gate, store or shell.
const PUBLIC_PATHS = ["/terms", "/privacy"];

// Composition order: (SessionProvider) → AuthGate → StoreProvider → AppShell.
// StoreProvider lives inside AuthGate so the cloud sync only kicks off once the
// user is authenticated. SessionProvider is only mounted in Google-auth mode so
// local/passcode deployments never hit the NextAuth session endpoint.
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return <>{children}</>;
  }

  const tree = (
    <AuthGate>
      <StoreProvider>
        <AppShell>{children}</AppShell>
      </StoreProvider>
    </AuthGate>
  );

  return GOOGLE_AUTH ? <SessionProvider>{tree}</SessionProvider> : tree;
}
