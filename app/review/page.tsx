"use client";

import { useState } from "react";
import { ClipboardCheck, Scale, Sparkles, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCoachContext } from "@/lib/hooks";
import { buildDailyReview } from "@/lib/coach";
import { calorieTarget, dayTotals, waterTargetMl } from "@/lib/calculations";
import { planForDate } from "@/lib/workout";
import { Card, PageHeader, Ring, clsx } from "@/components/ui";
import { HydrationGate } from "@/components/Gates";

export default function ReviewPage() {
  return (
    <HydrationGate>
      <PageHeader
        title="AI Daily Review"
        subtitle="End the day honest. Get your score. Plan tomorrow."
        icon={<ClipboardCheck size={22} />}
      />
      <Review />
    </HydrationGate>
  );
}

function Review() {
  const { state, getDay, setReview, setWeight, setEnergy } = useStore();
  const ctx = useCoachContext();
  const day = getDay();

  const plan = planForDate();
  const workoutPlanned = plan.some((b) => b.type !== "rest");
  const autoWorkedOut = plan.some(
    (b) => day.workouts[b.id] === "completed" || day.workouts[b.id] === "modified"
  );

  const [redo, setRedo] = useState(false);
  const [workedOut, setWorkedOut] = useState<boolean>(autoWorkedOut);
  const [ate, setAte] = useState(day.review?.ate ?? "");
  const [overate, setOverate] = useState(day.review?.overate ?? false);
  const [energy, setEnergyState] = useState(day.energy ?? day.review?.energy ?? 3);
  const [improve, setImprove] = useState(day.review?.improve ?? "");
  const [weight, setWeightInput] = useState(
    day.weightKg ? String(day.weightKg) : ""
  );

  const totals = dayTotals(day);
  const target = calorieTarget(state.profile).target;
  const water = waterTargetMl(state.profile);

  const generate = () => {
    if (weight) setWeight(Number(weight));
    setEnergy(energy);
    const review = buildDailyReview({
      workedOut,
      overate,
      energy,
      improve,
      ate,
      caloriesConsumed: totals.calories,
      calorieTarget: target,
      waterConsumedMl: day.waterMl,
      waterTargetMl: water,
      missionsDone: day.missions.filter((m) => m.done).length,
      missionsTotal: day.missions.length,
      workoutPlanned,
    });
    setReview(review);
    setRedo(false);
  };

  if (day.review && !redo) {
    return <ReviewResult onRedo={() => setRedo(true)} />;
  }

  return (
    <div className="space-y-5">
      <Card title="Tonight's Check-in" icon={<Sparkles size={16} className="text-accent" />}>
        <div className="space-y-5">
          {/* Workout */}
          <Field label="Did you complete your workout today?">
            <Toggle
              value={workedOut}
              onChange={setWorkedOut}
              yes="Yes, trained"
              no={workoutPlanned ? "No / skipped" : "Rest day"}
            />
          </Field>

          {/* Ate */}
          <Field label="What did you eat today?">
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Breakfast: eggs… Lunch: chicken salad… Dinner: ordered sushi…"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
            />
            <p className="mt-1 text-xs text-white/40">
              Logged so far: {totals.calories} / {target} kcal
            </p>
          </Field>

          {/* Overate */}
          <Field label="Did you overeat?">
            <Toggle value={overate} onChange={setOverate} yes="Yes, overate" no="No, in control" invert />
          </Field>

          {/* Energy */}
          <Field label={`How was your energy? (${energy}/5)`}>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={energy}
              onChange={(e) => setEnergyState(Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-white/40">
              <span>Drained</span>
              <span>Average</span>
              <span>Energized</span>
            </div>
          </Field>

          {/* Weight */}
          <Field label="Today's weight (optional)">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-white/40" />
              <input
                className="input max-w-[160px]"
                type="number"
                inputMode="decimal"
                placeholder="kg"
                value={weight}
                onChange={(e) => setWeightInput(e.target.value)}
              />
              <span className="text-sm text-white/40">kg</span>
            </div>
          </Field>

          {/* Improve */}
          <Field label="What should you improve tomorrow?">
            <input
              className="input"
              placeholder="e.g. Drink more water, no late-night snacking"
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
            />
          </Field>

          <button onClick={generate} className="btn-accent w-full">
            <Sparkles size={16} /> Generate my daily score & report
          </button>
        </div>
      </Card>
    </div>
  );
}

function ReviewResult({ onRedo }: { onRedo: () => void }) {
  const { getDay } = useStore();
  const review = getDay().review!;
  const scoreColor =
    review.score >= 85 ? "#22c55e" : review.score >= 60 ? "#ff5a1f" : "#f43f5e";
  const grade =
    review.score >= 90
      ? "Elite"
      : review.score >= 75
      ? "Strong"
      : review.score >= 60
      ? "Solid"
      : review.score >= 40
      ? "Average"
      : "Reset";

  return (
    <Card title="Today's Score" icon={<ClipboardCheck size={16} className="text-accent" />}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Ring
          value={review.score}
          max={100}
          size={150}
          stroke={12}
          color={scoreColor}
          label={
            <span className="text-4xl font-extrabold text-white">{review.score}</span>
          }
          sub={<span className="text-xs font-semibold text-white/40">/ 100</span>}
        />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div
            className="inline-block rounded-full px-3 py-1 text-sm font-bold"
            style={{ backgroundColor: `${scoreColor}22`, color: scoreColor }}
          >
            {grade}
          </div>
          <p className="text-sm leading-relaxed text-white/80">{review.report}</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Tag>{review.workedOut ? "Trained ✅" : "No workout"}</Tag>
            <Tag>{review.overate ? "Overate ⚠️" : "Calories controlled ✅"}</Tag>
            <Tag>Energy {review.energy}/5</Tag>
          </div>
          {review.improve && (
            <p className="rounded-xl bg-ink-900/60 p-3 text-sm text-white/70">
              <span className="font-semibold text-accent">Tomorrow: </span>
              {review.improve}
            </p>
          )}
        </div>
      </div>
      <button onClick={onRedo} className="btn-ghost mt-5 w-full">
        <RefreshCw size={15} /> Redo today&apos;s review
      </button>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white/80">{label}</p>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  yes,
  no,
  invert,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  yes: string;
  no: string;
  invert?: boolean;
}) {
  // For "overate", a "yes" is bad — invert the color semantics.
  const yesGood = !invert;
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onChange(true)}
        className={clsx(
          "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
          value
            ? yesGood
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/15 text-rose-300"
            : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
        )}
      >
        {yes}
      </button>
      <button
        onClick={() => onChange(false)}
        className={clsx(
          "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
          !value
            ? yesGood
              ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
              : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
            : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
        )}
      >
        {no}
      </button>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70">
      {children}
    </span>
  );
}
