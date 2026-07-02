import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildViralScannerStrategyPrompt } from "@/lib/viral-scanner/strategyPrompt";

export const runtime = "nodejs";

type StrategyDirectionId = "educational" | "storytelling" | "localized" | "authority" | "behind-the-scenes";

type ViralScannerAnalysis = {
  whatMakesThisContentEffective: string[];
  contentBlueprint: {
    opening: string;
    problem: string;
    evidence: string;
    solution: string;
    callToAction: string;
  };
  whatYouCanLearn: string[];
};

type CreativeStrategy = {
  strategySummary: string;
  hookDirection: string;
  audience: string;
  tone: string;
  storyStructure: string;
  ctaDirection: string;
  visualStyleRecommendation: string;
};

const allowedDirections = new Set<StrategyDirectionId>([
  "educational",
  "storytelling",
  "localized",
  "authority",
  "behind-the-scenes",
]);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonResponse(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  return JSON.parse(withoutFence);
}

function normalizeAnalysis(raw: unknown): ViralScannerAnalysis | null {
  const record = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!record) {
    return null;
  }

  const effective = Array.isArray(record.whatMakesThisContentEffective)
    ? record.whatMakesThisContentEffective.map((item) => normalizeText(item)).filter(Boolean)
    : [];

  const lessons = Array.isArray(record.whatYouCanLearn)
    ? record.whatYouCanLearn.map((item) => normalizeText(item)).filter(Boolean)
    : [];

  const blueprintRecord =
    record.contentBlueprint && typeof record.contentBlueprint === "object"
      ? (record.contentBlueprint as Record<string, unknown>)
      : null;

  if (!blueprintRecord) {
    return null;
  }

  const contentBlueprint = {
    opening: normalizeText(blueprintRecord.opening),
    problem: normalizeText(blueprintRecord.problem),
    evidence: normalizeText(blueprintRecord.evidence),
    solution: normalizeText(blueprintRecord.solution),
    callToAction: normalizeText(blueprintRecord.callToAction),
  };

  if (!effective.length || !lessons.length) {
    return null;
  }

  return {
    whatMakesThisContentEffective: effective,
    contentBlueprint,
    whatYouCanLearn: lessons,
  };
}

function normalizeStrategy(raw: unknown): CreativeStrategy {
  const record = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  return {
    strategySummary:
      normalizeText(record.strategySummary) ||
      "A focused strategy is available once more context is provided.",
    hookDirection:
      normalizeText(record.hookDirection) ||
      "Open with one clear promise tailored to the selected direction.",
    audience: normalizeText(record.audience) || "Audience details should be clarified before production.",
    tone: normalizeText(record.tone) || "Clear, confident, and audience-appropriate.",
    storyStructure:
      normalizeText(record.storyStructure) ||
      "Hook -> Context -> Core Point -> Proof -> Next Step.",
    ctaDirection:
      normalizeText(record.ctaDirection) ||
      "End with one direct action aligned to the strategy goal.",
    visualStyleRecommendation:
      normalizeText(record.visualStyleRecommendation) ||
      "Use a consistent visual style that reinforces the selected direction.",
  };
}

function resolveErrorStatus(error: unknown) {
  const status =
    typeof (error as { status?: unknown })?.status === "number"
      ? ((error as { status: number }).status)
      : typeof (error as { statusCode?: unknown })?.statusCode === "number"
        ? ((error as { statusCode: number }).statusCode)
        : 500;

  if (status >= 400 && status <= 599) {
    return status;
  }

  return 500;
}

function friendlyErrorMessage(error: unknown) {
  const raw = normalizeText((error as { message?: unknown })?.message ?? "");

  if (!raw) {
    return "Strategy generation is temporarily unavailable. Please try again.";
  }

  if (raw.toLowerCase().includes("timeout") || raw.toLowerCase().includes("timed out")) {
    return "Strategy generation took too long. Please try again.";
  }

  return raw;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const direction = normalizeText(body?.direction) as StrategyDirectionId;
    const analysis = normalizeAnalysis(body?.analysis);
    const manualDescription = normalizeText(body?.manualDescription);
    const videoUrl = normalizeText(body?.videoUrl);

    if (!allowedDirections.has(direction)) {
      return NextResponse.json({ error: "Please select a valid creative direction." }, { status: 400 });
    }

    if (!analysis) {
      return NextResponse.json(
        { error: "Run Analyze Inspiration first so the strategist has source context." },
        { status: 400 },
      );
    }

    const prompt = buildViralScannerStrategyPrompt({
      direction,
      analysis,
      manualDescription,
      videoUrl,
    });

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const strategy = normalizeStrategy(parseJsonResponse(response.output_text));

    return NextResponse.json({ strategy });
  } catch (error) {
    const status = resolveErrorStatus(error);
    const message = friendlyErrorMessage(error);

    console.error("[api/viral-scanner/strategy] POST failed", {
      status,
      message,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
