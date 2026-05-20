import { calorieTarget, dayTotals, waterTargetMl } from "./calculations";
import { AppState, DayLog } from "./types";
import { lastNDays, toDateKey, fromDateKey } from "./date";
import { planForDate, allBlockCalories } from "./workout";

export interface DayMetrics {
  date: string;
  calories: number;
  calorieTarget: number;
  caloriesOk: boolean;
  waterMl: number;
  waterOk: boolean;
  workoutDone: boolean;
  workoutPlanned: boolean;
  cleanEating: boolean; // calories <= target and not wildly over
  weightKg?: number;
  disciplineScore: number; // 0-100 quick score for the day
}

function workoutInfoForDay(state: AppState, day: DayLog) {
  const plan = planForDate(fromDateKey(day.date));
  const planned = plan.filter((b) => b.type !== "rest");
  const workoutPlanned = planned.length > 0;
  const workoutDone =
    !workoutPlanned ||
    planned.some(
      (b) => day.workouts[b.id] === "completed" || day.workouts[b.id] === "modified"
    );
  return { workoutPlanned, workoutDone };
}

export function dayMetrics(state: AppState, dateKey: string): DayMetrics {
  const day =
    state.days[dateKey] ??
    ({ date: dateKey, foods: [], waterMl: 0, workouts: {}, missions: [] } as DayLog);
  const totals = dayTotals(day);
  const target = calorieTarget(state.profile).target;
  const water = waterTargetMl(state.profile);

  const caloriesOk =
    totals.calories > 0 && totals.calories <= target * 1.05;
  const waterOk = water > 0 && day.waterMl >= water * 0.9;
  const { workoutPlanned, workoutDone } = workoutInfoForDay(state, day);
  const cleanEating = totals.calories > 0 && totals.calories <= target * 1.1;

  // Quick discipline score (used when there's no full review for the day).
  let score = 0;
  if (totals.calories > 0) score += caloriesOk ? 35 : 15;
  if (workoutDone) score += 30;
  if (waterOk) score += 20;
  if (cleanEating) score += 15;
  // If a full review exists, prefer its score.
  const finalScore = day.review ? day.review.score : Math.min(100, score);

  return {
    date: dateKey,
    calories: totals.calories,
    calorieTarget: target,
    caloriesOk,
    waterMl: day.waterMl,
    waterOk,
    workoutDone,
    workoutPlanned,
    cleanEating,
    weightKg: day.weightKg,
    disciplineScore: finalScore,
  };
}

export function rangeMetrics(state: AppState, days: number): DayMetrics[] {
  return lastNDays(days).map((k) => dayMetrics(state, k));
}

export interface Streaks {
  workout: number;
  cleanEating: number;
  calorieControl: number;
  water: number;
}

/** Count consecutive days (ending today or yesterday) meeting each condition. */
export function computeStreaks(state: AppState): Streaks {
  const keys = lastNDays(120).reverse(); // today first, going back
  const today = toDateKey();

  function streak(pred: (m: DayMetrics) => boolean): number {
    let count = 0;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const m = dayMetrics(state, k);
      const has = state.days[k];
      // Allow the streak to "not break" if today hasn't been logged yet.
      if (k === today && !has) continue;
      if (pred(m)) count++;
      else break;
    }
    return count;
  }

  // Workout streak: count consecutive completed training days; rest days are
  // skipped (they neither add to nor break the streak).
  function workoutStreak(): number {
    let count = 0;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const m = dayMetrics(state, k);
      const has = state.days[k];
      if (k === today && !has) continue;
      if (!m.workoutPlanned) continue; // rest day — skip
      if (m.workoutDone) count++;
      else break;
    }
    return count;
  }

  return {
    workout: workoutStreak(),
    cleanEating: streak((m) => m.cleanEating),
    calorieControl: streak((m) => m.caloriesOk),
    water: streak((m) => m.waterOk),
  };
}

export interface WeeklyDiscipline {
  weekLabel: string;
  avgScore: number;
}

/** Average discipline score per week for the last `weeks` weeks. */
export function weeklyDiscipline(state: AppState, weeks = 6): WeeklyDiscipline[] {
  const out: WeeklyDiscipline[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const keys = lastNDays(7, addDaysLocal(new Date(), -7 * w));
    const scores = keys
      .map((k) => (state.days[k] ? dayMetrics(state, k).disciplineScore : null))
      .filter((s): s is number => s !== null);
    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const label =
      w === 0 ? "This wk" : w === 1 ? "Last wk" : `${w}w ago`;
    out.push({ weekLabel: label, avgScore: avg });
  }
  return out;
}

function addDaysLocal(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export function weightSeries(state: AppState): WeightPoint[] {
  return Object.values(state.days)
    .filter((d) => typeof d.weightKg === "number")
    .map((d) => ({ date: d.date, weightKg: d.weightKg as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Calories burned via completed workouts across a range (for stats). */
export function caloriesBurnedRange(state: AppState, days: number): number {
  const cals = allBlockCalories();
  return lastNDays(days).reduce((sum, k) => {
    const day = state.days[k];
    if (!day) return sum;
    for (const [id, status] of Object.entries(day.workouts)) {
      if (status === "completed" || status === "modified") sum += cals[id] ?? 0;
    }
    return sum;
  }, 0);
}
