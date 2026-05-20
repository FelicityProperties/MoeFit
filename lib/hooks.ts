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
  const workoutPlannedToday = plan
    .filter((b) => b.type !== "rest")
    .map((b) => b.title)
    .join(" + ") || "Rest day";
  const workedOutToday = plan.some(
    (b) =>
      day.workouts[b.id] === "completed" || day.workouts[b.id] === "modified"
  );

  return {
    name: state.profile.name,
    hour: new Date().getHours(),
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
  };
}

/** True only after client hydration — use to gate localStorage-driven UI. */
export function useHydrated(): boolean {
  return useStore().hydrated;
}
