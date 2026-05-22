import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeMealText, type CoachContext } from "@/lib/coach";
import type { OrderSmartResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.AI_MODEL || "claude-opus-4-7";

const SYSTEM_PROMPT = `You are a nutrition coach for someone losing weight who orders takeout often. They describe a restaurant or delivery meal; you judge it for fat loss.

Given the meal and their remaining calories for the day, respond with ONLY a JSON object (no markdown, no prose, no code fences) with exactly these keys:
{
  "verdict": "good" | "ok" | "avoid",   // good = fits their goal, ok = fine if smart, avoid = will set them back
  "calories": number,                    // realistic total estimate for the described meal
  "protein": number,                     // grams
  "carbs": number,                       // grams
  "fat": number,                         // grams
  "timing": string,                      // one short sentence: eat it now, or wait/skip, given their remaining calories and the time
  "alternatives": string[],              // 1-3 short, concrete healthier swaps (empty if it's already great)
  "reasoning": string                    // 1-3 sentences, direct and practical, referencing their remaining calories
}
Be realistic with estimates (restaurant portions are bigger than people think). If a photo of the meal is attached, identify the food from the image and base your estimate on what you see. Output JSON only.`;

interface OrderRequest {
  query: string;
  context: CoachContext;
  /** optional meal photo (base64, no data: prefix) */
  image?: { data: string; mediaType: string };
}

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export async function POST(req: Request) {
  let body: OrderRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { query, context, image } = body;
  if (!context || (!query && !image)) {
    return NextResponse.json({ error: "Missing query or context." }, { status: 400 });
  }

  // Built-in analyzer when no key / on any failure. (Text-only — can't read a photo.)
  const fallback = (): OrderSmartResult => analyzeMealText(query || "meal", context);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ result: fallback(), source: "local" });
  }

  try {
    const client = new Anthropic();
    const prompt = [
      query ? `Meal: ${query}` : "Meal: (see attached photo)",
      `Their daily calorie target: ${context.calorieTarget} kcal`,
      `Already eaten today: ${context.caloriesConsumed} kcal`,
      `Remaining today: ${context.caloriesRemaining} kcal`,
      `Local hour: ${context.hour}:00`,
      `Protein so far: ${context.proteinConsumed}g of ${context.proteinTarget}g`,
    ].join("\n");

    const content: Anthropic.ContentBlockParam[] = [];
    if (image?.data) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: image.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: image.data,
        },
      });
    }
    content.push({ type: "text", text: prompt });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = extractJson(text);
    const verdict = parsed?.verdict;
    if (!parsed || (verdict !== "good" && verdict !== "ok" && verdict !== "avoid")) {
      return NextResponse.json({ result: fallback(), source: "local" });
    }

    const result: OrderSmartResult = {
      query: query || "Meal photo",
      verdict,
      calories: num(parsed.calories),
      protein: num(parsed.protein),
      carbs: num(parsed.carbs),
      fat: num(parsed.fat),
      timing: typeof parsed.timing === "string" ? parsed.timing : "",
      alternatives: Array.isArray(parsed.alternatives)
        ? parsed.alternatives.filter((a): a is string => typeof a === "string").slice(0, 4)
        : [],
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ result, source: "ai" });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error(`Order API error ${e.status}: ${e.message}`);
    } else {
      console.error("Order error:", e);
    }
    return NextResponse.json({ result: fallback(), source: "local" });
  }
}
