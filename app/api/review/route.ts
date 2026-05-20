import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.AI_MODEL || "claude-opus-4-7";

const SYSTEM_PROMPT = `You are MoeFit Coach — a strict but supportive fitness and nutrition coach. Write the user's end-of-day review for a weight-loss app.

Keep it to 3-5 sentences, direct and personal, tied to the specifics of their day. Acknowledge wins, call out slips without being harsh, and end with ONE clear focus for tomorrow. Plain text only — no markdown, no headers, no lists. The numeric score is already decided; do not invent a different score, just reflect it in your tone.`;

interface ReviewRequest {
  score: number;
  fallbackReport: string;
  inputs: {
    workedOut: boolean;
    workoutPlanned: boolean;
    overate: boolean;
    energy: number;
    ate: string;
    improve: string;
    caloriesConsumed: number;
    calorieTarget: number;
    waterConsumedMl: number;
    waterTargetMl: number;
    missionsDone: number;
    missionsTotal: number;
  };
}

export async function POST(req: Request) {
  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { score, fallbackReport, inputs } = body;
  if (typeof score !== "number" || !inputs) {
    return NextResponse.json({ error: "Missing review data." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ report: fallbackReport, source: "local" });
  }

  try {
    const client = new Anthropic();
    const prompt = [
      `Today's score: ${score}/100`,
      `Workout: ${
        inputs.workoutPlanned
          ? inputs.workedOut
            ? "planned and completed"
            : "planned but skipped"
          : "rest day"
      }`,
      `Calories: ${inputs.caloriesConsumed} of ${inputs.calorieTarget} target`,
      `Overate: ${inputs.overate ? "yes" : "no"}`,
      `Water: ${inputs.waterConsumedMl}ml of ${inputs.waterTargetMl}ml`,
      `Energy: ${inputs.energy}/5`,
      `Missions completed: ${inputs.missionsDone}/${inputs.missionsTotal}`,
      inputs.ate ? `What they ate: ${inputs.ate}` : null,
      inputs.improve ? `What they want to improve: ${inputs.improve}` : null,
      "",
      "Write their end-of-day review now.",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    const report = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      report: report || fallbackReport,
      source: report ? "ai" : "local",
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error(`Review API error ${e.status}: ${e.message}`);
    } else {
      console.error("Review error:", e);
    }
    return NextResponse.json({ report: fallbackReport, source: "local" });
  }
}
