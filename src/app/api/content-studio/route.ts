import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedModes = new Set(["create-content", "inspiration"]);
const allowedContentTypes = new Set([
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
const allowedGoals = new Set([
  "engagement",
  "education",
  "selling",
  "lead-generation",
  "brand-awareness",
  "weekly-facebook-task",
]);
const allowedInspirationCategories = new Set([
  "property-education",
  "property-listing",
  "investment",
  "legal",
  "lifestyle",
  "drone",
  "construction",
  "personal-branding",
  "funny-sabahan",
  "general",
]);
const allowedAudiences = new Set([
  "buyers",
  "investors",
  "land-owners",
  "developers",
  "agents",
  "general-public",
]);
const allowedIdeaCounts = new Set([10, 20, 50]);

type StudioResponse = {
  title: string;
  contentType: string;
  platform: string;
  aspectRatio: string;
  sections: Array<{
    label: string;
    value: string;
  }>;
};

type InspirationIdea = {
  title: string;
  angle: string;
  suggestedContentType: string;
  whyItMayWork: string;
  engagementPotential: "Low" | "Medium" | "High";
};

type InspirationResponse = {
  ideas: InspirationIdea[];
};

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

function normalizeStudioResponse(value: unknown): StudioResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid content studio response");
  }

  const payload = value as Record<string, unknown>;
  const title = normalizeText(payload.title);
  const contentType = normalizeText(payload.contentType);
  const platform = normalizeText(payload.platform);
  const aspectRatio = normalizeText(payload.aspectRatio);
  const sections = Array.isArray(payload.sections)
    ? payload.sections
        .map((section) => {
          if (!section || typeof section !== "object") {
            return null;
          }

          const record = section as Record<string, unknown>;
          const label = normalizeText(record.label);
          const value = normalizeText(record.value);

          if (!label || !value) {
            return null;
          }

          return { label, value };
        })
        .filter(Boolean) as Array<{ label: string; value: string }>
    : [];

  if (!title || !contentType || !platform || !aspectRatio || sections.length === 0) {
    throw new Error("Incomplete content studio response");
  }

  return {
    title,
    contentType,
    platform,
    aspectRatio,
    sections,
  };
}

function normalizeEngagementPotential(value: string) {
  const normalized = value.toLowerCase();

  if (normalized === "low") {
    return "Low";
  }

  if (normalized === "medium") {
    return "Medium";
  }

  if (normalized === "high") {
    return "High";
  }

  throw new Error("Invalid engagementPotential value");
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
          const angle = normalizeText(record.angle);
          const suggestedContentType = normalizeText(record.suggestedContentType);
          const whyItMayWork = normalizeText(record.whyItMayWork);
          const rawEngagementPotential = normalizeText(record.engagementPotential);

          if (!title || !angle || !suggestedContentType || !whyItMayWork || !rawEngagementPotential) {
            return null;
          }

          return {
            title,
            angle,
            suggestedContentType,
            whyItMayWork,
            engagementPotential: normalizeEngagementPotential(rawEngagementPotential),
          };
        })
        .filter(Boolean) as InspirationIdea[]
    : [];

  if (ideas.length === 0) {
    throw new Error("Incomplete inspiration response");
  }

  return { ideas };
}

function getOutputTemplate(contentType: string) {
  if (["reel-short-video", "drone-showcase", "construction-progress"].includes(contentType)) {
    return [
      "Hook",
      "Caption",
      "Reel Script",
      "Thumbnail Title",
      "Image Prompt",
      "Video Prompt",
      "Animation Prompt",
      "Music Style",
      "CTA",
      "Hashtags",
    ];
  }

  return ["Hook", "Caption", "CTA", "Hashtags"];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = normalizeText(body?.mode).toLowerCase() || "create-content";

    if (!allowedModes.has(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (mode === "inspiration") {
      const category = normalizeText(body?.category).toLowerCase().replace(/\s+/g, "-");
      const targetAudience = normalizeText(body?.targetAudience).toLowerCase().replace(/\s+/g, "-");
      const goal = normalizeText(body?.goal).toLowerCase().replace(/\s+/g, "-");
      const ideaCount = Number(body?.ideaCount);

      if (!allowedInspirationCategories.has(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }

      if (!allowedAudiences.has(targetAudience)) {
        return NextResponse.json({ error: "Invalid targetAudience" }, { status: 400 });
      }

      if (!allowedGoals.has(goal)) {
        return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
      }

      if (!allowedIdeaCounts.has(ideaCount)) {
        return NextResponse.json({ error: "Invalid ideaCount" }, { status: 400 });
      }

      const response = await client.responses.create({
        model: "gpt-5-mini",
        input: `
You are Gatekeeper AI Content Studio for Borneo Land Gatekeeper.

Generate inspiration ideas only. Do not generate a full post, caption, script, CTA, or hashtag package.

Brand and idea rules:
- Ideas must fit Borneo Land Gatekeeper.
- Ideas should be suitable for Facebook posts, reels, and property education.
- Do not invent property facts, pricing, dimensions, approvals, legal claims, amenities, distances, or construction details.
- Include Sabah, real estate, or land education angles where relevant.
- Prioritize ideas that encourage comments, shares, saves, or inquiries.
- Keep each idea practical, specific, and usable for future content generation.

Output requirements:
- Return exactly one JSON object.
- The JSON must match this shape:
{
  "ideas": [
    {
      "title": "...",
      "angle": "...",
      "suggestedContentType": "Standard Post | Reel / Short Video | Property Listing | Educational Content | Drone Showcase | Construction Progress | Storytelling | Custom",
      "whyItMayWork": "...",
      "engagementPotential": "Low | Medium | High"
    }
  ]
}
- Return exactly ${ideaCount} ideas.
- Do not include numbering in the title.

Request:
- Category: ${category}
- Target Audience: ${targetAudience}
- Goal: ${goal}
- Number of Ideas: ${ideaCount}
`,
      });

      return NextResponse.json(normalizeInspirationResponse(parseJsonResponse(response.output_text)));
    }

    const contentType = normalizeText(body?.contentType).toLowerCase();
    const platform = normalizeText(body?.platform).toLowerCase();
    const aspectRatio = normalizeText(body?.aspectRatio);
    const topic = normalizeText(body?.topic);
    const tone = normalizeText(body?.tone).toLowerCase() || "professional";
    const language = normalizeText(body?.language).toLowerCase() || "english";
    const goal = normalizeText(body?.goal).toLowerCase().replace(/\s+/g, "-");

    if (!allowedContentTypes.has(contentType)) {
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

    const sectionLabels = getOutputTemplate(contentType);
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are Gatekeeper AI Content Studio for Borneo Land Gatekeeper.

Generate a complete content package in strict JSON only.

Brand rules:
- Always include #BorneoLandGatekeeper.
- Never produce more than 5 hashtags total.
- Professional tone by default.
- Do not use emojis unless the selected tone is Funny.
- Never invent property facts, pricing, dimensions, approvals, legal claims, amenities, distances, or construction details.
- If the topic does not provide facts, keep the content generic and safe.

Output requirements:
- Return exactly one JSON object.
- Do not wrap JSON in markdown unless necessary.
- The JSON must match this shape:
{
  "title": "Short package title",
  "contentType": "...",
  "platform": "...",
  "aspectRatio": "...",
  "sections": [
    { "label": "Hook", "value": "..." }
  ]
}

Required sections for this request, in order:
${sectionLabels.map((label) => `- ${label}`).join("\n")}

Additional rules:
- The Hashtags section must be a single line of hashtags, maximum 5 total, and must include #BorneoLandGatekeeper.
- Standard Post style outputs should feel complete but concise.
- Video style outputs should include practical production prompts, but still avoid invented facts.
- Thumbnail Title must be short and punchy.
- CTA should be one clear action.
- If language is Both, blend both naturally and sparingly.
- If tone is Sabahan, reflect that flavor lightly without becoming caricatured.

Request:
- Content Type: ${contentType}
- Platform: ${platform}
- Aspect Ratio: ${aspectRatio}
- Topic: ${topic}
- Tone: ${tone}
- Language: ${language}
- Goal: ${goal}
`,
    });

    return NextResponse.json(normalizeStudioResponse(parseJsonResponse(response.output_text)));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}