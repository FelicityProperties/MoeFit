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

// Default hour-by-hour routine — built around MORNING training. Editable in
// Settings. Category drives the icon and the "what should I be doing now" logic;
// the "workout" item is shown with the day's actual session (Muay Thai on
// Tue/Thu, gym/cardio otherwise) on the dashboard.
export const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: "s6", hour: 6, label: "Wake up + 500ml water", category: "wake" },
  { id: "s630", hour: 6, label: "Pre-workout: coffee + light stretch", category: "personal" },
  { id: "s7", hour: 7, label: "Morning training", category: "workout" },
  { id: "s9", hour: 9, label: "High-protein breakfast", category: "meal" },
  { id: "s10", hour: 10, label: "Deep work / focus block", category: "work" },
  { id: "s12", hour: 12, label: "Water check (1.5L by now)", category: "water" },
  { id: "s13", hour: 13, label: "Lunch — protein + veg", category: "meal" },
  { id: "s14", hour: 14, label: "Work focus, avoid snacking", category: "work" },
  { id: "s17", hour: 17, label: "Evening walk / steps", category: "personal" },
  { id: "s19", hour: 19, label: "Healthy dinner, no junk", category: "meal" },
  { id: "s21", hour: 21, label: "Wind down, no late food", category: "personal" },
  { id: "s22", hour: 22, label: "Screens off, prep for sleep", category: "sleep" },
  { id: "s23", hour: 23, label: "Sleep", category: "sleep" },
];

export const DEFAULT_MISSIONS = [
  "Hit my calorie target",
  "Complete today's workout",
  "Drink all my water",
  "No junk food / clean eating",
  "In bed by 11pm",
];

export const CURRENT_VERSION = 2;

export function freshState(): AppState {
  return {
    version: CURRENT_VERSION,
    profile: { ...DEFAULT_PROFILE },
    schedule: [...DEFAULT_SCHEDULE],
    defaultMissions: [...DEFAULT_MISSIONS],
    days: {},
    chat: [],
    orderHistory: [],
    progressNotes: "",
  };
}

/**
 * Upgrade a previously-saved state to the current version. v2 moves everyone to
 * the morning-training routine. Only the routine is replaced; profile, logs,
 * chat, etc. are preserved.
 */
export function migrateState(state: AppState): AppState {
  let next = state;
  if ((next.version ?? 1) < 2) {
    next = { ...next, schedule: [...DEFAULT_SCHEDULE], version: 2 };
  }
  return next;
}
