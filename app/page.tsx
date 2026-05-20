"use client";

import Link from "next/link";
import {
  Sun,
  Briefcase,
  UtensilsCrossed,
  Dumbbell,
  Droplets,
  Moon,
  User,
  Target,
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useCoachContext, useNow } from "@/lib/hooks";
import { prettyDate, prettyTime } from "@/lib/date";
import {
  calorieTarget,
  dayTotals,
  macroTargets,
  waterTargetMl,
} from "@/lib/calculations";
import { planForDate } from "@/lib/workout";
import { Card, ProgressBar, Ring, Stat, clsx } from "@/components/ui";
import { ScheduleItem } from "@/lib/types";
import { HydrationGate, SetupPrompt } from "@/components/Gates";

const CATEGORY_ICON: Record<ScheduleItem["category"], typeof Sun> = {
  wake: Sun,
  work: Briefcase,
  meal: UtensilsCrossed,
  workout: Dumbbell,
  water: Droplets,
  sleep: Moon,
  personal: User,
};

const CATEGORY_COLOR: Record<ScheduleItem["category"], string> = {
  wake: "#eab308",
  work: "#38bdf8",
  meal: "#22c55e",
  workout: "#ff5a1f",
  water: "#06b6d4",
  sleep: "#a78bfa",
  personal: "#f472b6",
};

export default function DashboardPage() {
  return (
    <HydrationGate>
      <Dashboard />
    </HydrationGate>
  );
}

function Dashboard() {
  const { state, getDay, addWater, toggleMission } = useStore();
  const now = useNow();
  const ctx = useCoachContext();
  const profile = state.profile;
  const day = getDay();

  const target = calorieTarget(profile);
  const totals = dayTotals(day);
  const macros = macroTargets(profile, target.target);
  const waterGoal = waterTargetMl(profile);

  const plan = planForDate(now);
  const currentHour = now.getHours();

  // Determine the active schedule item (latest one whose hour has passed).
  const sorted = [...state.schedule].sort((a, b) => a.hour - b.hour);
  const currentItem =
    [...sorted].reverse().find((s) => s.hour <= currentHour) ?? sorted[0];
  const nextItem = sorted.find((s) => s.hour > currentHour);

  const caloriesLeft = Math.max(0, target.target - totals.calories);
  const overBudget = totals.calories > target.target;

  if (!profile.name) {
    return <SetupPrompt />;
  }

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : currentHour < 22
      ? "Good evening"
      : "Late night";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-white/50">{prettyDate(now)}</p>
          <p className="font-mono text-sm font-bold text-accent">
            {prettyTime(now)}
          </p>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          {greeting}, {profile.name.split(" ")[0]}.
        </h1>
      </div>

      {/* Right-now banner */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-transparent">
        <div className="flex items-center gap-4">
          <div
            className="grid h-14 w-14 shrink-0 animate-pulse-ring place-items-center rounded-2xl"
            style={{
              backgroundColor: `${CATEGORY_COLOR[currentItem?.category ?? "personal"]}22`,
              color: CATEGORY_COLOR[currentItem?.category ?? "personal"],
            }}
          >
            {(() => {
              const Icon = CATEGORY_ICON[currentItem?.category ?? "personal"];
              return <Icon size={26} />;
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="label text-accent">Right now</div>
            <p className="truncate text-lg font-bold text-white">
              {currentItem?.label ?? "Plan your day"}
            </p>
            {nextItem && (
              <p className="text-xs text-white/45">
                Up next at {formatHour(nextItem.hour)}: {nextItem.label}
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-ink-900/60 p-3 text-sm text-white/70">
          <Flame size={14} className="mr-1 inline text-accent" />
          {coachLine(ctx)}
        </p>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="flex items-center gap-4">
          <Ring
            value={totals.calories}
            max={target.target}
            size={84}
            stroke={9}
            color={overBudget ? "#f43f5e" : "#ff5a1f"}
            label={
              <span className="text-lg font-extrabold text-white">
                {caloriesLeft}
              </span>
            }
            sub={<span className="text-[10px] text-white/40">left</span>}
          />
          <div>
            <div className="label">Calories</div>
            <div className="text-sm font-bold text-white">
              {totals.calories}
              <span className="text-white/40"> / {target.target}</span>
            </div>
            <div className="text-[11px] text-white/40">
              {overBudget ? "Over budget" : `${caloriesLeft} remaining`}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <Ring
            value={day.waterMl}
            max={waterGoal}
            size={84}
            stroke={9}
            color="#06b6d4"
            label={
              <span className="text-base font-extrabold text-white">
                {(day.waterMl / 1000).toFixed(1)}L
              </span>
            }
            sub={<span className="text-[10px] text-white/40">water</span>}
          />
          <div>
            <div className="label">Water</div>
            <div className="text-sm font-bold text-white">
              {(day.waterMl / 1000).toFixed(2)} /{" "}
              {(waterGoal / 1000).toFixed(1)}L
            </div>
            <button
              onClick={() => addWater(250)}
              className="btn-chip mt-1"
            >
              <Plus size={12} /> 250ml
            </button>
          </div>
        </Card>

        <Stat
          label="Protein"
          value={`${totals.protein}g`}
          sub={`of ${macros.protein}g target`}
          accent
        />
        <Stat
          label="Weight"
          value={`${profile.weightKg}kg`}
          sub={`goal ${profile.goalWeightKg}kg`}
        />
      </div>

      {/* Today's Mission */}
      <Card title="Today's Mission" icon={<Target size={16} className="text-accent" />}>
        <div className="space-y-2">
          {day.missions.length === 0 && (
            <p className="text-sm text-white/40">
              No missions set. Add them in Settings.
            </p>
          )}
          {day.missions.map((m, i) => (
            <button
              key={i}
              onClick={() => toggleMission(i)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                m.done
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-white/5 bg-ink-900/50 hover:bg-white/5"
              )}
            >
              {m.done ? (
                <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
              ) : (
                <Circle size={20} className="shrink-0 text-white/30" />
              )}
              <span
                className={clsx(
                  "text-sm font-medium",
                  m.done ? "text-white/40 line-through" : "text-white"
                )}
              >
                {m.text}
              </span>
            </button>
          ))}
          {day.missions.length > 0 && (
            <p className="pt-1 text-xs text-white/40">
              {day.missions.filter((m) => m.done).length} / {day.missions.length}{" "}
              complete
            </p>
          )}
        </div>
      </Card>

      {/* Macros */}
      <Card title="Macros Today" icon={<UtensilsCrossed size={16} className="text-accent" />}>
        <div className="space-y-3">
          <MacroRow label="Protein" value={totals.protein} max={macros.protein} color="#ff5a1f" unit="g" />
          <MacroRow label="Carbs" value={totals.carbs} max={macros.carbs} color="#38bdf8" unit="g" />
          <MacroRow label="Fat" value={totals.fat} max={macros.fat} color="#a78bfa" unit="g" />
        </div>
        <Link href="/food" className="btn-ghost mt-4 w-full">
          Log food <ArrowRight size={15} />
        </Link>
      </Card>

      {/* Schedule */}
      <Card title="Today's Schedule" icon={<Sun size={16} className="text-accent" />}>
        <div className="space-y-1.5">
          {sorted.map((item) => {
            const Icon = CATEGORY_ICON[item.category];
            const isCurrent = item.id === currentItem?.id;
            const isPast = item.hour < currentHour && !isCurrent;
            return (
              <div
                key={item.id}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                  isCurrent
                    ? "border-accent/30 bg-accent/10"
                    : "border-transparent",
                  isPast && "opacity-40"
                )}
              >
                <span className="w-12 shrink-0 font-mono text-xs font-bold text-white/50">
                  {formatHour(item.hour)}
                </span>
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{
                    backgroundColor: `${CATEGORY_COLOR[item.category]}1f`,
                    color: CATEGORY_COLOR[item.category],
                  }}
                >
                  <Icon size={15} />
                </span>
                <span
                  className={clsx(
                    "flex-1 text-sm",
                    isCurrent ? "font-bold text-white" : "text-white/70"
                  )}
                >
                  {item.label}
                </span>
                {isCurrent && (
                  <span className="pill bg-accent/20 text-accent">now</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Workout shortcut */}
      <Card title="Today's Training" icon={<Dumbbell size={16} className="text-accent" />}>
        <div className="space-y-2">
          {plan.map((b) => {
            const status = day.workouts[b.id] ?? "pending";
            return (
              <div
                key={b.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-ink-900/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {b.durationMin > 0 ? `${b.durationMin} min · ` : ""}
                    {b.estCalories > 0 ? `~${b.estCalories} kcal` : "Recovery"}
                  </p>
                </div>
                <span
                  className={clsx(
                    "pill shrink-0",
                    status === "completed"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : status === "skipped"
                      ? "bg-rose-500/15 text-rose-300"
                      : "bg-white/5 text-white/50"
                  )}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
        <Link href="/workout" className="btn-ghost mt-4 w-full">
          Open workout planner <ArrowRight size={15} />
        </Link>
      </Card>
    </div>
  );
}

function MacroRow({
  label,
  value,
  max,
  color,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-white/70">{label}</span>
        <span className="text-white/40">
          {value}
          {unit} / {max}
          {unit}
        </span>
      </div>
      <ProgressBar value={value} max={max} color={color} height={7} />
    </div>
  );
}

function coachLine(ctx: ReturnType<typeof useCoachContext>): string {
  const hour = ctx.hour;
  if (hour < 11)
    return `Start strong: hydrate, eat protein, and lock in your ${ctx.caloriesRemaining} kcal plan for the day.`;
  if (hour < 17)
    return ctx.caloriesRemaining > 400
      ? `You've got ${ctx.caloriesRemaining} kcal left. Keep lunch lean and don't snack out of boredom.`
      : `Tight on calories (${ctx.caloriesRemaining} left). Lean on protein and water for the rest of the day.`;
  if (hour < 22)
    return ctx.workedOutToday
      ? "Workout done — eat a clean, protein-forward dinner and start winding down."
      : `Training time: ${ctx.workoutPlannedToday}. Get it done, then a clean dinner.`;
  return "It's late — no more food, hydrate, screens off, and get to bed. Recovery is part of the plan.";
}

function formatHour(h: number): string {
  const ampm = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ampm}`;
}
