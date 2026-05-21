import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { CoachContext } from "@/lib/coach";
import { buildMealPlan } from "@/lib/meals";
import type { MealSuggestion } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.AI_MODEL || "claude-opus-4-7";

const SYSTEM_PROMPT = `You are a nutrition coach building a one-day meal plan for someone losing weight who orders takeout often.

Plan a full day — Breakfast, Lunch, Dinner, and one Snack — that:
- Hits their daily calorie target (stay within ~5%) and prioritizes their protein target.
- Is weight-loss friendly, filling, and realistic — mix simple home meals with easy-to-order options (they eat out a lot).
- Uses everyday foods, not fancy ingredients.

Respond with ONLY a JSON array (no markdown, no prose, no code fences) of exactly 4 objects in this shape:
[
  { "slot": "Breakfast", "name": "...", "description": "one short sentence", "calories": number, "protein": number, "carbs": number, "fat": number },
  { "slot": "Lunch", ... },
  { "slot": "Dinner", ... },
  { "slot": "Snack", ... }
]
Macros are grams. The four meals' calories should sum close to the target. Output JSON only.`;

interface MealsRequest {
  context: CoachContext;
}

function extractArray(text: string): unknown[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export async function POST(req: Request) {
  let body: MealsRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { context } = body;
  if (!context) {
    return NextResponse.json({ error: "Missing context." }, { status: 400 });
  }

  const seed = new Date().getDate();
  const fallback = (): MealSuggestion[] =>
    buildMealPlan(context.calorieTarget, context.proteinTarget, seed);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ meals: fallback(), source: "local" });
  }

  try {
    const client = new Anthropic();
    const prompt = [
      `Daily calorie target: ${context.calorieTarget} kcal`,
      `Protein target: ${context.proteinTarget} g`,
      `Current weight: ${context.weightKg} kg, goal ${context.goalWeightKg} kg`,
      "Build today's plan now.",
    ].join("\n");

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const arr = extractArray(text);
    if (!arr || arr.length === 0) {
      return NextResponse.json({ meals: fallback(), source: "local" });
    }

    const meals: MealSuggestion[] = arr
      .map((m) => {
        const o = m as Record<string, unknown>;
        return {
          slot: typeof o.slot === "string" ? o.slot : "Meal",
          name: typeof o.name === "string" ? o.name : "",
          description: typeof o.description === "string" ? o.description : "",
          calories: num(o.calories),
          protein: num(o.protein),
          carbs: num(o.carbs),
          fat: num(o.fat),
        };
      })
      .filter((m) => m.name && m.calories > 0);

    if (meals.length === 0) {
      return NextResponse.json({ meals: fallback(), source: "local" });
    }

    return NextResponse.json({ meals, source: "ai" });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error(`Meals API error ${e.status}: ${e.message}`);
    } else {
      console.error("Meals error:", e);
    }
    return NextResponse.json({ meals: fallback(), source: "local" });
  }
}
