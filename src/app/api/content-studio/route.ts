import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedModes = new Set(["create-content", "inspiration", "inspiration-refresh"]);
const allowedContentTypes = new Set([
  "normal-post",
  "reel-video",
  "standard-post",
  "reel-short-video",
  "property-listing",
  "educational-content",
  "drone-showcase",
  "construction-progress",
  "storytelling",
  "custom",
]);
const allowedPlatforms = new Set([
  "facebook",
  "instagram",
  "tiktok",
  "linkedin",
  "youtube-shorts",
]);
const allowedAspectRatios = new Set(["4:5", "9:16", "1:1", "16:9"]);
const allowedTones = new Set(["professional", "sabahan", "educational", "investor", "funny", "storytelling"]);
const allowedLanguages = new Set(["english", "sabahan", "both"]);
const allowedStoryStyles = new Set([
  "educational",
  "documentary",
  "case-study",
  "property-tour",
  "investor-pitch",
  "comedy",
  "lifestyle",
  "news-report",
]);
const allowedPresentationStyles = new Set([
  "narration",
  "dialogue",
  "host-presentation",
  "silent-cinematic",
  "voice-over",
  "interview",
]);
const allowedProductionLevels = new Set(["quick", "professional", "premium"]);
const allowedShootingEnvironments = new Set([
  "on-site-property",
  "outdoor-location",
  "interior-space",
  "office-studio",
  "mixed-environment",
]);
const allowedEquipment = new Set([
  "phone",
  "drone",
  "gimbal",
  "tripod",
  "nd-filter",
  "lavalier-mic",
  "mirrorless-camera",
]);
const allowedDurations = new Set([8, 16, 24, 32, 40, 48, 56, 64]);
const allowedGoals = new Set([
  "engagement",
  "education",
  "selling",
  "lead-generation",
  "brand-awareness",
  "weekly-facebook-task",
]);
const allowedInspirationSourceTypes = new Set(["topic", "image"]);
const allowedIdeaExplorerGoals = new Set([
  "build-authority",
  "educate",
  "find-buyers",
  "find-sellers",
  "branding",
]);
const allowedIdeaCounts = new Set([1, 10]);
const supportedIdeaImageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const unsupportedImageFormatMessage = "Unsupported image format. Please upload PNG, JPG, JPEG, or WEBP.";

type StudioResponse = {
  title: string;
  outputMode: string;
  contentType: string;
  platform: string;
  aspectRatio: string;
  creativeBrief: {
    objective: string;
    targetAudience: string;
    keyMessage: string;
    storyStyle: string;
    presentationStyle: string;
    estimatedProductionTime: string;
  };
  visualDirection: {
    mood: string;
    lighting: string;
    colourPalette: string;
    cameraStyle: string;
    atmosphere: string;
  };
  productionChecklist: string[];
  storyboard: Array<{
    sceneNumber: number;
    summary: string;
  }>;
  scenes: Array<{
    sceneNumber: number;
    purpose: string;
    directorNotes: string;
    estimatedDuration: string;
    thumbnailPlaceholder: string;
    imagePrompt: string;
    videoPrompt: string;
  }>;
  caption: string;
  cta: string;
  hashtags: string;
  sections: Array<{
    label: string;
    value: string;
  }>;
};

type InspirationIdea = {
  title: string;
  summary: string;
  bestFormat: "Normal Post" | "Reel / Video";
  potentialScore: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  estimatedProductionTime: string;
  whyThisIdea: string;
};

type InspirationResponse = {
  ideas: InspirationIdea[];
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlug(value: unknown) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, "-");
}

function normalizeContentType(value: string) {
  if (["reel-video", "reel-short-video", "drone-showcase", "construction-progress"].includes(value)) {
    return "reel-video";
  }

  return "normal-post";
}

function getAspectRatioForContentType(contentType: string) {
  return contentType === "reel-video" ? "9:16" : "4:5";
}

function formatTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shouldApplySabahRepresentationRules(topic: string) {
  const lowered = topic.toLowerCase();

  const sabahKeywords = [
    "sabah",
    "sabah land",
    "sabah property",
    "village",
    "villages",
    "buyer",
    "buyers",
    "owner",
    "owners",
    "ren",
    "real estate negotiator",
    "agriculture",
    "tourism",
    "local community",
  ];

  return sabahKeywords.some((keyword) => lowered.includes(keyword));
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

function normalizeStringList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => normalizeText(item)).filter(Boolean)
    : [];
}

function normalizeRequiredStringObject<T extends string>(
  value: unknown,
  keys: readonly T[],
  errorMessage: string,
) {
  if (!value || typeof value !== "object") {
    throw new Error(errorMessage);
  }

  const record = value as Record<string, unknown>;
  const normalized = {} as Record<T, string>;

  for (const key of keys) {
    const nextValue = normalizeText(record[key]);

    if (!nextValue) {
      throw new Error(errorMessage);
    }

    normalized[key] = nextValue;
  }

  return normalized;
}

function normalizeStoryboard(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error("Incomplete production storyboard");
  }

  const storyboard = value
    .map((scene, index) => {
      if (!scene || typeof scene !== "object") {
        return null;
      }

      const record = scene as Record<string, unknown>;
      const sceneNumber = Number(record.sceneNumber ?? index + 1);
      const summary = normalizeText(record.summary);

      if (!Number.isInteger(sceneNumber) || sceneNumber <= 0 || !summary) {
        return null;
      }

      return { sceneNumber, summary };
    })
    .filter(Boolean) as StudioResponse["storyboard"];

  if (storyboard.length === 0) {
    throw new Error("Incomplete production storyboard");
  }

  return storyboard;
}

function normalizeScenes(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error("Incomplete production scenes");
  }

  const scenes = value
    .map((scene, index) => {
      if (!scene || typeof scene !== "object") {
        return null;
      }

      const record = scene as Record<string, unknown>;
      const sceneNumber = Number(record.sceneNumber ?? index + 1);
      const purpose = normalizeText(record.purpose);
      const directorNotes = normalizeText(record.directorNotes);
      const estimatedDuration = normalizeText(record.estimatedDuration);
      const thumbnailPlaceholder = normalizeText(record.thumbnailPlaceholder);
      const imagePrompt = normalizeText(record.imagePrompt);
      const videoPrompt = normalizeText(record.videoPrompt);

      if (
        !Number.isInteger(sceneNumber) ||
        sceneNumber <= 0 ||
        !purpose ||
        !directorNotes ||
        !estimatedDuration ||
        !thumbnailPlaceholder ||
        !imagePrompt ||
        !videoPrompt
      ) {
        return null;
      }

      return {
        sceneNumber,
        purpose,
        directorNotes,
        estimatedDuration,
        thumbnailPlaceholder,
        imagePrompt,
        videoPrompt,
      };
    })
    .filter(Boolean) as StudioResponse["scenes"];

  if (scenes.length === 0) {
    throw new Error("Incomplete production scenes");
  }

  return scenes;
}

function buildSections(response: Omit<StudioResponse, "sections">): StudioResponse["sections"] {
  return [
    {
      label: "Creative Brief",
      value: [
        `Objective: ${response.creativeBrief.objective}`,
        `Target Audience: ${response.creativeBrief.targetAudience}`,
        `Key Message: ${response.creativeBrief.keyMessage}`,
        `Story Style: ${response.creativeBrief.storyStyle}`,
        `Presentation Style: ${response.creativeBrief.presentationStyle}`,
        `Estimated Production Time: ${response.creativeBrief.estimatedProductionTime}`,
      ].join("\n"),
    },
    {
      label: "Visual Direction",
      value: [
        `Mood: ${response.visualDirection.mood}`,
        `Lighting: ${response.visualDirection.lighting}`,
        `Colour Palette: ${response.visualDirection.colourPalette}`,
        `Camera Style: ${response.visualDirection.cameraStyle}`,
        `Atmosphere: ${response.visualDirection.atmosphere}`,
      ].join("\n"),
    },
    {
      label: "Production Checklist",
      value: response.productionChecklist.join("\n"),
    },
    {
      label: "Storyboard",
      value: response.storyboard.map((scene) => `Scene ${scene.sceneNumber}: ${scene.summary}`).join("\n"),
    },
    {
      label: "Caption",
      value: response.caption,
    },
    {
      label: "CTA",
      value: response.cta,
    },
    {
      label: "Hashtags",
      value: response.hashtags,
    },
  ];
}

function normalizeStudioResponse(value: unknown): StudioResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid production studio response");
  }

  const payload = value as Record<string, unknown>;
  const title = normalizeText(payload.title);
  const outputMode = normalizeText(payload.outputMode);
  const contentType = normalizeText(payload.contentType);
  const platform = normalizeText(payload.platform);
  const aspectRatio = normalizeText(payload.aspectRatio);
  const creativeBrief = normalizeRequiredStringObject(
    payload.creativeBrief,
    ["objective", "targetAudience", "keyMessage", "storyStyle", "presentationStyle", "estimatedProductionTime"],
    "Incomplete production creative brief",
  );
  const visualDirection = normalizeRequiredStringObject(
    payload.visualDirection,
    ["mood", "lighting", "colourPalette", "cameraStyle", "atmosphere"],
    "Incomplete production visual direction",
  );
  const productionChecklist = normalizeStringList(payload.productionChecklist);
  const storyboard = normalizeStoryboard(payload.storyboard);
  const scenes = normalizeScenes(payload.scenes);
  const caption = normalizeText(payload.caption);
  const cta = normalizeText(payload.cta);
  const hashtags = normalizeText(payload.hashtags);

  if (
    !title ||
    !outputMode ||
    !contentType ||
    !platform ||
    !aspectRatio ||
    productionChecklist.length === 0 ||
    !caption ||
    !cta ||
    !hashtags
  ) {
    throw new Error("Incomplete production studio response");
  }

  const baseResponse = {
    title,
    outputMode,
    contentType,
    platform,
    aspectRatio,
    creativeBrief,
    visualDirection,
    productionChecklist,
    storyboard,
    scenes,
    caption,
    cta,
    hashtags,
  };

  return {
    ...baseResponse,
    sections: buildSections(baseResponse),
  };
}

function normalizeDifficulty(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "easy") {
    return "Easy";
  }

  if (normalized === "medium") {
    return "Medium";
  }

  if (normalized === "advanced") {
    return "Advanced";
  }

  throw new Error("Invalid difficulty value");
}

function normalizeBestFormat(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("reel") || normalized.includes("video")) {
    return "Reel / Video" as const;
  }

  return "Normal Post" as const;
}

function normalizeInspirationResponse(value: unknown): InspirationResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid inspiration response");
  }

  const payload = value as Record<string, unknown>;
  const ideas = Array.isArray(payload.ideas)
    ? payload.ideas
        .map((idea) => {
          if (!idea || typeof idea !== "object") {
            return null;
          }

          const record = idea as Record<string, unknown>;
          const title = normalizeText(record.title);
          const summary = normalizeText(record.summary);
          const rawBestFormat = normalizeText(record.bestFormat);
          const potentialScore = Number(record.potentialScore);
          const rawDifficulty = normalizeText(record.difficulty);
          const estimatedProductionTime = normalizeText(record.estimatedProductionTime);
          const whyThisIdea = normalizeText(record.whyThisIdea);

          if (
            !title ||
            !summary ||
            !rawBestFormat ||
            !Number.isFinite(potentialScore) ||
            !rawDifficulty ||
            !estimatedProductionTime ||
            !whyThisIdea
          ) {
            return null;
          }

          const boundedScore = Math.max(1, Math.min(100, Math.round(potentialScore)));

          return {
            title,
            summary,
            bestFormat: normalizeBestFormat(rawBestFormat),
            potentialScore: boundedScore,
            difficulty: normalizeDifficulty(rawDifficulty),
            estimatedProductionTime,
            whyThisIdea,
          };
        })
        .filter(Boolean) as InspirationIdea[]
    : [];

  if (ideas.length === 0) {
    throw new Error("Incomplete inspiration response");
  }

  return { ideas };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = normalizeText(body?.mode).toLowerCase() || "create-content";

    if (!allowedModes.has(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (mode === "inspiration" || mode === "inspiration-refresh") {
      const sourceType = normalizeText(body?.sourceType).toLowerCase();
      const goal = normalizeText(body?.goal).toLowerCase().replace(/\s+/g, "-");
      const ideaCount = Number(body?.ideaCount ?? (mode === "inspiration-refresh" ? 1 : 10));
      const topic = normalizeText(body?.topic);
      const imageDataUrl = normalizeText(body?.imageDataUrl);
      const excludeTitles = Array.isArray(body?.excludeTitles)
        ? body.excludeTitles.map((value: unknown) => normalizeText(value)).filter(Boolean)
        : [];

      if (!allowedInspirationSourceTypes.has(sourceType)) {
        return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
      }

      if (!allowedIdeaExplorerGoals.has(goal)) {
        return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
      }

      if (!allowedIdeaCounts.has(ideaCount)) {
        return NextResponse.json({ error: "Invalid ideaCount" }, { status: 400 });
      }

      if (sourceType === "topic" && !topic) {
        return NextResponse.json({ error: "Topic is required for topic source" }, { status: 400 });
      }

      if (sourceType === "image") {
        const mimeType = getDataUrlMimeType(imageDataUrl);

        if (!supportedIdeaImageMimeTypes.has(mimeType)) {
          return NextResponse.json({ error: unsupportedImageFormatMessage }, { status: 400 });
        }
      }

      const exclusionRule = excludeTitles.length > 0
        ? `Avoid repeating these previous idea titles: ${excludeTitles.join(" | ")}`
        : "";
      const sourceSummary = sourceType === "topic"
        ? `Topic from user: ${topic}`
        : "User uploaded a screenshot/image as the inspiration source. Infer practical context only from visible clues.";

      const prompt = `
You are Gatekeeper AI Idea Explorer for Borneo Land Gatekeeper.

Generate idea cards only. Keep language simple and practical for a non-technical user.

Rules:
- Do not invent property facts, pricing, dimensions, approvals, legal claims, amenities, distances, or construction details.
- Keep ideas relevant to Sabah land, buyer/seller education, authority building, or branding.
- Each idea must be fast to understand.
- Return exactly ${ideaCount} ideas.
- Do not number titles.
- ${exclusionRule || "Do not produce near-duplicate ideas in the same batch."}

Return exactly one JSON object in this shape:
{
  "ideas": [
    {
      "title": "...",
      "summary": "1-2 sentences, plain language",
      "bestFormat": "Normal Post | Reel / Video",
      "potentialScore": 1,
      "difficulty": "Easy | Medium | Advanced",
      "estimatedProductionTime": "...",
      "whyThisIdea": "..."
    }
  ]
}

Context:
- Goal: ${goal}
- Source Type: ${sourceType}
- ${sourceSummary}
`;

      const response = await client.responses.create({
        model: "gpt-5-mini",
        input: sourceType === "image"
          ? [
              {
                role: "user",
                content: [
                  { type: "input_text", text: prompt },
                  { type: "input_image", image_url: imageDataUrl, detail: "auto" },
                ],
              },
            ]
          : prompt,
      });

      return NextResponse.json(normalizeInspirationResponse(parseJsonResponse(response.output_text)));
    }

    const rawContentType = normalizeText(body?.contentType).toLowerCase();
    const platform = normalizeText(body?.platform).toLowerCase();
    const topic = normalizeText(body?.topic);
    const tone = normalizeText(body?.tone).toLowerCase() || "professional";
    const language = normalizeText(body?.language).toLowerCase() || "english";
    const goal = normalizeText(body?.goal).toLowerCase().replace(/\s+/g, "-");
    const storyStyle = normalizeSlug(body?.storyStyle);
    const presentationStyle = normalizeSlug(body?.presentationStyle);
    const productionLevel = normalizeSlug(body?.productionLevel);
    const shootingEnvironment = normalizeSlug(body?.shootingEnvironment);
    const rawEquipment: unknown[] = Array.isArray(body?.equipment) ? body.equipment : [];
    const equipment = rawEquipment
      .map((item) => normalizeSlug(item))
      .filter((item) => Boolean(item));
    const duration = body?.duration === null || body?.duration === undefined || body?.duration === ""
      ? null
      : Number(body.duration);
    const contentType = normalizeContentType(rawContentType);
    const aspectRatio = normalizeText(body?.aspectRatio) || getAspectRatioForContentType(contentType);

    if (!allowedContentTypes.has(rawContentType)) {
      return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
    }

    if (!allowedPlatforms.has(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    if (!allowedAspectRatios.has(aspectRatio)) {
      return NextResponse.json({ error: "Invalid aspectRatio" }, { status: 400 });
    }

    if (!topic) {
      return NextResponse.json({ error: "topic required" }, { status: 400 });
    }

    if (!allowedTones.has(tone)) {
      return NextResponse.json({ error: "Invalid tone" }, { status: 400 });
    }

    if (!allowedLanguages.has(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    if (!allowedGoals.has(goal)) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
    }

    if (!allowedStoryStyles.has(storyStyle)) {
      return NextResponse.json({ error: "Invalid storyStyle" }, { status: 400 });
    }

    if (!allowedPresentationStyles.has(presentationStyle)) {
      return NextResponse.json({ error: "Invalid presentationStyle" }, { status: 400 });
    }

    if (!allowedProductionLevels.has(productionLevel)) {
      return NextResponse.json({ error: "Invalid productionLevel" }, { status: 400 });
    }

    if (!allowedShootingEnvironments.has(shootingEnvironment)) {
      return NextResponse.json({ error: "Invalid shootingEnvironment" }, { status: 400 });
    }

    if (!equipment.every((item) => allowedEquipment.has(item))) {
      return NextResponse.json({ error: "Invalid equipment" }, { status: 400 });
    }

    if (contentType === "reel-video" && (duration === null || !allowedDurations.has(duration))) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const sceneCount = contentType === "reel-video" && duration ? Math.ceil(duration / 8) : 1;
    const equipmentList = equipment.length > 0 ? equipment.map(formatTitleCase).join(", ") : "Phone, Gimbal";
    const sabahRepresentationRules = shouldApplySabahRepresentationRules(topic)
      ? `
Sabah local representation rules (apply for all visuals, scenes, and prompts):
- Every imagePrompt and videoPrompt must explicitly describe realistic local Sabahan/Malaysian people and authentic Sabah environment.
- Actors/characters should be local Sabahan/Malaysian-looking unless user specifies otherwise.
- Use natural local clothing and styling: casual polo shirt, fieldwork shirt, cap, modest everyday clothing, and village/rural/town context when appropriate.
- Avoid generic Western-looking actors for Sabah local scenes.
- Keep representation respectful, realistic, and professional.
- If dialogue style is selected and language allows, characters may use light Sabahan Malay/local conversational tone.
- Do not stereotype or exaggerate local identity.
- Maintain character consistency across scenes: same face, same clothing, same age range, same body type, and same role.
- Role guidance when relevant:
  - Landowner: local Sabahan landowner, mature, trustworthy, practical.
  - Buyer: Malaysian/Sabahan buyer, professional or family-oriented depending on context.
  - REN/agent: local Malaysian real estate negotiator, professional fieldwork appearance.
  - Villagers: realistic local community members, respectful and natural.
- Use realistic local Sabahan/Malaysian people and environment. Avoid generic Western stock-footage appearance. Keep scenes natural, respectful, and authentic to Sabah.
`
      : "";

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are Gatekeeper AI Production Studio for Borneo Land Gatekeeper.

Generate a complete production package in strict JSON only.

Brand rules:
- Always include #BorneoLandGatekeeper.
- Never produce more than 5 hashtags total.
- Professional tone by default.
- Do not use emojis unless the selected tone is Funny.
- Never invent property facts, pricing, dimensions, approvals, legal claims, amenities, distances, or construction details.
- If the topic does not provide facts, keep the content generic and safe.

Production rules:
- Output mode is always Production Package.
- Content type can be Normal Post or Reel / Video.
- Every Normal Post must include content-ready caption, one image prompt, one optional motion-friendly video prompt, CTA, and hashtags.
- For Normal Post, create exactly 1 storyboard item and exactly 1 scene card focused on the hero visual.
- If content type is Reel / Video, create exactly ${sceneCount} scenes.
- Every Reel / Video scene must be no more than 8 seconds.
- Every video prompt must explicitly include the scene duration.
- Every video prompt must be optimized for Google Flow and must include character consistency, clothing consistency, environment consistency, lighting consistency, camera movement, subject movement, environmental motion, smooth transition, no subtitles, no text, and no logos.
- Use only one thumbnail placeholder per scene. Do not duplicate the thumbnail inside the image prompt.
- Storyboard must contain scene summary only.
- Production checklist must reflect the selected equipment and likely setup needs.

Output requirements:
- Return exactly one JSON object.
- Do not wrap JSON in markdown unless necessary.
- The JSON must match this shape:
{
  "title": "Short production package title",
  "outputMode": "Production Package",
  "contentType": "Normal Post | Reel / Video",
  "platform": "...",
  "aspectRatio": "...",
  "creativeBrief": {
    "objective": "...",
    "targetAudience": "...",
    "keyMessage": "...",
    "storyStyle": "...",
    "presentationStyle": "...",
    "estimatedProductionTime": "..."
  },
  "visualDirection": {
    "mood": "...",
    "lighting": "...",
    "colourPalette": "...",
    "cameraStyle": "...",
    "atmosphere": "..."
  },
  "productionChecklist": ["..."],
  "storyboard": [
    { "sceneNumber": 1, "summary": "..." }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "purpose": "...",
      "directorNotes": "...",
      "estimatedDuration": "8 seconds",
      "thumbnailPlaceholder": "...",
      "imagePrompt": "...",
      "videoPrompt": "..."
    }
  ],
  "caption": "...",
  "cta": "...",
  "hashtags": "#BorneoLandGatekeeper ..."
}

Additional rules:
- Caption must be complete and publish-ready.
- CTA must be one clear action.
- Hashtags must be a single line, maximum 5 total, and must include #BorneoLandGatekeeper.
- Image prompts must be copy-ready for ChatGPT Image or Google Flow image generation.
- Video prompts must be copy-ready for Google Flow.
- Director notes should guide framing, pacing, and story emphasis.
- If language is Both, blend both naturally and sparingly.
- If tone is Sabahan, reflect that flavor lightly without becoming caricatured.
${sabahRepresentationRules}

Request:
- Content Type: ${contentType === "reel-video" ? "Reel / Video" : "Normal Post"}
- Platform: ${platform}
- Aspect Ratio: ${aspectRatio}
- Topic: ${topic}
- Tone: ${tone}
- Language: ${language}
- Goal: ${goal}
- Story Style: ${storyStyle}
- Presentation Style: ${presentationStyle}
- Duration: ${duration ? `${duration} seconds` : "Not applicable"}
- Production Level: ${productionLevel}
- Shooting Environment: ${shootingEnvironment}
- Selected Equipment: ${equipmentList}
`,
    });

    return NextResponse.json(normalizeStudioResponse(parseJsonResponse(response.output_text)));
  } catch (error: any) {
    const errorMessage = typeof error?.message === "string" ? error.message : String(error);
    const errorStatus = typeof error?.status === "number"
      ? error.status
      : typeof error?.statusCode === "number"
        ? error.statusCode
        : 500;
    const errorDetails =
      typeof error?.error === "object"
        ? error.error
        : typeof error?.response?.data === "object"
          ? error.response.data
          : null;

    console.error("[api/content-studio] POST failed", {
      errorName: error?.name,
      errorMessage,
      errorStatus,
      errorCode: error?.code,
      errorType: error?.type,
      errorParam: error?.param,
      errorStack: error?.stack,
      errorDetails,
    });

    return NextResponse.json(
      {
        error: errorMessage,
        errorName: error?.name ?? "Error",
        status: errorStatus,
        details: errorDetails,
      },
      { status: errorStatus },
    );
  }
}