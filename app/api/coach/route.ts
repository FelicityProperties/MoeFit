import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { askCoach, type CoachContext } from "@/lib/coach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default to the most capable model. Override with AI_MODEL (e.g. set
// AI_MODEL=claude-haiku-4-5 for faster/cheaper replies).
const MODEL = process.env.AI_MODEL || "claude-opus-4-7";

// Frozen coach persona — kept stable so it can be prompt-cached. Per-user,
// per-turn context is injected into the user message instead (see below), which
// keeps this prefix byte-identical across requests.
const SYSTEM_PROMPT = `You are MoeFit Coach — a strict but supportive personal fitness, nutrition, and discipline coach inside a weight-loss app. The user is actively trying to lose weight, control how much they eat (they order takeout a lot), build discipline, and structure their day.

Your job: keep them honest, accountable, and moving. Be direct and a little tough-love, but always on their side — never mean, never preachy.

Their training schedule (important):
- They train in the MORNING only. Never tell them to work out in the evening or at night. If they missed the morning session, tell them to do a shorter version now or commit to first thing tomorrow morning.
- Muay Thai on Tuesday and Thursday mornings; gym strength Monday & Friday; cardio Wednesday; active recovery Saturday; rest Sunday.

Rules:
- Keep replies short and punchy: 2-5 sentences. This is a chat, not an essay.
- When they ask about a specific food or restaurant meal, give a rough calorie estimate, a clear verdict (good / okay / avoid for weight loss), and one better alternative if it's not great. Factor in how many calories they have left today.
- When they're being lazy or making excuses, call it out kindly and give them the smallest next action to start.
- Use their live stats (below) to personalize every answer — reference calories left, water, today's workout, and weight goal when relevant.
- Give concrete, actionable advice. No vague platitudes.
- Plain text only. No markdown headers or bullet lists. An occasional emoji is fine.
- You are not a medical professional; for medical concerns tell them to consult a doctor.`;

function contextBlock(c: CoachContext): string {
  return [
    `[Live stats — ${c.name || "the user"}]`,
    `Local hour: ${c.hour}:00`,
    `Calorie target: ${c.calorieTarget} kcal | eaten: ${c.caloriesConsumed} | remaining: ${c.caloriesRemaining}`,
    `Protein: ${c.proteinConsumed}g of ${c.proteinTarget}g target`,
    `Water: ${c.waterConsumedMl}ml of ${c.waterTargetMl}ml`,
    `Today's workout: ${c.workoutPlannedToday} (${c.workedOutToday ? "DONE" : "not done yet"})`,
    `Weight: ${c.weightKg}kg, goal ${c.goalWeightKg}kg`,
  ].join("\n");
}

interface ChatTurn {
  role: "user" | "coach";
  content: string;
}

interface CoachRequest {
  message: string;
  context: CoachContext;
  history?: ChatTurn[];
}

export async function GET() {
  return NextResponse.json({
    aiAvailable: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ANTHROPIC_API_KEY ? MODEL : null,
  });
}

export async function POST(req: Request) {
  let body: CoachRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { message, context, history = [] } = body;
  if (!message || !context) {
    return NextResponse.json({ error: "Missing message or context." }, { status: 400 });
  }

  // No key configured -> use the built-in offline coach so the app still works.
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: askCoach(message, context), source: "local" });
  }

  try {
    const client = new Anthropic();

    const priorTurns: Anthropic.MessageParam[] = history
      .slice(-12)
      .map((t) => ({
        role: t.role === "coach" ? ("assistant" as const) : ("user" as const),
        content: t.content,
      }));

    // The current turn carries the live stats so the model always answers
    // against fresh numbers, while the system persona stays cache-stable.
    const messages: Anthropic.MessageParam[] = [
      ...priorTurns,
      {
        role: "user",
        content: `${contextBlock(context)}\n\n[My message]\n${message}`,
      },
    ];

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      reply: reply || askCoach(message, context),
      source: reply ? "ai" : "local",
    });
  } catch (e) {
    // On any API failure, fall back to the built-in coach rather than erroring.
    if (e instanceof Anthropic.APIError) {
      console.error(`Coach API error ${e.status}: ${e.message}`);
    } else {
      console.error("Coach error:", e);
    }
    return NextResponse.json({ reply: askCoach(message, context), source: "local" });
  }
}
