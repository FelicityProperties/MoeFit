import { ActivityLevel, DayLog, Profile } from "./types";
import { daysBetween, fromDateKey } from "./date";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Light (1-3 workouts / week)",
  moderate: "Moderate (3-5 workouts / week)",
  active: "Active (6-7 workouts / week)",
  very_active: "Very active (physical job + training)",
};

const KCAL_PER_KG_FAT = 7700;

/** Mifflin-St Jeor basal metabolic rate. */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

/** Total daily energy expenditure (maintenance calories). */
export function tdee(p: Profile): number {
  return Math.round(bmr(p) * ACTIVITY_FACTOR[p.activityLevel]);
}

export interface CalorieTarget {
  target: number;
  maintenance: number;
  deficit: number;
  weeklyLossKg: number;
  note: string;
  capped: boolean;
}

/** Daily calorie target derived from goal weight + timeline, with safe floors. */
export function calorieTarget(p: Profile): CalorieTarget {
  const maintenance = tdee(p);

  if (p.calorieTargetOverride && p.calorieTargetOverride > 0) {
    return {
      target: p.calorieTargetOverride,
      maintenance,
      deficit: maintenance - p.calorieTargetOverride,
      weeklyLossKg: ((maintenance - p.calorieTargetOverride) * 7) / KCAL_PER_KG_FAT,
      note: "Using your manual calorie target.",
      capped: false,
    };
  }

  const toLose = Math.max(0, p.weightKg - p.goalWeightKg);

  let deficit = 500; // sensible default ~0.45 kg/week
  let note = "Default ~0.45 kg/week deficit. Set a target date for a custom pace.";

  if (p.targetDate && toLose > 0) {
    const days = Math.max(7, daysBetween(new Date(), fromDateKey(p.targetDate)));
    const requiredDailyDeficit = (toLose * KCAL_PER_KG_FAT) / days;
    deficit = requiredDailyDeficit;
    note = `Pace to hit ${p.goalWeightKg}kg by your target date.`;
  }

  // Safety: never recommend more than ~1000 kcal/day deficit.
  let capped = false;
  if (deficit > 1000) {
    deficit = 1000;
    capped = true;
    note = "Your timeline is aggressive — capped at a safe 1000 kcal/day deficit.";
  }

  // Floor calories so the plan stays healthy.
  const floor = p.sex === "male" ? 1500 : 1200;
  let target = Math.round(maintenance - deficit);
  if (target < floor) {
    target = floor;
    capped = true;
    deficit = maintenance - floor;
    note = `Held at a safe minimum of ${floor} kcal/day.`;
  }

  return {
    target,
    maintenance,
    deficit: Math.round(deficit),
    weeklyLossKg: Math.round(((deficit * 7) / KCAL_PER_KG_FAT) * 100) / 100,
    note,
    capped,
  };
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fat: number;
}

/** Higher protein for a cut, moderate fat, carbs fill the rest. */
export function macroTargets(p: Profile, calories: number): MacroTargets {
  const protein = Math.round(1.8 * p.weightKg); // g
  const fat = Math.round(0.8 * p.weightKg); // g
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.max(0, Math.round((calories - proteinCals - fatCals) / 4));
  return { protein, carbs, fat };
}

export function waterTargetMl(p: Profile): number {
  if (p.waterTargetOverride && p.waterTargetOverride > 0) {
    return p.waterTargetOverride;
  }
  return Math.round((35 * p.weightKg) / 100) * 100; // ~35 ml per kg, rounded
}

export function bmi(p: Profile): number {
  const m = p.heightCm / 100;
  return Math.round((p.weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return "Underweight";
  if (value < 25) return "Healthy";
  if (value < 30) return "Overweight";
  return "Obese";
}

// ---- Daily totals ----

export interface DayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function dayTotals(day: DayLog | undefined): DayTotals {
  if (!day) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return day.foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Calories burned today from completed workouts. */
export function workoutCaloriesBurned(
  day: DayLog | undefined,
  blockCalories: Record<string, number>
): number {
  if (!day) return 0;
  let total = 0;
  for (const [id, status] of Object.entries(day.workouts)) {
    if (status === "completed" || status === "modified") {
      total += blockCalories[id] ?? 0;
    }
  }
  return total;
}
