"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  ChatMessage,
  DayLog,
  DayReview,
  FoodEntry,
  MealSuggestion,
  OrderSmartResult,
  Profile,
  ScheduleItem,
  WorkoutStatus,
} from "./types";
import { freshState, migrateState } from "./defaults";
import { toDateKey } from "./date";

const STORAGE_KEY = "moefit:v1";
const STORAGE_TS = "moefit:v1:ts";

// When true (set NEXT_PUBLIC_CLOUD_ENABLED=true on Vercel), the app gates behind
// a passcode and syncs AppState to Neon Postgres via /api/state, using
// localStorage as an offline cache. When false/unset, it's pure localStorage.
export const CLOUD_ENABLED =
  process.env.NEXT_PUBLIC_CLOUD_ENABLED === "true";

export type CloudStatus = "local" | "syncing" | "synced" | "offline";

// ---------------------------------------------------------------------------
// Persistence
// ----------------------------------------------------------------------------
// Data lives in localStorage today. To move to Supabase/Firebase later, replace
// loadState/saveState with async calls and keep the same AppState shape.
// INTEGRATION POINT (cloud sync): swap these two functions for network calls.
// ---------------------------------------------------------------------------

function loadState(): AppState {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as AppState;
    // Merge with fresh defaults so new fields always exist, then migrate.
    return migrateState({ ...freshState(), ...parsed });
  } catch {
    return freshState();
  }
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.setItem(STORAGE_TS, String(Date.now()));
  } catch {
    // storage full / disabled — fail silently
  }
}

function localTimestamp(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(STORAGE_TS) || 0);
}

// --- Cloud (Neon via /api/state) ---
async function cloudGet(): Promise<{ data: AppState | null; updatedAt: string | null }> {
  const res = await fetch("/api/state", { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/state ${res.status}`);
  return res.json();
}

async function cloudPut(state: AppState): Promise<void> {
  const res = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`PUT /api/state ${res.status}`);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------

interface StoreContextValue {
  state: AppState;
  hydrated: boolean;
  cloudStatus: CloudStatus;
  // profile
  updateProfile: (patch: Partial<Profile>) => void;
  // days
  getDay: (date?: string) => DayLog;
  setWeight: (kg: number, date?: string) => void;
  setEnergy: (energy: number, date?: string) => void;
  // food
  addFood: (entry: Omit<FoodEntry, "id">, date?: string) => void;
  removeFood: (id: string, date?: string) => void;
  // water
  addWater: (ml: number, date?: string) => void;
  setWater: (ml: number, date?: string) => void;
  // workouts
  setWorkoutStatus: (blockId: string, status: WorkoutStatus, date?: string) => void;
  // missions
  toggleMission: (index: number, date?: string) => void;
  setMissions: (missions: string[], date?: string) => void;
  // review
  setReview: (review: DayReview, date?: string) => void;
  // meal plan
  setMealPlan: (meals: MealSuggestion[], date?: string) => void;
  // chat
  addChat: (msg: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearChat: () => void;
  // order smart
  addOrder: (result: OrderSmartResult) => void;
  // schedule + missions defaults
  setSchedule: (schedule: ScheduleItem[]) => void;
  setDefaultMissions: (missions: string[]) => void;
  setProgressNotes: (notes: string) => void;
  // data management
  exportData: () => string;
  importData: (json: string) => boolean;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function emptyDay(date: string, missions: string[]): DayLog {
  return {
    date,
    foods: [],
    waterMl: 0,
    workouts: {},
    missions: missions.map((text) => ({ text, done: false })),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => freshState());
  const [hydrated, setHydrated] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(
    CLOUD_ENABLED ? "syncing" : "local"
  );
  // Gates the cloud push effect until the initial server reconcile is done, so
  // we never overwrite newer server data with stale local data on first load.
  const syncReady = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load once on mount (client only): localStorage first for instant UI, then
  // reconcile with the cloud if enabled (last-write-wins by timestamp).
  useEffect(() => {
    const local = loadState();
    const localTs = localTimestamp();
    setState(local);
    setHydrated(true);

    if (!CLOUD_ENABLED) return;

    (async () => {
      try {
        const remote = await cloudGet();
        const remoteTs = remote.updatedAt
          ? new Date(remote.updatedAt).getTime()
          : 0;
        if (remote.data && remoteTs >= localTs) {
          const merged = migrateState({ ...freshState(), ...remote.data });
          setState(merged);
          saveState(merged);
        } else {
          await cloudPut(local); // server empty or stale -> push local up
        }
        setCloudStatus("synced");
      } catch {
        setCloudStatus("offline");
      } finally {
        syncReady.current = true;
      }
    })();
  }, []);

  // Persist to localStorage on every change after hydration.
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // Debounced write-through to the cloud after the initial reconcile.
  useEffect(() => {
    if (!CLOUD_ENABLED || !syncReady.current) return;
    setCloudStatus("syncing");
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      cloudPut(state)
        .then(() => setCloudStatus("synced"))
        .catch(() => setCloudStatus("offline"));
    }, 800);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [state]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const ensureDay = useCallback(
    (s: AppState, date: string): { state: AppState; day: DayLog } => {
      const existing = s.days[date];
      if (existing) return { state: s, day: existing };
      const day = emptyDay(date, s.defaultMissions);
      const next = { ...s, days: { ...s.days, [date]: day } };
      return { state: next, day };
    },
    []
  );

  const mutateDay = useCallback(
    (date: string | undefined, fn: (day: DayLog) => DayLog) => {
      const key = date ?? toDateKey();
      setState((s) => {
        const { state: withDay, day } = ensureDay(s, key);
        const updated = fn(day);
        return { ...withDay, days: { ...withDay.days, [key]: updated } };
      });
    },
    [ensureDay]
  );

  const getDay = useCallback(
    (date?: string): DayLog => {
      const key = date ?? toDateKey();
      return state.days[key] ?? emptyDay(key, state.defaultMissions);
    },
    [state.days, state.defaultMissions]
  );

  const setWeight = useCallback(
    (kg: number, date?: string) => {
      mutateDay(date, (d) => ({ ...d, weightKg: kg }));
      // also update current profile weight to the latest entry
      setState((s) => ({ ...s, profile: { ...s.profile, weightKg: kg } }));
    },
    [mutateDay]
  );

  const setEnergy = useCallback(
    (energy: number, date?: string) => {
      mutateDay(date, (d) => ({ ...d, energy }));
    },
    [mutateDay]
  );

  const addFood = useCallback(
    (entry: Omit<FoodEntry, "id">, date?: string) => {
      mutateDay(date, (d) => ({
        ...d,
        foods: [...d.foods, { ...entry, id: uid() }],
      }));
    },
    [mutateDay]
  );

  const removeFood = useCallback(
    (id: string, date?: string) => {
      mutateDay(date, (d) => ({ ...d, foods: d.foods.filter((f) => f.id !== id) }));
    },
    [mutateDay]
  );

  const addWater = useCallback(
    (ml: number, date?: string) => {
      mutateDay(date, (d) => ({ ...d, waterMl: Math.max(0, d.waterMl + ml) }));
    },
    [mutateDay]
  );

  const setWater = useCallback(
    (ml: number, date?: string) => {
      mutateDay(date, (d) => ({ ...d, waterMl: Math.max(0, ml) }));
    },
    [mutateDay]
  );

  const setWorkoutStatus = useCallback(
    (blockId: string, status: WorkoutStatus, date?: string) => {
      mutateDay(date, (d) => ({
        ...d,
        workouts: { ...d.workouts, [blockId]: status },
      }));
    },
    [mutateDay]
  );

  const toggleMission = useCallback(
    (index: number, date?: string) => {
      mutateDay(date, (d) => {
        const missions = d.missions.map((m, i) =>
          i === index ? { ...m, done: !m.done } : m
        );
        return { ...d, missions };
      });
    },
    [mutateDay]
  );

  const setMissions = useCallback(
    (missions: string[], date?: string) => {
      mutateDay(date, (d) => {
        const existing = d.missions;
        const next = missions.map((text) => {
          const prev = existing.find((m) => m.text === text);
          return { text, done: prev?.done ?? false };
        });
        return { ...d, missions: next };
      });
    },
    [mutateDay]
  );

  const setReview = useCallback(
    (review: DayReview, date?: string) => {
      mutateDay(date, (d) => ({ ...d, review }));
    },
    [mutateDay]
  );

  const setMealPlan = useCallback(
    (meals: MealSuggestion[], date?: string) => {
      mutateDay(date, (d) => ({ ...d, mealPlan: meals }));
    },
    [mutateDay]
  );

  const addChat = useCallback((msg: Omit<ChatMessage, "id" | "createdAt">) => {
    setState((s) => ({
      ...s,
      chat: [
        ...s.chat,
        { ...msg, id: uid(), createdAt: new Date().toISOString() },
      ].slice(-200),
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState((s) => ({ ...s, chat: [] }));
  }, []);

  const addOrder = useCallback((result: OrderSmartResult) => {
    setState((s) => ({ ...s, orderHistory: [result, ...s.orderHistory].slice(0, 50) }));
  }, []);

  const setSchedule = useCallback((schedule: ScheduleItem[]) => {
    setState((s) => ({ ...s, schedule }));
  }, []);

  const setDefaultMissions = useCallback((missions: string[]) => {
    setState((s) => ({ ...s, defaultMissions: missions }));
  }, []);

  const setProgressNotes = useCallback((notes: string) => {
    setState((s) => ({ ...s, progressNotes: notes }));
  }, []);

  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as AppState;
      if (!parsed || typeof parsed !== "object" || !parsed.profile) return false;
      setState(migrateState({ ...freshState(), ...parsed }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetAll = useCallback(() => {
    setState(freshState());
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      hydrated,
      cloudStatus,
      updateProfile,
      getDay,
      setWeight,
      setEnergy,
      addFood,
      removeFood,
      addWater,
      setWater,
      setWorkoutStatus,
      toggleMission,
      setMissions,
      setReview,
      setMealPlan,
      addChat,
      clearChat,
      addOrder,
      setSchedule,
      setDefaultMissions,
      setProgressNotes,
      exportData,
      importData,
      resetAll,
    }),
    [
      state,
      hydrated,
      cloudStatus,
      updateProfile,
      getDay,
      setWeight,
      setEnergy,
      addFood,
      removeFood,
      addWater,
      setWater,
      setWorkoutStatus,
      toggleMission,
      setMissions,
      setReview,
      setMealPlan,
      addChat,
      clearChat,
      addOrder,
      setSchedule,
      setDefaultMissions,
      setProgressNotes,
      exportData,
      importData,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
