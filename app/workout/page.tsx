"use client";

import {
  Dumbbell,
  Check,
  X,
  Pencil,
  CalendarDays,
  Flame,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/hooks";
import {
  planForDate,
  fullWeek,
  WORKOUT_TYPE_META,
  WEEKDAY_NAMES,
} from "@/lib/workout";
import { mondayIndex, toDateKey } from "@/lib/date";
import { WorkoutStatus } from "@/lib/types";
import { Card, PageHeader, Pill, clsx } from "@/components/ui";
import { HydrationGate } from "@/components/Gates";

export default function WorkoutPage() {
  return (
    <HydrationGate>
      <PageHeader
        title="Workout Planner"
        subtitle="Fat-loss training built around your week. Track it, miss it, adapt it."
        icon={<Dumbbell size={22} />}
      />
      <div className="space-y-5">
        <TodayWorkout />
        <WeeklyCalendar />
      </div>
    </HydrationGate>
  );
}

function TodayWorkout() {
  const { getDay, setWorkoutStatus } = useStore();
  const now = useNow(30000);
  const day = getDay();
  const plan = planForDate(now);
  const hour = now.getHours();

  const planned = plan.filter((b) => b.type !== "rest");
  const anySkipped = planned.some((b) => day.workouts[b.id] === "skipped");
  const allHandled =
    planned.length > 0 &&
    planned.every((b) => {
      const s = day.workouts[b.id];
      return s === "completed" || s === "modified" || s === "skipped";
    });

  const recommendation =
    plan[0]?.type === "rest"
      ? "Today is a rest day. Recovery and sleep are when your body actually changes. Light stretching is optional."
      : hour < 11
      ? "Morning training works great on an empty-ish stomach. Hydrate first, then go."
      : hour < 17
      ? "Afternoon slot is ideal — your strength peaks. Slot this in after work or on a break."
      : hour < 21
      ? "Evening is fine — just leave 2-3 hours before bed so it doesn't wreck your sleep."
      : "It's late. If you haven't trained, do a short version or push to tomorrow morning — don't sacrifice sleep.";

  return (
    <Card title="Today's Training" icon={<Dumbbell size={16} className="text-accent" />}>
      <p className="mb-4 rounded-xl bg-panel p-3 text-sm text-strong">
        <Clock size={14} className="mr-1 inline text-accent" />
        {recommendation}
      </p>

      <div className="space-y-3">
        {plan.map((b) => {
          const status = (day.workouts[b.id] ?? "pending") as WorkoutStatus;
          const meta = WORKOUT_TYPE_META[b.type];
          const done = status === "completed" || status === "modified";
          return (
            <div
              key={b.id}
              className={clsx(
                "rounded-xl border p-4 transition",
                done
                  ? "border-emerald-200 bg-emerald-50"
                  : status === "skipped"
                  ? "border-rose-200 bg-rose-50"
                  : "border-line bg-panel"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="pill"
                      style={{
                        backgroundColor: `${meta.color}22`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    <h3 className="text-base font-bold text-fg">{b.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted">{b.detail}</p>
                  {b.estCalories > 0 && (
                    <p className="mt-1 text-xs text-faint">
                      <Flame size={12} className="mr-1 inline text-accent" />
                      ~{b.estCalories} kcal · {b.durationMin} min
                    </p>
                  )}
                </div>
              </div>

              {b.type !== "rest" && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <StatusBtn
                    active={status === "completed"}
                    onClick={() =>
                      setWorkoutStatus(
                        b.id,
                        status === "completed" ? "pending" : "completed"
                      )
                    }
                    tone="good"
                    icon={<Check size={15} />}
                    label="Done"
                  />
                  <StatusBtn
                    active={status === "modified"}
                    onClick={() =>
                      setWorkoutStatus(
                        b.id,
                        status === "modified" ? "pending" : "modified"
                      )
                    }
                    tone="ok"
                    icon={<Pencil size={15} />}
                    label="Modified"
                  />
                  <StatusBtn
                    active={status === "skipped"}
                    onClick={() =>
                      setWorkoutStatus(
                        b.id,
                        status === "skipped" ? "pending" : "skipped"
                      )
                    }
                    tone="avoid"
                    icon={<X size={15} />}
                    label="Skipped"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Adaptive coaching when a workout is skipped */}
      {anySkipped && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <RotateCcw size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Plan adjusted</p>
            <p className="text-amber-700">
              You skipped a session. Don&apos;t try to &quot;make it all up&quot;
              — add a 20-30 min brisk walk today and tighten your calories by
              ~150 kcal. Then hit tomorrow&apos;s session as planned. Consistency
              beats cramming.
            </p>
          </div>
        </div>
      )}

      {allHandled && !anySkipped && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          🔥 Training complete. That&apos;s a discipline win banked. Recover well.
        </div>
      )}
    </Card>
  );
}

function StatusBtn({
  active,
  onClick,
  tone,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  tone: "good" | "ok" | "avoid";
  icon: React.ReactNode;
  label: string;
}) {
  const activeCls = {
    good: "border-emerald-300 bg-emerald-100 text-emerald-700",
    ok: "border-amber-300 bg-amber-100 text-amber-700",
    avoid: "border-rose-300 bg-rose-100 text-rose-600",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition",
        active ? activeCls : "border-line bg-panel text-muted hover:bg-slate-200"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function WeeklyCalendar() {
  const { state } = useStore();
  const week = fullWeek();
  const todayIdx = mondayIndex();

  // Build date keys for the current week (Mon-Sun) to read completion status.
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIdx);

  return (
    <Card title="This Week" icon={<CalendarDays size={16} className="text-accent" />}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {week.map((d, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const key = toDateKey(date);
          const log = state.days[key];
          const isToday = i === todayIdx;
          const primary = d.blocks[0];
          const meta = WORKOUT_TYPE_META[primary.type];
          const planned = d.blocks.filter((b) => b.type !== "rest");
          const doneCount = planned.filter((b) => {
            const s = log?.workouts[b.id];
            return s === "completed" || s === "modified";
          }).length;
          const skipped = planned.some((b) => log?.workouts[b.id] === "skipped");

          return (
            <div
              key={d.day}
              className={clsx(
                "rounded-xl border p-3 transition",
                isToday
                  ? "border-accent/40 bg-accent/10"
                  : "border-line bg-panel"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted">
                  {WEEKDAY_NAMES[i].slice(0, 3)}
                </span>
                {isToday && <span className="pill bg-accent/20 text-accent">today</span>}
              </div>
              <div
                className="mt-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
              >
                {meta.label}
              </div>
              <p className="mt-1 text-xs font-medium text-strong">
                {primary.title}
              </p>
              {planned.length > 0 && (
                <p
                  className={clsx(
                    "mt-1.5 text-[11px] font-semibold",
                    doneCount === planned.length
                      ? "text-emerald-600"
                      : skipped
                      ? "text-rose-600"
                      : "text-faint"
                  )}
                >
                  {doneCount}/{planned.length} done
                  {skipped && doneCount < planned.length ? " · skipped" : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(WORKOUT_TYPE_META).map(([k, m]) => (
          <Pill key={k} tone="neutral">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            {m.label}
          </Pill>
        ))}
      </div>
    </Card>
  );
}
