"use client";

import { ReactNode } from "react";

export function clsx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  title,
  icon,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={clsx("card animate-fade-in", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white/80">
            {icon}
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-900/60 p-3">
      <div className="label">{label}</div>
      <div
        className={clsx(
          "mt-1 text-2xl font-bold leading-none",
          accent ? "text-accent" : "text-white"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  color = "#7c6cff",
  height = 8,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-white/10"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function Ring({
  value,
  max,
  size = 120,
  stroke = 10,
  color = "#7c6cff",
  label,
  sub,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: ReactNode;
  sub?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const dash = circ * pct;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label}
        {sub}
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "good" | "ok" | "avoid" | "neutral" | "accent";
}) {
  const map = {
    good: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    ok: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    avoid: "bg-rose-500/15 text-rose-300 border border-rose-500/20",
    accent: "bg-accent/15 text-accent border border-accent/20",
    neutral: "bg-white/5 text-white/60 border border-white/10",
  };
  return <span className={clsx("pill", map[tone])}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-8 text-center">
      {icon && <div className="text-white/30">{icon}</div>}
      <p className="text-sm font-medium text-white/60">{title}</p>
      {hint && <p className="max-w-xs text-xs text-white/35">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {icon && (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
          {icon}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
      </div>
    </div>
  );
}
