import { WorkoutBlock } from "./types";
import { mondayIndex } from "./date";

// Morning-only fat-loss split with Muay Thai on Tuesday & Thursday.
// Index 0 = Monday. All sessions are done in the MORNING.
// Block ids are stable per weekday so completion status persists per calendar day.

const WEEK: WorkoutBlock[][] = [
  // Monday — Gym: full body strength
  [
    {
      id: "mon-gym",
      title: "Gym — Full Body Strength",
      type: "gym",
      detail: "Squats 4x10, Bench 4x10, Rows 4x12, Overhead press 3x12, Plank 3x45s. Finish with a 10 min incline walk.",
      estCalories: 380,
      durationMin: 60,
    },
  ],
  // Tuesday — Muay Thai
  [
    {
      id: "tue-muaythai",
      title: "Muay Thai",
      type: "muay_thai",
      detail: "Morning class: shadow boxing, pad work, bag rounds, clinch & conditioning. Hydrate well after.",
      estCalories: 600,
      durationMin: 75,
    },
  ],
  // Wednesday — Cardio + core
  [
    {
      id: "wed-cardio",
      title: "Cardio + Core",
      type: "cardio",
      detail: "25-30 min steady run or intervals, then 3 rounds: 20 crunches, 45s plank, 15 leg raises, 20 mountain climbers.",
      estCalories: 400,
      durationMin: 45,
    },
  ],
  // Thursday — Muay Thai
  [
    {
      id: "thu-muaythai",
      title: "Muay Thai",
      type: "muay_thai",
      detail: "Morning class: technique, pad work, bag rounds, sparring/clinch. Stretch hips and shoulders after.",
      estCalories: 600,
      durationMin: 75,
    },
  ],
  // Friday — Gym: lower body strength
  [
    {
      id: "fri-gym",
      title: "Gym — Lower Body Strength",
      type: "gym",
      detail: "Deadlift 4x8, Lunges 3x12/leg, Leg press 4x12, Calf raises 4x15, Hanging knee raise 3x12.",
      estCalories: 360,
      durationMin: 55,
    },
  ],
  // Saturday — Active recovery / light cardio
  [
    {
      id: "sat-recovery",
      title: "Active Recovery / Light Cardio",
      type: "recovery",
      detail: "30-45 min brisk walk, easy bike, or swim + 10 min full-body mobility. Keep it easy.",
      estCalories: 200,
      durationMin: 45,
    },
  ],
  // Sunday — Rest
  [
    {
      id: "sun-rest",
      title: "Full Rest Day",
      type: "rest",
      detail: "Recover, prep meals for the week, light stretching optional. Sleep is the workout.",
      estCalories: 0,
      durationMin: 0,
    },
  ],
];

export const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function planForWeekdayIndex(idx: number): WorkoutBlock[] {
  return WEEK[((idx % 7) + 7) % 7];
}

export function planForDate(d: Date = new Date()): WorkoutBlock[] {
  return planForWeekdayIndex(mondayIndex(d));
}

export function fullWeek(): { day: string; blocks: WorkoutBlock[] }[] {
  return WEEK.map((blocks, i) => ({ day: WEEKDAY_NAMES[i], blocks }));
}

/** Map of every block id -> est calories (used for burn calculations). */
export function allBlockCalories(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const day of WEEK) for (const b of day) map[b.id] = b.estCalories;
  return map;
}

export const WORKOUT_TYPE_META: Record<
  WorkoutBlock["type"],
  { label: string; color: string }
> = {
  gym: { label: "Gym", color: "#7c6cff" },
  muay_thai: { label: "Muay Thai", color: "#f97316" },
  cardio: { label: "Cardio", color: "#38bdf8" },
  run: { label: "Run", color: "#a78bfa" },
  hiit: { label: "HIIT", color: "#f43f5e" },
  rest: { label: "Rest", color: "#64748b" },
  recovery: { label: "Recovery", color: "#22c55e" },
  walk: { label: "Walk", color: "#eab308" },
};
