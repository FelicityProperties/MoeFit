"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Flame,
  Check,
  Sparkles,
  UtensilsCrossed,
  Dumbbell,
  Camera,
  LineChart,
  CalendarClock,
  MessageSquareText,
} from "lucide-react";
import { useBilling } from "@/lib/useBilling";
import { PRO_FEATURES } from "./UpgradeCard";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "A coach that knows your day",
    text: "Ask anything — it answers with your real calories, water, schedule and workout in mind.",
  },
  {
    icon: Camera,
    title: "Snap your meal",
    text: "Photo in, calories and macros out, plus a straight verdict: eat it, tweak it, or skip it.",
  },
  {
    icon: UtensilsCrossed,
    title: "Order smart",
    text: "Order takeout a lot? Describe the meal and get the healthier version before you tap buy.",
  },
  {
    icon: Dumbbell,
    title: "Training that adapts",
    text: "A weekly plan that tracks done / skipped / modified and adjusts when life gets in the way.",
  },
  {
    icon: CalendarClock,
    title: "Your day, on rails",
    text: "Hour-by-hour routines for weekdays and weekends, with one-tap adjustments when you run late.",
  },
  {
    icon: LineChart,
    title: "Progress you can see",
    text: "Weight, calories, water, workouts and a weekly discipline score — with streaks that keep you honest.",
  },
];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

/** Public landing page shown to signed-out visitors in Google-auth mode. */
export function Landing() {
  const billing = useBilling();
  const price = billing.price?.label;
  const start = () => signIn("google");

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-dark shadow-accent">
            <Flame size={20} className="text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-fg">FeliHealth</span>
        </div>
        <button onClick={start} className="btn-ghost !py-2 text-sm">
          Sign in
        </button>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pb-14 pt-10 text-center md:pt-16">
        <span className="pill mx-auto bg-accent/15 text-accent">
          <Sparkles size={12} /> AI health coach
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-fg md:text-6xl">
          Lose the weight.
          <br />
          <span className="text-accent">Keep the discipline.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted md:text-lg">
          One app for your calories, meals, workouts and daily routine — with an AI coach
          that&apos;s strict enough to keep you honest and smart enough to know what you
          actually ate.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={start} className="btn bg-white text-strong shadow-soft hover:bg-panel border border-line px-6 py-3">
            <GoogleIcon /> Continue with Google
          </button>
          <span className="text-xs text-faint">Free to start · no card needed</span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
                <Icon size={20} />
              </div>
              <h3 className="mt-3 text-base font-bold text-fg">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-4xl px-5 pb-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-fg">
          Simple pricing
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Track for free forever. Go Pro when you want the AI in your corner.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-bold text-fg">Free</h3>
            <div className="mt-1 text-3xl font-extrabold text-fg">$0</div>
            <ul className="mt-4 space-y-2 text-sm text-strong">
              {[
                "Calorie, macro & water tracking",
                "Food history & daily reports",
                "Weekly workout planner & streaks",
                "Weekday / weekend routines",
                "Progress charts",
                "Built-in coach",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
            <button onClick={start} className="btn-ghost mt-6 w-full">
              Start free
            </button>
          </div>

          <div className="card border-accent/40 bg-gradient-to-br from-accent/10 via-white/80 to-white/80">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-fg">Pro</h3>
              <span className="pill bg-accent text-white">Most popular</span>
            </div>
            <div className="mt-1 text-3xl font-extrabold text-fg">
              {price ?? "—"}
              {!price && <span className="text-sm font-medium text-faint"> pricing soon</span>}
            </div>
            <p className="text-xs text-faint">Everything in Free, plus:</p>
            <ul className="mt-4 space-y-2 text-sm text-strong">
              {PRO_FEATURES.map(({ text }) => (
                <li key={text} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent" /> {text}
                </li>
              ))}
            </ul>
            <button onClick={start} className="btn-accent mt-6 w-full">
              <Sparkles size={16} /> Get Pro
            </button>
            <p className="mt-2 text-center text-[11px] text-faint">
              Sign in first, then upgrade in one tap. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-6 text-center text-xs text-faint">
        © {new Date().getFullYear()} FeliHealth ·{" "}
        <Link href="/terms" className="hover:text-fg">Terms</Link> ·{" "}
        <Link href="/privacy" className="hover:text-fg">Privacy</Link>
        <p className="mt-1">Not medical advice. Talk to a doctor before changing your diet or training.</p>
      </footer>
    </div>
  );
}
