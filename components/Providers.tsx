"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { StoreProvider, GOOGLE_AUTH } from "@/lib/store";
import { AuthGate } from "./AuthGate";
import { AppShell } from "./AppShell";

// Composition order: (SessionProvider) → AuthGate → StoreProvider → AppShell.
// StoreProvider lives inside AuthGate so the cloud sync only kicks off once the
// user is authenticated. SessionProvider is only mounted in Google-auth mode so
// local/passcode deployments never hit the NextAuth session endpoint.
export function Providers({ children }: { children: ReactNode }) {
  const tree = (
    <AuthGate>
      <StoreProvider>
        <AppShell>{children}</AppShell>
      </StoreProvider>
    </AuthGate>
  );

  return GOOGLE_AUTH ? <SessionProvider>{tree}</SessionProvider> : tree;
}
