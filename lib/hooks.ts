"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { CoachContext } from "./coach";
import {
  calorieTarget,
  dayTotals,
  macroTargets,
  waterTargetMl,
} from "./calculations";
import { planForDate } from "./workout";
import { ScheduleItem } from "./types";
import { minutesOfDay, formatClock } from "./date";

/** Live ticking clock. Updates every `intervalMs` (default 1s). */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Builds the CoachContext that the AI engine consumes, from current state. */
export function useCoachContext(): CoachContext {
  const { state, getDay } = useStore();
  const day = getDay();
  const totals = dayTotals(day);
  const target = calorieTarget(state.profile);
  const macros = macroTargets(state.profile, target.target);
  const water = waterTargetMl(state.profile);

  const plan = planForDate();
  const trainingBlocks = plan.filter((b) => b.type !== "rest");
  const workoutPlannedToday =
    trainingBlocks.map((b) => b.title).join(" + ") || "Rest day";
  const workoutLabel =
    trainingBlocks.length > 0
      ? trainingBlocks.map((b) => b.title).join(" + ")
      : "Rest day — recover";
  const workedOutToday = plan.some(
    (b) =>
      day.workouts[b.id] === "completed" || day.workouts[b.id] === "modified"
  );

  // Today's actual routine: the per-day override if set, else the right
  // template for the weekday/Saturday/Sunday. The "workout" slot shows the
  // day's real session. This lets the AI coach answer timing questions against
  // the user's true day, including same-day "Adjust today" changes.
  const now = new Date();
  const dow = now.getDay();
  const template =
    dow === 6
      ? state.saturdaySchedule
      : dow === 0
      ? state.sundaySchedule
      : state.schedule;
  const effective = day.scheduleOverride ?? template;
  const labelOf = (it: ScheduleItem) =>
    it.category === "workout" ? workoutLabel : it.label;
  const sorted = [...effective].sort(
    (a, b) => minutesOfDay(a.hour, a.minute) - minutesOfDay(b.hour, b.minute)
  );
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const currentItem =
    [...sorted].reverse().find((s) => minutesOfDay(s.hour, s.minute) <= nowMins) ??
    sorted[0];
  const nextItem = sorted.find((s) => minutesOfDay(s.hour, s.minute) > nowMins);
  const scheduleToday = sorted.map((it) => ({
    time: formatClock(it.hour, it.minute),
    label: labelOf(it),
  }));

  return {
    name: state.profile.name,
    hour: now.getHours(),
    calorieTarget: target.target,
    caloriesConsumed: totals.calories,
    caloriesRemaining: Math.max(0, target.target - totals.calories),
    proteinTarget: macros.protein,
    proteinConsumed: totals.protein,
    waterTargetMl: water,
    waterConsumedMl: day.waterMl,
    workedOutToday,
    workoutPlannedToday,
    weightKg: state.profile.weightKg,
    goalWeightKg: state.profile.goalWeightKg,
    currentActivity: currentItem ? labelOf(currentItem) : "",
    nextActivity: nextItem
      ? `${labelOf(nextItem)} at ${formatClock(nextItem.hour, nextItem.minute)}`
      : "",
    scheduleToday,
  };
}

/** True only after client hydration — use to gate localStorage-driven UI. */
export function useHydrated(): boolean {
  return useStore().hydrated;
}
