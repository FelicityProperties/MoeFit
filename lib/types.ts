// Core data model for MoeFit Command Center.
// Everything is persisted to localStorage (see lib/store.tsx). The shapes here
// are intentionally plain JSON so they can later be synced to Supabase/Firebase
// without transformation.

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export interface Profile {
  name: string;
  age: number;
  heightCm: number;
  sex: Sex;
  weightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  /** Target date to reach goal weight, ISO yyyy-mm-dd. Empty = no deadline. */
  targetDate: string;
  /** Manual override for daily calorie target. 0/undefined = auto-calculate. */
  calorieTargetOverride?: number;
  /** Manual override for water target in ml. 0/undefined = auto-calculate. */
  waterTargetOverride?: number;
}

export type Macro = "protein" | "carbs" | "fat";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** HH:mm */
  time: string;
  /** e.g. "home", "restaurant", "delivery" */
  source: string;
}

export type WorkoutStatus = "pending" | "completed" | "skipped" | "modified";

export interface WorkoutBlock {
  id: string;
  title: string;
  type: "gym" | "cardio" | "run" | "hiit" | "rest" | "recovery" | "walk" | "muay_thai";
  detail: string;
  estCalories: number;
  durationMin: number;
}

export interface DayReview {
  workedOut: boolean | null;
  ate: string;
  overate: boolean | null;
  energy: number; // 1-5
  improve: string;
  score: number; // 0-100
  report: string;
  completedAt: string; // ISO
}

export interface DayLog {
  date: string; // yyyy-mm-dd
  weightKg?: number;
  foods: FoodEntry[];
  /** water consumed in ml */
  waterMl: number;
  /** keyed by workout block id -> status */
  workouts: Record<string, WorkoutStatus>;
  /** mission text -> done */
  missions: { text: string; done: boolean }[];
  energy?: number; // 1-5 quick log
  review?: DayReview;
}

export interface ScheduleItem {
  id: string;
  /** 0-23 */
  hour: number;
  label: string;
  category: "wake" | "work" | "meal" | "workout" | "water" | "sleep" | "personal";
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  createdAt: string;
}

export interface OrderSmartResult {
  query: string;
  verdict: "good" | "ok" | "avoid";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timing: string;
  alternatives: string[];
  reasoning: string;
  createdAt: string;
}

export interface AppState {
  version: number;
  profile: Profile;
  schedule: ScheduleItem[];
  defaultMissions: string[];
  days: Record<string, DayLog>;
  chat: ChatMessage[];
  orderHistory: OrderSmartResult[];
  /** free-text before/after progress notes */
  progressNotes: string;
  /** which weekly workout template is active */
  workoutPlanStartWeight?: number;
}
