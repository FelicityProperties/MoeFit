"use client";

import { useRef, useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Target,
  CalendarClock,
  ListChecks,
  Database,
  Download,
  Upload,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  ACTIVITY_LABELS,
  bmi,
  bmiCategory,
  calorieTarget,
  macroTargets,
  waterTargetMl,
} from "@/lib/calculations";
import { ActivityLevel, ScheduleItem } from "@/lib/types";
import { Card, PageHeader, Stat } from "@/components/ui";
import { HydrationGate } from "@/components/Gates";

export default function SettingsPage() {
  return (
    <HydrationGate>
      <PageHeader
        title="Settings"
        subtitle="Your profile, your plan, your data."
        icon={<SettingsIcon size={22} />}
      />
      <div className="space-y-5">
        <ProfileForm />
        <TargetsPreview />
        <ScheduleEditor />
        <MissionsEditor />
        <DataManagement />
      </div>
    </HydrationGate>
  );
}

function ProfileForm() {
  const { state, updateProfile } = useStore();
  const p = state.profile;

  return (
    <Card title="Profile" icon={<User size={16} className="text-accent" />}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-3">
          <label className="label">Name</label>
          <input
            className="input mt-1"
            placeholder="Your name"
            value={p.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Age</label>
          <input
            className="input mt-1"
            type="number"
            inputMode="numeric"
            value={p.age || ""}
            onChange={(e) => updateProfile({ age: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Height (cm)</label>
          <input
            className="input mt-1"
            type="number"
            inputMode="numeric"
            value={p.heightCm || ""}
            onChange={(e) => updateProfile({ heightCm: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Sex</label>
          <select
            className="input mt-1"
            value={p.sex}
            onChange={(e) => updateProfile({ sex: e.target.value as "male" | "female" })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input
            className="input mt-1"
            type="number"
            inputMode="decimal"
            value={p.weightKg || ""}
            onChange={(e) => updateProfile({ weightKg: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Goal weight (kg)</label>
          <input
            className="input mt-1"
            type="number"
            inputMode="decimal"
            value={p.goalWeightKg || ""}
            onChange={(e) => updateProfile({ goalWeightKg: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Target date</label>
          <input
            className="input mt-1"
            type="date"
            value={p.targetDate}
            onChange={(e) => updateProfile({ targetDate: e.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className="label">Activity level</label>
          <select
            className="input mt-1"
            value={p.activityLevel}
            onChange={(e) =>
              updateProfile({ activityLevel: e.target.value as ActivityLevel })
            }
          >
            {Object.entries(ACTIVITY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional overrides */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <label className="label">Calorie target override</label>
          <input
            className="input mt-1"
            type="number"
            inputMode="numeric"
            placeholder="auto"
            value={p.calorieTargetOverride || ""}
            onChange={(e) =>
              updateProfile({ calorieTargetOverride: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="label">Water target override (ml)</label>
          <input
            className="input mt-1"
            type="number"
            inputMode="numeric"
            placeholder="auto"
            value={p.waterTargetOverride || ""}
            onChange={(e) =>
              updateProfile({ waterTargetOverride: Number(e.target.value) || 0 })
            }
          />
        </div>
      </div>
    </Card>
  );
}

function TargetsPreview() {
  const { state } = useStore();
  const p = state.profile;
  const target = calorieTarget(p);
  const macros = macroTargets(p, target.target);
  const water = waterTargetMl(p);
  const bmiVal = bmi(p);

  return (
    <Card title="Your Plan" icon={<Target size={16} className="text-accent" />}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Calorie target" value={target.target} sub="kcal/day" accent />
        <Stat label="Maintenance" value={target.maintenance} sub="kcal/day" />
        <Stat label="Daily deficit" value={target.deficit} sub="kcal" />
        <Stat
          label="Est. weekly loss"
          value={`${target.weeklyLossKg}kg`}
          sub="per week"
        />
        <Stat label="Protein" value={`${macros.protein}g`} />
        <Stat label="Carbs" value={`${macros.carbs}g`} />
        <Stat label="Fat" value={`${macros.fat}g`} />
        <Stat label="Water" value={`${(water / 1000).toFixed(1)}L`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-panel px-3 py-1.5 text-xs text-muted">
          BMI {bmiVal} · {bmiCategory(bmiVal)}
        </span>
        {target.capped && (
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
            Plan adjusted for safety
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-faint">{target.note}</p>
    </Card>
  );
}

const CATEGORY_OPTIONS: ScheduleItem["category"][] = [
  "wake",
  "work",
  "meal",
  "workout",
  "water",
  "sleep",
  "personal",
];

function ScheduleEditor() {
  const { state, setSchedule, setWeekendSchedule } = useStore();
  const [mode, setMode] = useState<"weekday" | "weekend">("weekday");

  const current = mode === "weekday" ? state.schedule : state.weekendSchedule;
  const setCurrent = mode === "weekday" ? setSchedule : setWeekendSchedule;
  const items = [...current].sort((a, b) => a.hour - b.hour);

  const update = (id: string, patch: Partial<ScheduleItem>) => {
    setCurrent(current.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const remove = (id: string) => setCurrent(current.filter((s) => s.id !== id));
  const add = () => {
    const id = "s" + Date.now();
    setCurrent([
      ...current,
      { id, hour: 12, label: "New routine block", category: "personal" },
    ]);
  };

  return (
    <Card
      title="Daily Routine"
      icon={<CalendarClock size={16} className="text-accent" />}
      action={
        <button onClick={add} className="btn-chip">
          <Plus size={13} /> Add
        </button>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2">
        {(["weekday", "weekend"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              "rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition " +
              (mode === m
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-line bg-white text-muted hover:bg-panel")
            }
          >
            {m === "weekday" ? "Weekday (Mon–Fri)" : "Weekend (Sat/Sun)"}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <select
              className="input max-w-[90px]"
              value={s.hour}
              onChange={(e) => update(s.id, { hour: Number(e.target.value) })}
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
            <input
              className="input flex-1"
              value={s.label}
              onChange={(e) => update(s.id, { label: e.target.value })}
            />
            <select
              className="input max-w-[110px]"
              value={s.category}
              onChange={(e) =>
                update(s.id, { category: e.target.value as ScheduleItem["category"] })
              }
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => remove(s.id)}
              className="rounded-lg p-2 text-faint transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Remove"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MissionsEditor() {
  const { state, setDefaultMissions, setMissions } = useStore();
  const [missions, setLocal] = useState<string[]>(state.defaultMissions);

  const update = (i: number, val: string) =>
    setLocal(missions.map((m, idx) => (idx === i ? val : m)));
  const add = () => setLocal([...missions, ""]);
  const remove = (i: number) => setLocal(missions.filter((_, idx) => idx !== i));
  const save = () => {
    const cleaned = missions.map((m) => m.trim()).filter(Boolean).slice(0, 6);
    setLocal(cleaned);
    setDefaultMissions(cleaned);
    setMissions(cleaned); // also apply to today
  };

  return (
    <Card
      title="Default Missions"
      icon={<ListChecks size={16} className="text-accent" />}
      action={
        <button onClick={add} className="btn-chip" disabled={missions.length >= 6}>
          <Plus size={13} /> Add
        </button>
      }
    >
      <p className="mb-3 text-xs text-faint">
        3-5 daily goals seeded each new day. (Today&apos;s list updates on save.)
      </p>
      <div className="space-y-2">
        {missions.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={m}
              placeholder="Mission goal"
              onChange={(e) => update(i, e.target.value)}
            />
            <button
              onClick={() => remove(i)}
              className="rounded-lg p-2 text-faint transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Remove"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={save} className="btn-accent mt-3 w-full">
        Save missions
      </button>
    </Card>
  );
}

function DataManagement() {
  const { exportData, importData, resetAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const doExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moefit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(String(reader.result));
      setMsg(ok ? "Data imported successfully." : "Import failed — invalid file.");
      setTimeout(() => setMsg(""), 3000);
    };
    reader.readAsText(file);
  };

  const doReset = () => {
    if (
      window.confirm(
        "This will erase ALL your MoeFit data on this device. This cannot be undone. Continue?"
      )
    ) {
      resetAll();
      setMsg("All data has been reset.");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  return (
    <Card title="Your Data" icon={<Database size={16} className="text-accent" />}>
      <p className="mb-3 text-xs text-faint">
        Everything is stored locally in this browser. Back it up regularly, or
        move it to another device. (Ready to connect Supabase/Firebase later.)
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button onClick={doExport} className="btn-ghost">
          <Download size={15} /> Export backup
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost">
          <Upload size={15} /> Import backup
        </button>
        <button
          onClick={doReset}
          className="btn border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
        >
          <Trash2 size={15} /> Reset all data
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) doImport(f);
          e.target.value = "";
        }}
      />
      {msg && (
        <p className="mt-3 rounded-lg bg-panel px-3 py-2 text-xs text-strong">
          {msg}
        </p>
      )}
    </Card>
  );
}

function formatHour(h: number): string {
  const ampm = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00${ampm}`;
}
