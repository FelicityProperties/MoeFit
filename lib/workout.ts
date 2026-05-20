import { WorkoutBlock } from "./types";
import { mondayIndex } from "./date";

// A 7-day fat-loss focused split. Index 0 = Monday. Each day has 1-2 blocks.
// Block ids are stable per weekday so completion status persists per calendar day.

const WEEK: WorkoutBlock[][] = [
  // Monday - Full body strength + light cardio
  [
    {
      id: "mon-strength",
      title: "Full Body Strength",
      type: "gym",
      detail: "Squats 4x10, Bench 4x10, Rows 4x12, Overhead press 3x12, Plank 3x45s",
      estCalories: 320,
      durationMin: 50,
    },
    {
      id: "mon-cardio",
      title: "Incline Walk",
      type: "cardio",
      detail: "15 min incline treadmill walk to finish",
      estCalories: 110,
      durationMin: 15,
    },
  ],
  // Tuesday - Cardio + core
  [
    {
      id: "tue-run",
      title: "Steady Run",
      type: "run",
      detail: "25-30 min easy-pace run (zone 2)",
      estCalories: 300,
      durationMin: 30,
    },
    {
      id: "tue-core",
      title: "Core Circuit",
      type: "hiit",
      detail: "3 rounds: 20 crunches, 30s plank, 15 leg raises, 20 mountain climbers",
      estCalories: 120,
      durationMin: 15,
    },
  ],
  // Wednesday - Upper body + burpees
  [
    {
      id: "wed-upper",
      title: "Upper Body Push/Pull",
      type: "gym",
      detail: "Incline press 4x10, Lat pulldown 4x12, Dips 3x12, Curls 3x12, Lateral raise 3x15",
      estCalories: 300,
      durationMin: 45,
    },
    {
      id: "wed-burpees",
      title: "Burpee Finisher",
      type: "hiit",
      detail: "5 rounds: 10 burpees, 30s rest",
      estCalories: 90,
      durationMin: 10,
    },
  ],
  // Thursday - Active recovery
  [
    {
      id: "thu-recovery",
      title: "Active Recovery",
      type: "recovery",
      detail: "30-40 min brisk walk + 10 min full-body stretch / mobility",
      estCalories: 150,
      durationMin: 45,
    },
  ],
  // Friday - Lower body + HIIT
  [
    {
      id: "fri-legs",
      title: "Lower Body Strength",
      type: "gym",
      detail: "Deadlift 4x8, Lunges 3x12/leg, Leg press 4x12, Calf raises 4x15, Hanging knee raise 3x12",
      estCalories: 340,
      durationMin: 50,
    },
    {
      id: "fri-hiit",
      title: "HIIT Intervals",
      type: "hiit",
      detail: "10 rounds: 30s sprint / 60s walk (bike, rower, or run)",
      estCalories: 180,
      durationMin: 20,
    },
  ],
  // Saturday - Long cardio / outdoor
  [
    {
      id: "sat-cardio",
      title: "Long Cardio / Sport",
      type: "cardio",
      detail: "45-60 min: long run, cycle, swim, or a sport you enjoy",
      estCalories: 400,
      durationMin: 55,
    },
  ],
  // Sunday - Rest
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
  cardio: { label: "Cardio", color: "#38bdf8" },
  run: { label: "Run", color: "#a78bfa" },
  hiit: { label: "HIIT", color: "#f43f5e" },
  rest: { label: "Rest", color: "#64748b" },
  recovery: { label: "Recovery", color: "#22c55e" },
  walk: { label: "Walk", color: "#eab308" },
};
