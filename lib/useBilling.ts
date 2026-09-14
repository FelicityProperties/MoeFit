"use client";

import { useCallback, useEffect, useState } from "react";

export interface BillingStatus {
  enabled: boolean;
  authenticated: boolean;
  email: string | null;
  plan: "pro" | "free";
  isAdmin: boolean;
  status: string;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
  price: { amount: number; currency: string; interval: string; label: string } | null;
}

const DEFAULT: BillingStatus = {
  enabled: false,
  authenticated: false,
  email: null,
  plan: "free",
  isAdmin: false,
  status: "unknown",
  currentPeriodEnd: null,
  hasCustomer: false,
  price: null,
};

/**
 * Client view of the user's plan. `isPro` is true whenever AI features should
 * be available: billing off (personal mode), admin, or an active subscription.
 */
export function useBilling() {
  const [status, setStatus] = useState<BillingStatus>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status", { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const go = async (path: string) => {
    setBusy(true);
    try {
      const res = await fetch(path, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) {
        window.location.assign(json.url);
        return;
      }
      alert(json.error || "Something went wrong. Please try again.");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const checkout = () => go("/api/billing/checkout");
  const manage = () => go("/api/billing/portal");

  // Gating rule: only gate when billing is actually on and the user isn't Pro.
  const isPro = !status.enabled || status.plan === "pro";
  const needsUpgrade = status.enabled && status.authenticated && status.plan !== "pro";

  return { ...status, loading, busy, isPro, needsUpgrade, checkout, manage, refresh };
}
