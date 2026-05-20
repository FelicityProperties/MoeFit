"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  MessageSquareText,
  LineChart,
  ClipboardCheck,
  Settings,
  Flame,
} from "lucide-react";
import { clsx } from "./ui";
import { ReactNode } from "react";
import { CLOUD_ENABLED, useStore, type CloudStatus } from "@/lib/store";
import { Cloud, CloudOff, RefreshCw, HardDrive } from "lucide-react";

const NAV = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/food", label: "Food", icon: UtensilsCrossed },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/coach", label: "Coach", icon: MessageSquareText },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/review", label: "Review", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/40 p-4 backdrop-blur-xl md:flex">
        <Brand />
        <nav className="mt-7 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                  active
                    ? "bg-accent/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(124,108,255,0.25)]"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <Icon
                  size={18}
                  className={clsx(
                    "transition-colors",
                    active ? "text-accent" : "text-white/40 group-hover:text-white/80"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <SyncIndicator />
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-ink-950/70 px-4 py-3 backdrop-blur-xl md:hidden">
          <Brand compact />
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-9">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-white/[0.07] bg-ink-950/85 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-accent" : "text-white/40"
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-7 rounded-full bg-accent" />
              )}
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SyncIndicator() {
  const { cloudStatus } = useStore();

  if (!CLOUD_ENABLED) {
    return (
      <p className="flex items-center gap-1.5 px-3 text-[11px] leading-relaxed text-white/25">
        <HardDrive size={12} /> Saved locally on this device.
      </p>
    );
  }

  const meta: Record<CloudStatus, { icon: typeof Cloud; text: string; color: string }> = {
    local: { icon: HardDrive, text: "Local", color: "text-white/40" },
    syncing: { icon: RefreshCw, text: "Syncing…", color: "text-amber-300/80" },
    synced: { icon: Cloud, text: "Synced to cloud", color: "text-emerald-300/80" },
    offline: { icon: CloudOff, text: "Offline — saved locally", color: "text-white/40" },
  };
  const m = meta[cloudStatus];
  const Icon = m.icon;
  return (
    <p className={clsx("flex items-center gap-1.5 px-3 text-[11px] font-medium", m.color)}>
      <Icon size={12} className={cloudStatus === "syncing" ? "animate-spin" : ""} />
      {m.text}
    </p>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-accent">
        <Flame size={20} className="text-white" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-extrabold tracking-tight text-white">
          MoeFit
        </div>
        {!compact && (
          <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Command Center
          </div>
        )}
      </div>
    </Link>
  );
}
