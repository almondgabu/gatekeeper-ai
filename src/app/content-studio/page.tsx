"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  Clapperboard,
  Clock3,
  Copy,
  FolderClock,
  FileVideo,
  ImagePlay,
  Languages,
  Lightbulb,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
  Video,
} from "lucide-react";
import ProductionWorkspaceShell from "@/components/production-studio/ProductionWorkspaceShell";
import WorkflowNavigator from "@/components/production-studio/WorkflowNavigator";
import { createWorkspaceFromIdea } from "@/lib/production-studio/createWorkspaceFromIdea";
import { saveProductionWorkspace } from "@/lib/production-studio/workspaceStorage";
import { type ProductionWorkspaceProject } from "@/types/production-studio";

type ContentTypeOption = {
  value: string;
  label: string;
};

type PackageSection = {
  label: string;
  value: string;
};

type GeneratedPackage = {
  title: string;
  outputMode?: string;
  contentType: string;
  platform: string;
  aspectRatio: string;
  sections?: PackageSection[];
  creativeBrief?: {
    objective: string;
    targetAudience: string;
    keyMessage: string;
    storyStyle: string;
    presentationStyle: string;
    estimatedProductionTime: string;
  };
  visualDirection?: {
    mood: string;
    lighting: string;
    colourPalette: string;
    cameraStyle: string;
    atmosphere: string;
  };
  productionChecklist?: string[];
  storyboard?: Array<{
    sceneNumber: number;
    summary: string;
  }>;
  scenes?: Array<{
    sceneNumber: number;
    purpose: string;
    directorNotes: string;
    estimatedDuration: string;
    thumbnailPlaceholder: string;
    imagePrompt: string;
    videoPrompt: string;
  }>;
  caption?: string;
  cta?: string;
  hashtags?: string;
};

type InspirationIdea = {
  title: string;
  summary: string;
  ideaType?: "social_post" | "short_video";
  bestFormat: "Normal Post" | "Reel / Video";
  potentialScore: number;
  engagementPotential?: number;
  confidenceScore?: number;
  targetAudience?: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  productionTime?: string;
  estimatedProductionTime: string;
  whyThisIdea: string;
  whyThisWorks?: string;
  keyVisualPrompt?: string;
};

type SavedHistoryItem = {
  id: string;
  kind: "content-package" | "idea-card";
  title: string;
  preview: string;
  savedAt: string;
  package?: GeneratedPackage;
  idea?: InspirationIdea;
  context?: {
    topic?: string;
    contentType?: string;
    platform?: string;
    aspectRatio?: string;
    tone?: string;
    language?: string;
    goal?: string;
    storyStyle?: string;
    presentationStyle?: string;
    duration?: string;
    productionLevel?: string;
    shootingEnvironment?: string;
    equipment?: string[];
    ideaWorkflow?: "normal-post" | "video-reel";
    ideaSourceType?: "topic" | "image";
    ideaType?: "social_post" | "short_video";
    ideaTopic?: string;
    ideaContext?: string;
    ideaGoal?: string;
    imageName?: string;
  };
};

const contentTypes: ContentTypeOption[] = [
  { value: "normal-post", label: "Normal Post" },
  { value: "reel-video", label: "Reel / Video" },
];

const platforms = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube-shorts", label: "YouTube Shorts" },
];

const languages = ["English", "Sabahan", "Both"];
const goals = ["Engagement", "Education", "Selling", "Brand Awareness", "Weekly Facebook Task"];
const storyStyles = [
  "Educational",
  "Documentary",
  "Case Study",
  "Property Tour",
  "Investor Pitch",
  "Comedy",
  "Lifestyle",
  "News Report",
];
const presentationStyles = [
  "Narration",
  "Dialogue",
  "Host Presentation",
  "Silent Cinematic",
  "Voice-over",
  "Interview",
];
const productionLevels = ["Quick", "Professional", "Premium"];
const videoLengthPresets = [
  { durationSeconds: 24, sceneCount: 3, label: "24 seconds (3 scenes)" },
  { durationSeconds: 32, sceneCount: 4, label: "32 seconds (4 scenes)" },
  { durationSeconds: 40, sceneCount: 5, label: "40 seconds (5 scenes)" },
  { durationSeconds: 48, sceneCount: 6, label: "48 seconds (6 scenes)" },
  { durationSeconds: 56, sceneCount: 7, label: "56 seconds (7 scenes)" },
  { durationSeconds: 64, sceneCount: 8, label: "64 seconds (8 scenes)" },
  { durationSeconds: 72, sceneCount: 9, label: "72 seconds (9 scenes)" },
  { durationSeconds: 80, sceneCount: 10, label: "80 seconds (10 scenes)" },
  { durationSeconds: 88, sceneCount: 11, label: "88 seconds (11 scenes)" },
  { durationSeconds: 96, sceneCount: 12, label: "96 seconds (12 scenes)" },
];
const videoTypes = ["AI Video", "Dialogue", "Storytelling", "Documentary", "Explainer", "Educational"];
const inputSourceOptions = [
  { value: "topic", label: "Topic" },
  { value: "screenshot", label: "Screenshot" },
  { value: "image", label: "Image" },
  { value: "saved-idea", label: "Saved Idea" },
  { value: "url", label: "URL" },
];
const ideaExplorerGoals = [
  { value: "build-authority", label: "Build Authority" },
  { value: "educate", label: "Educate" },
  { value: "find-buyers", label: "Find Buyers" },
  { value: "find-sellers", label: "Find Sellers" },
  { value: "branding", label: "Branding" },
];
const ideaTypeOptions = [
  { value: "social_post", label: "Normal Post" },
  { value: "short_video", label: "Short Video" },
] as const;
const ideaWorkflowOptions = [
  {
    value: "normal-post",
    label: "Normal Post",
    description: "Prepare 10 single-image post ideas with one professional key visual prompt each.",
  },
  {
    value: "video-reel",
    label: "Video / Reel",
    description: "Prepare 10 video concept ideas. Duration presets and scene logic will be added next.",
  },
] as const;
const savedHistoryStorageKey = "gatekeeper-content-studio-history";
const supportedIdeaImageMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const unsupportedImageFormatMessage = "Unsupported image format. Please upload PNG, JPG, JPEG, or WEBP.";
const maxIdeaContextLength = 1500;

function normalizeStudioContentType(value: string) {
  const normalized = value.trim().toLowerCase();

  if (["reel-video", "reel-short-video", "drone-showcase", "construction-progress"].includes(normalized)) {
    return "reel-video";
  }

  return "normal-post";
}

function getAspectRatioForContentType(contentType: string) {
  return contentType === "reel-video" ? "9:16" : "4:5";
}

function hasProductionStudioStructure(contentPackage: GeneratedPackage) {
  return Boolean(
    contentPackage.creativeBrief &&
    contentPackage.visualDirection &&
    contentPackage.productionChecklist &&
    contentPackage.storyboard &&
    contentPackage.scenes,
  );
}

function formatCreativeBriefForCopy(contentPackage: GeneratedPackage) {
  if (!contentPackage.creativeBrief) {
    return "";
  }

  const { creativeBrief } = contentPackage;

  return [
    "Creative Brief",
    `Objective: ${creativeBrief.objective}`,
    `Target Audience: ${creativeBrief.targetAudience}`,
    `Key Message: ${creativeBrief.keyMessage}`,
    `Story Style: ${creativeBrief.storyStyle}`,
    `Presentation Style: ${creativeBrief.presentationStyle}`,
    `Estimated Production Time: ${creativeBrief.estimatedProductionTime}`,
  ].join("\n");
}

function formatVisualDirectionForCopy(contentPackage: GeneratedPackage) {
  if (!contentPackage.visualDirection) {
    return "";
  }

  const { visualDirection } = contentPackage;

  return [
    "Visual Direction",
    `Mood: ${visualDirection.mood}`,
    `Lighting: ${visualDirection.lighting}`,
    `Colour Palette: ${visualDirection.colourPalette}`,
    `Camera Style: ${visualDirection.cameraStyle}`,
    `Atmosphere: ${visualDirection.atmosphere}`,
  ].join("\n");
}

function formatProductionChecklistForCopy(contentPackage: GeneratedPackage) {
  return [
    "Production Checklist",
    ...(contentPackage.productionChecklist ?? []).map((item) => `- ${item}`),
  ].join("\n");
}

function formatStoryboardForCopy(contentPackage: GeneratedPackage) {
  return [
    "Storyboard",
    ...(contentPackage.storyboard ?? []).map((scene) => `Scene ${scene.sceneNumber}: ${scene.summary}`),
  ].join("\n");
}

function formatSceneForCopy(scene: NonNullable<GeneratedPackage["scenes"]>[number]) {
  return [
    `Scene ${scene.sceneNumber}`,
    `Purpose: ${scene.purpose}`,
    `Director Notes: ${scene.directorNotes}`,
    `Estimated Duration: ${scene.estimatedDuration}`,
    `Thumbnail Placeholder: ${scene.thumbnailPlaceholder}`,
    "",
    "Image Prompt",
    scene.imagePrompt,
    "",
    "Video Prompt",
    scene.videoPrompt,
  ].join("\n");
}

function formatPackageForCopy(contentPackage: GeneratedPackage) {
  if (!hasProductionStudioStructure(contentPackage)) {
    return [
      contentPackage.title,
      `Content Type: ${contentPackage.contentType}`,
      `Platform: ${contentPackage.platform}`,
      `Aspect Ratio: ${contentPackage.aspectRatio}`,
      "",
      ...(contentPackage.sections ?? []).flatMap((section) => [section.label, section.value, ""]),
    ].join("\n");
  }

  return [
    contentPackage.title,
    `Output Mode: ${contentPackage.outputMode ?? "Production Package"}`,
    `Content Type: ${contentPackage.contentType}`,
    `Platform: ${contentPackage.platform}`,
    `Aspect Ratio: ${contentPackage.aspectRatio}`,
    "",
    formatCreativeBriefForCopy(contentPackage),
    "",
    formatVisualDirectionForCopy(contentPackage),
    "",
    formatProductionChecklistForCopy(contentPackage),
    "",
    formatStoryboardForCopy(contentPackage),
    "",
    ...(contentPackage.scenes ?? []).flatMap((scene) => [formatSceneForCopy(scene), ""]),
    "Caption",
    contentPackage.caption ?? "",
    "",
    "CTA",
    contentPackage.cta ?? "",
    "",
    "Hashtags",
    contentPackage.hashtags ?? "",
  ].join("\n");
}

function getPackagePreview(contentPackage: GeneratedPackage) {
  if (contentPackage.creativeBrief?.objective) {
    return contentPackage.creativeBrief.objective;
  }

  if (contentPackage.caption) {
    return contentPackage.caption;
  }

  return contentPackage.sections?.[0]?.value ?? contentPackage.title;
}

function readSavedHistory() {
  if (typeof window === "undefined") {
    return [] as SavedHistoryItem[];
  }

  try {
    const rawValue = window.localStorage.getItem(savedHistoryStorageKey);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as SavedHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeSavedHistory(items: SavedHistoryItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(savedHistoryStorageKey, JSON.stringify(items));
}

function formatSavedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getSceneDurationBadge(duration: string) {
  return duration.replace("seconds", "sec").replace("second", "sec");
}

function getGoalLabel(value: string) {
  return ideaExplorerGoals.find((goalOption) => goalOption.value === value)?.label ?? "Educate";
}

function getIdeaTypeLabel(value: "social_post" | "short_video") {
  return ideaTypeOptions.find((option) => option.value === value)?.label ?? "Normal Post";
}

function mapWorkflowToIdeaType(value: "normal-post" | "video-reel") {
  return value === "video-reel" ? "short_video" : "social_post";
}

function mapIdeaTypeToWorkflow(value: "social_post" | "short_video") {
  return value === "short_video" ? "video-reel" : "normal-post";
}

function getIdeaWorkflowLabel(value: "normal-post" | "video-reel") {
  return value === "video-reel" ? "Video / Reel" : "Normal Post";
}

function mapExplorerGoalToStudioGoal(value: string) {
  if (value === "find-buyers" || value === "find-sellers") {
    return "Selling";
  }

  if (value === "build-authority" || value === "branding") {
    return "Brand Awareness";
  }

  return "Education";
}

function normalizeExplorerGoal(value: string | undefined) {
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

function mapIdeaBestFormatToContentType(value: InspirationIdea["bestFormat"]) {
  return value === "Reel / Video" ? "reel-video" : "normal-post";
}

type MapperIdea = Parameters<typeof createWorkspaceFromIdea>[0];

function mapInspirationIdeaToWorkspaceIdea(
  idea: InspirationIdea,
  selectedPlatform: string,
  selectedGoal: string,
  selectedTone: string,
  selectedStoryStyle: string,
): MapperIdea {
  return {
    title: idea.title,
    hook: idea.summary || idea.title,
    coreConcept: idea.summary || idea.whyThisIdea || idea.title,
    ideaType: idea.ideaType ?? "social_post",
    bestFormat: idea.bestFormat,
    targetAudience: idea.targetAudience || "General audience",
    emotion: "Trust",
    platform: selectedPlatform,
    inheritedGoal: getGoalLabel(selectedGoal),
    inheritedTone: selectedTone,
    inheritedStyle: selectedStoryStyle,
    estimatedReach: Math.max(idea.potentialScore * 100, 100),
    engagementPotential: Number.isFinite(Number(idea.engagementPotential))
      ? Number(idea.engagementPotential)
      : idea.potentialScore,
    difficulty: idea.difficulty,
    productionTime: idea.productionTime || idea.estimatedProductionTime,
    suggestedCTA: `Encourage action for ${getGoalLabel(selectedGoal).toLowerCase()}`,
    thumbnailPrompt: `Thumbnail concept for: ${idea.title}`,
    keyVisualPrompt: idea.keyVisualPrompt || `Key visual concept for: ${idea.title}`,
    animationPrompt: `Motion concept for: ${idea.title}`,
    confidenceScore: Number.isFinite(Number(idea.confidenceScore)) ? Number(idea.confidenceScore) : idea.potentialScore,
    whyThisWorks: idea.whyThisWorks || idea.whyThisIdea,
  };
}

function getDataUrlMimeType(dataUrl: string | null) {
  if (!dataUrl) {
    return "";
  }

  const match = /^data:([^;,]+)[;,]/i.exec(dataUrl.trim());
  return match?.[1]?.toLowerCase() ?? "";
}

function isSupportedIdeaImageDataUrl(dataUrl: string | null) {
  return supportedIdeaImageMimeTypes.has(getDataUrlMimeType(dataUrl));
}

function getIdeaRecommendationScore(idea: InspirationIdea) {
  const engagement = Number(idea.engagementPotential);
  if (Number.isFinite(engagement) && engagement > 0) {
    return { score: engagement, source: "engagement" as const };
  }

  const potential = Number(idea.potentialScore);
  if (Number.isFinite(potential) && potential > 0) {
    return { score: potential, source: "potential" as const };
  }

  const confidence = Number(idea.confidenceScore);
  if (Number.isFinite(confidence) && confidence > 0) {
    return { score: confidence, source: "confidence" as const };
  }

  return { score: 0, source: "fallback" as const };
}

function getNormalPostVisualConcept(idea: InspirationIdea, selectedPlatform: string) {
  if (idea.keyVisualPrompt?.trim()) {
    return idea.keyVisualPrompt.trim();
  }

  return `A polished real-estate visual concept for ${idea.title} on ${selectedPlatform}, with professional composition, clean focal framing, and premium editorial lighting.`;
}

export default function ContentStudioPage() {
  const hasAppliedOpportunityPrefill = useRef(false);
  const [mode, setMode] = useState<"create-content" | "inspiration" | "saved">("inspiration");
  const [contentType, setContentType] = useState("normal-post");
  const [platform, setPlatform] = useState("facebook");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [goal, setGoal] = useState("Engagement");
  const [storyStyle, setStoryStyle] = useState("Educational");
  const [presentationStyle, setPresentationStyle] = useState("Narration");
  const [durationSeconds, setDurationSeconds] = useState(40);
  const [sceneCount, setSceneCount] = useState(5);
  const [productionLevel, setProductionLevel] = useState("Professional");
  const [videoType, setVideoType] = useState("AI Video");
  const [inputSource, setInputSource] = useState("topic");
  const [ideaSourceType, setIdeaSourceType] = useState<"topic" | "image">("topic");
  const [ideaWorkflow, setIdeaWorkflow] = useState<"normal-post" | "video-reel" | null>(null);
  const [ideaType, setIdeaType] = useState<"social_post" | "short_video">("social_post");
  const [ideaTopic, setIdeaTopic] = useState("");
  const [ideaContext, setIdeaContext] = useState("");
  const [ideaGoal, setIdeaGoal] = useState("educate");
  const [ideaImageDataUrl, setIdeaImageDataUrl] = useState<string | null>(null);
  const [ideaImageName, setIdeaImageName] = useState<string | null>(null);
  const [refreshingIdeaKey, setRefreshingIdeaKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generatedPackage, setGeneratedPackage] = useState<GeneratedPackage | null>(null);
  const [ideaPages, setIdeaPages] = useState<InspirationIdea[][]>([]);
  const [ideaPageIndex, setIdeaPageIndex] = useState(0);
  const [savedItems, setSavedItems] = useState<SavedHistoryItem[]>([]);
  const [activeProductionWorkspace, setActiveProductionWorkspace] = useState<ProductionWorkspaceProject | null>(null);
  const [loadedOpportunityTitle, setLoadedOpportunityTitle] = useState<string | null>(null);

  useEffect(() => {
    setSavedItems(readSavedHistory());
  }, []);

  useEffect(() => {
    if (hasAppliedOpportunityPrefill.current) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("source") !== "opportunity") {
      return;
    }

    const opportunityTitle = searchParams.get("opportunityTitle")?.trim() ?? "";
    const topicValue = searchParams.get("topic")?.trim() ?? "";
    const contentTypeValue = searchParams.get("contentType")?.trim() ?? "";
    const goalValue = searchParams.get("goal")?.trim() ?? "";
    const toneValue = searchParams.get("tone")?.trim() ?? "";

    hasAppliedOpportunityPrefill.current = true;
    setMode("create-content");
    setGeneratedPackage(null);
    setIdeaPages([]);
    setIdeaPageIndex(0);
    setCopiedKey(null);
    setError(null);
    setLoadedOpportunityTitle(opportunityTitle || "Opportunity");

    if (topicValue) {
      setTopic(topicValue);
    }

    if (contentTypeValue) {
      setContentType(normalizeStudioContentType(contentTypeValue));
    }

    if (goalValue) {
      setGoal(goalValue);
    }

    if (toneValue) {
      setTone(toneValue);
    }
  }, []);

  const requestPayload = useMemo(
    () => ({
      mode: "create-content",
      contentType,
      platform,
      aspectRatio: getAspectRatioForContentType(contentType),
      topic,
      tone,
      language,
      goal,
      storyStyle,
      presentationStyle,
      duration: contentType === "reel-video" ? durationSeconds : null,
      productionLevel,
      shootingEnvironment: "ai_generated",
      equipment: [],
    }),
    [contentType, platform, topic, tone, language, goal, storyStyle, presentationStyle, durationSeconds, productionLevel],
  );

  const selectedIdeaType = useMemo(
    () => (ideaWorkflow ? mapWorkflowToIdeaType(ideaWorkflow) : ideaType),
    [ideaWorkflow, ideaType],
  );

  const inspirationPayload = useMemo(
    () => ({
      mode: "inspiration",
      sourceType: ideaSourceType,
      workflow: ideaWorkflow,
      ideaType: selectedIdeaType,
      platform,
      topic: ideaSourceType === "topic" ? ideaTopic.trim() : "",
      imageDataUrl: ideaSourceType === "image" ? ideaImageDataUrl : null,
      context: ideaContext.trim(),
      goal: ideaGoal,
      ideaCount: 10,
    }),
    [ideaSourceType, ideaWorkflow, selectedIdeaType, platform, ideaTopic, ideaImageDataUrl, ideaContext, ideaGoal],
  );

  const visibleIdeas = ideaPages[ideaPageIndex] ?? [];
  const recommendedIdeaIndex = useMemo(() => {
    if (visibleIdeas.length === 0) {
      return -1;
    }

    let bestIndex = 0;
    let bestScore = -1;

    visibleIdeas.forEach((idea, index) => {
      const { score } = getIdeaRecommendationScore(idea);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  }, [visibleIdeas]);
  const canGoToPreviousIdeas = ideaPageIndex > 0;
  const canGoToNextIdeas = ideaPageIndex < ideaPages.length - 1;

  async function generateContent() {
    if (!topic.trim()) {
      setError("Topic is required.");
      return;
    }

    setGenerating(true);
    setError(null);
    setCopiedKey(null);

    try {
      const endpoint = "/api/content-studio";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const serverError = typeof result?.error === "string" ? result.error : null;
        throw new Error(serverError || `Failed to generate production package (${response.status}).`);
      }

      if (!result || typeof result !== "object") {
        throw new Error("Invalid API response from /api/content-studio.");
      }

      setGeneratedPackage(result as GeneratedPackage);
    } catch (generationError: any) {
      console.error("[production-studio] generateContent failed", {
        endpoint: "/api/content-studio",
        origin: typeof window === "undefined" ? null : window.location.origin,
        requestPayload,
        error: generationError,
      });

      const message = generationError?.message ?? "Failed to generate production package.";
      if (message.toLowerCase().includes("failed to fetch")) {
        setError("Cannot reach /api/content-studio from this page origin. Check that the Next.js server is running on the same port as the page.");
      } else {
        setError(message);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function generateIdeas() {
    if (!ideaWorkflow) {
      setError("Choose Normal Post or Video / Reel before generating ideas.");
      return;
    }

    if (ideaSourceType === "topic" && !ideaTopic.trim()) {
      setError("Type a topic to explore ideas.");
      return;
    }

    if (ideaSourceType === "image" && !ideaImageDataUrl) {
      setError(ideaImageName ? unsupportedImageFormatMessage : "Upload a screenshot or image to explore ideas.");
      return;
    }

    if (ideaSourceType === "image" && !isSupportedIdeaImageDataUrl(ideaImageDataUrl)) {
      setError(unsupportedImageFormatMessage);
      return;
    }

    setGenerating(true);
    setError(null);
    setCopiedKey(null);

    try {
      const endpoint = "/api/content-studio";
      let responseStatus: number | null = null;
      let responseStatusText: string | null = null;
      let responseBody: string | null = null;
      let responseJson: unknown = null;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inspirationPayload),
      });

      responseStatus = response.status;
      responseStatusText = response.statusText;
      responseBody = await response.text().catch(() => "");

      if (responseBody) {
        try {
          responseJson = JSON.parse(responseBody);
        } catch {
          responseJson = null;
        }
      }

      if (!response.ok) {
        const parsed = (responseJson && typeof responseJson === "object")
          ? (responseJson as { error?: unknown; message?: unknown; details?: unknown })
          : null;
        const detailsText = typeof parsed?.details === "string" ? parsed.details : null;
        const serverMessage =
          (typeof parsed?.error === "string" && parsed.error) ||
          (typeof parsed?.message === "string" && parsed.message) ||
          detailsText ||
          responseBody?.trim() ||
          `Request failed with status ${response.status}.`;

        console.error("[production-studio] generateIdeas API non-OK", {
          endpoint,
          status: responseStatus,
          statusText: responseStatusText,
          bodyText: responseBody,
          bodyJson: responseJson,
          inspirationPayload,
        });

        setError(`Idea generation failed (${response.status} ${response.statusText}): ${serverMessage}`);
        return;
      }

      const result = responseJson;

      if (!result || typeof result !== "object") {
        console.error("[production-studio] generateIdeas invalid success payload", {
          endpoint,
          status: responseStatus,
          statusText: responseStatusText,
          bodyText: responseBody,
          bodyJson: responseJson,
          inspirationPayload,
        });
        setError("Idea generation returned an invalid response. Please try again.");
        return;
      }

      const resultRecord = result as { ideas?: unknown };
      const nextIdeas = Array.isArray(resultRecord.ideas) ? (resultRecord.ideas as InspirationIdea[]) : [];
      setIdeaPages(nextIdeas.length > 0 ? [nextIdeas] : []);
      setIdeaPageIndex(0);
    } catch (generationError: any) {
      console.error("[production-studio] generateIdeas failed", {
        endpoint: "/api/content-studio",
        origin: typeof window === "undefined" ? null : window.location.origin,
        errorName: generationError?.name,
        errorMessage: generationError?.message,
        errorStack: generationError?.stack,
        responseStatus: generationError?.responseStatus ?? null,
        responseStatusText: generationError?.responseStatusText ?? null,
        responseBody: generationError?.responseBody ?? null,
        responseJson: generationError?.responseJson ?? null,
        inspirationPayload,
        error: generationError,
      });

      const message = generationError?.message ?? "Failed to generate ideas.";
      if (message.toLowerCase().includes("failed to fetch")) {
        setError("Cannot reach /api/content-studio from this page origin. Check that the Next.js server is running on the same port as the page.");
      } else {
        setError(message);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function refreshIdea(idea: InspirationIdea) {
    setRefreshingIdeaKey(idea.title);
    setError(null);

    try {
      const endpoint = "/api/content-studio";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...inspirationPayload,
          mode: "inspiration-refresh",
          ideaCount: 1,
          excludeTitles: visibleIdeas.map((entry) => entry.title),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const serverError = typeof result?.error === "string" ? result.error : null;
        throw new Error(serverError || `Failed to refresh idea (${response.status}).`);
      }

      const freshIdea = Array.isArray(result?.ideas) ? (result.ideas[0] as InspirationIdea | undefined) : undefined;

      if (!freshIdea) {
        throw new Error("Could not refresh this idea right now.");
      }

      setIdeaPages((currentPages) => currentPages.map((page, pageIndex) => {
        if (pageIndex !== ideaPageIndex) {
          return page;
        }

        return page.map((entry) => (entry.title === idea.title ? freshIdea : entry));
      }));
    } catch (refreshError: any) {
      const message = refreshError?.message ?? "Failed to refresh idea.";
      setError(message);
    } finally {
      setRefreshingIdeaKey(null);
    }
  }

  async function goToNextIdeas() {
    if (canGoToNextIdeas) {
      setIdeaPageIndex((current) => current + 1);
      return;
    }

    if (ideaSourceType === "topic" && !ideaTopic.trim()) {
      setError("Type a topic to explore ideas.");
      return;
    }

    if (ideaSourceType === "image" && !ideaImageDataUrl) {
      setError(ideaImageName ? unsupportedImageFormatMessage : "Upload a screenshot or image to explore ideas.");
      return;
    }

    if (ideaSourceType === "image" && !isSupportedIdeaImageDataUrl(ideaImageDataUrl)) {
      setError(unsupportedImageFormatMessage);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const endpoint = "/api/content-studio";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...inspirationPayload,
          excludeTitles: ideaPages.flatMap((page) => page.map((idea) => idea.title)),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const serverError = typeof result?.error === "string" ? result.error : null;
        throw new Error(serverError || `Failed to load more ideas (${response.status}).`);
      }

      const nextIdeas = Array.isArray(result?.ideas) ? (result.ideas as InspirationIdea[]) : [];

      if (nextIdeas.length === 0) {
        throw new Error("No more ideas available right now.");
      }

      setIdeaPages((currentPages) => [...currentPages, nextIdeas]);
      setIdeaPageIndex((current) => current + 1);
    } catch (nextError: any) {
      setError(nextError?.message ?? "Failed to load next ideas.");
    } finally {
      setGenerating(false);
    }
  }

  function goToPreviousIdeas() {
    if (!canGoToPreviousIdeas) {
      return;
    }

    setIdeaPageIndex((current) => current - 1);
    setError(null);
  }

  function handleIdeaImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const normalizedMimeType = file.type.toLowerCase();

    if (!supportedIdeaImageMimeTypes.has(normalizedMimeType)) {
      setIdeaImageDataUrl(null);
      setIdeaImageName(file.name);
      setError(unsupportedImageFormatMessage);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;

      if (!result) {
        setError("Could not read the uploaded image.");
        return;
      }

      setIdeaImageDataUrl(result);
      setIdeaImageName(file.name);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function copyText(text: string, key: string, errorMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      setError(errorMessage);
    }
  }

  async function copyOutput() {
    if (!generatedPackage) {
      return;
    }

    await copyText(formatPackageForCopy(generatedPackage), "package", "Failed to copy production package.");
  }

  function persistSavedItems(nextItems: SavedHistoryItem[]) {
    setSavedItems(nextItems);
    writeSavedHistory(nextItems);
  }

  function savePackage() {
    if (!generatedPackage) {
      return;
    }

    const nextItems = [
      {
        id: crypto.randomUUID(),
        kind: "content-package" as const,
        title: generatedPackage.title,
        preview: getPackagePreview(generatedPackage),
        savedAt: new Date().toISOString(),
        package: generatedPackage,
        context: {
          topic,
          contentType,
          platform,
          aspectRatio: getAspectRatioForContentType(contentType),
          tone,
          language,
          goal,
          storyStyle,
          presentationStyle,
          duration: String(durationSeconds),
          productionLevel,
          shootingEnvironment: videoType,
          equipment: [],
        },
      },
      ...savedItems,
    ].slice(0, 100);

    persistSavedItems(nextItems);
    setError(null);
  }

  function saveIdea(idea: InspirationIdea) {
    const nextItems = [
      {
        id: crypto.randomUUID(),
        kind: "idea-card" as const,
        title: idea.title,
        preview: idea.summary,
        savedAt: new Date().toISOString(),
        idea,
        context: {
          ideaWorkflow: ideaWorkflow ?? undefined,
          ideaSourceType,
          ideaType: selectedIdeaType,
          ideaTopic,
          ideaContext,
          ideaGoal,
          imageName: ideaImageName ?? undefined,
        },
      },
      ...savedItems,
    ].slice(0, 100);

    persistSavedItems(nextItems);
    setError(null);
  }

  function deleteSavedItem(itemId: string) {
    persistSavedItems(savedItems.filter((item) => item.id !== itemId));
  }

  function loadSavedItem(item: SavedHistoryItem) {
    if (item.kind === "content-package" && item.package) {
      setMode("create-content");
      setGeneratedPackage(item.package);
      setTopic(item.context?.topic ?? "");
      setContentType(normalizeStudioContentType(item.context?.contentType ?? "normal-post"));
      setPlatform(item.context?.platform ?? "facebook");
      setTone(item.context?.tone ?? "Professional");
      setLanguage(item.context?.language ?? "English");
      setGoal(item.context?.goal ?? "Engagement");
      setStoryStyle(item.context?.storyStyle ?? "Educational");
      setPresentationStyle(item.context?.presentationStyle ?? "Narration");
      const loadedDuration = Number(item.context?.duration ?? "40");
      const safeDuration = Number.isFinite(loadedDuration) ? loadedDuration : 40;
      setDurationSeconds(safeDuration);
      setSceneCount(Math.max(3, Math.min(12, Math.round(safeDuration / 8))));
      setProductionLevel(item.context?.productionLevel ?? "Professional");
      setVideoType(item.context?.shootingEnvironment ?? "AI Video");
      setError(null);
      return;
    }

    if (item.kind === "idea-card" && item.idea) {
      setMode("inspiration");
      setIdeaPages([[item.idea]]);
      setIdeaPageIndex(0);
      setIdeaSourceType(item.context?.ideaSourceType ?? "topic");
      const loadedIdeaType = item.context?.ideaType ?? "social_post";
      setIdeaType(loadedIdeaType);
      setIdeaWorkflow(item.context?.ideaWorkflow ?? mapIdeaTypeToWorkflow(loadedIdeaType));
      setIdeaTopic(item.context?.ideaTopic ?? "");
      setIdeaContext(item.context?.ideaContext ?? "");
      setIdeaGoal(normalizeExplorerGoal(item.context?.ideaGoal));
      setError(null);
    }
  }

  function handleProductionWorkspaceChange(updatedProject: ProductionWorkspaceProject) {
    const nextProject = {
      ...updatedProject,
      updatedAt: new Date().toISOString(),
    };

    setActiveProductionWorkspace(nextProject);
    saveProductionWorkspace(nextProject);
  }

  function useIdea(idea: InspirationIdea) {
    const nextWorkflow = mapIdeaTypeToWorkflow(idea.ideaType ?? "social_post");
    const workspace = createWorkspaceFromIdea(
      mapInspirationIdeaToWorkspaceIdea(idea, platform, ideaGoal, tone, storyStyle),
    );

    saveProductionWorkspace(workspace);
    setActiveProductionWorkspace(workspace);
    setIdeaWorkflow(nextWorkflow);
    setIdeaType(mapWorkflowToIdeaType(nextWorkflow));
    setTopic(`${idea.title}: ${getIdeaSummary(idea)}`);
    setContentType(mapIdeaBestFormatToContentType(idea.bestFormat));
    setGoal(mapExplorerGoalToStudioGoal(ideaGoal));
    setMode("create-content");
    setError(null);
  }

  function getIdeaSummary(idea: InspirationIdea | (Record<string, unknown> & InspirationIdea)) {
    const legacyAngle = typeof (idea as Record<string, unknown>).angle === "string"
      ? ((idea as Record<string, unknown>).angle as string)
      : "";

    return idea.summary || legacyAngle;
  }

  function handleVideoLengthPresetChange(value: string) {
    const preset = videoLengthPresets.find(
      (option) => `${option.durationSeconds}-${option.sceneCount}` === value,
    );

    if (!preset) {
      return;
    }

    setDurationSeconds(preset.durationSeconds);
    setSceneCount(preset.sceneCount);
  }

  const showingStructuredPackage = Boolean(generatedPackage && hasProductionStudioStructure(generatedPackage));
  const activeWorkflow = useMemo<"normal-post" | "video-reel" | null>(() => {
    const sourceIdeaType = activeProductionWorkspace?.sourceMetadata?.ideaType;
    const sourceBestFormat = activeProductionWorkspace?.sourceMetadata?.bestFormat;

    if (sourceIdeaType === "social_post" || sourceBestFormat === "Normal Post") {
      return "normal-post";
    }

    if (sourceIdeaType === "short_video" || sourceBestFormat === "Reel / Video") {
      return "video-reel";
    }

    return ideaWorkflow;
  }, [activeProductionWorkspace, ideaWorkflow]);
  const isNormalPostWorkspaceActive =
    mode === "create-content" &&
    Boolean(activeProductionWorkspace) &&
    (
      activeProductionWorkspace?.sourceMetadata?.ideaType === "social_post" ||
      activeProductionWorkspace?.sourceMetadata?.bestFormat === "Normal Post"
    );
  const workflowStep2Title = activeWorkflow === "normal-post"
    ? "📝 Post Workspace"
    : activeWorkflow === "video-reel"
      ? "🎬 AI Director Studio"
      : "Workspace";
  const workflowStep2Description = activeWorkflow
    ? "Workspace unlocks automatically after selecting an idea."
    : "Workspace will unlock after selecting an idea.";
  const canOpenWorkflowStep2 = Boolean(
    activeProductionWorkspace ||
    generatedPackage ||
    loadedOpportunityTitle ||
    mode === "create-content",
  );

  return (
    <div className="min-h-screen w-full px-6 py-8 text-white md:px-10 md:py-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-400">
              AI Creative Workflow
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">
              {mode === "inspiration"
                ? "Start with AI Idea Explorer to guide every content workflow"
                : mode === "create-content"
                  ? "Continue in your active workspace"
                  : "Resume from saved projects"}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              {mode === "inspiration"
                ? "AI Idea Explorer is always your first step: generate ideas, evaluate options, and move forward with one click."
                : mode === "create-content"
                  ? "The workspace follows your selected workflow automatically, so there is no second workspace decision."
                  : "Saved Projects keeps your previous ideas, drafts, and workspaces ready to continue."}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
            Always includes <span className="font-semibold">#BorneoLandGatekeeper</span> and never exceeds 5 hashtags.
          </div>
        </div>

        <WorkflowNavigator
          mode={mode}
          step2Title={workflowStep2Title}
          step2Description={workflowStep2Description}
          step2Enabled={canOpenWorkflowStep2}
          onSelectStep={(nextMode) => {
            if (nextMode === "create-content" && !canOpenWorkflowStep2) {
              return;
            }

            setMode(nextMode);
          }}
        />

        {loadedOpportunityTitle ? (
          <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
            Loaded from opportunity: <span className="font-semibold text-white">{loadedOpportunityTitle}</span>
          </div>
        ) : null}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          {mode === "create-content" ? (
            isNormalPostWorkspaceActive ? (
              <>
                <div className="flex items-center gap-3">
                  <Clapperboard className="text-yellow-400" size={22} />
                  <h2 className="text-2xl font-semibold">Content Settings</h2>
                </div>

                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Read-only inherited settings</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoField label="Goal" value={activeProductionWorkspace?.sourceMetadata?.inheritedGoal || goal} />
                      <InfoField label="Platform" value={activeProductionWorkspace?.sourceMetadata?.platform || platform} />
                      <InfoField label="Tone" value={activeProductionWorkspace?.sourceMetadata?.inheritedTone || tone} />
                      <InfoField label="Style" value={activeProductionWorkspace?.sourceMetadata?.inheritedStyle || storyStyle} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Post draft guidance</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      This workspace is focused on writing one professional post with one professional image prompt.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Clapperboard className="text-yellow-400" size={22} />
                  <h2 className="text-2xl font-semibold">Director&apos;s Desk</h2>
                </div>

                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Creative Brief</p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <SelectField label="Goal" value={goal} onChange={setGoal} options={goals.map((option) => ({ value: option, label: option }))} />
                      <SelectField label="Tone" value={tone} onChange={setTone} options={["Professional", "Bold", "Friendly", "Educational"].map((option) => ({ value: option, label: option }))} />
                      <SelectField label="Language" value={language} onChange={setLanguage} options={languages.map((option) => ({ value: option, label: option }))} />
                      <SelectField label="Story Style" value={storyStyle} onChange={setStoryStyle} options={storyStyles.map((option) => ({ value: option, label: option }))} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Platform & Output</p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <SelectField label="Platform" value={platform} onChange={setPlatform} options={platforms} />
                      <SelectField label="Content Type" value={contentType} onChange={setContentType} options={contentTypes} />
                      <SelectField label="Presentation Style" value={presentationStyle} onChange={setPresentationStyle} options={presentationStyles.map((option) => ({ value: option, label: option }))} />
                      <SelectField label="Production Level" value={productionLevel} onChange={setProductionLevel} options={productionLevels.map((option) => ({ value: option, label: option }))} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Video Settings</p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Video Length Preset</label>
                        <select
                          value={`${durationSeconds}-${sceneCount}`}
                          onChange={(event) => handleVideoLengthPresetChange(event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                        >
                          {videoLengthPresets.map((preset) => (
                            <option key={`${preset.durationSeconds}-${preset.sceneCount}`} value={`${preset.durationSeconds}-${preset.sceneCount}`}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <SelectField label="Video Type" value={videoType} onChange={setVideoType} options={videoTypes.map((option) => ({ value: option, label: option }))} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Input Source</p>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <SelectField label="Source" value={inputSource} onChange={setInputSource} options={inputSourceOptions} />
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">{inputSource === "url" ? "URL" : "Input Brief"}</label>
                        <textarea
                          value={topic}
                          onChange={(event) => setTopic(event.target.value)}
                          rows={4}
                          placeholder={inputSource === "url"
                            ? "Paste a URL to use as source context"
                            : inputSource === "saved-idea"
                              ? "Describe the saved idea you want to transform"
                              : `Describe the ${inputSource} you want to turn into a production package`}
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoCard
                    icon={<Megaphone size={18} className="text-yellow-400" />}
                    title="Production Rules"
                    body="No invented property facts. Every package includes a caption, CTA, hashtags, and copy-ready prompts for production."
                  />
                  <InfoCard
                    icon={<ImagePlay size={18} className="text-yellow-400" />}
                    title="Google Flow Ready"
                    body="Reel prompts enforce 8-second scene caps, continuity, camera direction, motion, and no text or logos."
                  />
                </div>
              </>
            )
          ) : mode === "inspiration" ? (
            <>
              <div className="flex items-center gap-3">
                <Lightbulb className="text-yellow-400" size={22} />
                <h2 className="text-2xl font-semibold">Idea Explorer</h2>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Step 0</p>
                <p className="mt-2 text-lg font-semibold text-white">Choose workflow first</p>
                <p className="mt-2 text-sm text-slate-300">
                  This selection controls the downstream idea generation path.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ideaWorkflowOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setIdeaWorkflow(option.value);
                        setIdeaType(mapWorkflowToIdeaType(option.value));
                        setError(null);
                      }}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        ideaWorkflow === option.value
                          ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-100"
                          : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-yellow-500/30"
                      }`}
                    >
                      <p>{option.label}</p>
                      <p className="mt-2 text-xs font-normal text-slate-300">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Step 1</p>
                <p className="mt-2 text-lg font-semibold text-white">Choose inspiration source</p>

                <div className="mt-4 inline-flex rounded-xl border border-slate-700 bg-slate-900/70 p-1">
                  <button
                    type="button"
                    onClick={() => setIdeaSourceType("topic")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      ideaSourceType === "topic" ? "bg-yellow-500 text-slate-950" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Type a topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdeaSourceType("image")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      ideaSourceType === "image" ? "bg-yellow-500 text-slate-950" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Upload screenshot/image
                  </button>
                </div>

                {ideaSourceType === "topic" ? (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-200">What should we explore?</label>
                    <textarea
                      value={ideaTopic}
                      onChange={(event) => setIdeaTopic(event.target.value)}
                      rows={6}
                      placeholder="Example: First-time buyers asking how to safely evaluate land listings in Sabah"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white placeholder:text-slate-500"
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm font-medium text-slate-200">Upload a screenshot or image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdeaImageUpload}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-yellow-500 file:px-3 file:py-2 file:font-semibold file:text-slate-950"
                    />
                    {ideaImageName ? (
                      <p className="text-sm text-slate-300">Selected: {ideaImageName}</p>
                    ) : null}
                    {ideaImageDataUrl ? (
                      <img src={ideaImageDataUrl} alt="Uploaded inspiration" className="max-h-56 w-full rounded-2xl border border-slate-800 object-cover" />
                    ) : null}
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-lg font-semibold text-white">✨ Additional Context (Optional)</p>
                <p className="mt-2 text-sm text-slate-300">
                  Help AI understand your image or topic. Add details that AI cannot know from the image alone.
                </p>
                <div className="mt-4">
                  <textarea
                    value={ideaContext}
                    onChange={(event) => setIdeaContext(event.target.value.slice(0, maxIdeaContextLength))}
                    rows={8}
                    placeholder={"Example:\nThis is a parcel land in Kundasang.\nAsking price RM160,000.\nAbout 1 acre.\nSuitable for homestay.\nFronting gravel road.\nBeautiful Mount Kinabalu view.\nOwner willing to negotiate.\nTarget investors."}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
                  <p>Optional, but highly recommended for more accurate ideas.</p>
                  <p>{ideaContext.length} / {maxIdeaContextLength}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Step 2</p>
                <p className="mt-2 text-lg font-semibold text-white">Workflow confirmation</p>
                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                  {ideaWorkflow
                    ? `Active workflow: ${getIdeaWorkflowLabel(ideaWorkflow)} (${getIdeaTypeLabel(selectedIdeaType)} generation mode).`
                    : "Select a workflow in Step 0 before exploring ideas."}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-300">Step 3</p>
                <p className="mt-2 text-lg font-semibold text-white">Choose goal</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ideaExplorerGoals.map((goalOption) => (
                    <button
                      key={goalOption.value}
                      type="button"
                      onClick={() => setIdeaGoal(goalOption.value)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        ideaGoal === goalOption.value
                          ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-100"
                          : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-yellow-500/30"
                      }`}
                    >
                      {goalOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={<Lightbulb size={18} className="text-yellow-400" />}
                  title="Step 4"
                  body="Click Explore Ideas to get 10 easy-to-scan cards for the selected workflow."
                />
                <InfoCard
                  icon={<Megaphone size={18} className="text-yellow-400" />}
                  title="Then"
                  body="Use Explore on any card to open the right workspace instantly."
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <FolderClock className="text-yellow-400" size={22} />
                <h2 className="text-2xl font-semibold">Saved History</h2>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={<FileVideo size={18} className="text-yellow-400" />}
                  title="Local Only"
                  body="Saved items live in this browser only through localStorage. They are not synced across devices or projects."
                />
                <InfoCard
                  icon={<FolderClock size={18} className="text-yellow-400" />}
                  title="Reusable Drafts"
                  body="Load saved packages back into Production Studio or reload saved idea cards into Inspiration without touching the database."
                />
              </div>
            </>
          )}

          {error ? (
            <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {mode === "create-content" ? (
              <button
                type="button"
                onClick={generateContent}
                disabled={generating}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-yellow-500 px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={20} />
                {generating ? "Generating..." : isNormalPostWorkspaceActive ? "Generate Post" : "Generate Production Package"}
              </button>
            ) : mode === "inspiration" ? (
              <>
                <button
                  type="button"
                  onClick={generateIdeas}
                  disabled={generating || !ideaWorkflow}
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles size={18} />
                  {generating ? "Exploring..." : "Explore Ideas"}
                </button>

                <button
                  type="button"
                  onClick={goToPreviousIdeas}
                  disabled={!canGoToPreviousIdeas || generating}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Previous 10
                </button>

                <button
                  type="button"
                  onClick={goToNextIdeas}
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? "Loading..." : "Explore More Ideas"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSavedItems(readSavedHistory())}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
              >
                <RefreshCw size={18} />
                Refresh Saved Items
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                {mode === "create-content" ? (
                  isNormalPostWorkspaceActive ? <ClipboardList className="text-yellow-400" size={22} /> : <FileVideo className="text-yellow-400" size={22} />
                ) : mode === "inspiration" ? (
                  <Lightbulb className="text-yellow-400" size={22} />
                ) : (
                  <FolderClock className="text-yellow-400" size={22} />
                )}
                <h2 className="text-2xl font-semibold">
                  {mode === "create-content"
                    ? isNormalPostWorkspaceActive ? "Post Draft" : "Production Package"
                    : mode === "inspiration" ? "Idea Explorer" : "Saved Items"}
                </h2>
              </div>
              {mode === "create-content" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {isNormalPostWorkspaceActive ? (
                    <>
                      <StatusBadge label="Post Workspace" tone="gold" />
                      <StatusBadge label="Single Image Prompt" tone="slate" />
                    </>
                  ) : (
                    <>
                      <StatusBadge label="Production Package" tone="gold" />
                      <StatusBadge label="Google Flow Ready" tone="slate" />
                      <StatusBadge label="8 sec max" tone="slate" />
                    </>
                  )}
                </div>
              ) : null}
              <p className="mt-3 text-sm text-slate-400">
                {mode === "create-content"
                  ? isNormalPostWorkspaceActive
                    ? "Post draft workspace with locked content settings and a single professional image prompt."
                    : "Output is structured for direct copy, Google Flow prompt generation, and production handoff."
                  : mode === "inspiration"
                    ? "Simple flow: add topic or screenshot, choose a goal, explore ideas, then open the right workspace."
                    : "Review saved idea cards and generated production packages stored in this browser."}
              </p>
            </div>

            {mode === "create-content" && !isNormalPostWorkspaceActive ? (
              <button
                type="button"
                onClick={copyOutput}
                disabled={!generatedPackage}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 max-md:w-full"
              >
                <Copy size={16} />
                {copiedKey === "package" ? "Copied" : "Copy Entire Production Package"}
              </button>
            ) : null}
          </div>

          {mode === "create-content" ? (
            activeProductionWorkspace ? (
              <div className="mt-6">
                <ProductionWorkspaceShell
                  project={activeProductionWorkspace}
                  onChange={handleProductionWorkspaceChange}
                />
              </div>
            ) : !generatedPackage ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                {isNormalPostWorkspaceActive
                  ? "Use Idea Explorer to select an idea, then continue editing your post draft in Post Workspace."
                  : "Set up the Director&apos;s Desk on the left, then generate a complete production package."}
              </div>
            ) : showingStructuredPackage ? (
              <div className="mt-6 space-y-5">
                <div className="overflow-hidden rounded-[28px] border border-yellow-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(234,179,8,0.16),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-5 shadow-[0_28px_90px_rgba(2,6,23,0.42)] md:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-yellow-400/90">Production Document</p>
                      <h3 className="mt-3 text-2xl font-semibold leading-tight text-white md:text-3xl">{generatedPackage.title}</h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                        A polished production package with pre-structured creative direction, scene guidance, and ready-to-copy prompts.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label="Production Package" tone="gold" />
                      <StatusBadge label="Google Flow Ready" tone="slate" />
                      <StatusBadge label={generatedPackage.contentType} tone="slate" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetaPill icon={<Clapperboard size={14} />} label={generatedPackage.contentType} />
                    <MetaPill icon={<Languages size={14} />} label={generatedPackage.platform} />
                    <MetaPill icon={<Target size={14} />} label={generatedPackage.aspectRatio} />
                    <MetaPill icon={<ClipboardList size={14} />} label={generatedPackage.outputMode ?? "Production Package"} />
                  </div>
                </div>

                <CopyCard
                  title="Creative Brief"
                  copyLabel="Copy Creative Brief"
                  copied={copiedKey === "creative-brief"}
                  onCopy={() => copyText(formatCreativeBriefForCopy(generatedPackage), "creative-brief", "Failed to copy creative brief.")}
                >
                  <FieldGrid
                    items={[
                      { label: "Objective", value: generatedPackage.creativeBrief?.objective ?? "" },
                      { label: "Target Audience", value: generatedPackage.creativeBrief?.targetAudience ?? "" },
                      { label: "Key Message", value: generatedPackage.creativeBrief?.keyMessage ?? "" },
                      { label: "Story Style", value: generatedPackage.creativeBrief?.storyStyle ?? "" },
                      { label: "Presentation Style", value: generatedPackage.creativeBrief?.presentationStyle ?? "" },
                      { label: "Estimated Production Time", value: generatedPackage.creativeBrief?.estimatedProductionTime ?? "" },
                    ]}
                  />
                </CopyCard>

                <CopyCard
                  title="Visual Direction"
                  copyLabel="Copy Visual Direction"
                  copied={copiedKey === "visual-direction"}
                  onCopy={() => copyText(formatVisualDirectionForCopy(generatedPackage), "visual-direction", "Failed to copy visual direction.")}
                >
                  <FieldGrid
                    items={[
                      { label: "Mood", value: generatedPackage.visualDirection?.mood ?? "" },
                      { label: "Lighting", value: generatedPackage.visualDirection?.lighting ?? "" },
                      { label: "Colour Palette", value: generatedPackage.visualDirection?.colourPalette ?? "" },
                      { label: "Camera Style", value: generatedPackage.visualDirection?.cameraStyle ?? "" },
                      { label: "Atmosphere", value: generatedPackage.visualDirection?.atmosphere ?? "" },
                    ]}
                  />
                </CopyCard>

                <CopyCard
                  title="Production Checklist"
                  eyebrow="On-set readiness"
                  copyLabel="Copy Production Checklist"
                  copied={copiedKey === "production-checklist"}
                  onCopy={() => copyText(formatProductionChecklistForCopy(generatedPackage), "production-checklist", "Failed to copy production checklist.")}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {(generatedPackage.productionChecklist ?? []).map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm leading-6 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <span className="font-semibold text-yellow-400">✓</span> {item}
                      </div>
                    ))}
                  </div>
                </CopyCard>

                <CopyCard
                  title="Storyboard"
                  eyebrow="Narrative flow"
                  copyLabel="Copy Storyboard"
                  copied={copiedKey === "storyboard"}
                  onCopy={() => copyText(formatStoryboardForCopy(generatedPackage), "storyboard", "Failed to copy storyboard.")}
                >
                  <div className="space-y-3">
                    {(generatedPackage.storyboard ?? []).map((scene, index) => (
                      <div key={`${scene.sceneNumber}-${scene.summary}`} className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-sm font-semibold text-yellow-300">
                            {scene.sceneNumber}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Scene {scene.sceneNumber}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-200">{scene.summary}</p>
                          </div>
                        </div>
                        {index < (generatedPackage.storyboard?.length ?? 0) - 1 ? (
                          <p className="mt-3 pl-14 text-yellow-400">↓</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CopyCard>

                <div className="rounded-[28px] border border-slate-800 bg-slate-950 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.25)] md:p-6">
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="text-yellow-400" size={20} />
                      <div>
                        <h3 className="text-xl font-semibold text-white md:text-2xl">Production Board</h3>
                        <p className="text-sm leading-6 text-slate-400">One scene card per production beat with copy-ready prompts.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label="Google Flow Ready" tone="slate" />
                      <StatusBadge label="8 sec max" tone="gold" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    {(generatedPackage.scenes ?? []).map((scene) => (
                      <div key={scene.sceneNumber} className="overflow-hidden rounded-[26px] border border-slate-800 bg-[linear-gradient(180deg,rgba(30,41,59,0.72),rgba(2,6,23,0.88))] shadow-[0_16px_50px_rgba(2,6,23,0.24)]">
                        <div className="border-b border-slate-800/80 bg-slate-950/60 px-4 py-4 md:px-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-300">
                                  Scene {scene.sceneNumber}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
                                  <Clock3 size={12} className="text-yellow-400" />
                                  {getSceneDurationBadge(scene.estimatedDuration)}
                                </span>
                              </div>
                              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                                {scene.purpose}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyText(formatSceneForCopy(scene), `scene-${scene.sceneNumber}`, "Failed to copy scene.")}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white max-md:w-full"
                            >
                              <Copy size={16} />
                              {copiedKey === `scene-${scene.sceneNumber}` ? "Copied" : "Copy Entire Scene"}
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
                          <div className="space-y-4">
                            <InfoPanel title="Purpose" value={scene.purpose} />
                            <InfoPanel title="Director Notes" value={scene.directorNotes} />
                            <div className="rounded-2xl border border-dashed border-yellow-500/20 bg-slate-950/80 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Thumbnail Placeholder</p>
                                <StatusBadge label="Hero Frame" tone="slate" />
                              </div>
                              <div className="mt-3 flex min-h-32 items-center justify-center rounded-2xl border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(30,41,59,0.65))] px-4 py-5 text-center text-sm font-medium text-slate-300">
                                {scene.thumbnailPlaceholder}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Image Prompt</p>
                                  <StatusBadge label="Visual" tone="slate" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyText(scene.imagePrompt, `scene-image-${scene.sceneNumber}`, "Failed to copy image prompt.")}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white max-md:w-full"
                                >
                                  <Copy size={16} />
                                  {copiedKey === `scene-image-${scene.sceneNumber}` ? "Copied" : "Copy Image Prompt"}
                                </button>
                              </div>
                              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200 md:text-[15px]">{scene.imagePrompt}</div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Video Prompt</p>
                                  <StatusBadge label="Motion" tone="slate" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyText(scene.videoPrompt, `scene-video-${scene.sceneNumber}`, "Failed to copy video prompt.")}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white max-md:w-full"
                                >
                                  <Copy size={16} />
                                  {copiedKey === `scene-video-${scene.sceneNumber}` ? "Copied" : "Copy Video Prompt"}
                                </button>
                              </div>
                              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200 md:text-[15px]">{scene.videoPrompt}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-800 bg-slate-950 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.25)] md:p-6">
                  <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <Megaphone className="text-yellow-400" size={20} />
                    <div>
                      <h3 className="text-xl font-semibold text-white md:text-2xl">Final Deliverables</h3>
                      <p className="text-sm leading-6 text-slate-400">Caption, CTA, and hashtags with dedicated copy actions.</p>
                    </div>
                    <StatusBadge label="Publish Ready" tone="gold" />
                  </div>

                  <div className="space-y-4">
                    <PromptCard
                      title="Caption"
                      badge="Primary Copy"
                      value={generatedPackage.caption ?? ""}
                      copyLabel="Copy Caption"
                      copied={copiedKey === "caption"}
                      onCopy={() => copyText(generatedPackage.caption ?? "", "caption", "Failed to copy caption.")}
                    />
                    <PromptCard
                      title="CTA"
                      badge="Action"
                      value={generatedPackage.cta ?? ""}
                      copyLabel="Copy CTA"
                      copied={copiedKey === "cta"}
                      onCopy={() => copyText(generatedPackage.cta ?? "", "cta", "Failed to copy CTA.")}
                    />
                    <PromptCard
                      title="Hashtags"
                      badge="Distribution"
                      value={generatedPackage.hashtags ?? ""}
                      copyLabel="Copy Hashtags"
                      copied={copiedKey === "hashtags"}
                      onCopy={() => copyText(generatedPackage.hashtags ?? "", "hashtags", "Failed to copy hashtags.")}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  Legacy saved package loaded. New generations use the full Production Studio layout below.
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h3 className="text-xl font-semibold text-white">{generatedPackage.title}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MetaPill icon={<Clapperboard size={14} />} label={generatedPackage.contentType} />
                    <MetaPill icon={<Languages size={14} />} label={generatedPackage.platform} />
                    <MetaPill icon={<Target size={14} />} label={generatedPackage.aspectRatio} />
                  </div>
                </div>

                {(generatedPackage.sections ?? []).map((section) => (
                  <div key={section.label} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{section.label}</p>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{section.value}</div>
                  </div>
                ))}
              </div>
            )
          ) : mode === "inspiration" ? (
            visibleIdeas.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Share a topic, screenshot, or image and let Gatekeeper AI generate professional content ideas.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                  Showing ideas {ideaPageIndex * 10 + 1}-{ideaPageIndex * 10 + visibleIdeas.length} | Goal: {getGoalLabel(ideaGoal)} | Workflow: {ideaWorkflow ? getIdeaWorkflowLabel(ideaWorkflow) : "Not selected"} | Type: {getIdeaTypeLabel(selectedIdeaType)}
                </div>

                <div className="grid gap-4">
                {visibleIdeas.map((idea, index) => {
                  const recommendation = getIdeaRecommendationScore(idea);
                  const recommendationReason = recommendation.source === "engagement"
                    ? `Highest engagement potential in this batch (${Math.round(recommendation.score)}/100).`
                    : recommendation.source === "potential"
                      ? `Highest potential score in this batch (${Math.round(recommendation.score)}/100).`
                      : recommendation.source === "confidence"
                        ? `Highest confidence score in this batch (${Math.round(recommendation.score)}/100).`
                        : `Best available fit for your current ${getGoalLabel(ideaGoal)} goal.`;
                  const isRecommended = index === recommendedIdeaIndex;
                  const isNormalPostIdea =
                    idea.ideaType === "social_post" ||
                    idea.bestFormat === "Normal Post" ||
                    selectedIdeaType === "social_post";
                  const visualConcept = getNormalPostVisualConcept(idea, platform);

                  return (
                  <div key={`${idea.title}-${idea.summary}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-[0_14px_40px_rgba(2,6,23,0.18)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        {isRecommended ? (
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-yellow-200">
                            <span>🏆 AI Recommended</span>
                          </div>
                        ) : null}
                        <h3 className="text-xl font-semibold text-white">{idea.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{getIdeaSummary(idea)}</p>
                        {isRecommended ? (
                          <p className="mt-3 text-xs leading-6 text-yellow-100/90">{recommendationReason}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => useIdea(idea)}
                          className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
                        >
                          <Sparkles size={16} />
                          Use This Idea
                        </button>

                        <button
                          type="button"
                          onClick={() => refreshIdea(idea)}
                          disabled={refreshingIdeaKey === idea.title}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RefreshCw size={16} className={refreshingIdeaKey === idea.title ? "animate-spin" : undefined} />
                          {refreshingIdeaKey === idea.title ? "Refreshing..." : "Refresh Idea"}
                        </button>

                        <button
                          type="button"
                          onClick={() => saveIdea(idea)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
                        >
                          <FolderClock size={16} />
                          Save Idea
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <IdeaField label="Target Audience" value={idea.targetAudience || "General property audience"} />
                      <IdeaField label="Engagement Potential" value={`${Math.round(Number.isFinite(Number(idea.engagementPotential)) ? Number(idea.engagementPotential) : idea.potentialScore ?? 70)}/100`} />
                      <IdeaField label="Estimated Difficulty" value={idea.difficulty || "Medium"} />
                      <IdeaField label="Estimated Time" value={idea.productionTime || idea.estimatedProductionTime || "Standard"} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Why This Idea Works</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{idea.whyThisWorks || idea.whyThisIdea || "Strong fit for your selected goal and source."}</p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Professional Visual Concept</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {isNormalPostIdea
                          ? visualConcept
                          : "Visual concept preview is optimized for Normal Post ideas. Select a Normal Post workflow for image-first concept guidance."}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Preview concept only. Final image prompt is generated later in Post Workspace.</p>
                    </div>
                  </div>
                );})}
                </div>
              </div>
            )
          ) : savedItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
              Save a generated production package or idea card to build local history in this browser.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {savedItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                        <span>{item.kind === "content-package" ? "Production Studio" : "Inspiration"}</span>
                        <span>{formatSavedDate(item.savedAt)}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{item.preview}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => loadSavedItem(item)}
                        className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
                      >
                        <Sparkles size={16} />
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedItem(item.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-red-500/40 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

function CopyCard({
  title,
  eyebrow,
  copyLabel,
  copied,
  onCopy,
  children,
}: {
  title: string;
  eyebrow?: string;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-slate-800 bg-slate-950 p-5 shadow-[0_16px_50px_rgba(2,6,23,0.18)] md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-400/80">{eyebrow}</p> : null}
          <h3 className="mt-2 text-xl font-semibold text-white md:text-2xl">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white max-md:w-full"
        >
          <Copy size={16} />
          {copied ? "Copied" : copyLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function PromptCard({
  title,
  badge,
  value,
  copyLabel,
  copied,
  onCopy,
}: {
  title: string;
  badge?: string;
  value: string;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
          {badge ? <StatusBadge label={badge} tone="slate" /> : null}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white max-md:w-full"
        >
          <Copy size={16} />
          {copied ? "Copied" : copyLabel}
        </button>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200 md:text-[15px]">{value}</div>
    </div>
  );
}

function FieldGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
          <p className="mt-3 text-sm leading-7 text-slate-200 md:text-[15px]">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function InfoPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200 md:text-[15px]">{value}</p>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

function IdeaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{value}</p>
    </div>
  );
}

function MetaPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      {icon}
      <span className="capitalize">{label.replace(/-/g, " ")}</span>
    </div>
  );
}

function StatusBadge({ label, tone = "slate" }: { label: string; tone?: "slate" | "gold" }) {
  return (
    <span
      className={tone === "gold"
        ? "inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200"
        : "inline-flex items-center rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
      }
    >
      {label}
    </span>
  );
}