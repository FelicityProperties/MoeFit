"use client";

import { useState, useRef } from "react";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Droplets,
  Sparkles,
  Search,
  Loader2,
  ChefHat,
  Check,
  ImagePlus,
  X,
} from "lucide-react";
import { fileToResizedImage, type ResizedImage } from "@/lib/image";
import { useStore } from "@/lib/store";
import { useCoachContext } from "@/lib/hooks";
import {
  calorieTarget,
  dayTotals,
  macroTargets,
  waterTargetMl,
} from "@/lib/calculations";
import { matchFood, FOOD_DB } from "@/lib/foods";
import { analyzeMealText } from "@/lib/coach";
import { buildMealPlan } from "@/lib/meals";
import { OrderSmartResult, MealSuggestion } from "@/lib/types";
import {
  Card,
  PageHeader,
  Pill,
  ProgressBar,
  Stat,
  EmptyState,
  clsx,
} from "@/components/ui";
import { HydrationGate } from "@/components/Gates";

export default function FoodPage() {
  return (
    <HydrationGate>
      <PageHeader
        title="Food Control"
        subtitle="Track every calorie. Order smart. Stay in your budget."
        icon={<UtensilsCrossed size={22} />}
      />
      <div className="space-y-5">
        <Summary />
        <MealPlan />
        <OrderSmart />
        <AddFood />
        <Water />
      </div>
    </HydrationGate>
  );
}

function Summary() {
  const { state, getDay } = useStore();
  const day = getDay();
  const totals = dayTotals(day);
  const target = calorieTarget(state.profile);
  const macros = macroTargets(state.profile, target.target);
  const left = target.target - totals.calories;

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Consumed" value={totals.calories} sub="kcal" />
        <Stat
          label={left >= 0 ? "Remaining" : "Over"}
          value={Math.abs(left)}
          sub="kcal"
          accent
        />
        <Stat label="Target" value={target.target} sub="kcal/day" />
        <Stat label="Maintenance" value={target.maintenance} sub="kcal/day" />
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="Calories" value={totals.calories} max={target.target} color="#7c6cff" />
        <Bar label="Protein" value={totals.protein} max={macros.protein} color="#22c55e" unit="g" />
        <Bar label="Carbs" value={totals.carbs} max={macros.carbs} color="#38bdf8" unit="g" />
        <Bar label="Fat" value={totals.fat} max={macros.fat} color="#a78bfa" unit="g" />
      </div>
      <p className="mt-3 text-xs text-faint">{target.note}</p>
    </Card>
  );
}

function Bar({
  label,
  value,
  max,
  color,
  unit = "",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold text-strong">{label}</span>
        <span className="text-faint">
          {value}
          {unit} / {max}
          {unit}
        </span>
      </div>
      <ProgressBar value={value} max={max} color={color} height={7} />
    </div>
  );
}

function MealPlan() {
  const { getDay, setMealPlan, addFood } = useStore();
  const ctx = useCoachContext();
  const day = getDay();
  const meals = day.mealPlan;
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx }),
      });
      const json = await res.json();
      setMealPlan(
        json.meals ??
          buildMealPlan(ctx.calorieTarget, ctx.proteinTarget, new Date().getDate())
      );
    } catch {
      setMealPlan(
        buildMealPlan(ctx.calorieTarget, ctx.proteinTarget, new Date().getDate())
      );
    } finally {
      setLoading(false);
    }
  };

  const logMeal = (m: MealSuggestion) => {
    addFood({
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "plan",
    });
  };

  const planCalories = meals?.reduce((a, m) => a + m.calories, 0) ?? 0;
  const planProtein = meals?.reduce((a, m) => a + m.protein, 0) ?? 0;

  return (
    <Card
      title="Today's Meal Plan"
      icon={<ChefHat size={16} className="text-accent" />}
      className="border-accent/15"
      action={
        meals ? (
          <button onClick={generate} disabled={loading} className="btn-chip">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            New plan
          </button>
        ) : undefined
      }
    >
      {!meals ? (
        <div className="text-center">
          <p className="mb-3 text-sm text-muted">
            Get a full day of meals — breakfast, lunch, dinner & a snack — built to
            hit your <span className="font-semibold text-fg">{ctx.calorieTarget} kcal</span> and{" "}
            <span className="font-semibold text-fg">{ctx.proteinTarget}g protein</span> target.
          </p>
          <button onClick={generate} disabled={loading} className="btn-accent mx-auto">
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Building your plan…
              </>
            ) : (
              <>
                <ChefHat size={15} /> Plan my meals for today
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {meals.map((m, i) => (
            <div key={i} className="rounded-xl border border-line bg-panel p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="pill bg-accent/15 text-accent">{m.slot}</span>
                    <span className="text-sm font-bold text-fg">{m.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{m.description}</p>
                  <p className="mt-1 text-xs text-faint">
                    {m.calories} kcal · P{m.protein} C{m.carbs} F{m.fat}
                  </p>
                </div>
                <button
                  onClick={() => logMeal(m)}
                  className="btn-chip shrink-0"
                  aria-label={`Log ${m.slot}`}
                >
                  <Check size={13} /> Log
                </button>
              </div>
            </div>
          ))}
          <p className="pt-1 text-xs text-faint">
            Plan total: {planCalories} kcal · {planProtein}g protein (target{" "}
            {ctx.calorieTarget} kcal · {ctx.proteinTarget}g)
          </p>
        </div>
      )}
    </Card>
  );
}

function OrderSmart() {
  const { addFood, addOrder, state } = useStore();
  const ctx = useCoachContext();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<OrderSmartResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<ResizedImage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try {
      setImage(await fileToResizedImage(file));
    } catch {
      /* ignore */
    }
  };

  const analyze = async () => {
    const q = query.trim();
    if ((!q && !image) || loading) return;
    const sentImage = image;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          context: ctx,
          ...(sentImage
            ? { image: { data: sentImage.data, mediaType: sentImage.mediaType } }
            : {}),
        }),
      });
      const json = await res.json();
      const out: OrderSmartResult = json.result ?? analyzeMealText(q || "meal", ctx);
      setResult(out);
      addOrder(out);
    } catch {
      const out = analyzeMealText(q || "meal", ctx);
      setResult(out);
      addOrder(out);
    } finally {
      setImage(null);
      setLoading(false);
    }
  };

  const logIt = () => {
    if (!result) return;
    addFood({
      name: result.query,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "delivery",
    });
    setResult(null);
    setQuery("");
  };

  const tone =
    result?.verdict === "good"
      ? "good"
      : result?.verdict === "ok"
      ? "ok"
      : "avoid";

  return (
    <Card
      title="Order Smart"
      icon={<Sparkles size={16} className="text-accent" />}
      className="border-accent/15"
    >
      <p className="mb-3 text-sm text-muted">
        Order food a lot? Describe the meal — or snap a photo of it — and your
        coach tells you if it fits your weight-loss goal.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pickPhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="btn-ghost shrink-0"
          aria-label="Add meal photo"
        >
          <ImagePlus size={16} /> Photo
        </button>
        <input
          className="input"
          placeholder={image ? "Add a note (optional)…" : 'e.g. "Big Mac meal with coke"'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
        />
        <button onClick={analyze} disabled={loading} className="btn-accent shrink-0">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {image && (
        <div className="mt-3 flex items-center gap-3">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.dataUrl}
              alt="Meal to analyze"
              className="h-16 w-16 rounded-lg border border-line object-cover"
            />
            <button
              onClick={() => setImage(null)}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white"
              aria-label="Remove photo"
            >
              <X size={12} />
            </button>
          </div>
          <span className="text-xs text-muted">
            Photo attached — tap Analyze and the coach reads the plate.
          </span>
        </div>
      )}

      {loading && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> Coach is checking that meal…
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-panel p-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={tone}>
              {result.verdict === "good"
                ? "✅ Good choice"
                : result.verdict === "ok"
                ? "🟡 Okay — be smart"
                : "🔴 Better to avoid"}
            </Pill>
            <Pill tone="neutral">~{result.calories} kcal</Pill>
            <Pill tone="neutral">P {result.protein}g</Pill>
            <Pill tone="neutral">C {result.carbs}g</Pill>
            <Pill tone="neutral">F {result.fat}g</Pill>
          </div>
          <p className="text-sm text-strong">{result.reasoning}</p>
          <p className="text-sm font-medium text-accent">⏱ {result.timing}</p>
          {result.alternatives.length > 0 && (
            <div>
              <p className="label mb-1">Better options</p>
              <ul className="space-y-1">
                {result.alternatives.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-strong">
                    <span className="text-emerald-600">→</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={logIt} className="btn-ghost w-full">
            <Plus size={15} /> Log this to my food diary
          </button>
        </div>
      )}

      {!result && state.orderHistory.length > 0 && (
        <div className="mt-4">
          <p className="label mb-2">Recent checks</p>
          <div className="flex flex-wrap gap-2">
            {state.orderHistory.slice(0, 6).map((o, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(o.query);
                  setResult(o);
                }}
                className="btn-chip"
              >
                {o.verdict === "good" ? "✅" : o.verdict === "ok" ? "🟡" : "🔴"}{" "}
                {o.query.slice(0, 24)}
                {o.query.length > 24 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AddFood() {
  const { addFood, getDay, removeFood } = useStore();
  const day = getDay();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [source, setSource] = useState("home");

  const autofill = (n: string) => {
    setName(n);
    const f = matchFood(n);
    if (f) {
      setCalories(String(f.calories));
      setProtein(String(f.protein));
      setCarbs(String(f.carbs));
      setFat(String(f.fat));
    }
  };

  const submit = () => {
    if (!name.trim() || !calories) return;
    addFood({
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source,
    });
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const quickFoods = FOOD_DB.filter((f) =>
    ["grilled chicken", "eggs", "protein shake", "salad", "oats", "salmon"].includes(
      f.keywords[0]
    )
  );

  return (
    <Card title="Food Log" icon={<UtensilsCrossed size={16} className="text-accent" />}>
      {/* Quick add chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {quickFoods.map((f) => (
          <button key={f.name} onClick={() => autofill(f.keywords[0])} className="btn-chip">
            <Plus size={12} /> {f.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <input
          className="input col-span-2 sm:col-span-2"
          placeholder="Food name"
          value={name}
          onChange={(e) => autofill(e.target.value)}
        />
        <input
          className="input"
          type="number"
          inputMode="numeric"
          placeholder="kcal"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <input
          className="input"
          type="number"
          inputMode="numeric"
          placeholder="P (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
        <input
          className="input"
          type="number"
          inputMode="numeric"
          placeholder="C (g)"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
        <input
          className="input"
          type="number"
          inputMode="numeric"
          placeholder="F (g)"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <select
          className="input max-w-[140px]"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="home">Home</option>
          <option value="restaurant">Restaurant</option>
          <option value="delivery">Delivery</option>
          <option value="snack">Snack</option>
        </select>
        <button onClick={submit} className="btn-accent flex-1">
          <Plus size={15} /> Add to log
        </button>
      </div>

      {/* Log list */}
      <div className="mt-4 space-y-2">
        {day.foods.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed size={28} />}
            title="No food logged yet today"
            hint="Use Order Smart, a quick-add chip, or the form above."
          />
        ) : (
          day.foods.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-xl bg-panel p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">{f.name}</p>
                <p className="text-xs text-faint">
                  {f.time} · {f.source} · P{f.protein} C{f.carbs} F{f.fat}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-accent">
                {f.calories}
                <span className="text-xs font-normal text-faint"> kcal</span>
              </span>
              <button
                onClick={() => removeFood(f.id)}
                className="shrink-0 rounded-lg p-1.5 text-faint transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function Water() {
  const { state, getDay, addWater, setWater } = useStore();
  const day = getDay();
  const goal = waterTargetMl(state.profile);
  const glasses = Math.round(goal / 250);
  const filled = Math.round(day.waterMl / 250);

  return (
    <Card title="Water Intake" icon={<Droplets size={16} className="text-cyan-600" />}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-extrabold text-fg">
            {(day.waterMl / 1000).toFixed(2)}
            <span className="text-lg text-faint">
              {" "}
              / {(goal / 1000).toFixed(1)} L
            </span>
          </p>
          <p className="text-xs text-faint">~{glasses} glasses target</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => addWater(250)} className="btn-ghost">
            +250ml
          </button>
          <button onClick={() => addWater(500)} className="btn-accent">
            +500ml
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {Array.from({ length: glasses }).map((_, i) => (
          <button
            key={i}
            onClick={() => setWater((i + 1) * 250)}
            className={clsx(
              "h-9 w-7 rounded-md border transition",
              i < filled
                ? "border-cyan-300 bg-cyan-100"
                : "border-line bg-panel hover:bg-slate-200"
            )}
            aria-label={`Set ${(i + 1) * 250}ml`}
          />
        ))}
      </div>
      <div className="mt-3">
        <ProgressBar value={day.waterMl} max={goal} color="#06b6d4" height={8} />
      </div>
    </Card>
  );
}
