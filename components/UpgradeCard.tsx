"use client";

import { Sparkles, Loader2, Crown, Camera, ChefHat, ClipboardCheck, MessageSquareText } from "lucide-react";
import { useBilling } from "@/lib/useBilling";
import { clsx } from "./ui";

export const PRO_FEATURES = [
  { icon: MessageSquareText, text: "Smart AI coach that knows your day, calories and schedule" },
  { icon: Camera, text: "Snap a meal photo — get calories, macros and a verdict" },
  { icon: ChefHat, text: "Daily meal plans built to your exact targets" },
  { icon: ClipboardCheck, text: "Personalised end-of-day reviews and coaching" },
];

/**
 * Upgrade prompt. `compact` renders a slim banner for inline use inside a
 * feature; the default renders the full pricing card.
 */
export function UpgradeCard({
  compact,
  reason,
  className,
}: {
  compact?: boolean;
  reason?: string;
  className?: string;
}) {
  const billing = useBilling();
  if (billing.loading || !billing.needsUpgrade) return null;

  const priceLabel = billing.price?.label ?? "Pro";

  if (compact) {
    return (
      <div
        className={clsx(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/10 p-3",
          className
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <Crown size={16} className="shrink-0 text-accent" />
          <span className="text-strong">
            {reason ?? "This is a Pro feature."}{" "}
            <span className="text-muted">Using the built-in version for now.</span>
          </span>
        </div>
        <button onClick={billing.checkout} disabled={billing.busy} className="btn-accent !py-1.5 text-xs">
          {billing.busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Upgrade — {priceLabel}
        </button>
      </div>
    );
  }

  return (
    <section
      className={clsx(
        "card border-accent/30 bg-gradient-to-br from-accent/10 via-white/80 to-white/80",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white shadow-accent">
          <Crown size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold tracking-tight text-fg">FeliHealth Pro</h2>
          <p className="text-sm text-muted">
            Unlock the AI coach — everything below runs on Claude.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-fg">{billing.price?.label ?? "—"}</div>
          <div className="text-[11px] text-faint">cancel anytime</div>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {PRO_FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2 text-sm text-strong">
            <Icon size={16} className="mt-0.5 shrink-0 text-accent" />
            {text}
          </li>
        ))}
      </ul>
      <button onClick={billing.checkout} disabled={billing.busy} className="btn-accent mt-4 w-full">
        {billing.busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        Upgrade to Pro
      </button>
      <p className="mt-2 text-center text-[11px] text-faint">
        Secure checkout by Stripe. Your tracking stays free forever.
      </p>
    </section>
  );
}
