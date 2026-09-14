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
import { freshState, reviveState } from "./defaults";
import { toDateKey } from "./date";

const STORAGE_KEY = "felihealth:v1";
const STORAGE_TS = "felihealth:v1:ts";
// Pre-rebrand keys; migrated on first load so nobody loses their data.
const LEGACY_KEY = "moefit:v1";
const LEGACY_TS = "moefit:v1:ts";

// When true (set NEXT_PUBLIC_CLOUD_ENABLED=true on Vercel), the app gates behind
// a passcode and syncs AppState to Neon Postgres via /api/state, using
// localStorage as an offline cache. When false/unset, it's pure localStorage.
export const CLOUD_ENABLED =
  process.env.NEXT_PUBLIC_CLOUD_ENABLED === "true";

// When true, the cloud gate uses Google sign-in (Auth.js) instead of a passcode,
// and each user's data is keyed by their Google email. Requires CLOUD_ENABLED.
export const GOOGLE_AUTH =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

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
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // One-time migration from the pre-rebrand storage key.
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        const ts = window.localStorage.getItem(LEGACY_TS);
        if (ts) window.localStorage.setItem(STORAGE_TS, ts);
        raw = legacy;
      }
    }
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return reviveState(parsed);
  } catch {
    return freshState();
  }
}

/**
 * Persist to localStorage. `ts` defaults to now; pass the server's updated_at
 * when adopting a remote snapshot so last-write-wins comparisons stay honest.
 */
function saveState(state: AppState, ts?: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.setItem(STORAGE_TS, String(ts ?? Date.now()));
  } catch {
    // storage full / disabled — fail silently
  }
}

function localTimestamp(): number {
  if (typeof window === "undefined") return 0;
  return Number(
    window.localStorage.getItem(STORAGE_TS) ||
      window.localStorage.getItem(LEGACY_TS) ||
      0
  );
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
  // per-day schedule override ("adjust today")
  setDaySchedule: (items: ScheduleItem[], date?: string) => void;
  clearDaySchedule: (date?: string) => void;
  // chat
  addChat: (msg: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearChat: () => void;
  // order smart
  addOrder: (result: OrderSmartResult) => void;
  // schedule + missions defaults
  setSchedule: (schedule: ScheduleItem[]) => void;
  setSaturdaySchedule: (schedule: ScheduleItem[]) => void;
  setSundaySchedule: (schedule: ScheduleItem[]) => void;
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
  // Gates the cloud push effect until the initial server reconcile SUCCEEDS.
  // Critical: if the first GET fails we must NOT start pushing — a fresh/empty
  // browser would overwrite good cloud data. We retry instead.
  const syncReady = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The exact object we hydrated with — used to (a) detect edits made while
  // the reconcile fetch is in flight and (b) skip the passive first persist.
  const hydratedStateRef = useRef<AppState | null>(null);

  // Load once on mount (client only): localStorage first for instant UI, then
  // reconcile with the cloud if enabled (last-write-wins by timestamp).
  useEffect(() => {
    const local = loadState();
    const localTs = localTimestamp();
    hydratedStateRef.current = local;
    setState(local);
    setHydrated(true);

    if (!CLOUD_ENABLED) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const reconcile = async () => {
      try {
        const remote = await cloudGet();
        if (cancelled) return;
        const remoteTs = remote.updatedAt
          ? new Date(remote.updatedAt).getTime()
          : 0;
        if (remote.data && remoteTs >= localTs) {
          const merged = reviveState(remote.data as Partial<AppState>);
          // Only adopt the remote snapshot if the user hasn't edited anything
          // since mount — reference equality with `local` detects mutations.
          // If they did edit, keep their state; it gets pushed below.
          let applied = false;
          hydratedStateRef.current = merged; // skip the passive re-persist
          setState((current) => {
            if (current !== local) return current;
            applied = true;
            return merged;
          });
          if (applied) {
            // Mirror the SERVER timestamp locally so a passive open never
            // makes old data look newer than another device's real edits.
            saveState(merged, remoteTs);
          } else {
            // User edited while we were fetching — keep their edit and make
            // sure it gets pushed now that syncReady flips on.
            syncReady.current = true;
            setState((current) => ({ ...current }));
          }
        } else {
          await cloudPut(local); // server empty or stale -> push local up
        }
        if (cancelled) return;
        syncReady.current = true;
        setCloudStatus("synced");
      } catch {
        if (cancelled) return;
        // Leave pushes gated and retry — never let an unreconciled device
        // start overwriting the server.
        setCloudStatus("offline");
        retryTimer = setTimeout(reconcile, 15000);
      }
    };
    reconcile();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // Persist to localStorage on every change after hydration — but skip
  // re-persisting the object we just loaded/adopted: bumping the timestamp on
  // a passive open would make stale data look fresh and corrupt LWW syncing.
  useEffect(() => {
    if (!hydrated) return;
    if (state === hydratedStateRef.current) return;
    saveState(state);
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

  const setDaySchedule = useCallback(
    (items: ScheduleItem[], date?: string) => {
      mutateDay(date, (d) => ({ ...d, scheduleOverride: items }));
    },
    [mutateDay]
  );

  const clearDaySchedule = useCallback(
    (date?: string) => {
      mutateDay(date, (d) => {
        const next = { ...d };
        delete next.scheduleOverride;
        return next;
      });
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

  const setSaturdaySchedule = useCallback((saturdaySchedule: ScheduleItem[]) => {
    setState((s) => ({ ...s, saturdaySchedule }));
  }, []);

  const setSundaySchedule = useCallback((sundaySchedule: ScheduleItem[]) => {
    setState((s) => ({ ...s, sundaySchedule }));
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
      setState(reviveState(parsed));
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
      setDaySchedule,
      clearDaySchedule,
      addChat,
      clearChat,
      addOrder,
      setSchedule,
      setSaturdaySchedule,
      setSundaySchedule,
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
      setDaySchedule,
      clearDaySchedule,
      addChat,
      clearChat,
      addOrder,
      setSchedule,
      setSaturdaySchedule,
      setSundaySchedule,
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
