import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildViralScannerPrompt } from "@/lib/viral-scanner/prompt";
import { detectSupportedVideoPlatform } from "@/lib/viral-scanner/platform";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supportedImageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const unsupportedImageFormatMessage = "Unsupported image format. Please upload PNG, JPG, JPEG, or WEBP.";

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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getDataUrlMimeType(dataUrl: string) {
  const match = /^data:([^;,]+)[;,]/i.exec(dataUrl.trim());
  return match?.[1]?.toLowerCase() ?? "";
}

function parseJsonResponse(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  return JSON.parse(withoutFence);
}

function normalizeList(value: unknown, maxItems: number, fallbackPrefix: string) {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .slice(0, maxItems);

  while (normalized.length < maxItems) {
    normalized.push(`${fallbackPrefix} ${normalized.length + 1}`);
  }

  return normalized;
}

function normalizeAnalysis(raw: unknown): ViralScannerAnalysis {
  const record = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const blueprint = (record.contentBlueprint && typeof record.contentBlueprint === "object"
    ? record.contentBlueprint
    : {}) as Record<string, unknown>;

  const effectivePoints = normalizeList(
    record.whatMakesThisContentEffective,
    3,
    "Context is limited; add a screenshot or description for a more specific lesson.",
  );

  const lessons = normalizeList(
    record.whatYouCanLearn,
    3,
    "This could be stronger by clarifying the story flow.",
  );

  const fallbackBlueprintValue = "Not clearly present.";

  return {
    whatMakesThisContentEffective: effectivePoints,
    contentBlueprint: {
      opening: normalizeText(blueprint.opening) || fallbackBlueprintValue,
      problem: normalizeText(blueprint.problem) || fallbackBlueprintValue,
      evidence: normalizeText(blueprint.evidence) || fallbackBlueprintValue,
      solution: normalizeText(blueprint.solution) || fallbackBlueprintValue,
      callToAction: normalizeText(blueprint.callToAction) || fallbackBlueprintValue,
    },
    whatYouCanLearn: lessons,
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
    return "AI analysis is temporarily unavailable. Please try again.";
  }

  const lowered = raw.toLowerCase();

  if (lowered.includes("timed out") || lowered.includes("timeout")) {
    return "The analysis took too long to complete. Please try again.";
  }

  return raw;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const videoUrl = normalizeText(body?.videoUrl);
    const manualDescription = normalizeText(body?.manualDescription);
    const screenshotDataUrl = normalizeText(body?.screenshotDataUrl);

    if (!videoUrl && !manualDescription && !screenshotDataUrl) {
      return NextResponse.json(
        { error: "Please provide a video link, screenshot, or manual description first." },
        { status: 400 },
      );
    }

    if (videoUrl && !detectSupportedVideoPlatform(videoUrl)) {
      return NextResponse.json(
        {
          error:
            "Unsupported URL. Please use a TikTok, Facebook Reel, Instagram Reel, or YouTube Shorts link.",
        },
        { status: 400 },
      );
    }

    if (screenshotDataUrl) {
      const mimeType = getDataUrlMimeType(screenshotDataUrl);
      if (!supportedImageMimeTypes.has(mimeType)) {
        return NextResponse.json({ error: unsupportedImageFormatMessage }, { status: 400 });
      }
    }

    const prompt = buildViralScannerPrompt({
      videoUrl,
      manualDescription,
      hasScreenshot: Boolean(screenshotDataUrl),
    });

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: screenshotDataUrl
        ? [
            {
              role: "user",
              content: [
                { type: "input_text", text: prompt },
                { type: "input_image", image_url: screenshotDataUrl, detail: "auto" },
              ],
            },
          ]
        : prompt,
    });

    const analysis = normalizeAnalysis(parseJsonResponse(response.output_text));

    return NextResponse.json({ analysis });
  } catch (error) {
    const status = resolveErrorStatus(error);
    const message = friendlyErrorMessage(error);

    console.error("[api/viral-scanner] POST failed", {
      status,
      message,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
