import { NextResponse } from "next/server";
import { generateImage } from "@/lib/media/mediaService";

export const runtime = "nodejs";

type ProductionStudioImageRequestBody = {
  project: {
    id?: string;
    name?: string;
    platform?: string;
    targetDuration?: string;
  };
  scene: {
    id?: string;
    sceneLabel?: string;
    beat?: string;
    purpose?: string;
    duration?: string;
    visual?: string;
    camera?: string;
    movement?: string;
  };
  creativeDirection: {
    title?: string;
    goal?: string;
    viewerEmotion?: string[];
    narration?: string;
    visualDescription?: string;
    directorNotes?: string;
  };
  universalPrompt?: string;
  promptVersion?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePromptVersion(value: unknown) {
  const normalized = normalizeText(value);
  return normalized || "V1";
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
    return "Image generation is temporarily unavailable. Please try again.";
  }

  const lowered = raw.toLowerCase();
  if (lowered.includes("timed out") || lowered.includes("timeout")) {
    return "Image generation took too long. Please retry.";
  }

  return raw;
}

function inferAspectRatio(prompt: string) {
  const match = prompt.match(/\b(\d+):(\d+)\b/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return "9:16";
}

function imageSizeFromAspectRatio(aspectRatio: string) {
  if (aspectRatio === "1:1") {
    return "1024x1024" as const;
  }

  if (aspectRatio === "16:9") {
    return "1536x1024" as const;
  }

  if (aspectRatio === "9:16") {
    return "1024x1536" as const;
  }

  return "1024x1536" as const;
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const body = (await request.json()) as ProductionStudioImageRequestBody;
    const universalPrompt = normalizeText(body?.universalPrompt);
    const promptVersion = normalizePromptVersion(body?.promptVersion);

    if (!universalPrompt) {
      return NextResponse.json({ error: "Universal prompt is required." }, { status: 400 });
    }

    const aspectRatio = inferAspectRatio(universalPrompt);
    const normalizedAspectRatio = aspectRatio === "1:1" || aspectRatio === "16:9" || aspectRatio === "9:16"
      ? aspectRatio
      : "9:16";

    const asset = await generateImage({
      sceneId: normalizeText(body?.scene?.id),
      prompt: universalPrompt,
      promptVersion,
      aspectRatio: normalizedAspectRatio,
    });

    const generationTimeMs = Date.now() - startedAt;
    const sceneId = normalizeText(body?.scene?.id);
    const generatedAt = asset.createdAt;
    const size = imageSizeFromAspectRatio(normalizedAspectRatio);
    const modelUsed = normalizeText(asset.metadata.modelUsed ?? "");

    return NextResponse.json({
      id: asset.id,
      provider: asset.provider,
      imageUrl: asset.mediaUrl,
      thumbnailUrl: asset.thumbnail,
      width: asset.width,
      height: asset.height,
      resolution: size.replace("x", " × "),
      aspectRatio: normalizedAspectRatio,
      generationTime: `${Math.max(1, Math.round(generationTimeMs / 1000))}s`,
      modelUsed: modelUsed || "unknown",
      timestamp: generatedAt,
      createdAt: generatedAt,
      promptVersion,
      universalPrompt,
      sceneId,
      project: {
        id: normalizeText(body?.project?.id),
        name: normalizeText(body?.project?.name),
      },
      scene: {
        id: sceneId,
        label: normalizeText(body?.scene?.sceneLabel),
      },
    });
  } catch (error) {
    const status = resolveErrorStatus(error);
    const message = friendlyErrorMessage(error);

    console.error("[api/production-studio/images] POST failed", {
      status,
      message,
      error,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
