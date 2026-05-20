import { FoodFact, matchAllFoods, matchFood } from "./foods";
import { DayReview, OrderSmartResult } from "./types";

// ============================================================================
// MoeFit Coach Engine
// ----------------------------------------------------------------------------
// This is a rule-based, offline "AI coach". It needs NO API key and works fully
// in the browser. It is structured so you can later swap in a real LLM:
//
//   INTEGRATION POINT (real AI):
//   In `askCoach` / `analyzeMealText`, branch on an env flag
//   (process.env.NEXT_PUBLIC_AI_PROVIDER) and POST the message + CoachContext
//   to an API route (e.g. /api/coach) that calls OpenAI/Anthropic, then return
//   the model's reply instead of the local heuristic. The CoachContext object
//   below is already a perfect system-prompt payload.
// ============================================================================

export interface CoachContext {
  name: string;
  hour: number; // current hour 0-23
  calorieTarget: number;
  caloriesConsumed: number;
  caloriesRemaining: number;
  proteinTarget: number;
  proteinConsumed: number;
  waterTargetMl: number;
  waterConsumedMl: number;
  workedOutToday: boolean;
  workoutPlannedToday: string; // e.g. "Lower Body Strength + HIIT"
  weightKg: number;
  goalWeightKg: number;
}

const STRICT_OPENERS = [
  "Let's be honest with each other.",
  "Straight talk:",
  "Coach mode on.",
  "Okay, listen up.",
  "Real talk —",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function timeOfDay(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour < 11) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

// ---------------------------------------------------------------------------
// Meal analysis (powers "Order Smart" + food questions in the chatbot)
// ---------------------------------------------------------------------------

export function analyzeMealText(
  query: string,
  ctx: CoachContext
): OrderSmartResult {
  const matches = matchAllFoods(query);
  const now = new Date().toISOString();

  if (matches.length === 0) {
    // Unknown food — give a sensible default estimate and honest disclaimer.
    const guess = guessUnknown(query);
    return {
      query,
      verdict: guess.verdict,
      calories: guess.calories,
      protein: guess.protein,
      carbs: guess.carbs,
      fat: guess.fat,
      timing: timingAdvice(guess.calories, ctx),
      alternatives: [
        "Choose a grilled protein over fried",
        "Ask for sauce/dressing on the side",
        "Add vegetables, cut the refined carbs",
      ],
      reasoning:
        "I don't have this exact item in my database so this is a rough estimate. " +
        "When in doubt: grilled beats fried, smaller portion, and load up on protein + veg.",
      createdAt: now,
    };
  }

  // Sum up all matched items (handles "burger and fries and coke").
  const total = matches.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const verdict = combinedVerdict(matches, total.calories, ctx);
  const alternatives = Array.from(
    new Set(matches.flatMap((m) => m.alternatives))
  ).slice(0, 4);

  return {
    query,
    verdict,
    calories: total.calories,
    protein: total.protein,
    carbs: total.carbs,
    fat: total.fat,
    timing: timingAdvice(total.calories, ctx),
    alternatives,
    reasoning: mealReasoning(matches, total.calories, verdict, ctx),
    createdAt: now,
  };
}

function combinedVerdict(
  matches: FoodFact[],
  calories: number,
  ctx: CoachContext
): OrderSmartResult["verdict"] {
  const hasAvoid = matches.some((m) => m.friendliness === "avoid");
  const allGood = matches.every((m) => m.friendliness === "good");
  const ratio = ctx.calorieTarget > 0 ? calories / ctx.calorieTarget : 0;

  if (ratio > 0.55) return "avoid"; // single meal eats most of the day's budget
  if (allGood && calories <= ctx.caloriesRemaining) return "good";
  if (hasAvoid && calories > ctx.caloriesRemaining) return "avoid";
  if (hasAvoid) return "ok";
  return "ok";
}

function mealReasoning(
  matches: FoodFact[],
  calories: number,
  verdict: OrderSmartResult["verdict"],
  ctx: CoachContext
): string {
  const names = matches.map((m) => m.name).join(" + ");
  const remaining = ctx.caloriesRemaining;
  const pctOfRemaining =
    remaining > 0 ? Math.round((calories / remaining) * 100) : 999;

  let base = `${names}: roughly ${calories} kcal. `;

  if (verdict === "good") {
    base +=
      "This is a smart, weight-loss-friendly choice — solid protein and it fits your remaining budget. Eat it and feel good.";
  } else if (verdict === "ok") {
    base +=
      remaining > 0
        ? `You've got ${remaining} kcal left today, so this fits if you keep the rest of the day clean. Get the leaner version where you can.`
        : "You're already at/over budget, so treat this as your main meal and keep portions tight.";
  } else {
    base +=
      remaining > 0
        ? `That's about ${pctOfRemaining}% of your remaining ${remaining} kcal in one hit. If you really want it, make it your only big meal today — otherwise pick an alternative.`
        : "You're out of calorie budget for today. This will put you over. Save it for a planned cheat meal, not tonight.";
  }

  const note = matches.find((m) => m.note)?.note;
  if (note) base += ` Tip: ${note}`;
  return base;
}

function timingAdvice(calories: number, ctx: CoachContext): string {
  const tod = timeOfDay(ctx.hour);
  if (calories <= ctx.caloriesRemaining && calories < 500) {
    return "Fine to eat now — it fits your budget.";
  }
  if (tod === "night") {
    return "It's late. If you eat this, keep it small — heavy late meals hurt sleep and recovery.";
  }
  if (calories > ctx.caloriesRemaining) {
    return "Hold off or pick a lighter option — this overshoots your remaining calories.";
  }
  return "Okay to eat now if it's your main meal — then keep the rest of the day light.";
}

function guessUnknown(query: string) {
  const q = query.toLowerCase();
  const fried = /(fried|crispy|breaded|tempura|deep)/.test(q);
  const grilled = /(grill|baked|steamed|roast|boiled)/.test(q);
  const veg = /(salad|veg|greens|broccoli|spinach)/.test(q);
  if (veg && !fried)
    return { calories: 250, protein: 15, carbs: 20, fat: 10, verdict: "good" as const };
  if (grilled)
    return { calories: 400, protein: 35, carbs: 20, fat: 15, verdict: "ok" as const };
  if (fried)
    return { calories: 650, protein: 20, carbs: 50, fat: 38, verdict: "avoid" as const };
  return { calories: 500, protein: 20, carbs: 45, fat: 22, verdict: "ok" as const };
}

// ---------------------------------------------------------------------------
// Chatbot brain
// ---------------------------------------------------------------------------

export function askCoach(message: string, ctx: CoachContext): string {
  // INTEGRATION POINT (real AI): if an API key/provider is configured, call your
  // /api/coach route here and return its response instead of the heuristics below.

  const m = message.toLowerCase().trim();
  const name = ctx.name ? ctx.name : "champ";

  // 1) Food / "can I eat X" style questions
  if (
    /(can i eat|should i eat|is it ok|is it okay|ordered|order|drink|eat this|have this|craving)/.test(
      m
    ) &&
    !/calorie/.test(m)
  ) {
    const res = analyzeMealText(message, ctx);
    const verdictLine =
      res.verdict === "good"
        ? "✅ Yes — go for it."
        : res.verdict === "ok"
        ? "🟡 Okay, but be smart about it."
        : "🔴 I'd skip it.";
    let out = `${verdictLine}\n\n${res.reasoning}\n\n⏱ ${res.timing}`;
    if (res.alternatives.length) {
      out += `\n\nBetter options: ${res.alternatives.join(", ")}.`;
    }
    return out;
  }

  // 2) Calorie questions
  if (/how many calories|calorie target|calories should i|calories today/.test(m)) {
    return (
      `${pick(STRICT_OPENERS)} Your target today is ${ctx.calorieTarget} kcal. ` +
      `You've eaten ${ctx.caloriesConsumed}, so you've got ${ctx.caloriesRemaining} kcal left. ` +
      `Protein is the priority — aim for ${ctx.proteinTarget}g (you're at ${ctx.proteinConsumed}g). ` +
      `Spend the rest on food that keeps you full, not food that disappears in two bites.`
    );
  }

  // 3) Workout timing / motivation
  if (/work ?out now|workout later|train now|gym now|when.*workout|should i train/.test(m)) {
    const tod = timeOfDay(ctx.hour);
    if (ctx.workedOutToday)
      return `You already trained today (${ctx.workoutPlannedToday}). Respect the recovery — go for a walk if you want more movement, but don't burn yourself out. 💪`;
    if (tod === "night")
      return `It's late, ${name}. A hard session now will wreck your sleep. Do 10 min of mobility/stretching tonight and hit ${ctx.workoutPlannedToday} first thing tomorrow.`;
    return `Now beats later — "later" is where workouts go to die. Today's plan is ${ctx.workoutPlannedToday}. Put your shoes on and start with 5 minutes. Momentum does the rest.`;
  }

  // 4) Lazy / unmotivated
  if (/lazy|tired|don'?t feel like|no motivation|can'?t be bothered|unmotivated|skip/.test(m)) {
    return (
      `${pick(STRICT_OPENERS)} Motivation isn't coming to save you — discipline is. ` +
      `You don't have to feel like it, you just have to start. Do the smallest version: ` +
      `5 minutes, one set, a short walk. ${ctx.workedOutToday ? "You already moved today, so even a walk + early night is a win." : `Your plan is ${ctx.workoutPlannedToday}. Start it now and decide how you feel after 5 minutes.`} ` +
      `Future you is watching what you do right now.`
    );
  }

  // 5) Water
  if (/water|hydrate|thirsty|drink enough/.test(m)) {
    const left = Math.max(0, ctx.waterTargetMl - ctx.waterConsumedMl);
    return left <= 0
      ? "You've hit your water goal today — nice. Keep a glass nearby and keep sipping. 💧"
      : `You're at ${ctx.waterConsumedMl}ml of ${ctx.waterTargetMl}ml. Drink ${left}ml more. Thirst often masquerades as hunger — water first, then decide if you're actually hungry.`;
  }

  // 6) Weight / progress
  if (/weight|progress|losing|how am i doing|on track/.test(m)) {
    const toGo = Math.round((ctx.weightKg - ctx.goalWeightKg) * 10) / 10;
    if (toGo <= 0)
      return `You're at or below your goal weight (${ctx.goalWeightKg}kg). Outstanding. Now we shift to maintenance and keeping the discipline. 🏆`;
    return `You're ${ctx.weightKg}kg, ${toGo}kg from your ${ctx.goalWeightKg}kg goal. The scale moves with consistency, not perfection. Win today: hit your calories, your water, and your workout. Stack enough good days and the weight has no choice.`;
  }

  // 7) What should I do now
  if (/what should i do|what now|next|right now/.test(m)) {
    const tod = timeOfDay(ctx.hour);
    const map = {
      morning: "Hydrate, get some light movement, and eat a high-protein breakfast. Set your 3 missions for the day.",
      afternoon: "Stay locked in on work, watch the snacking, and get your water in. Plan dinner now so you're not deciding while hungry.",
      evening: ctx.workedOutToday
        ? "Good dinner, protein-forward, then start winding down. No junk."
        : `Time to train — ${ctx.workoutPlannedToday}. Then a clean dinner.`,
      night: "No more food tonight. Screens down, hydrate, and get to bed — sleep is where fat loss and recovery happen.",
    };
    return `${map[tod]}`;
  }

  // 8) Greeting / fallback
  if (/^(hi|hey|hello|yo|sup|good morning|good evening)/.test(m)) {
    return `Hey ${name}. I'm your coach. Ask me about food ("can I eat this burger?"), your calories, when to train, or just tell me you feel lazy and I'll get you moving. What's up?`;
  }

  return (
    `I hear you. Here's where you stand right now: ${ctx.caloriesRemaining} kcal left, ` +
    `${Math.max(0, ctx.waterTargetMl - ctx.waterConsumedMl)}ml of water to go, and ` +
    `${ctx.workedOutToday ? "today's workout is done" : `${ctx.workoutPlannedToday} still on the plan`}. ` +
    `Ask me "can I eat ___?", "should I work out now?", "how many calories should I eat?", or tell me how you're feeling and I'll coach you through it.`
  );
}

// ---------------------------------------------------------------------------
// Daily review / scoring
// ---------------------------------------------------------------------------

export interface ReviewInputs {
  workedOut: boolean;
  overate: boolean;
  energy: number; // 1-5
  improve: string;
  ate: string;
  caloriesConsumed: number;
  calorieTarget: number;
  waterConsumedMl: number;
  waterTargetMl: number;
  missionsDone: number;
  missionsTotal: number;
  workoutPlanned: boolean;
}

export function buildDailyReview(input: ReviewInputs): DayReview {
  let score = 0;

  // Calories (30 pts): within 10% of target = full, scaled penalty otherwise.
  if (input.calorieTarget > 0 && input.caloriesConsumed > 0) {
    const diff = Math.abs(input.caloriesConsumed - input.calorieTarget);
    const pct = diff / input.calorieTarget;
    score += Math.round(30 * Math.max(0, 1 - pct / 0.3));
  } else if (input.caloriesConsumed === 0) {
    score += 10; // logged nothing — partial credit, but log your food!
  }

  // Workout (25 pts)
  if (!input.workoutPlanned) score += 20; // rest day, no penalty
  else if (input.workedOut) score += 25;

  // Overeating (15 pts)
  if (!input.overate) score += 15;

  // Water (15 pts)
  if (input.waterTargetMl > 0) {
    score += Math.round(
      15 * Math.min(1, input.waterConsumedMl / input.waterTargetMl)
    );
  }

  // Energy (5 pts)
  score += Math.round((Math.min(5, Math.max(1, input.energy)) / 5) * 5);

  // Missions (10 pts)
  if (input.missionsTotal > 0) {
    score += Math.round((input.missionsDone / input.missionsTotal) * 10);
  }

  score = Math.max(0, Math.min(100, score));

  const report = buildReportText(score, input);

  return {
    workedOut: input.workedOut,
    ate: input.ate,
    overate: input.overate,
    energy: input.energy,
    improve: input.improve,
    score,
    report,
    completedAt: new Date().toISOString(),
  };
}

function buildReportText(score: number, input: ReviewInputs): string {
  const parts: string[] = [];

  if (score >= 85) parts.push("Elite day. This is exactly how the weight comes off.");
  else if (score >= 70) parts.push("Strong day. A few tweaks from perfect.");
  else if (score >= 50) parts.push("Average day. Not bad, not great — let's sharpen up.");
  else parts.push("Tough day. One bad day doesn't define you, but don't stack two.");

  if (input.workoutPlanned && !input.workedOut)
    parts.push("You skipped a planned workout — that's the first thing to fix tomorrow.");
  if (input.workedOut) parts.push("Workout done ✅.");

  if (input.overate) parts.push("You overate — tomorrow, pre-plan meals and lead with protein.");
  else parts.push("Calories under control ✅.");

  if (input.waterTargetMl > 0 && input.waterConsumedMl < input.waterTargetMl * 0.8)
    parts.push("Water was low — keep a bottle in sight tomorrow.");

  if (input.improve.trim())
    parts.push(`Your focus for tomorrow: ${input.improve.trim()}`);

  return parts.join(" ");
}
