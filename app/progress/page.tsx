"use client";

import {
  LineChart as LineChartIcon,
  Flame,
  Dumbbell,
  Salad,
  Droplets,
  TrendingDown,
  NotebookPen,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { useStore } from "@/lib/store";
import {
  computeStreaks,
  rangeMetrics,
  weeklyDiscipline,
  weightSeries,
  caloriesBurnedRange,
} from "@/lib/progress";
import { calorieTarget } from "@/lib/calculations";
import { weekdayShort } from "@/lib/date";
import { Card, PageHeader, Stat, EmptyState } from "@/components/ui";
import { HydrationGate } from "@/components/Gates";

export default function ProgressPage() {
  return (
    <HydrationGate>
      <PageHeader
        title="Progress"
        subtitle="The numbers don't lie. Watch the trend, keep the streaks alive."
        icon={<LineChartIcon size={22} />}
      />
      <div className="space-y-5">
        <Streaks />
        <WeightChart />
        <CaloriesChart />
        <div className="grid gap-5 lg:grid-cols-2">
          <WorkoutChart />
          <WaterChart />
        </div>
        <DisciplineChart />
        <Notes />
      </div>
    </HydrationGate>
  );
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#0e131c",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "rgba(255,255,255,0.6)" },
};

function Streaks() {
  const { state } = useStore();
  const s = computeStreaks(state);
  const items = [
    { label: "Workout", value: s.workout, icon: Dumbbell, color: "#ff5a1f" },
    { label: "Clean Eating", value: s.cleanEating, icon: Salad, color: "#22c55e" },
    { label: "Calorie Control", value: s.calorieControl, icon: Flame, color: "#f43f5e" },
    { label: "Water", value: s.water, icon: Droplets, color: "#06b6d4" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label} className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={{ backgroundColor: `${it.color}22`, color: it.color }}
            >
              <Icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-extrabold leading-none text-white">
                {it.value}
                <span className="ml-1 text-xs font-medium text-white/40">
                  day{it.value === 1 ? "" : "s"}
                </span>
              </div>
              <div className="label mt-1">{it.label}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function WeightChart() {
  const { state } = useStore();
  const data = weightSeries(state).map((p) => ({
    date: weekdayShort(p.date) + " " + p.date.slice(5),
    weight: p.weightKg,
  }));
  const goal = state.profile.goalWeightKg;

  return (
    <Card title="Weight Progress" icon={<TrendingDown size={16} className="text-accent" />}>
      {data.length < 2 ? (
        <EmptyState
          icon={<TrendingDown size={28} />}
          title="Log your weight to see the trend"
          hint="Add today's weight on the Review page or Settings. Two+ entries draw the line."
        />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine
              y={goal}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{ value: `Goal ${goal}kg`, fill: "#22c55e", fontSize: 11, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#ff5a1f"
              strokeWidth={3}
              dot={{ r: 3, fill: "#ff5a1f" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function CaloriesChart() {
  const { state } = useStore();
  const target = calorieTarget(state.profile).target;
  const metrics = rangeMetrics(state, 14);
  const data = metrics.map((m) => ({
    date: weekdayShort(m.date),
    calories: m.calories,
    over: m.calories > target,
  }));
  const hasData = metrics.some((m) => m.calories > 0);

  return (
    <Card title="Calories — Last 14 Days" icon={<Flame size={16} className="text-accent" />}>
      {!hasData ? (
        <EmptyState icon={<Flame size={28} />} title="No calories logged yet" hint="Log food to track your daily intake against target." />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine
              y={target}
              stroke="#38bdf8"
              strokeDasharray="4 4"
              label={{ value: `Target ${target}`, fill: "#38bdf8", fontSize: 11, position: "insideTopRight" }}
            />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.over ? "#f43f5e" : "#ff5a1f"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function WorkoutChart() {
  const { state } = useStore();
  const metrics = rangeMetrics(state, 14);
  const burned = caloriesBurnedRange(state, 14);
  const data = metrics.map((m) => ({
    date: weekdayShort(m.date),
    value: m.workoutPlanned ? (m.workoutDone ? 1 : 0) : 0.5,
    status: !m.workoutPlanned ? "rest" : m.workoutDone ? "done" : "missed",
  }));
  const completed = metrics.filter((m) => m.workoutPlanned && m.workoutDone).length;
  const planned = metrics.filter((m) => m.workoutPlanned).length;

  return (
    <Card title="Workout Consistency" icon={<Dumbbell size={16} className="text-accent" />}>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Stat label="Sessions hit (14d)" value={`${completed}/${planned}`} accent />
        <Stat label="Calories burned" value={burned} sub="est. kcal" />
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
          <YAxis hide domain={[0, 1]} />
          <Tooltip {...tooltipStyle} formatter={(_v, _n, p) => [(p as any).payload.status, "status"]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.status === "done" ? "#22c55e" : d.status === "missed" ? "#f43f5e" : "#334155"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function WaterChart() {
  const { state } = useStore();
  const metrics = rangeMetrics(state, 7);
  const data = metrics.map((m) => ({
    date: weekdayShort(m.date),
    liters: Math.round((m.waterMl / 1000) * 10) / 10,
  }));

  return (
    <Card title="Water — Last 7 Days" icon={<Droplets size={16} className="text-cyan-400" />}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${v} L`, "water"]} />
          <Bar dataKey="liters" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function DisciplineChart() {
  const { state } = useStore();
  const data = weeklyDiscipline(state, 6);

  return (
    <Card title="Weekly Discipline Score" icon={<Flame size={16} className="text-accent" />}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="weekLabel" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
          <Tooltip {...tooltipStyle} />
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke="#aef359"
            strokeWidth={3}
            dot={{ r: 4, fill: "#aef359" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function Notes() {
  const { state, setProgressNotes } = useStore();
  return (
    <Card title="Before / After Notes" icon={<NotebookPen size={16} className="text-accent" />}>
      <p className="mb-2 text-xs text-white/40">
        Track non-scale wins: how clothes fit, energy, mood, photos taken, measurements.
      </p>
      <textarea
        className="input min-h-[140px] resize-y"
        placeholder="Week 1: starting at 90kg, jeans tight, low energy in the mornings…"
        value={state.progressNotes}
        onChange={(e) => setProgressNotes(e.target.value)}
      />
    </Card>
  );
}
