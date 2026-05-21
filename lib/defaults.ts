import { AppState, Profile, ScheduleItem } from "./types";

export const DEFAULT_PROFILE: Profile = {
  name: "",
  age: 28,
  heightCm: 178,
  sex: "male",
  weightKg: 90,
  goalWeightKg: 78,
  activityLevel: "light",
  targetDate: "",
};

// Default WEEKDAY routine — day starts at 8am, training in the morning.
// Editable in Settings. Category drives the icon and the "what should I be
// doing now" logic; the "workout" item shows the day's actual session.
export const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: "wd-wake", hour: 8, label: "Wake up + 500ml water", category: "wake" },
  { id: "wd-pre", hour: 8, label: "Pre-workout: coffee + light stretch", category: "personal" },
  { id: "wd-train", hour: 9, label: "Morning training", category: "workout" },
  { id: "wd-breakfast", hour: 10, label: "High-protein breakfast", category: "meal" },
  { id: "wd-work1", hour: 11, label: "Deep work / focus block", category: "work" },
  { id: "wd-water", hour: 13, label: "Water check (1.5L by now)", category: "water" },
  { id: "wd-lunch", hour: 13, label: "Lunch — protein + veg", category: "meal" },
  { id: "wd-work2", hour: 14, label: "Work focus, avoid snacking", category: "work" },
  { id: "wd-walk", hour: 17, label: "Evening walk / steps", category: "personal" },
  { id: "wd-dinner", hour: 19, label: "Healthy dinner, no junk", category: "meal" },
  { id: "wd-wind", hour: 21, label: "Wind down, no late food", category: "personal" },
  { id: "wd-screens", hour: 22, label: "Screens off, prep for sleep", category: "sleep" },
  { id: "wd-sleep", hour: 23, label: "Sleep", category: "sleep" },
];

// Default SATURDAY routine — relaxed 11am start, light training + errands.
export const DEFAULT_SATURDAY_SCHEDULE: ScheduleItem[] = [
  { id: "sat-wake", hour: 11, label: "Wake up + 500ml water", category: "wake" },
  { id: "sat-pre", hour: 11, label: "Light stretch + coffee", category: "personal" },
  { id: "sat-train", hour: 12, label: "Morning training", category: "workout" },
  { id: "sat-brunch", hour: 13, label: "High-protein brunch", category: "meal" },
  { id: "sat-activity", hour: 15, label: "Errands / activity / social", category: "personal" },
  { id: "sat-water", hour: 16, label: "Water check (1.5L by now)", category: "water" },
  { id: "sat-snack", hour: 18, label: "Light meal — protein", category: "meal" },
  { id: "sat-dinner", hour: 20, label: "Dinner out — pick lean", category: "meal" },
  { id: "sat-wind", hour: 22, label: "Wind down, no late food", category: "personal" },
  { id: "sat-sleep", hour: 23, label: "Sleep", category: "sleep" },
];

// Default SUNDAY routine — full rest day, 11am start, meal prep & recovery.
export const DEFAULT_SUNDAY_SCHEDULE: ScheduleItem[] = [
  { id: "sun-wake", hour: 11, label: "Wake up + 500ml water", category: "wake" },
  { id: "sun-stretch", hour: 11, label: "Easy stretch + coffee", category: "personal" },
  { id: "sun-walk", hour: 12, label: "Light walk / mobility (rest day)", category: "personal" },
  { id: "sun-brunch", hour: 13, label: "High-protein brunch", category: "meal" },
  { id: "sun-prep", hour: 14, label: "Meal prep for the week", category: "personal" },
  { id: "sun-water", hour: 16, label: "Water check (1.5L by now)", category: "water" },
  { id: "sun-snack", hour: 18, label: "Light meal — protein", category: "meal" },
  { id: "sun-dinner", hour: 20, label: "Healthy dinner, no junk", category: "meal" },
  { id: "sun-wind", hour: 22, label: "Wind down, screens off", category: "sleep" },
  { id: "sun-sleep", hour: 23, label: "Sleep", category: "sleep" },
];

export const DEFAULT_MISSIONS = [
  "Hit my calorie target",
  "Complete today's workout",
  "Drink all my water",
  "No junk food / clean eating",
  "In bed by 11pm",
];

export const CURRENT_VERSION = 4;

export function freshState(): AppState {
  return {
    version: CURRENT_VERSION,
    profile: { ...DEFAULT_PROFILE },
    schedule: [...DEFAULT_SCHEDULE],
    saturdaySchedule: [...DEFAULT_SATURDAY_SCHEDULE],
    sundaySchedule: [...DEFAULT_SUNDAY_SCHEDULE],
    defaultMissions: [...DEFAULT_MISSIONS],
    days: {},
    chat: [],
    orderHistory: [],
    progressNotes: "",
  };
}

/**
 * Upgrade a previously-saved state to the current version. Only routines are
 * replaced; profile, logs, chat, etc. are preserved.
 *   v3 → 8am weekday routine
 *   v4 → separate Saturday + Sunday routines (was one weekend routine)
 */
export function migrateState(state: AppState): AppState {
  let next = state;
  if ((next.version ?? 1) < 3) {
    next = { ...next, schedule: [...DEFAULT_SCHEDULE], version: 3 };
  }
  if ((next.version ?? 1) < 4) {
    next = {
      ...next,
      saturdaySchedule: [...DEFAULT_SATURDAY_SCHEDULE],
      sundaySchedule: [...DEFAULT_SUNDAY_SCHEDULE],
      version: 4,
    };
  }
  return next;
}
