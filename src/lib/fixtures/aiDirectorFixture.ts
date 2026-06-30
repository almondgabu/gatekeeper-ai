import { createWorkspaceFromIdea } from "@/lib/production-studio/createWorkspaceFromIdea";
import { saveProductionWorkspace } from "@/lib/production-studio/workspaceStorage";
import { type ProductionWorkspaceProject } from "@/types/production-studio";

const LOCAL_FIXTURE_HOSTS = new Set(["localhost", "127.0.0.1"]);
const SUPPORTED_PLATFORMS = new Set(["facebook", "instagram", "tiktok", "linkedin", "youtube-shorts"]);

export const AI_DIRECTOR_FIXTURE_FLAG = "ai-director";

type ExplorerGoal = "build-authority" | "educate" | "find-buyers" | "find-sellers" | "branding";
type MapperIdea = Parameters<typeof createWorkspaceFromIdea>[0];

type FixtureIdea = {
  title: string;
  summary: string;
  ideaType: "short_video";
  bestFormat: "Reel / Video";
  potentialScore: number;
  engagementPotential: number;
  confidenceScore: number;
  targetAudience: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  productionTime: string;
  estimatedProductionTime: string;
  whyThisIdea: string;
  whyThisWorks: string;
  keyVisualPrompt: string;
};

export type AiDirectorFixtureState = {
  workspace: ProductionWorkspaceProject;
  workflow: "video-reel";
  ideaType: "short_video";
  contentType: "reel-video";
  platform: string;
  tone: string;
  storyStyle: string;
  ideaGoal: ExplorerGoal;
  studioGoal: string;
  topic: string;
};

const AI_DIRECTOR_FIXTURE_IDEA: FixtureIdea = {
  title: "Fixture Reel Idea - Mount Kinabalu Weekend Land Teaser",
  summary: "A concise reel concept that highlights scenic parcel land value and a clear action step for buyers.",
  ideaType: "short_video",
  bestFormat: "Reel / Video",
  potentialScore: 90,
  engagementPotential: 92,
  confidenceScore: 89,
  targetAudience: "First-time land buyers and small investors in Sabah",
  difficulty: "Easy",
  productionTime: "2-4 hours",
  estimatedProductionTime: "2-4 hours",
  whyThisIdea: "Short scenic reels with a practical CTA are easy to consume and convert interest quickly.",
  whyThisWorks: "Combines place identity, urgency, and social proof-friendly visuals.",
  keyVisualPrompt: "Golden-hour drone reveal of hillside parcel lots near Mount Kinabalu, cinematic contrast, clean overlays.",
};

export function isLocalFixtureHost(hostname: string) {
  return LOCAL_FIXTURE_HOSTS.has(hostname.trim().toLowerCase());
}

export function createAiDirectorFixtureState(searchParams: URLSearchParams): AiDirectorFixtureState {
  const goal = normalizeFixtureGoal(searchParams.get("goal"));
  const platform = normalizePlatform(searchParams.get("platform"));
  const tone = normalizeText(searchParams.get("tone"), "Professional");
  const storyStyle = normalizeText(searchParams.get("style"), "Educational");
  const studioGoal = mapExplorerGoalToStudioGoal(goal);

  const workspace = createWorkspaceFromIdea(
    mapFixtureIdeaToWorkspaceIdea(AI_DIRECTOR_FIXTURE_IDEA, {
      platform,
      goal,
      tone,
      storyStyle,
    }),
  );

  saveProductionWorkspace(workspace);

  return {
    workspace,
    workflow: "video-reel",
    ideaType: "short_video",
    contentType: "reel-video",
    platform,
    tone,
    storyStyle,
    ideaGoal: goal,
    studioGoal,
    topic: `${AI_DIRECTOR_FIXTURE_IDEA.title}: ${AI_DIRECTOR_FIXTURE_IDEA.summary}`,
  };
}

function normalizeFixtureGoal(value: string | null): ExplorerGoal {
  const normalized = (value ?? "").trim().toLowerCase().replace(/\s+/g, "-");

  if (normalized === "build-authority") {
    return "build-authority";
  }

  if (normalized === "find-buyers") {
    return "find-buyers";
  }

  if (normalized === "find-sellers") {
    return "find-sellers";
  }

  if (normalized === "branding" || normalized === "brand-awareness") {
    return "branding";
  }

  return "educate";
}

function normalizePlatform(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  return SUPPORTED_PLATFORMS.has(normalized) ? normalized : "facebook";
}

function normalizeText(value: string | null, fallback: string) {
  const normalized = (value ?? "").trim();
  return normalized || fallback;
}

function mapExplorerGoalToStudioGoal(value: ExplorerGoal) {
  if (value === "find-buyers" || value === "find-sellers") {
    return "Selling";
  }

  if (value === "build-authority" || value === "branding") {
    return "Brand Awareness";
  }

  return "Education";
}

function getGoalLabel(value: ExplorerGoal) {
  if (value === "build-authority") {
    return "Build Authority";
  }

  if (value === "find-buyers") {
    return "Find Buyers";
  }

  if (value === "find-sellers") {
    return "Find Sellers";
  }

  if (value === "branding") {
    return "Branding";
  }

  return "Educate";
}

function mapFixtureIdeaToWorkspaceIdea(
  idea: FixtureIdea,
  context: {
    platform: string;
    goal: ExplorerGoal;
    tone: string;
    storyStyle: string;
  },
): MapperIdea {
  return {
    title: idea.title,
    hook: idea.summary,
    coreConcept: idea.summary,
    ideaType: idea.ideaType,
    bestFormat: idea.bestFormat,
    targetAudience: idea.targetAudience,
    emotion: "Trust",
    platform: context.platform,
    inheritedGoal: getGoalLabel(context.goal),
    inheritedTone: context.tone,
    inheritedStyle: context.storyStyle,
    estimatedReach: Math.max(idea.potentialScore * 100, 100),
    engagementPotential: idea.engagementPotential,
    difficulty: idea.difficulty,
    productionTime: idea.productionTime || idea.estimatedProductionTime,
    suggestedCTA: `Encourage action for ${getGoalLabel(context.goal).toLowerCase()}`,
    thumbnailPrompt: `Thumbnail concept for: ${idea.title}`,
    keyVisualPrompt: idea.keyVisualPrompt,
    animationPrompt: `Motion concept for: ${idea.title}`,
    confidenceScore: idea.confidenceScore,
    whyThisWorks: idea.whyThisWorks || idea.whyThisIdea,
  };
}