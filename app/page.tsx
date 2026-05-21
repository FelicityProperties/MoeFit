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
import { prettyDate, prettyTime, isWeekend } from "@/lib/date";
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
  workout: "#7c6cff",
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

  // Today's training, used to label the "workout" slot in the routine.
  const trainingBlocks = plan.filter((b) => b.type !== "rest");
  const workoutLabel =
    trainingBlocks.length > 0
      ? trainingBlocks.map((b) => b.title).join(" + ")
      : "Rest day — recover";
  // Show the day's actual session in any "workout" routine slot.
  const labelFor = (item: ScheduleItem) =>
    item.category === "workout" ? workoutLabel : item.label;

  // Weekend days follow a separate, later routine.
  const weekend = isWeekend(now);
  const activeSchedule = weekend ? state.weekendSchedule : state.schedule;

  // Determine the active schedule item (latest one whose hour has passed).
  const sorted = [...activeSchedule].sort((a, b) => a.hour - b.hour);
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
          <p className="text-sm font-semibold text-muted">{prettyDate(now)}</p>
          <p className="font-mono text-sm font-bold text-accent">
            {prettyTime(now)}
          </p>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
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
            <p className="truncate text-lg font-bold text-fg">
              {currentItem ? labelFor(currentItem) : "Plan your day"}
            </p>
            {nextItem && (
              <p className="text-xs text-faint">
                Up next at {formatHour(nextItem.hour)}: {labelFor(nextItem)}
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-panel p-3 text-sm text-strong">
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
            color={overBudget ? "#f43f5e" : "#7c6cff"}
            label={
              <span className="text-lg font-extrabold text-fg">
                {caloriesLeft}
              </span>
            }
            sub={<span className="text-[10px] text-faint">left</span>}
          />
          <div>
            <div className="label">Calories</div>
            <div className="text-sm font-bold text-fg">
              {totals.calories}
              <span className="text-faint"> / {target.target}</span>
            </div>
            <div className="text-[11px] text-faint">
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
              <span className="text-base font-extrabold text-fg">
                {(day.waterMl / 1000).toFixed(1)}L
              </span>
            }
            sub={<span className="text-[10px] text-faint">water</span>}
          />
          <div>
            <div className="label">Water</div>
            <div className="text-sm font-bold text-fg">
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
            <p className="text-sm text-faint">
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
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-line bg-panel hover:bg-panel"
              )}
            >
              {m.done ? (
                <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              ) : (
                <Circle size={20} className="shrink-0 text-faint" />
              )}
              <span
                className={clsx(
                  "text-sm font-medium",
                  m.done ? "text-faint line-through" : "text-fg"
                )}
              >
                {m.text}
              </span>
            </button>
          ))}
          {day.missions.length > 0 && (
            <p className="pt-1 text-xs text-faint">
              {day.missions.filter((m) => m.done).length} / {day.missions.length}{" "}
              complete
            </p>
          )}
        </div>
      </Card>

      {/* Macros */}
      <Card title="Macros Today" icon={<UtensilsCrossed size={16} className="text-accent" />}>
        <div className="space-y-3">
          <MacroRow label="Protein" value={totals.protein} max={macros.protein} color="#7c6cff" unit="g" />
          <MacroRow label="Carbs" value={totals.carbs} max={macros.carbs} color="#38bdf8" unit="g" />
          <MacroRow label="Fat" value={totals.fat} max={macros.fat} color="#a78bfa" unit="g" />
        </div>
        <Link href="/food" className="btn-ghost mt-4 w-full">
          Log food <ArrowRight size={15} />
        </Link>
      </Card>

      {/* Schedule */}
      <Card
        title="Today's Schedule"
        icon={<Sun size={16} className="text-accent" />}
        action={
          <span className="pill bg-accent/15 text-accent">
            {weekend ? "Weekend" : "Weekday"}
          </span>
        }
      >
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
                <span className="w-12 shrink-0 font-mono text-xs font-bold text-muted">
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
                    isCurrent ? "font-bold text-fg" : "text-strong"
                  )}
                >
                  {labelFor(item)}
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
                className="flex items-center justify-between gap-2 rounded-xl bg-panel p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-fg">
                    {b.title}
                  </p>
                  <p className="truncate text-xs text-faint">
                    {b.durationMin > 0 ? `${b.durationMin} min · ` : ""}
                    {b.estCalories > 0 ? `~${b.estCalories} kcal` : "Recovery"}
                  </p>
                </div>
                <span
                  className={clsx(
                    "pill shrink-0",
                    status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "skipped"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-panel text-muted"
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
        <span className="font-semibold text-strong">{label}</span>
        <span className="text-faint">
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
  const isRest = ctx.workoutPlannedToday === "Rest day";
  // Early morning — training time (your sessions are in the morning).
  if (hour < 11) {
    if (isRest)
      return `Rest day. Hydrate, eat protein, and keep your steps up — recovery is when progress sticks.`;
    return ctx.workedOutToday
      ? `Morning training done — refuel with protein and lock in your ${ctx.caloriesRemaining} kcal for the day. 🔥`
      : `Morning is training time: ${ctx.workoutPlannedToday}. Get it done early, then a high-protein breakfast.`;
  }
  if (hour < 17) {
    if (!ctx.workedOutToday && !isRest)
      return `You haven't trained yet — squeeze ${ctx.workoutPlannedToday} in, or commit to first thing tomorrow morning. Meanwhile keep lunch lean.`;
    return ctx.caloriesRemaining > 400
      ? `You've got ${ctx.caloriesRemaining} kcal left. Keep lunch lean and don't snack out of boredom.`
      : `Tight on calories (${ctx.caloriesRemaining} left). Lean on protein and water for the rest of the day.`;
  }
  if (hour < 22)
    return `Evening: clean, protein-forward dinner and start winding down. No night workouts — your training is in the morning. Prep your gear for tomorrow.`;
  return "It's late — no more food, hydrate, screens off, and get to bed. Early start = morning training.";
}

function formatHour(h: number): string {
  const ampm = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ampm}`;
}
