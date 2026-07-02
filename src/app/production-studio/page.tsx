"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, ArrowRight, BadgeCheck, Check, RefreshCw, Sparkles, Star, Trash2 } from "lucide-react";
import {
  createProductionStudioRecordId,
  createProductionStudioVersionSnapshot,
  loadProductionStudioRecord,
  saveProductionStudioRecord,
  type ProductionStudioBrief,
  type ProductionStudioCreativeDirection,
  type ProductionStudioGeneratedImageAsset,
  type ProductionStudioGenerationMetadata,
  type ProductionStudioFutureAssets,
  type ProductionStudioMasterImageSelection,
  type ProductionStudioReferenceItem,
  type ProductionStudioSaveRecord,
  type ProductionStudioScene,
  type ProductionStudioStepId,
} from "@/lib/production-studio/saveStorage";
import {
  buildProductionBriefFromBridge,
  loadWorkflowBridgeRecord,
  saveWorkflowBridgeRecord,
  type WorkflowBridgeProductionBrief,
  type WorkflowBridgeRecord,
} from "@/lib/workflowBridge";

type ScenePlan = ProductionStudioScene;

type GeneratedImageWorkspaceItem = {
  id: string;
  label: string;
  provider: string;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  imageUrl: string;
  universalPrompt: string;
  aiUsed: string;
  resolution: string;
  aspectRatio: string;
  promptVersion: string;
  generationTime: string;
  createdAt: string;
  productionScore: number;
  favorite: boolean;
  isMaster: boolean;
};

type CompareSelection = [string | null, string | null];

type AnimationRenderer = "google-flow" | "sora-2" | "sora-2-pro";

type AnimationRendererOption = {
  id: AnimationRenderer;
  label: string;
  badge?: string;
  description: string;
  externalUrl: string;
  optimizationCopy: string;
};

type AnimationDirectorInput = {
  sceneId: string;
  sceneTitle: string;
  sceneLabel: string;
  masterImageId?: string;
  masterImageUrl?: string;
  universalPrompt: string;
  continuityNotes?: string;
  productionBrief?: string;
  sceneInfo?: string;
};

type AnimationPromptAnalysis = {
  cameraMotion: string;
  subjectMotion: string;
  environmentalMotion: string;
  continuitySafeguards: string;
};

type VoicePersona = "narrator-mode" | "executive-tone" | "dynamic-pace";

type PublishingPlatform = "facebook-core" | "instagram-reels" | "tiktok-business";

const animationRendererOptions: AnimationRendererOption[] = [
  {
    id: "google-flow",
    label: "Google Flow",
    badge: "Recommended",
    description: "Google Flow cinematic motion pipeline",
    externalUrl: "https://labs.google/fx/tools/flow",
    optimizationCopy: "Optimizing motion syntax for Google Flow cinematic scene continuity.",
  },
  {
    id: "sora-2",
    label: "OpenAI Sora 2",
    description: "OpenAI Sora 2 balanced cinematic generation",
    externalUrl: "https://openai.com/sora",
    optimizationCopy: "Optimizing motion direction for OpenAI Sora 2 balanced cinematic generation.",
  },
  {
    id: "sora-2-pro",
    label: "OpenAI Sora 2 Pro",
    description: "OpenAI Sora 2 Pro high-detail cinematic generation",
    externalUrl: "https://openai.com/sora",
    optimizationCopy: "Optimizing high-detail cinematic direction for OpenAI Sora 2 Pro.",
  },
];

const defaultAnimationAnalysis: AnimationPromptAnalysis = {
  cameraMotion: "Slow cinematic push-in with subtle parallax and controlled tracking movement.",
  subjectMotion: "Preserve subject identity while adding natural micro-movement and scene-appropriate action.",
  environmentalMotion: "Introduce wind, atmospheric depth, light shifts, and ambient movement without changing composition.",
  continuitySafeguards: "Maintain approved master image composition, visual identity, color palette, and scene continuity.",
};

const defaultNarrationScript = "A stunning interior overview showcasing the rich timber textures of the Tamparuli courtyard, where architectural heritage meets modern land development potential...";

const acousticBackgroundPrompt = "Ambient acoustic string arrangement, low-fi background resonance, subtle Bornean nature soundscape layer, slow pacing, premium cinematic mood.";

const defaultPublishingCaptionBlueprint = [
  "Land Asset Spotlight | Sabah Region",
  "",
  "This curated land opportunity combines access, planning clarity, and long-term value potential for buyers evaluating strategic development zones.",
  "",
  "Category Marker: [Residential / Commercial / Mixed-Use]",
  "Regional Hashtag Cluster: [#SabahLand #BorneoProperty #[DistrictTag] #[CategoryTag]]",
  "Call-To-Action: DM for location brief and verification checklist.",
].join("\n");

function resolvePublishingPlatformLabel(platform: PublishingPlatform) {
  if (platform === "facebook-core") {
    return "Facebook Core";
  }

  if (platform === "instagram-reels") {
    return "Instagram Reels";
  }

  return "TikTok Business";
}

function buildInitialPublishingPayload(record: WorkflowBridgeRecord | null): string {
  return (
    record?.p4_production?.productionManifestMarkdown ||
    record?.p4_production?.approvedCaption ||
    record?.p3_viralReview?.approvedCaption ||
    record?.p2_content?.caption ||
    record?.contentCreator?.caption ||
    defaultPublishingCaptionBlueprint
  );
}

function buildManifestPreview(manifest: string) {
  const trimmed = manifest.trim();
  if (!trimmed) {
    return "No Phase 4 production manifest found.";
  }

  if (trimmed.length <= 1600) {
    return trimmed;
  }

  return `${trimmed.slice(0, 1600)}\n\nManifest continues in the main payload editor.`;
}

const sceneTitleFallbackById: Record<string, string> = {
  "scene-4": "The Tamparuli Courtyard",
};

function buildAnimationPrompt(input: AnimationDirectorInput, renderer: AnimationRenderer) {
  const rendererLabel = animationRendererOptions.find((option) => option.id === renderer)?.label ?? "Google Flow";
  const rendererOptimization = animationRendererOptions.find((option) => option.id === renderer)?.optimizationCopy
    ?? "Optimizing motion syntax for cinematic scene continuity.";

  const analysis = {
    ...defaultAnimationAnalysis,
    cameraMotion:
      renderer === "sora-2-pro"
        ? "Slow cinematic push-in with deliberate dolly stability, subtle parallax depth, and precision-framed tracking movement."
        : renderer === "sora-2"
          ? "Slow cinematic push-in with balanced tracking movement and clean directional stability."
          : "Slow cinematic push-in with subtle parallax and controlled tracking movement.",
    subjectMotion:
      renderer === "sora-2-pro"
        ? "Preserve subject identity and wardrobe continuity while introducing nuanced facial micro-expression and controlled body movement."
        : "Preserve subject identity while adding natural micro-movement and scene-appropriate action.",
    environmentalMotion:
      renderer === "google-flow"
        ? "Introduce ambient wind layers, depth cues, and soft lighting evolution while preserving approved composition anchors."
        : "Introduce wind, atmospheric depth, light shifts, and ambient movement without changing composition.",
  } satisfies AnimationPromptAnalysis;

  const prompt = [
    `Renderer: ${rendererLabel}`,
    `Scene: ${input.sceneLabel} - ${input.sceneTitle}`,
    input.masterImageId ? `Approved Master Image ID: ${input.masterImageId}` : "",
    input.masterImageUrl ? `Approved Master Image Reference URL: ${input.masterImageUrl}` : "",
    `Scene Visual Reference: ${input.universalPrompt}`,
    input.sceneInfo ? `Scene Info: ${input.sceneInfo}` : "",
    input.productionBrief ? `Production Brief Context: ${input.productionBrief}` : "",
    `Renderer Optimization: ${rendererOptimization}`,
    `Camera Motion: ${analysis.cameraMotion}`,
    `Subject Motion: ${analysis.subjectMotion}`,
    `Environmental Motion: ${analysis.environmentalMotion}`,
    "Lighting Behavior: Preserve approved lighting intent and apply subtle cinematic transitions only.",
    `Continuity Safeguards: ${analysis.continuitySafeguards}`,
    input.continuityNotes ? `Continuity Notes: ${input.continuityNotes}` : "",
    "Do not add new text overlays unless already present in the approved scene context.",
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  return { prompt, analysis };
}

function extractSceneNumber(sceneLabel: string) {
  const match = sceneLabel.match(/\d+/);
  return match ? match[0] : null;
}

const steps: Array<{ id: ProductionStudioStepId; label: string; question: string }> = [
  { id: "creative-brief", label: "Production Brief", question: "What are we producing?" },
  { id: "scene-planner", label: "Scene Planner", question: "How will the story flow?" },
  { id: "visual-prompt-builder", label: "Visual Prompt Builder", question: "What should each scene look like?" },
  { id: "animation-prompt-builder", label: "Animation Prompt Builder", question: "How should each scene move?" },
  { id: "review", label: "Review", question: "Is the plan coherent and complete?" },
  { id: "export-prompts", label: "Export Prompts", question: "What should we export for production?" },
];

const mockBrief = {
  projectTitle: "Land Buying Checklist",
  platform: "TikTok / Instagram Reels",
  audience: "First-time land buyers in Sabah",
  goal: "Educate and build trust with practical due diligence guidance",
  tone: "Calm, expert, practical",
  hook: "Before you buy land, check these 5 things first.",
  cta: "Save this checklist and share with a friend who is buying land.",
  targetVideoLength: "45-60 seconds",
};

const mockScenes: ScenePlan[] = [
  {
    id: "scene-1",
    sceneLabel: "Scene 1",
    beat: "Hook",
    purpose: "Grab attention with a high-stakes warning before purchase.",
    duration: "0-8s",
    visual: "Creator at a roadside lot with title overlay: '5 Land Checks Before You Buy'",
    camera: "Medium talking-head shot",
    movement: "Slow push-in",
    imagePrompt:
      "Professional Malaysian roadside land lot, local vegetation, confident presenter in smart-casual outfit, natural daylight, cinematic composition, text-safe framing, 9:16",
    animationPrompt:
      "Start with medium shot of presenter at roadside lot, slow forward camera push, subtle wind movement in trees, confident hand gesture on key words, clean educational pacing",
  },
  {
    id: "scene-2",
    sceneLabel: "Scene 2",
    beat: "Mistake",
    purpose: "Show a common error buyers make when skipping title checks.",
    duration: "8-20s",
    visual: "Close-up of land title document with highlighted risk notes",
    camera: "Top-down close shot",
    movement: "Static with controlled hand movement",
    imagePrompt:
      "Top-down desk shot with Malaysian land title document, highlighted warning marks, pen and notepad, neutral lighting, realistic detail, educational style, 9:16",
    animationPrompt:
      "Static top-down composition, hand enters frame to point at highlighted title section, slight paper movement, timed pauses for readability, documentary pacing",
  },
  {
    id: "scene-3",
    sceneLabel: "Scene 3",
    beat: "Example",
    purpose: "Give one realistic due diligence example with practical verification steps.",
    duration: "20-35s",
    visual: "Planner checklist with map screenshot and zoning label",
    camera: "Over-shoulder shot",
    movement: "Gentle lateral slide",
    imagePrompt:
      "Over-shoulder planner desk with checklist, local area map screenshot, zoning label callout, neat stationery, warm neutral color palette, structured composition, 9:16",
    animationPrompt:
      "Over-shoulder angle, slow side slide across checklist items, cursor-like pointer marks completed checks, soft ambient motion, clear beat transitions",
  },
  {
    id: "scene-4",
    sceneLabel: "Scene 4",
    beat: "Solution + CTA",
    purpose: "Deliver the final checklist framing and clear action for the viewer.",
    duration: "35-55s",
    visual: "Presenter returns on screen with final checklist bullets and CTA",
    camera: "Medium-wide presenter shot",
    movement: "Locked shot with slight subject movement",
    imagePrompt:
      "Presenter in outdoor setting with final checklist bullet overlay, approachable professional expression, balanced daylight, strong readability zones, clean background, 9:16",
    animationPrompt:
      "Medium-wide locked frame, presenter speaks with clear hand cues, checklist bullets animate in one-by-one, final CTA highlight pulse, concise closing rhythm",
  },
];

const sceneDirectorGuidance: Record<
  string,
  {
    title: string;
    goal: string;
    viewerEmotion: Array<"Curiosity" | "Trust" | "Fear" | "Confidence" | "Relief">;
    narration: string;
    visualDescription: string;
    animationChecklist: string[];
    directorNotes: string;
  }
> = {
  "scene-1": {
    title: "Opening Hook",
    goal: "Capture attention within the first three seconds.",
    viewerEmotion: ["Curiosity", "Trust"],
    narration: "Before buying land...\n\nthere are five things\n\nyou absolutely must check.",
    visualDescription:
      "Drone slowly approaches the roadside lot during sunrise.\n\nTitle fades in while morning haze frames the location.",
    animationChecklist: ["Grass moving", "Trees swaying", "Clouds drifting", "Birds flying", "Slow camera push"],
    directorNotes:
      "Keep the opening rhythm energetic.\n\nHold the title long enough for readability, then transition quickly into the risk setup.",
  },
  "scene-2": {
    title: "Problem Reveal",
    goal: "Show the real risk when title checks are skipped.",
    viewerEmotion: ["Fear", "Trust"],
    narration: "Most buyers lose leverage\n\nbecause they verify too late.\n\nThe title check must come first.",
    visualDescription:
      "Top-down view of a title document with highlighted risk lines.\n\nA hand points to critical sections one by one.",
    animationChecklist: ["Paper movement", "Hand pointer motion", "Highlight emphasis", "Subtle shadow drift"],
    directorNotes:
      "Keep this scene tight and factual.\n\nAvoid over-explaining; let the document visual carry authority.",
  },
  "scene-3": {
    title: "Explanation",
    goal: "Translate due diligence into practical, step-by-step checks.",
    viewerEmotion: ["Curiosity", "Confidence"],
    narration: "Use a simple checklist:\n\nverify zoning, access, and restrictions\n\nbefore committing any payment.",
    visualDescription:
      "Over-shoulder planning desk with checklist and zoning map callout.\n\nEach check is marked in sequence for clarity.",
    animationChecklist: ["Checklist tick motion", "Cursor glide", "Map callout pulse", "Gentle side camera slide"],
    directorNotes:
      "Make this the clarity scene.\n\nEvery visual beat should reduce confusion and build decision confidence.",
  },
  "scene-4": {
    title: "Solution + Call To Action",
    goal: "Close with confidence and one clear action.",
    viewerEmotion: ["Confidence", "Relief"],
    narration: "Follow this checklist first.\n\nSave it now and share it\n\nwith someone planning to buy land.",
    visualDescription:
      "Presenter returns on screen with final checklist bullets.\n\nClosing CTA lands with a clean, readable on-screen prompt.",
    animationChecklist: ["Bullet reveal sequence", "Presenter hand cues", "CTA pulse", "Stable camera lock"],
    directorNotes:
      "End with authority and calm.\n\nDo not rush the CTA; this is the conversion moment.",
  },
};

const sceneVisualDirection: Record<
  string,
  {
    visualConcept: string;
    mood: string[];
    composition: string;
    lens: string;
    lighting: string;
    colorPalette: string;
    cameraPosition: string;
  }
> = {
  "scene-1": {
    visualConcept:
      "The opening frame should feel premium and immediately trustworthy, signaling high-value guidance before the audience decides to keep watching.",
    mood: ["Premium", "Trustworthy", "Urgent"],
    composition: "Medium Shot",
    lens: "35mm",
    lighting: "Golden Hour",
    colorPalette: "Warm Earth",
    cameraPosition: "Eye Level",
  },
  "scene-2": {
    visualConcept:
      "This scene should feel investigative and serious, making the viewer sense the cost of missing critical checks in a real transaction.",
    mood: ["Serious", "Focused", "Credible"],
    composition: "Top Down",
    lens: "50mm",
    lighting: "Soft Morning",
    colorPalette: "Neutral",
    cameraPosition: "Ground Low",
  },
  "scene-3": {
    visualConcept:
      "The frame should communicate clarity and control, helping viewers feel they can confidently apply each checklist step.",
    mood: ["Calm", "Practical", "Confident"],
    composition: "Over Shoulder",
    lens: "35mm",
    lighting: "Natural",
    colorPalette: "Cinematic Orange",
    cameraPosition: "Eye Level",
  },
  "scene-4": {
    visualConcept:
      "The closing visual should feel resolved and optimistic, reinforcing authority while guiding the viewer into a clear next action.",
    mood: ["Confident", "Relief", "Exciting"],
    composition: "Medium Shot",
    lens: "24mm",
    lighting: "Blue Hour",
    colorPalette: "Moody",
    cameraPosition: "Orbit",
  },
};

function createEmptyFutureAssets(): ProductionStudioFutureAssets {
  return {
    images: [],
    videos: [],
    animationPrompts: [],
    voiceScripts: [],
    audio: [],
    subtitles: [],
    exports: [],
    generatedImages: [],
    masterImageSelection: null,
    animationDirectorInput: null,
  };
}

function createInitialCreativeDirection(): Record<string, ProductionStudioCreativeDirection> {
  return Object.fromEntries(
    mockScenes.map((scene) => {
      const guidance = sceneDirectorGuidance[scene.id];
      const visual = sceneVisualDirection[scene.id];

      return [scene.id, {
        title: guidance.title,
        goal: guidance.goal,
        viewerEmotion: guidance.viewerEmotion,
        narration: guidance.narration,
        visualDescription: guidance.visualDescription,
        animationChecklist: guidance.animationChecklist,
        directorNotes: guidance.directorNotes,
        visualConcept: visual.visualConcept,
        mood: visual.mood,
        composition: visual.composition,
        lens: visual.lens,
        lighting: visual.lighting,
        colorPalette: visual.colorPalette,
        cameraPosition: visual.cameraPosition,
      } satisfies ProductionStudioCreativeDirection];
    }),
  ) as Record<string, ProductionStudioCreativeDirection>;
}

function createInitialReferenceBoard(): Record<string, ProductionStudioReferenceItem[]> {
  return Object.fromEntries(mockScenes.map((scene) => [scene.id, []])) as Record<string, ProductionStudioReferenceItem[]>;
}

function createInitialRecord(): ProductionStudioSaveRecord {
  const now = new Date().toISOString();
  const baseRecord: ProductionStudioSaveRecord = {
    id: "production-studio",
    projectName: mockBrief.projectTitle,
    createdAt: now,
    updatedAt: now,
    currentStep: "visual-prompt-builder",
    productionStatus: "Planning",
    platform: mockBrief.platform,
    targetDuration: mockBrief.targetVideoLength,
    thumbnailPlaceholder: "Production Studio thumbnail placeholder",
    brief: { ...mockBrief },
    scenes: mockScenes.map((scene) => ({ ...scene })),
    creativeDirection: createInitialCreativeDirection(),
    referenceBoard: createInitialReferenceBoard(),
    versionHistory: [],
    futureAssets: createEmptyFutureAssets(),
  };

  const snapshot = {
    projectName: baseRecord.projectName,
    createdAt: baseRecord.createdAt,
    updatedAt: baseRecord.updatedAt,
    currentStep: baseRecord.currentStep,
    productionStatus: baseRecord.productionStatus,
    platform: baseRecord.platform,
    targetDuration: baseRecord.targetDuration,
    thumbnailPlaceholder: baseRecord.thumbnailPlaceholder,
    brief: baseRecord.brief,
    scenes: baseRecord.scenes,
    creativeDirection: baseRecord.creativeDirection,
    referenceBoard: baseRecord.referenceBoard,
    futureAssets: baseRecord.futureAssets,
  };

  return {
    ...baseRecord,
    versionHistory: [
      createProductionStudioVersionSnapshot({
        name: "Initial Draft",
        author: "Gatekeeper AI",
        productionScore: 92,
        approved: false,
        snapshot,
      }),
      createProductionStudioVersionSnapshot({
        name: "Improved Prompt",
        author: "Gatekeeper AI",
        productionScore: 95,
        approved: false,
        snapshot,
      }),
      createProductionStudioVersionSnapshot({
        name: "Approved Version",
        author: "Gatekeeper AI",
        productionScore: 96,
        approved: true,
        snapshot,
      }),
    ],
  };
}

function createSceneGeneratedImages(): Record<string, GeneratedImageWorkspaceItem[]> {
  return Object.fromEntries(mockScenes.map((scene) => [scene.id, []])) as Record<string, GeneratedImageWorkspaceItem[]>;
}

function createSceneCompareSelections(): Record<string, CompareSelection> {
  return Object.fromEntries(mockScenes.map((scene) => [scene.id, [null, null]])) as Record<string, CompareSelection>;
}

function createSceneImageSelectionMap() {
  return Object.fromEntries(mockScenes.map((scene) => [scene.id, null])) as Record<string, string | null>;
}

function cloneProductionStudioRecord(record: ProductionStudioSaveRecord): ProductionStudioSaveRecord {
  return JSON.parse(JSON.stringify(record)) as ProductionStudioSaveRecord;
}

function buildUniversalPromptForScene(scene: ProductionStudioScene, visual?: ProductionStudioCreativeDirection) {
  const fragments = [
    scene.imagePrompt,
    scene.visual,
    scene.camera,
    scene.movement,
    visual?.visualConcept,
    visual?.lighting ? `lighting: ${visual.lighting}` : "",
    visual?.colorPalette ? `color palette: ${visual.colorPalette}` : "",
    visual?.composition ? `composition: ${visual.composition}` : "",
    visual?.lens ? `lens: ${visual.lens}` : "",
    visual?.cameraPosition ? `camera position: ${visual.cameraPosition}` : "",
  ]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);

  return fragments.join(", ").replace(/\s+/g, " ").trim();
}

function mapAssetToWorkspaceItem(asset: ProductionStudioGeneratedImageAsset): GeneratedImageWorkspaceItem {
  const provider = asset.provider ?? asset.aiUsed;
  const [resolutionWidth = "1024", resolutionHeight = "1536"] = asset.metadata.resolution.split(" × ");
  const parsedWidth = Number(resolutionWidth);
  const parsedHeight = Number(resolutionHeight);

  return {
    id: asset.id,
    label: asset.label,
    provider,
    thumbnailUrl: asset.thumbnailUrl ?? null,
    width: asset.width ?? (Number.isFinite(parsedWidth) ? parsedWidth : 1024),
    height: asset.height ?? (Number.isFinite(parsedHeight) ? parsedHeight : 1536),
    imageUrl: asset.imageUrl,
    universalPrompt: asset.universalPrompt,
    aiUsed: provider,
    resolution: asset.metadata.resolution,
    aspectRatio: asset.metadata.aspectRatio,
    promptVersion: asset.metadata.promptVersion,
    generationTime: asset.metadata.generationTime,
    createdAt: asset.createdAt ?? asset.metadata.timestamp,
    productionScore: 96,
    favorite: asset.favorite,
    isMaster: asset.isMaster,
  };
}

function mapWorkspaceItemToAsset(item: GeneratedImageWorkspaceItem, sceneId: string): ProductionStudioGeneratedImageAsset {
  return {
    id: item.id,
    sceneId,
    label: item.label,
    provider: item.provider,
    thumbnailUrl: item.thumbnailUrl,
    width: item.width,
    height: item.height,
    createdAt: item.createdAt,
    imageUrl: item.imageUrl,
    universalPrompt: item.universalPrompt,
    aiUsed: item.aiUsed,
    favorite: item.favorite,
    isMaster: item.isMaster,
    metadata: {
      resolution: item.resolution,
      aspectRatio: item.aspectRatio,
      generationTime: item.generationTime,
      modelUsed: item.aiUsed,
      timestamp: item.createdAt,
      promptVersion: item.promptVersion,
    },
  };
}

function createGeneratedImagesBySceneFromAssets(assets: ProductionStudioGeneratedImageAsset[]) {
  const byScene = createSceneGeneratedImages();

  for (const asset of assets) {
    const existing = byScene[asset.sceneId] ?? [];
    byScene[asset.sceneId] = [mapAssetToWorkspaceItem(asset), ...existing];
  }

  for (const sceneId of Object.keys(byScene)) {
    byScene[sceneId] = byScene[sceneId]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }

  return byScene;
}

function extractMasterImageByScene(generatedImagesByScene: Record<string, GeneratedImageWorkspaceItem[]>) {
  const masterByScene = Object.fromEntries(mockScenes.map((scene) => [scene.id, null])) as Record<string, string | null>;

  for (const scene of mockScenes) {
    const sceneImages = generatedImagesByScene[scene.id] ?? [];
    const master = sceneImages.find((image) => image.isMaster);
    masterByScene[scene.id] = master?.id ?? null;
  }

  return masterByScene;
}

function extractSelectedImageByScene(generatedImagesByScene: Record<string, GeneratedImageWorkspaceItem[]>) {
  const selectedByScene = createSceneImageSelectionMap();

  for (const scene of mockScenes) {
    const latest = (generatedImagesByScene[scene.id] ?? [])[0];
    selectedByScene[scene.id] = latest?.id ?? null;
  }

  return selectedByScene;
}

function formatSavedTimeLabel(iso: string) {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${minutes} ${meridiem}`;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function ProductionStudioPrototypePage() {
  const router = useRouter();
  const initialStudioRecord = useMemo(() => createInitialRecord(), []);
  const initialGeneratedImagesByScene = useMemo(() => (
    createGeneratedImagesBySceneFromAssets(initialStudioRecord.futureAssets.generatedImages ?? [])
  ), [initialStudioRecord]);
  const [studioRecord, setStudioRecord] = useState<ProductionStudioSaveRecord>(initialStudioRecord);
  const [copiedKey, setCopiedKey] = useState<string>("");
  const [selectedRenderer, setSelectedRenderer] = useState<AnimationRenderer>("google-flow");
  const [isGeneratingAnimationPrompt, setIsGeneratingAnimationPrompt] = useState(false);
  const [animationPrompt, setAnimationPrompt] = useState("");
  const [animationPromptAnalysis, setAnimationPromptAnalysis] = useState<AnimationPromptAnalysis | null>(null);
  const [copiedAnimationPrompt, setCopiedAnimationPrompt] = useState(false);
  const [animationGenerationStageIndex, setAnimationGenerationStageIndex] = useState(0);
  const [selectedVoicePersona, setSelectedVoicePersona] = useState<VoicePersona>("narrator-mode");
  const [narrationScript, setNarrationScript] = useState(defaultNarrationScript);
  const [copiedAudioBlueprint, setCopiedAudioBlueprint] = useState(false);
  const [selectedPublishingPlatform, setSelectedPublishingPlatform] = useState<PublishingPlatform>("facebook-core");
  const [publishingCaptionBlueprint, setPublishingCaptionBlueprint] = useState<string>("");
  const [copiedPublishingPayload, setCopiedPublishingPayload] = useState<boolean>(false);
  const [showPublishingInheritedContext, setShowPublishingInheritedContext] = useState(false);
  const [publishingBridgeRecord, setPublishingBridgeRecord] = useState<WorkflowBridgeRecord | null>(null);
  const [intelligenceReach, setIntelligenceReach] = useState<string>("");
  const [intelligenceEngagement, setIntelligenceEngagement] = useState<string>("");
  const [intelligenceLinkClicks, setIntelligenceLinkClicks] = useState<string>("");
  const [intelligencePayloads, setIntelligencePayloads] = useState<string[]>([]);
  const [intelligenceFinalized, setIntelligenceFinalized] = useState<boolean>(false);
  const [pendingBridgeBrief, setPendingBridgeBrief] = useState<WorkflowBridgeProductionBrief | null>(null);
  const [showBridgeRefreshModal, setShowBridgeRefreshModal] = useState(false);
  const [generatedImagesByScene, setGeneratedImagesByScene] = useState<Record<string, GeneratedImageWorkspaceItem[]>>(() => initialGeneratedImagesByScene);
  const [selectedImageByScene, setSelectedImageByScene] = useState<Record<string, string | null>>(() => extractSelectedImageByScene(initialGeneratedImagesByScene));
  const [masterImageByScene, setMasterImageByScene] = useState<Record<string, string | null>>(() => extractMasterImageByScene(initialGeneratedImagesByScene));
  const [compareModeByScene, setCompareModeByScene] = useState<Record<string, boolean>>(() => Object.fromEntries(mockScenes.map((scene) => [scene.id, false])) as Record<string, boolean>);
  const [compareSelectionByScene, setCompareSelectionByScene] = useState<Record<string, CompareSelection>>(() => createSceneCompareSelections());
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [generationMessageIndex, setGenerationMessageIndex] = useState(0);
  const [generationErrorByScene, setGenerationErrorByScene] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<{
    status: "saved" | "saving" | "failed";
    lastSavedAt: string | null;
    error: string | null;
  }>({
    status: "saved",
    lastSavedAt: initialStudioRecord.updatedAt,
    error: null,
  });
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ tone: "good" | "info" | "error"; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const hydratedRef = useRef(false);

  const activeStep = studioRecord.currentStep;
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;
  const brief = studioRecord.brief;
  const scenes = studioRecord.scenes;
  const creativeDirection = studioRecord.creativeDirection;
  const referenceBoard = studioRecord.referenceBoard;
  const versionHistory = studioRecord.versionHistory;

  const saveBadge =
    saveState.status === "saving"
      ? "Saving..."
      : saveState.status === "failed"
        ? "Save Failed"
        : "Saved";

  const lastSavedLabel = isMounted && saveState.lastSavedAt
    ? `Last saved ${formatSavedTimeLabel(saveState.lastSavedAt)}`
    : "Last saved --";

  const hasMasterImageSelected = useMemo(() => Object.values(masterImageByScene).some((imageId) => Boolean(imageId)), [masterImageByScene]);
  const generationMessages = useMemo(() => [
    "Generating Image...",
    "Creating cinematic composition...",
    "Optimizing lighting...",
    "Preparing production preview...",
  ], []);
  const animationGenerationMessages = useMemo(() => [
    "Analyzing approved composition frames...",
    "Evaluating focal depth & subject placement constraints...",
    "Injecting physics-aware camera vector paths...",
    "Finalizing target renderer-specific motion syntax...",
  ], []);
  const animationDirectorInput = studioRecord.futureAssets.animationDirectorInput;
  const activeRendererOption = animationRendererOptions.find((option) => option.id === selectedRenderer) ?? animationRendererOptions[0];

  const animationInput = useMemo<AnimationDirectorInput | null>(() => {
    if (!animationDirectorInput) {
      return null;
    }

    const sceneInfo = [
      animationDirectorInput.sceneData.visual,
      animationDirectorInput.sceneData.camera ? `Camera: ${animationDirectorInput.sceneData.camera}` : "",
      animationDirectorInput.sceneData.movement ? `Movement: ${animationDirectorInput.sceneData.movement}` : "",
      animationDirectorInput.sceneData.duration ? `Duration: ${animationDirectorInput.sceneData.duration}` : "",
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" | ");

    const productionBrief = [
      `Project: ${studioRecord.projectName}`,
      `Platform: ${studioRecord.platform}`,
      `Target Duration: ${studioRecord.targetDuration}`,
      `Goal: ${brief.goal}`,
    ].join(" | ");

    return {
      sceneId: animationDirectorInput.sceneId,
      sceneTitle: animationDirectorInput.creativeDirection.title || animationDirectorInput.sceneData.beat,
      sceneLabel: animationDirectorInput.sceneData.sceneLabel,
      masterImageId: animationDirectorInput.masterImageSelection.masterImageId,
      masterImageUrl: animationDirectorInput.masterImageSelection.masterImage,
      universalPrompt: animationDirectorInput.universalPrompt,
      continuityNotes: animationDirectorInput.creativeDirection.directorNotes,
      productionBrief,
      sceneInfo,
    };
  }, [animationDirectorInput, brief.goal, studioRecord.platform, studioRecord.projectName, studioRecord.targetDuration]);

  const canGenerateAnimationPrompt = Boolean(
    animationInput?.sceneId &&
      animationInput.universalPrompt.trim() &&
      animationInput.masterImageUrl,
  );

  const isAnimationPromptReady = Boolean(animationPrompt.trim());
  const publishingConfigMessage = selectedPublishingPlatform === "facebook-core"
    ? "→ Configured: Applying structural post formatting optimized for Facebook's feed algorithm."
    : selectedPublishingPlatform === "instagram-reels"
      ? "→ Configured: Adjusting metadata layout for mobile screen viewport retention loops."
      : "→ Configured: Injecting formatting tokens optimized for fast-paced viral engagement trends.";
  const selectedPublishingPlatformLabel = resolvePublishingPlatformLabel(selectedPublishingPlatform);

  const inheritedProjectTitle =
    publishingBridgeRecord?.p4_production?.projectTitle ||
    publishingBridgeRecord?.p1_idea?.topic ||
    publishingBridgeRecord?.ideaExplorer?.topic ||
    studioRecord.projectName ||
    "Untitled Gatekeeper Project";

  const inheritedTargetPlatform =
    publishingBridgeRecord?.p4_production?.targetPlatform ||
    publishingBridgeRecord?.p2_content?.platform ||
    publishingBridgeRecord?.contentCreator?.targetPlatform ||
    selectedPublishingPlatformLabel;

  const inheritedApprovedCaption =
    publishingBridgeRecord?.p2_content?.caption ||
    publishingBridgeRecord?.contentCreator?.caption ||
    publishingBridgeRecord?.p4_production?.approvedCaption ||
    "No approved Phase 2 caption found.";

  const inheritedManifest =
    publishingBridgeRecord?.p4_production?.productionManifestMarkdown ||
    "No Phase 4 production manifest found.";

  const inheritedManifestPreview = buildManifestPreview(inheritedManifest);

  const intelligenceHistoricalVisualSummary = useMemo(() => {
    return scenes
      .map((scene, index) => {
        const sceneNumber = String(index + 1).padStart(2, "0");
        const sceneTitle = (sceneTitleFallbackById[scene.id] ?? creativeDirection[scene.id]?.title ?? scene.beat).toUpperCase();
        const visualPrompt = buildUniversalPromptForScene(scene, creativeDirection[scene.id]) || scene.imagePrompt || "Visual prompt unavailable.";
        return `Scene ${sceneNumber}: ${sceneTitle}\n${visualPrompt}`;
      })
      .join("\n\n");
  }, [creativeDirection, scenes]);

  const intelligenceAnimationSummary = useMemo(() => {
    const animationLines = scenes
      .map((scene, index) => {
        const sceneNumber = String(index + 1).padStart(2, "0");
        const direction = scene.animationPrompt?.trim() || (animationInput?.sceneId === scene.id ? animationPrompt.trim() : "") || "";
        if (!direction) {
          return "";
        }
        return `Scene ${sceneNumber}: ${direction}`;
      })
      .filter(Boolean);

    return animationLines.join("\n\n");
  }, [animationInput?.sceneId, animationPrompt, scenes]);

  const intelligenceVoiceSummary = useMemo(() => {
    return narrationScript.trim() || defaultNarrationScript;
  }, [narrationScript]);

  const intelligencePublishingRecord = publishingBridgeRecord?.p5_publishing;

  const intelligencePublishingSummary = useMemo(() => {
    return intelligencePublishingRecord?.dispatchedPayload?.trim()
      || publishingCaptionBlueprint.trim()
      || defaultPublishingCaptionBlueprint;
  }, [intelligencePublishingRecord?.dispatchedPayload, publishingCaptionBlueprint]);

  const hasHistoricalContext = Boolean(
    intelligenceHistoricalVisualSummary.trim()
      || intelligenceAnimationSummary.trim()
      || intelligenceVoiceSummary.trim()
      || intelligencePublishingSummary.trim(),
  );

  const intelligenceOptimizationToken = intelligenceReach.trim()
    ? `Manual reach input (${intelligenceReach.trim()}) indicates the campaign should be reviewed against visual hook strength and regional infrastructure relevance.`
    : "Manual reach input indicates the campaign should be reviewed against visual hook strength and regional infrastructure relevance.";

  const intelligenceStrategicReading = intelligenceEngagement.trim()
    ? `Engagement input (${intelligenceEngagement.trim()}) suggests sloped terracing visuals combined with heritage architecture and clear JKR infrastructure context can improve regional interaction quality.`
    : "Sloped terracing visuals combined with heritage architecture and clear JKR infrastructure context can improve regional interaction quality.";

  const intelligenceNextCampaignRecommendation = intelligenceLinkClicks.trim()
    ? `Link Clicks / DMs (${intelligenceLinkClicks.trim()}) indicate opportunity to increase volumetric light parameters, foreground land-access cues, and extend duration vectors to 10s on primary environmental reveals in the next campaign layout pass.`
    : "Increase volumetric light parameters, foreground land-access cues, and extend duration vectors to 10s on primary environmental reveals in the next campaign layout pass.";

  const intelligenceNextBriefSeed = "Lead the next Phase 1 idea with road access, local development potential, and one strong visual transformation hook.";

  const intelligenceStrategyPayload = [
    "# Gatekeeper AI Content Intelligence Payload",
    "",
    `Reach: ${intelligenceReach.trim() || "N/A"}`,
    `Engagement: ${intelligenceEngagement.trim() || "N/A"}`,
    `Link Clicks / DMs: ${intelligenceLinkClicks.trim() || "N/A"}`,
    "",
    "Historical Context Summary:",
    `Visual Prompt Summary:\n${intelligenceHistoricalVisualSummary || "N/A"}`,
    `Animation Vector Direction Summary:\n${intelligenceAnimationSummary || "N/A"}`,
    `Voice / Narration Summary:\n${intelligenceVoiceSummary || "N/A"}`,
    `Publishing Caption Summary:\n${intelligencePublishingSummary || "N/A"}`,
    "",
    `Optimization Token:\n${intelligenceOptimizationToken}`,
    "",
    `Next Campaign Recommendation:\n${intelligenceNextCampaignRecommendation}`,
    "",
    `Next Brief Seed:\n${intelligenceNextBriefSeed}`,
  ].join("\n");

  async function handleCopy(key: string, text: string) {
    try {
      await copyText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch {
      setCopiedKey("");
    }
  }

  async function generateAnimationPromptFromHandoff() {
    if (!animationInput || !canGenerateAnimationPrompt) {
      showToast("Step 4 requires an approved Master Image from Step 3.", "error");
      return;
    }

    setCopiedAnimationPrompt(false);
    setIsGeneratingAnimationPrompt(true);
    setAnimationGenerationStageIndex(0);

    try {
      for (let index = 1; index < animationGenerationMessages.length; index += 1) {
        // Simulated generation sequence for frontend-only Step 4 prompt production.
        await new Promise((resolve) => {
          window.setTimeout(resolve, 450);
        });
        setAnimationGenerationStageIndex(index);
      }

      const generated = buildAnimationPrompt(animationInput, selectedRenderer);
      setAnimationPrompt(generated.prompt);
      setAnimationPromptAnalysis(generated.analysis);

      updateRecord((record) => ({
        ...record,
        scenes: record.scenes.map((scene) => (
          scene.id === animationInput.sceneId ? { ...scene, animationPrompt: generated.prompt } : scene
        )),
        futureAssets: {
          ...record.futureAssets,
          animationPrompts: [
            ...record.futureAssets.animationPrompts.filter((value) => value !== generated.prompt),
            generated.prompt,
          ],
        },
      }));

      showToast("✓ Animation Prompt Ready", "good");
    } finally {
      setIsGeneratingAnimationPrompt(false);
      setAnimationGenerationStageIndex(0);
    }
  }

  async function copyPromptAndOpenPlatform() {
    if (!isAnimationPromptReady) {
      return;
    }

    try {
      await copyText(animationPrompt);
      setCopiedAnimationPrompt(true);

      if (typeof window !== "undefined") {
        window.open(activeRendererOption.externalUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => setCopiedAnimationPrompt(false), 2200);
      }
    } catch {
      setCopiedAnimationPrompt(false);
      showToast("Unable to copy the animation prompt.", "error");
    }
  }

  async function copyAudioBlueprintPackage() {
    const payload = [
      "Narration Script Blueprint:",
      narrationScript.trim() || defaultNarrationScript,
      "",
      "Acoustic Background Direction (Suno / Udio Prompt):",
      acousticBackgroundPrompt,
    ].join("\n");

    try {
      await copyText(payload);
      setCopiedAudioBlueprint(true);
      window.setTimeout(() => setCopiedAudioBlueprint(false), 2200);
    } catch {
      setCopiedAudioBlueprint(false);
      showToast("Unable to copy the audio blueprint package.", "error");
    }
  }

  function buildProductionManifestMarkdown() {
    const projectTitle = brief.projectTitle.trim() || studioRecord.projectName || "Untitled Gatekeeper Project";
    const platform = brief.platform.trim() || studioRecord.platform || selectedPublishingPlatformLabel;
    const captionPayload = publishingCaptionBlueprint.trim() || defaultPublishingCaptionBlueprint;
    const scenesBlock = scenes
      .map((scene, index) => {
        const sceneNumber = String(index + 1).padStart(2, "0");
        const sceneTitle = scene.beat.trim() || scene.sceneLabel;
        const visualPrompt = buildUniversalPromptForScene(scene, creativeDirection[scene.id]) || scene.imagePrompt || "Visual prompt unavailable.";
        const animationDirection = scene.animationPrompt?.trim() || "Animation prompt unavailable.";
        return [
          `## Scene ${sceneNumber}: ${sceneTitle}`,
          `Purpose: ${scene.purpose || "N/A"}`,
          "",
          "Visual Prompt:",
          visualPrompt,
          "",
          "Animation Prompt:",
          animationDirection,
        ].join("\n");
      })
      .join("\n\n");

    return [
      "# Gatekeeper AI Production Manifest",
      "",
      `Project Title: ${projectTitle}`,
      `Target Platform: ${platform}`,
      `Audience: ${brief.audience || "N/A"}`,
      `Goal: ${brief.goal || "N/A"}`,
      `Tone: ${brief.tone || "N/A"}`,
      `Target Video Length: ${brief.targetVideoLength || "N/A"}`,
      "",
      "## Approved Caption",
      captionPayload,
      "",
      "## Production Scenes",
      scenesBlock,
    ].join("\n");
  }

  function syncProductionManifestToBridge() {
    const manifestMarkdown = buildProductionManifestMarkdown();
    const nowIso = new Date().toISOString();
    const existingRecord = loadWorkflowBridgeRecord();
    const resolvedProjectTitle = brief.projectTitle.trim() || studioRecord.projectName || "Untitled Gatekeeper Project";
    const resolvedTargetPlatform = brief.platform.trim() || studioRecord.platform || selectedPublishingPlatformLabel;
    const resolvedApprovedCaption = publishingCaptionBlueprint.trim()
      || existingRecord?.p2_content?.caption
      || existingRecord?.contentCreator?.caption
      || defaultPublishingCaptionBlueprint;
    const resolvedMetadata = [
      `Platform: ${resolvedTargetPlatform}`,
      `Audience: ${brief.audience || "N/A"}`,
      `Goal: ${brief.goal || "N/A"}`,
      `Target Duration: ${brief.targetVideoLength || "N/A"}`,
    ].join(" | ");

    return saveWorkflowBridgeRecord({
      p1_idea: existingRecord?.p1_idea,
      p2_content: existingRecord?.p2_content,
      p3_viralReview: existingRecord?.p3_viralReview,
      ideaExplorer: existingRecord?.ideaExplorer,
      contentCreator: existingRecord?.contentCreator,
      contentStudio: existingRecord?.contentStudio,
      viralScanner: existingRecord?.viralScanner,
      p6_intelligence: existingRecord?.p6_intelligence,
      p5_publishing: existingRecord?.p5_publishing,
      p4_production: {
        projectTitle: resolvedProjectTitle,
        targetPlatform: resolvedTargetPlatform,
        approvedCaption: resolvedApprovedCaption,
        productionManifestMarkdown: manifestMarkdown,
        productionManifestUpdatedAt: nowIso,
        approvedManifest: "Approved Manifest",
        productionMetadata: resolvedMetadata,
        status: "manifest-ready",
      },
    });
  }

  async function handleCopyPublishingPayloadAndOpenChannel() {
    const destinationUrl = selectedPublishingPlatform === "facebook-core"
      ? "https://facebook.com"
      : selectedPublishingPlatform === "instagram-reels"
        ? "https://instagram.com"
        : "https://tiktok.com";

    const payload = publishingCaptionBlueprint.trim() || defaultPublishingCaptionBlueprint;
    const syncedRecord = syncProductionManifestToBridge();
    const dispatchTimestamp = new Date().toISOString();

    const persistedRecord = saveWorkflowBridgeRecord({
      p1_idea: syncedRecord.p1_idea,
      p2_content: syncedRecord.p2_content,
      p3_viralReview: syncedRecord.p3_viralReview,
      ideaExplorer: syncedRecord.ideaExplorer,
      contentCreator: syncedRecord.contentCreator,
      contentStudio: syncedRecord.contentStudio,
      viralScanner: syncedRecord.viralScanner,
      p4_production: syncedRecord.p4_production,
      p6_intelligence: syncedRecord.p6_intelligence,
      p5_publishing: {
        dispatchedAt: dispatchTimestamp,
        selectedChannel: selectedPublishingPlatform,
        selectedChannelLabel: selectedPublishingPlatformLabel,
        dispatchedPayload: payload,
        sourceManifestMarkdown: syncedRecord.p4_production?.productionManifestMarkdown,
        sourceManifestSummary: buildManifestPreview(syncedRecord.p4_production?.productionManifestMarkdown || ""),
        sourceCaption: syncedRecord.p2_content?.caption || syncedRecord.contentCreator?.caption || syncedRecord.p4_production?.approvedCaption,
        productionMetadata: syncedRecord.p4_production?.productionMetadata,
        status: "payload-dispatched",
      },
    });

    setPublishingBridgeRecord(persistedRecord);

    try {
      await copyText(payload);
      setCopiedPublishingPayload(true);
      window.open(destinationUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => setCopiedPublishingPayload(false), 2200);
    } catch {
      window.open(destinationUrl, "_blank", "noopener,noreferrer");
      setCopiedPublishingPayload(false);
      showToast("Publishing payload was dispatched, but clipboard copy was blocked in this browser session.", "info");
    }
  }

  useEffect(() => {
    if (activeStep !== "export-prompts") {
      return;
    }

    const syncedRecord = syncProductionManifestToBridge();
    setPublishingBridgeRecord(syncedRecord);

    if (publishingCaptionBlueprint.trim()) {
      return;
    }

    setPublishingCaptionBlueprint(buildInitialPublishingPayload(syncedRecord));
  }, [activeStep]);

  function finalizeIntelligenceCycleAndResetStudio() {
    const payload = intelligenceStrategyPayload.trim();

    if (!payload) {
      return;
    }

    const finalizedAt = new Date().toISOString();

    try {
      saveWorkflowBridgeRecord({
        p6_intelligence: {
          intelligenceSummary: intelligenceStrategicReading,
          optimizationTokens: intelligenceOptimizationToken,
          bestPerformingPatterns: intelligencePublishingSummary,
          regionalLearnings: intelligenceStrategicReading,
          nextCampaignSeed: intelligenceNextBriefSeed,
          finalizedAt,
          status: "intelligence-complete",
        },
      });
    } catch {
      showToast("Unable to finalize intelligence cycle. Please retry.", "error");
      return;
    }

    setIntelligencePayloads((current) => [...current, payload]);
    setIntelligenceFinalized(true);
    showToast("✓ Intelligence cycle finalized. Studio reset for the next strategic brief.", "good");

    updateRecord((record) => ({
      ...record,
      currentStep: "creative-brief",
    }));

    window.setTimeout(() => {
      router.push("/content-studio");
    }, 250);
  }

  function persistGeneratedImages(nextImagesByScene: Record<string, GeneratedImageWorkspaceItem[]>) {
    updateRecord((record) => {
      const generatedImages = Object.entries(nextImagesByScene).flatMap(([sceneId, items]) => (
        items.map((item) => mapWorkspaceItemToAsset(item, sceneId))
      ));

      return {
        ...record,
        futureAssets: {
          ...record.futureAssets,
          generatedImages,
        },
      };
    });
  }

  function createMasterImageSelection(sceneId: string, image: GeneratedImageWorkspaceItem): ProductionStudioMasterImageSelection {
    return {
      sceneId,
      masterImageId: image.id,
      masterImage: image.imageUrl,
      masterPrompt: image.universalPrompt,
      provider: image.provider,
      resolution: image.resolution,
      createdAt: image.createdAt,
      generationMetadata: {
        resolution: image.resolution,
        aspectRatio: image.aspectRatio,
        generationTime: image.generationTime,
        modelUsed: image.aiUsed,
        timestamp: image.createdAt,
        promptVersion: image.promptVersion,
      },
    };
  }

  async function generateImageWithGpt(scene: ProductionStudioScene, visual: ProductionStudioCreativeDirection) {
    setGenerationErrorByScene((current) => ({ ...current, [scene.id]: "" }));
    setGeneratingSceneId(scene.id);
    setGenerationMessageIndex(0);

    try {
      const existingImages = getSceneImages(scene.id);
      const nextPromptVersion = `V${existingImages.length + 1}`;
      const universalPrompt = buildUniversalPromptForScene(scene, visual);

      const response = await fetch("/api/production-studio/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: {
            id: studioRecord.id,
            name: studioRecord.projectName,
            platform: studioRecord.platform,
            targetDuration: studioRecord.targetDuration,
          },
          scene: {
            id: scene.id,
            sceneLabel: scene.sceneLabel,
            beat: scene.beat,
            purpose: scene.purpose,
            duration: scene.duration,
            visual: scene.visual,
            camera: scene.camera,
            movement: scene.movement,
          },
          creativeDirection: {
            title: visual.title,
            goal: visual.goal,
            viewerEmotion: visual.viewerEmotion,
            narration: visual.narration,
            visualDescription: visual.visualDescription,
            directorNotes: visual.directorNotes,
          },
          universalPrompt,
          promptVersion: nextPromptVersion,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = typeof data?.error === "string" ? ` ${data.error}` : "";
        throw new Error(`Image generation failed.${detail}`);
      }

      const metadata: ProductionStudioGenerationMetadata = {
        resolution: String(data.resolution ?? "1024 × 1536"),
        aspectRatio: String(data.aspectRatio ?? "9:16"),
        generationTime: String(data.generationTime ?? "1s"),
        modelUsed: String(data.modelUsed ?? "gpt-image-2"),
        timestamp: String(data.createdAt ?? data.timestamp ?? new Date().toISOString()),
        promptVersion: String(data.promptVersion ?? nextPromptVersion),
      };

      const provider = String(data.provider ?? "GPT Image 2");

      const nextImage: GeneratedImageWorkspaceItem = {
        id: String(data.id ?? createProductionStudioRecordId()),
        label: `Image ${existingImages.length + 1}`,
        provider,
        thumbnailUrl: typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : null,
        width: Number(data.width ?? 1024),
        height: Number(data.height ?? 1536),
        imageUrl: String(data.imageUrl ?? ""),
        universalPrompt,
        aiUsed: provider,
        resolution: metadata.resolution,
        aspectRatio: metadata.aspectRatio,
        promptVersion: metadata.promptVersion,
        generationTime: metadata.generationTime,
        createdAt: metadata.timestamp,
        productionScore: Math.max(82, 96 - existingImages.length * 2),
        favorite: false,
        isMaster: existingImages.length === 0,
      };

      const nextByScene = {
        ...generatedImagesByScene,
        [scene.id]: [nextImage, ...existingImages],
      };

      setGeneratedImagesByScene(nextByScene);
      setSelectedSceneImage(scene.id, nextImage.id);
      setCompareSelectionByScene((current) => ({ ...current, [scene.id]: [nextImage.id, null] }));

      if (nextImage.isMaster) {
        setMasterImageByScene((current) => ({ ...current, [scene.id]: nextImage.id }));
      }

      persistGeneratedImages(nextByScene);

      if (nextImage.isMaster) {
        const masterSelection = createMasterImageSelection(scene.id, nextImage);
        updateRecord((record) => ({
          ...record,
          futureAssets: {
            ...record.futureAssets,
            masterImageSelection: masterSelection,
          },
        }));
      }

      showToast("✓ Image generated", "good");
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "We couldn't generate this image right now. Please retry or copy the Universal Prompt.";

      setGenerationErrorByScene((current) => ({ ...current, [scene.id]: message }));
      showToast("⚠ Image generation failed", "error");
    } finally {
      setGeneratingSceneId(null);
      setGenerationMessageIndex(0);
    }
  }

  function goPrevious() {
    if (activeIndex <= 0) return;
    updateRecord((draft) => ({
      ...draft,
      currentStep: steps[activeIndex - 1].id,
    }));
  }

  function goNext() {
    if (!nextStep) return;
    updateRecord((draft) => ({
      ...draft,
      currentStep: nextStep.id,
    }));
  }

  function showToast(message: string, tone: "good" | "info" | "error" = "info") {
    if (typeof window !== "undefined" && toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({ message, tone });

    if (typeof window !== "undefined") {
      toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
    }
  }

  function updateRecord(updater: (record: ProductionStudioSaveRecord) => ProductionStudioSaveRecord) {
    setStudioRecord((current) => {
      const next = updater(cloneProductionStudioRecord(current));
      setDirty(true);
      setSaveState((previous) => ({ ...previous, status: "saving", error: null }));
      return next;
    });
  }

  function saveNow(message: string, tone: "good" | "info" = "good", announce = true) {
    try {
      const saved = saveProductionStudioRecord(studioRecord);
      setStudioRecord(saved);
      setSaveState({ status: "saved", lastSavedAt: saved.updatedAt, error: null });
      setDirty(false);
      if (announce) {
        showToast(message, tone);
      }
    } catch (error) {
      setSaveState((previous) => ({
        ...previous,
        status: "failed",
        error: error instanceof Error ? error.message : "Unable to save the production studio record.",
      }));
      showToast("⚠ Save Failed", "error");
    }
  }

  function saveVersion() {
    const versionName = versionHistory.length === 0
      ? "Initial Draft"
      : versionHistory.length === 1
        ? "Improved Prompt"
        : versionHistory.length === 2
          ? "Approved Version"
          : `Version ${versionHistory.length + 1}`;

    const snapshot = {
      projectName: studioRecord.projectName,
      createdAt: studioRecord.createdAt,
      updatedAt: studioRecord.updatedAt,
      currentStep: studioRecord.currentStep,
      productionStatus: studioRecord.productionStatus,
      platform: studioRecord.platform,
      targetDuration: studioRecord.targetDuration,
      thumbnailPlaceholder: studioRecord.thumbnailPlaceholder,
      brief: studioRecord.brief,
      scenes: studioRecord.scenes,
      creativeDirection: studioRecord.creativeDirection,
      referenceBoard: studioRecord.referenceBoard,
      futureAssets: studioRecord.futureAssets,
    };

    updateRecord((record) => ({
      ...record,
      versionHistory: [
        ...record.versionHistory,
        createProductionStudioVersionSnapshot({
          name: versionName,
          author: "Gatekeeper AI",
          productionScore: 96,
          approved: versionHistory.length >= 2,
          snapshot,
        }),
      ],
    }));

    showToast("✓ Version Saved", "good");
  }

  function saveProject() {
    saveNow("✓ Production Saved", "good");
  }

  function setBriefField<K extends keyof ProductionStudioBrief>(field: K, value: ProductionStudioBrief[K]) {
    updateRecord((record) => ({
      ...record,
      brief: {
        ...record.brief,
        [field]: value,
      },
      projectName: field === "projectTitle" ? value : record.projectName,
      platform: field === "platform" ? value : record.platform,
      targetDuration: field === "targetVideoLength" ? value : record.targetDuration,
    }));
  }

  function setSceneField<K extends keyof ProductionStudioScene>(sceneId: string, field: K, value: ProductionStudioScene[K]) {
    updateRecord((record) => ({
      ...record,
      scenes: record.scenes.map((scene) => (scene.id === sceneId ? { ...scene, [field]: value } : scene)),
    }));
  }

  function setCreativeDirectionField<K extends keyof ProductionStudioCreativeDirection>(
    sceneId: string,
    field: K,
    value: ProductionStudioCreativeDirection[K],
  ) {
    updateRecord((record) => ({
      ...record,
      creativeDirection: {
        ...record.creativeDirection,
        [sceneId]: {
          ...record.creativeDirection[sceneId],
          [field]: value,
        },
      },
    }));
  }

  function addReference(sceneId: string, title: string, description: string, source: string) {
    updateRecord((record) => {
      const items = record.referenceBoard[sceneId] ?? [];

      return {
        ...record,
        referenceBoard: {
          ...record.referenceBoard,
          [sceneId]: [
            ...items,
            {
              id: createProductionStudioRecordId(),
              title,
              description,
              source,
              addedAt: new Date().toISOString(),
            },
          ],
        },
      };
    });
  }

  function updateReference(sceneId: string, referenceId: string, field: "title" | "description" | "source", value: string) {
    updateRecord((record) => ({
      ...record,
      referenceBoard: {
        ...record.referenceBoard,
        [sceneId]: (record.referenceBoard[sceneId] ?? []).map((reference) => (
          reference.id === referenceId ? { ...reference, [field]: value } : reference
        )),
      },
    }));
  }

  function removeReference(sceneId: string, referenceId: string) {
    updateRecord((record) => ({
      ...record,
      referenceBoard: {
        ...record.referenceBoard,
        [sceneId]: (record.referenceBoard[sceneId] ?? []).filter((reference) => reference.id !== referenceId),
      },
    }));
  }

  function restoreVersion(versionId: string) {
    const version = versionHistory.find((item) => item.id === versionId);
    if (!version) {
      return;
    }

    updateRecord((record) => ({
      ...record,
      currentStep: version.snapshot.currentStep,
      productionStatus: version.snapshot.productionStatus,
      platform: version.snapshot.platform,
      targetDuration: version.snapshot.targetDuration,
      thumbnailPlaceholder: version.snapshot.thumbnailPlaceholder,
      brief: version.snapshot.brief,
      scenes: version.snapshot.scenes,
      creativeDirection: version.snapshot.creativeDirection,
      referenceBoard: version.snapshot.referenceBoard,
      futureAssets: version.snapshot.futureAssets,
    }));

    setIsVersionDrawerOpen(false);
    showToast("✓ Version Restored", "good");
  }

  function duplicateVersion(versionId: string) {
    const version = versionHistory.find((item) => item.id === versionId);
    if (!version) {
      return;
    }

    updateRecord((record) => ({
      ...record,
      versionHistory: [
        ...record.versionHistory,
        {
          ...version,
          id: createProductionStudioRecordId(),
          name: `Copy of ${version.name}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    showToast("✓ Version Duplicated", "good");
  }

  function deleteVersion(versionId: string) {
    updateRecord((record) => ({
      ...record,
      versionHistory: record.versionHistory.filter((version) => version.id !== versionId),
    }));

    showToast("Version deleted", "info");
  }

  function openVersion(versionId: string) {
    const version = versionHistory.find((item) => item.id === versionId);
    if (!version) {
      return;
    }

    updateRecord((record) => ({
      ...record,
      currentStep: version.snapshot.currentStep,
      productionStatus: version.snapshot.productionStatus,
      platform: version.snapshot.platform,
      targetDuration: version.snapshot.targetDuration,
      thumbnailPlaceholder: version.snapshot.thumbnailPlaceholder,
      brief: version.snapshot.brief,
      scenes: version.snapshot.scenes,
      creativeDirection: version.snapshot.creativeDirection,
      referenceBoard: version.snapshot.referenceBoard,
      futureAssets: version.snapshot.futureAssets,
    }));

    setIsVersionDrawerOpen(false);
    showToast("✓ Version Opened", "info");
  }

  function getSceneImages(sceneId: string) {
    return generatedImagesByScene[sceneId] ?? [];
  }

  function getSelectedSceneImage(sceneId: string) {
    const sceneImages = getSceneImages(sceneId);
    const selectedImageId = selectedImageByScene[sceneId] ?? null;
    return sceneImages.find((image) => image.id === selectedImageId) ?? sceneImages[0] ?? null;
  }

  function setSelectedSceneImage(sceneId: string, imageId: string) {
    setSelectedImageByScene((current) => ({ ...current, [sceneId]: imageId }));
  }

  function addGeneratedImage(sceneId: string) {
    const scene = studioRecord.scenes.find((item) => item.id === sceneId);
    const visual = studioRecord.creativeDirection[sceneId];
    if (!scene || !visual) {
      showToast("Unable to locate scene details.", "error");
      return;
    }

    void generateImageWithGpt(scene, visual);
  }

  function toggleFavoriteImage(sceneId: string, imageId: string) {
    setGeneratedImagesByScene((current) => {
      const next = {
        ...current,
        [sceneId]: (current[sceneId] ?? []).map((image) => (
          image.id === imageId ? { ...image, favorite: !image.favorite } : image
        )),
      };

      persistGeneratedImages(next);
      return next;
    });
  }

  function setMasterImage(sceneId: string, imageId: string) {
    let selectedMaster: GeneratedImageWorkspaceItem | null = null;

    setGeneratedImagesByScene((current) => {
      const updatedImages = (current[sceneId] ?? []).map((image) => {
        const isMaster = image.id === imageId;
        const next = { ...image, isMaster };
        if (isMaster) {
          selectedMaster = next;
        }
        return next;
      });

      const next = {
        ...current,
        [sceneId]: updatedImages,
      };

      persistGeneratedImages(next);
      return next;
    });

    setMasterImageByScene((current) => ({ ...current, [sceneId]: imageId }));
    setSelectedSceneImage(sceneId, imageId);

    if (selectedMaster) {
      const masterSelection = createMasterImageSelection(sceneId, selectedMaster);
      updateRecord((record) => ({
        ...record,
        futureAssets: {
          ...record.futureAssets,
          masterImageSelection: masterSelection,
        },
      }));
    }

    showToast("Master image selected", "good");
  }

  function handleSetMasterImage(sceneId: string, imageId: string) {
    setMasterImage(sceneId, imageId);
  }

  function handleApproveImage(sceneId: string, imageId: string) {
    handleSetMasterImage(sceneId, imageId);
    showToast("Approved as Master Image", "good");
  }

  function prepareAnimationHandoff(sceneId: string) {
    const sceneData = studioRecord.scenes.find((scene) => scene.id === sceneId);
    const visual = studioRecord.creativeDirection[sceneId];
    const masterImageId = masterImageByScene[sceneId];
    const masterImage = (generatedImagesByScene[sceneId] ?? []).find((image) => image.id === masterImageId);

    if (!sceneData || !visual || !masterImage) {
      return;
    }

    const universalPrompt = buildUniversalPromptForScene(sceneData, visual);
    const masterImageSelection = createMasterImageSelection(sceneId, masterImage);

    updateRecord((record) => ({
      ...record,
      futureAssets: {
        ...record.futureAssets,
        masterImageSelection,
        animationDirectorInput: {
          sceneId,
          projectMetadata: {
            projectName: record.projectName,
            platform: record.platform,
            targetDuration: record.targetDuration,
          },
          sceneData,
          creativeDirection: visual,
          universalPrompt,
          masterImageSelection,
        },
      },
    }));

    showToast("Ready for Step 4", "good");
  }

  function deleteGeneratedImage(sceneId: string, imageId: string) {
    setGeneratedImagesByScene((current) => {
      const next = {
        ...current,
        [sceneId]: (current[sceneId] ?? []).filter((image) => image.id !== imageId),
      };

      persistGeneratedImages(next);
      return next;
    });

    setSelectedImageByScene((current) => {
      const next = current[sceneId] === imageId ? null : current[sceneId];
      return { ...current, [sceneId]: next };
    });

    setMasterImageByScene((current) => ({
      ...current,
      [sceneId]: current[sceneId] === imageId ? null : current[sceneId],
    }));

    setCompareSelectionByScene((current) => ({
      ...current,
      [sceneId]: current[sceneId].map((selectedId) => (selectedId === imageId ? null : selectedId)) as CompareSelection,
    }));

    updateRecord((record) => ({
      ...record,
      futureAssets: {
        ...record.futureAssets,
        masterImageSelection:
          record.futureAssets.masterImageSelection?.sceneId === sceneId &&
          (generatedImagesByScene[sceneId] ?? []).find((item) => item.id === imageId)?.imageUrl ===
            record.futureAssets.masterImageSelection.masterImage
            ? null
            : record.futureAssets.masterImageSelection,
      },
    }));
  }

  function toggleCompareMode(sceneId: string) {
    setCompareModeByScene((current) => ({ ...current, [sceneId]: !current[sceneId] }));
    setCompareSelectionByScene((current) => ({ ...current, [sceneId]: [null, null] }));
  }

  function pickCompareImage(sceneId: string, imageId: string) {
    setCompareSelectionByScene((current) => {
      const [left, right] = current[sceneId] ?? [null, null];

      if (left === imageId) {
        return { ...current, [sceneId]: [null, right] };
      }

      if (right === imageId) {
        return { ...current, [sceneId]: [left, null] };
      }

      if (!left) {
        return { ...current, [sceneId]: [imageId, right] };
      }

      if (!right) {
        return { ...current, [sceneId]: [left, imageId] };
      }

      return { ...current, [sceneId]: [right, imageId] };
    });
  }

  useEffect(() => {
    setIsMounted(true);
    hydratedRef.current = true;
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  function buildSeededRecordFromBridge(bridgeBrief: WorkflowBridgeProductionBrief): ProductionStudioSaveRecord {
    const initialRecord = createInitialRecord();

    return {
      ...initialRecord,
      projectName: bridgeBrief.projectTitle,
      platform: bridgeBrief.platform,
      targetDuration: bridgeBrief.targetVideoLength,
      brief: {
        ...initialRecord.brief,
        projectTitle: bridgeBrief.projectTitle,
        platform: bridgeBrief.platform,
        audience: bridgeBrief.audience,
        goal: bridgeBrief.goal,
        tone: bridgeBrief.tone,
        hook: bridgeBrief.hook,
        cta: bridgeBrief.cta,
        targetVideoLength: bridgeBrief.targetVideoLength,
      },
      currentStep: "creative-brief",
    };
  }

  function applyStudioRecord(record: ProductionStudioSaveRecord) {
    const hydratedGeneratedImages = createGeneratedImagesBySceneFromAssets(record.futureAssets.generatedImages ?? []);
    setStudioRecord(record);
    setGeneratedImagesByScene(hydratedGeneratedImages);
    setMasterImageByScene(extractMasterImageByScene(hydratedGeneratedImages));
    setSelectedImageByScene(extractSelectedImageByScene(hydratedGeneratedImages));
    setSaveState({ status: "saved", lastSavedAt: record.updatedAt, error: null });
  }

  function handleStartFromLatestApprovedViralReview() {
    if (!pendingBridgeBrief) {
      setShowBridgeRefreshModal(false);
      return;
    }

    const seededRecord = buildSeededRecordFromBridge(pendingBridgeBrief);
    const savedBridgeSeed = saveProductionStudioRecord(seededRecord);
    applyStudioRecord(savedBridgeSeed);
    setShowBridgeRefreshModal(false);
    setPendingBridgeBrief(null);
    showToast("Loaded latest approved Viral Review into Production Studio.", "good");
  }

  useEffect(() => {
    const savedRecord = loadProductionStudioRecord();
    const bridgeRecord = loadWorkflowBridgeRecord();
    const bridgeBrief = bridgeRecord ? buildProductionBriefFromBridge(bridgeRecord) : null;
    setPublishingBridgeRecord(bridgeRecord);

    if (!savedRecord) {
      if (!bridgeBrief) {
        return;
      }

      const seededRecord = buildSeededRecordFromBridge(bridgeBrief);
      const savedBridgeSeed = saveProductionStudioRecord(seededRecord);
      applyStudioRecord(savedBridgeSeed);
      showToast("Loaded Viral Scanner handoff into Production Studio.", "good");
      return;
    }

    applyStudioRecord(savedRecord);

    const approvedAt = bridgeRecord?.p3_viralReview?.approvedAt;
    const hasNewerApprovedReview = Boolean(
      approvedAt &&
      Date.parse(approvedAt) > Date.parse(savedRecord.updatedAt),
    );

    if (hasNewerApprovedReview) {
      setPendingBridgeBrief(bridgeBrief);
      setShowBridgeRefreshModal(true);
    }
  }, []);

  useEffect(() => {
    if (!generatingSceneId) {
      return;
    }

    const timer = window.setInterval(() => {
      setGenerationMessageIndex((current) => (current + 1) % generationMessages.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [generationMessages, generatingSceneId]);

  useEffect(() => {
    if (!animationInput) {
      setAnimationPrompt("");
      setAnimationPromptAnalysis(null);
      setCopiedAnimationPrompt(false);
      return;
    }

    setAnimationPrompt("");
    setAnimationPromptAnalysis(null);
    setCopiedAnimationPrompt(false);
  }, [animationInput?.sceneId, animationInput?.masterImageId, animationInput?.masterImageUrl]);

  useEffect(() => {
    if (!hydratedRef.current || !dirty) {
      return;
    }

    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    setSaveState((previous) => ({ ...previous, status: "saving", error: null }));

    autoSaveTimerRef.current = window.setTimeout(() => {
      saveNow("✓ Saved", "good", false);
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [dirty, studioRecord]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty || saveState.status === "failed") {
        event.preventDefault();
        event.returnValue = "You have unsaved production changes.";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty, saveState.status]);

  useEffect(() => {
    if (!hasMasterImageSelected) {
      if (studioRecord.futureAssets.masterImageSelection || studioRecord.futureAssets.animationDirectorInput) {
        updateRecord((record) => ({
          ...record,
          futureAssets: {
            ...record.futureAssets,
            masterImageSelection: null,
            animationDirectorInput: null,
          },
        }));
      }
      return;
    }

    const firstMasterSceneId = Object.keys(masterImageByScene).find((sceneId) => Boolean(masterImageByScene[sceneId]));
    if (!firstMasterSceneId) {
      return;
    }

    const masterImageId = masterImageByScene[firstMasterSceneId];
    if (!masterImageId) {
      return;
    }

    const masterImage = (generatedImagesByScene[firstMasterSceneId] ?? []).find((image) => image.id === masterImageId);
    const sceneData = studioRecord.scenes.find((scene) => scene.id === firstMasterSceneId);
    const visual = studioRecord.creativeDirection[firstMasterSceneId];

    if (!masterImage || !sceneData || !visual) {
      return;
    }

    const masterSelection = createMasterImageSelection(firstMasterSceneId, masterImage);
    const universalPrompt = buildUniversalPromptForScene(sceneData, visual);
    const currentSelection = studioRecord.futureAssets.masterImageSelection;

    const hasSameSelection =
      currentSelection?.sceneId === masterSelection.sceneId &&
      currentSelection?.masterImage === masterSelection.masterImage &&
      currentSelection?.masterPrompt === masterSelection.masterPrompt &&
      currentSelection?.generationMetadata.promptVersion === masterSelection.generationMetadata.promptVersion &&
      currentSelection?.generationMetadata.timestamp === masterSelection.generationMetadata.timestamp;

    const currentAnimationInput = studioRecord.futureAssets.animationDirectorInput;
    const hasSameAnimationInput =
      currentAnimationInput?.sceneId === firstMasterSceneId &&
      currentAnimationInput?.universalPrompt === universalPrompt &&
      currentAnimationInput?.masterImageSelection.masterImage === masterSelection.masterImage &&
      currentAnimationInput?.masterImageSelection.generationMetadata.promptVersion === masterSelection.generationMetadata.promptVersion;

    if (hasSameSelection && hasSameAnimationInput) {
      return;
    }

    updateRecord((record) => ({
      ...record,
      futureAssets: {
        ...record.futureAssets,
        masterImageSelection: masterSelection,
        animationDirectorInput: {
          sceneId: firstMasterSceneId,
          projectMetadata: {
            projectName: record.projectName,
            platform: record.platform,
            targetDuration: record.targetDuration,
          },
          sceneData,
          creativeDirection: visual,
          universalPrompt,
          masterImageSelection: masterSelection,
        },
      },
    }));
  }, [generatedImagesByScene, hasMasterImageSelected, masterImageByScene, studioRecord.creativeDirection, studioRecord.futureAssets.animationDirectorInput, studioRecord.futureAssets.masterImageSelection, studioRecord.platform, studioRecord.projectName, studioRecord.scenes, studioRecord.targetDuration]);

  return (
    <section className="min-h-screen px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1120px]">
        <header className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">AI Production Studio</p>
              <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                Your production brief is ready.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-300">
                Review everything before generating scenes, image prompts, and animation prompts.
              </p>
              <p className="max-w-3xl text-sm leading-7 text-slate-400">
                This brief was prepared from your approved content strategy.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/45 px-4 py-3 md:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${saveState.status === "failed" ? "border-amber-300/30 bg-amber-400/10 text-amber-200" : saveState.status === "saving" ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100" : "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"}`}>
                  {saveBadge}
                </span>
                <span className="text-xs text-slate-400">{lastSavedLabel}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveVersion}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                >
                  Save Version
                </button>
                <button
                  type="button"
                  onClick={saveProject}
                  className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/60"
                >
                  Save Project
                </button>
                <button
                  type="button"
                  onClick={() => setIsVersionDrawerOpen(true)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                >
                  Version History
                </button>
                {saveState.status === "failed" ? (
                  <button
                    type="button"
                    onClick={() => saveProject()}
                    className="rounded-lg border border-amber-300/35 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:border-amber-200/60"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700/80 bg-slate-900/45 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Generated From</p>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="inline-flex items-center gap-1.5 font-medium text-slate-100">
                  <Check size={13} className="text-emerald-300" /> Viral Scanner
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Creative Direction</p>
                <p className="mt-1 text-slate-100">{brief.tone}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Platform</p>
                <p className="mt-1 text-slate-100">{brief.platform}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Target Length</p>
                <p className="mt-1 text-slate-100">{brief.targetVideoLength}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-900/50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              STEP {activeIndex + 1} OF {steps.length}
            </p>
            <div className="flex items-center gap-2.5" aria-label="Progress steps">
              {steps.map((step, index) => {
                const isCurrent = step.id === activeStep;
                const isPast = index < activeIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => updateRecord((record) => ({ ...record, currentStep: step.id }))}
                    aria-label={`Go to ${step.label}`}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      isCurrent ? "bg-cyan-300" : isPast ? "bg-slate-300" : "bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-sm text-slate-300">{steps[activeIndex].label}</p>
          </div>
        </header>

        <main className="mt-10 space-y-12">
          {activeStep === "creative-brief" ? (
            <section className="space-y-6">
              <SectionHeader title="Production Brief" subtitle="What are we producing?" />

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/45 px-4 py-4">
                <p className="text-sm leading-7 text-slate-200">
                  I&apos;ve prepared your production brief based on your approved strategy.
                </p>
                <p className="mt-1 text-sm leading-7 text-slate-300">
                  Please review it before we build the production plan.
                </p>
              </div>

              <div className="space-y-6">
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Project Summary</p>
                  <div className="grid gap-3 rounded-xl border border-slate-800/80 bg-slate-950/35 px-4 py-4 sm:grid-cols-3">
                    {[
                      ["Project Title", "projectTitle"],
                      ["Platform", "platform"],
                      ["Target Video Length", "targetVideoLength"],
                    ].map(([label, field]) => (
                      <label key={field} className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        <input
                          value={brief[field as keyof ProductionStudioBrief]}
                          onChange={(event) => setBriefField(field as keyof ProductionStudioBrief, event.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                        />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Production Objective</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      ["Audience", "audience"],
                      ["Goal", "goal"],
                      ["Tone", "tone"],
                    ].map(([label, field]) => (
                      <label key={field} className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        <textarea
                          value={brief[field as keyof ProductionStudioBrief]}
                          onChange={(event) => setBriefField(field as keyof ProductionStudioBrief, event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                        />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Message Strategy</p>
                  <div className="grid gap-3 rounded-xl border border-slate-800/80 bg-slate-950/35 px-4 py-4 sm:grid-cols-2">
                    {[
                      ["Hook", "hook"],
                      ["CTA", "cta"],
                    ].map(([label, field]) => (
                      <label key={field} className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                        <textarea
                          value={brief[field as keyof ProductionStudioBrief]}
                          onChange={(event) => setBriefField(field as keyof ProductionStudioBrief, event.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">What you'll receive</p>
                <div className="mt-3 space-y-2">
                  <ChecklistItem text="Scene-by-scene production plan" />
                  <ChecklistItem text="Image generation prompts" />
                  <ChecklistItem text="Animation prompts" />
                  <ChecklistItem text="Production guidance" />
                </div>
              </div>
            </section>

          ) : null}

          {activeStep === "scene-planner" ? (
            <section className="space-y-6">
              <SectionHeader title="Scene Planner" subtitle="How will the story flow?" />

              <div className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/45 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Story Flow</p>
                <div className="space-y-1.5 text-sm font-medium text-slate-100">
                  <p>HOOK</p>
                  <p className="text-slate-500">↓</p>
                  <p>PROBLEM</p>
                  <p className="text-slate-500">↓</p>
                  <p>EXPLANATION</p>
                  <p className="text-slate-500">↓</p>
                  <p>SOLUTION</p>
                  <p className="text-slate-500">↓</p>
                  <p>CALL TO ACTION</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/70 bg-slate-900/45 px-4 py-4">
                <p className="text-sm leading-7 text-slate-200">
                  I&apos;ve translated your approved strategy into a scene-by-scene production storyboard.
                </p>
                <p className="mt-1 text-sm leading-7 text-slate-300">
                  Each scene has one responsibility.
                </p>
                <p className="mt-1 text-sm leading-7 text-slate-300">
                  Review the complete story before generating image prompts and animation prompts.
                </p>
              </div>

              <div className="space-y-4">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className="space-y-2">
                    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/55 px-5 py-5 md:px-6 md:py-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">{scene.sceneLabel.replace(" ", " ")}</p>
                          <input
                            value={scene.beat}
                            onChange={(event) => setSceneField(scene.id, "beat", event.target.value)}
                            className="mt-1 w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-lg font-semibold text-white outline-none transition focus:border-cyan-300/60"
                          />
                        </div>
                        <span className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
                          {formatDurationBadge(scene.duration)}
                        </span>
                      </div>

                      <div className="mt-5 space-y-5">
                        <div className="grid gap-3 lg:grid-cols-2">
                          <label className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Purpose</p>
                            <textarea
                              value={scene.purpose}
                              onChange={(event) => setSceneField(scene.id, "purpose", event.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/60"
                            />
                          </label>
                          <label className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Goal</p>
                            <p className="rounded-lg border border-slate-700/70 bg-slate-950/35 px-3 py-2 text-sm leading-7 text-slate-200">
                              {sceneDirectorGuidance[scene.id]?.goal || scene.purpose}
                            </p>
                          </label>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Viewer Emotion</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(sceneDirectorGuidance[scene.id]?.viewerEmotion || ["Curiosity"]).map((emotion) => (
                              <EmotionChip key={`${scene.id}-${emotion}`} emotion={emotion} />
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Narration</p>
                          <p className="mt-2 whitespace-pre-line text-base leading-8 text-slate-100">
                            {sceneDirectorGuidance[scene.id]?.narration || scene.purpose}
                          </p>
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                          <label className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Visual</p>
                            <textarea
                              value={scene.visual}
                              onChange={(event) => setSceneField(scene.id, "visual", event.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/60"
                            />
                          </label>
                          <label className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Camera Direction</p>
                            <input
                              value={scene.camera}
                              onChange={(event) => setSceneField(scene.id, "camera", event.target.value)}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-7 text-slate-100 outline-none transition focus:border-cyan-300/60"
                            />
                          </label>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">🎥 Camera Direction</p>
                          <input
                            value={scene.movement}
                            onChange={(event) => setSceneField(scene.id, "movement", event.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition focus:border-cyan-300/60"
                          />
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Animation Direction</p>
                          <div className="mt-2 space-y-2">
                            {(sceneDirectorGuidance[scene.id]?.animationChecklist || ["Subtle scene motion"]).map((item) => (
                              <p key={`${scene.id}-${item}`} className="inline-flex items-center gap-2 text-sm text-slate-200">
                                <Check size={13} className="text-emerald-300" />
                                {item}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-700/70 bg-slate-950/35 px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Director Notes</p>
                          <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-slate-300">
                            {sceneDirectorGuidance[scene.id]?.directorNotes}
                          </p>
                        </div>
                      </div>
                    </div>
                      {index < scenes.length - 1 ? (
                      <div className="space-y-2 py-2 text-center">
                        <p className="h-px w-full bg-slate-800/80" />
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Continue Story</p>
                        <p className="text-slate-500">↓</p>
                        <p className="h-px w-full bg-slate-800/80" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeStep === "visual-prompt-builder" ? (
            <section className="space-y-6">
              <SectionHeader title="Visual Prompt Builder" subtitle="What should each scene look like?" />

              <div className="space-y-4 rounded-xl border border-slate-700/70 bg-slate-900/45 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Creative Brief</p>
                <p className="text-sm leading-7 text-slate-200">
                  I&apos;ve translated each scene into a visual language board so you can approve the look and feel before generation.
                </p>
                <p className="text-sm leading-7 text-slate-300">
                  Treat this as your AI Art Director workspace for framing, mood, and cinematic consistency.
                </p>
              </div>

              <div className="space-y-5">
                {scenes.map((scene, index) => {
                  const visual = creativeDirection[scene.id];
                  const universalPrompt = buildUniversalPromptForScene(scene, visual);
                  const sceneReferences = referenceBoard[scene.id] ?? [];
                  const sceneGeneratedImages = getSceneImages(scene.id);
                  const selectedGeneratedImage = getSelectedSceneImage(scene.id);
                  const compareModeEnabled = Boolean(compareModeByScene[scene.id]);
                  const compareSelection = compareSelectionByScene[scene.id] ?? [null, null];
                  const stats = buildPromptStats(scene.imagePrompt, visual);
                  const estimatedTokens = Math.max(1, Math.round(scene.imagePrompt.length / 4));
                  const isGenerating = generatingSceneId === scene.id;
                  const generationError = generationErrorByScene[scene.id] ?? "";
                  const productionScore = selectedGeneratedImage?.productionScore ?? 96;
                  const productionScoreLabel = `${productionScore}/100`;
                  const promptWordCount = universalPrompt.split(/\s+/).filter(Boolean).length;
                  const wordCountLabel = `${promptWordCount} words`;
                  const hasRequiredBriefContext = Boolean(
                    brief.projectTitle.trim() &&
                    brief.platform.trim() &&
                    brief.goal.trim() &&
                    brief.targetVideoLength.trim()
                  );
                  const hasScene = Boolean(scene.id);
                  const hasUniversalPrompt = Boolean(universalPrompt.trim());
                  const hasSceneMasterImage = Boolean(masterImageByScene[scene.id]);
                  const canPrepareStep4 = hasScene && hasUniversalPrompt && hasSceneMasterImage && hasRequiredBriefContext;
                  const step4MissingReason = !hasScene
                    ? "Scene is missing."
                    : !hasUniversalPrompt
                      ? "Universal prompt is missing."
                      : !hasSceneMasterImage
                        ? "Approve a Master Image first."
                        : !hasRequiredBriefContext
                          ? "Complete project brief context first."
                          : "";

                  return (
                    <div key={scene.id} className="space-y-3">
                      <article className="space-y-5 rounded-2xl border border-slate-700/70 bg-slate-900/55 px-5 py-5 md:px-6 md:py-6">
                        <header className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">{scene.sceneLabel}</p>
                          <h3 className="text-lg font-semibold text-white">{visual.title || scene.beat}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusPill label="Visual Approved" tone="good" />
                            <StatusPill label="Prompt Approved" tone="good" />
                            <StatusPill label="Ready for Image Generation" tone="info" />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill label="Estimated Production Time: 8-12s" tone="info" />
                            <StatusPill label="Image Resolution: 1024 × 1792" tone="info" />
                            <StatusPill label="Selected AI: GPT Image 2" tone="info" />
                            <StatusPill label="Scene Complexity: Moderate" tone="info" />
                          </div>
                        </header>

                        <section className="space-y-4 rounded-2xl border border-slate-700/70 bg-slate-950/35 px-4 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Generated Images</p>
                              <p className="mt-1 text-sm text-slate-400">Create, review, select, master, and continue.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCompareMode(scene.id)}
                              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${compareModeEnabled ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}
                            >
                              <ArrowLeftRight size={13} />
                              Compare Mode
                            </button>
                          </div>

                          <div className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Preview Canvas</p>
                                <p className="mt-1 text-sm font-medium text-slate-100">{selectedGeneratedImage ? selectedGeneratedImage.label : "No images generated yet."}</p>
                              </div>
                              {selectedGeneratedImage?.isMaster ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-gradient-to-r from-amber-300/20 to-cyan-300/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                                  <BadgeCheck size={11} />
                                  MASTER IMAGE
                                </span>
                              ) : null}
                            </div>

                            {isGenerating ? (
                              <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3.5 py-3 text-sm text-cyan-100">
                                {generationMessages[generationMessageIndex]}
                              </div>
                            ) : null}

                            {generationError ? (
                              <div className="space-y-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3.5 py-3 text-sm text-amber-100">
                                <p>{generationError}</p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => addGeneratedImage(scene.id)}
                                    className="rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100"
                                  >
                                    Retry
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleCopy(`${scene.id}-universal-prompt-fallback`, universalPrompt)}
                                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                                  >
                                    {copiedKey === `${scene.id}-universal-prompt-fallback` ? "Copied" : "Copy Universal Prompt"}
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/75 px-4 py-6 text-center">
                              {selectedGeneratedImage ? (
                                <div className="w-full max-w-[560px] space-y-3">
                                  <div className="mx-auto min-h-[220px] overflow-hidden rounded-2xl border border-slate-700/70 bg-[linear-gradient(160deg,rgba(34,211,238,0.08),rgba(15,23,42,0.96))]">
                                    {selectedGeneratedImage.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={selectedGeneratedImage.imageUrl}
                                        alt={`${scene.sceneLabel} ${selectedGeneratedImage.label}`}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex min-h-[220px] items-center justify-center px-6 py-6 text-center">
                                        <div className="space-y-2">
                                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-100">Large Preview</p>
                                          <p className="text-lg font-semibold text-white">{selectedGeneratedImage.label}</p>
                                          <p className="text-sm text-slate-300">{selectedGeneratedImage.aiUsed}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                                    <span className="rounded-full border border-slate-700 px-2 py-1">{selectedGeneratedImage.resolution}</span>
                                    <span className="rounded-full border border-slate-700 px-2 py-1">{selectedGeneratedImage.aspectRatio}</span>
                                    <span className="rounded-full border border-slate-700 px-2 py-1">Score {selectedGeneratedImage.productionScore}%</span>
                                  </div>
                                  <p className="text-sm text-slate-400">Selected image is always shown here.</p>
                                </div>
                              ) : (
                                <div className="max-w-md space-y-3">
                                  <p className="text-lg font-semibold text-slate-100">No images generated yet.</p>
                                  <p className="text-sm leading-7 text-slate-400">
                                    Generate an image inside Gatekeeper AI or copy the Universal Prompt and use your preferred AI platform.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                              <article className="h-full min-w-0 rounded-2xl border border-cyan-300/25 bg-cyan-400/5 p-4 sm:p-5 shadow-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Path A</p>
                                <h4 className="mt-2 text-base font-semibold text-white">Generate with GPT Image 2</h4>
                                <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                                  Generate a native key visual inside Gatekeeper AI using the configured GPT Image 2 workflow.
                                </p>
                                <button
                                  type="button"
                                  disabled={isGenerating}
                                  onClick={() => addGeneratedImage(scene.id)}
                                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/70 sm:w-auto"
                                >
                                  {isGenerating ? "Generating image..." : "Generate with GPT Image 2"}
                                </button>
                                <p className="mt-2 text-xs leading-5 text-slate-400">Preview workspace updates automatically after generation.</p>
                              </article>

                              <article className="h-full min-w-0 rounded-2xl border border-slate-700/80 bg-slate-900/45 p-4 sm:p-5 shadow-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Path B</p>
                                <h4 className="mt-2 text-base font-semibold text-white">Copy Universal Prompt</h4>
                                <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                                  Copy the universal prompt and paste it into your preferred external image engine.
                                </p>
                                <button
                                  type="button"
                                  disabled={isGenerating}
                                  onClick={() => void handleCopy(`${scene.id}-universal-prompt`, universalPrompt)}
                                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-500 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-slate-300 sm:w-auto"
                                >
                                  {copiedKey === `${scene.id}-universal-prompt` ? "Copied" : "Copy Universal Prompt"}
                                </button>
                                <p className="mt-2 text-xs leading-5 text-slate-400">Compatible with Google Flow, Midjourney, Flux, and Stable Diffusion.</p>
                              </article>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Filmstrip</p>
                                <p className="mt-1 text-sm text-slate-400">Horizontal image gallery</p>
                              </div>
                              <span className="text-xs text-slate-500">{sceneGeneratedImages.length} images</span>
                            </div>

                            {sceneGeneratedImages.length ? (
                              <div className="overflow-x-auto pb-1">
                                <div className="flex min-w-max gap-3">
                                  {sceneGeneratedImages.map((image) => {
                                    const isSelected = selectedGeneratedImage?.id === image.id;
                                    const compareSlot = compareSelectionByScene[scene.id] ?? [null, null];
                                    const isCompareLeft = compareSlot[0] === image.id;
                                    const isCompareRight = compareSlot[1] === image.id;

                                    return (
                                      <button
                                        key={image.id}
                                        type="button"
                                        onClick={() => {
                                          if (compareModeEnabled) {
                                            pickCompareImage(scene.id, image.id);
                                          } else {
                                            setSelectedSceneImage(scene.id, image.id);
                                          }
                                        }}
                                        className={`group w-[188px] rounded-2xl border p-3 text-left transition ${isSelected ? "border-cyan-300 bg-cyan-500/10" : "border-slate-700/80 bg-slate-900/45 hover:border-slate-500"}`}
                                      >
                                        <div className="relative flex min-h-[130px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/65 text-center">
                                          {image.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              src={image.imageUrl}
                                              alt={`${scene.sceneLabel} ${image.label}`}
                                              className="h-full w-full rounded-xl object-cover"
                                            />
                                          ) : (
                                            <div className="space-y-1">
                                              <p className="text-sm font-medium text-slate-200">Preview</p>
                                              <p className="text-xs text-slate-400">{image.aiUsed}</p>
                                            </div>
                                          )}
                                          {image.isMaster ? (
                                            <span className="absolute left-2 top-2 rounded-full border border-amber-300/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                                              MASTER IMAGE
                                            </span>
                                          ) : null}
                                          {isSelected ? (
                                            <span className="absolute right-2 top-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100">
                                              Selected
                                            </span>
                                          ) : null}
                                          {isCompareLeft || isCompareRight ? (
                                            <span className="absolute bottom-2 left-2 rounded-full border border-slate-700 bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200">
                                              {isCompareLeft ? "Left" : "Right"}
                                            </span>
                                          ) : null}
                                        </div>

                                        <div className="mt-3 space-y-1">
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-white">{image.label}</p>
                                            <span
                                              role="button"
                                              tabIndex={0}
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                toggleFavoriteImage(scene.id, image.id);
                                              }}
                                              onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                  event.preventDefault();
                                                  event.stopPropagation();
                                                  toggleFavoriteImage(scene.id, image.id);
                                                }
                                              }}
                                              className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300"
                                            >
                                              <Star size={11} className={image.favorite ? "fill-yellow-300 text-yellow-300" : "text-slate-400"} />
                                              {image.favorite ? "Favorite" : "Star"}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            <span className="rounded-full border border-slate-700 px-2 py-1">{image.resolution}</span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1">Score {image.productionScore}%</span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    disabled={isGenerating}
                                    onClick={() => addGeneratedImage(scene.id)}
                                    className="flex w-[96px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/35 px-3 py-3 text-slate-400 transition hover:border-cyan-300/40 hover:text-cyan-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-4 py-6 text-center text-sm text-slate-400">
                                <p className="text-base font-semibold text-slate-100">No images generated yet.</p>
                                <p className="mt-2 leading-7">Generate an image inside Gatekeeper AI or copy the Universal Prompt and use your preferred AI platform.</p>
                              </div>
                            )}
                          </div>

                          {selectedGeneratedImage?.isMaster ? (
                            <div className="rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-300/10 to-cyan-300/10 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-100">MASTER IMAGE</p>
                              <p className="mt-1.5 text-sm text-slate-200">Approved as Master Image</p>
                              <p className="mt-1 text-sm text-cyan-100">Ready for Step 4 handoff</p>
                              <p className="mt-2 text-sm text-slate-200">This image will be used by:</p>
                              <div className="mt-2 grid gap-1 text-sm text-slate-200 sm:grid-cols-2">
                                {[
                                  "Animation Director",
                                  "Voice Studio",
                                  "Video Production",
                                  "Final Export",
                                ].map((pipelineStage) => (
                                  <p key={`${scene.id}-master-usage-${pipelineStage}`} className="inline-flex items-center gap-2">
                                    <Check size={13} className="text-emerald-300" />
                                    {pipelineStage}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ) : null}

                                  {compareModeEnabled && compareSelection[0] && compareSelection[1] ? (
                            <div className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Compare View</p>
                                <p className="text-xs text-slate-400">Select two thumbnails in compare mode.</p>
                              </div>
                              <div className="grid gap-3 lg:grid-cols-2">
                                {[compareSelection[0], compareSelection[1]].map((imageId, index) => {
                                  const image = sceneGeneratedImages.find((item) => item.id === imageId) ?? null;
                                  return (
                                    <div key={`${scene.id}-compare-${index}`} className="space-y-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{index === 0 ? "Left" : "Right"}</p>
                                      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/60 text-center">
                                        {image ? (
                                          <div className="space-y-1.5">
                                            <p className="text-sm font-semibold text-white">{image.label}</p>
                                            <p className="text-sm text-slate-400">{image.aiUsed}</p>
                                            <p className="text-xs text-slate-500">{image.resolution} • Score {image.productionScore}%</p>
                                          </div>
                                        ) : (
                                          <p className="text-sm text-slate-500">Select another image</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Selected Image</p>
                                {selectedGeneratedImage?.favorite ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/30 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-yellow-200">
                                    <Star size={11} className="fill-yellow-300 text-yellow-300" />
                                    Favorite
                                  </span>
                                ) : null}
                              </div>
                              {selectedGeneratedImage ? (
                                <div className="grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                                  <PromptStat label="AI Used" value={selectedGeneratedImage.aiUsed} />
                                  <PromptStat label="Resolution" value={selectedGeneratedImage.resolution} />
                                  <PromptStat label="Aspect Ratio" value={selectedGeneratedImage.aspectRatio} />
                                  <PromptStat label="Prompt Version" value={selectedGeneratedImage.promptVersion} />
                                  <PromptStat label="Created Time" value={formatSavedTimeLabel(selectedGeneratedImage.createdAt)} />
                                  <PromptStat label="Production Score" value={`${selectedGeneratedImage.productionScore}%`} />
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-4 py-5 text-sm text-slate-400">
                                  No image is selected yet.
                                </div>
                              )}
                            </div>

                            <div className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-900/55 p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Actions</p>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedGeneratedImage) {
                                      handleApproveImage(scene.id, selectedGeneratedImage.id);
                                    }
                                  }}
                                  disabled={!selectedGeneratedImage || isGenerating}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <BadgeCheck size={12} />
                                  Approve as Master Image
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedGeneratedImage) {
                                      toggleFavoriteImage(scene.id, selectedGeneratedImage.id);
                                    }
                                  }}
                                  disabled={!selectedGeneratedImage || isGenerating}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Star size={12} className="text-yellow-300" />
                                  Favorite
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleCompareMode(scene.id)}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                                >
                                  <ArrowLeftRight size={12} />
                                  Compare
                                </button>
                                <button
                                  type="button"
                                  disabled={isGenerating}
                                  onClick={() => addGeneratedImage(scene.id)}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                                >
                                  <RefreshCw size={12} />
                                  Regenerate
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedGeneratedImage) {
                                      deleteGeneratedImage(scene.id, selectedGeneratedImage.id);
                                    }
                                  }}
                                  disabled={!selectedGeneratedImage || isGenerating}
                                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                              <div className="rounded-xl border border-slate-700/70 bg-slate-950/45 px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => prepareAnimationHandoff(scene.id)}
                                  disabled={!canPrepareStep4 || isGenerating}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {canPrepareStep4 ? "Prepare Animation Handoff" : "Ready for Step 4"}
                                </button>
                                <p className="mt-2 text-xs text-slate-400">
                                  {canPrepareStep4
                                    ? "Handoff payload includes scene id, scene title, master image id/url, universal prompt, brief context, and continuity notes."
                                    : step4MissingReason}
                                </p>
                              </div>
                            </div>
                          </div>

                          <CollapsiblePanel title="Universal Production Prompt" defaultOpen={false}>
                            <div className="space-y-2">
                              <p className="text-sm text-slate-300">This prompt is optimized for multiple AI image platforms.</p>
                              <textarea
                                value={universalPrompt}
                                readOnly
                                className="min-h-[140px] w-full resize-y rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 font-mono text-xs leading-6 text-slate-200 outline-none"
                              />
                            </div>
                          </CollapsiblePanel>
                        </section>

                        <section className="space-y-2 rounded-xl border border-slate-700/70 bg-slate-950/30 px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Creative Brief</p>
                          <textarea
                            value={visual.visualConcept}
                            onChange={(event) => setCreativeDirectionField(scene.id, "visualConcept", event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/60"
                          />
                          <div className="flex flex-wrap gap-2">
                            {visual.viewerEmotion.map((emotion) => (
                              <EmotionChip key={`${scene.id}-direction-${emotion}`} emotion={emotion} />
                            ))}
                          </div>
                          <div className="grid gap-2 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="space-y-2">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Visual Goal</p>
                              <input
                                value={visual.goal}
                                onChange={(event) => setCreativeDirectionField(scene.id, "goal", event.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                              />
                            </label>
                            <label className="space-y-2">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Mood</p>
                              <input
                                value={visual.mood.join(" • ")}
                                onChange={(event) => setCreativeDirectionField(scene.id, "mood", event.target.value.split("•").map((entry) => entry.trim()).filter(Boolean))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                              />
                            </label>
                            <label className="space-y-2 sm:col-span-2 lg:col-span-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Director Notes</p>
                              <textarea
                                value={visual.directorNotes}
                                onChange={(event) => setCreativeDirectionField(scene.id, "directorNotes", event.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/60"
                              />
                            </label>
                          </div>
                        </section>

                        <CollapsiblePanel title="Reference Board" defaultOpen={false}>
                          <p className="text-sm text-slate-300">Allow users to gather visual inspiration before generating images.</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {[
                              { title: "+ Upload Reference", desc: "Add an inspiration frame.", source: "Upload" },
                              { title: "Pinterest", desc: "Mood and composition ideas.", source: "Pinterest" },
                              { title: "Instagram", desc: "Style and framing references.", source: "Instagram" },
                              { title: "Screenshot", desc: "Capture a visual cue quickly.", source: "Screenshot" },
                              { title: "Previous Scene", desc: "Keep continuity between frames.", source: "Internal" },
                            ].map((item) => (
                              <button
                                key={`${scene.id}-${item.title}`}
                                type="button"
                                onClick={() => addReference(scene.id, item.title, item.desc, item.source)}
                                className="rounded-xl border border-slate-700/80 bg-slate-900/45 px-3 py-3 text-left transition hover:border-slate-500"
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/60 text-xs font-semibold text-slate-300">
                                  •
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-100">{item.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</p>
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 space-y-3">
                            {sceneReferences.length > 0 ? (
                              sceneReferences.map((reference) => (
                                <div key={reference.id} className="space-y-3 rounded-xl border border-slate-700/80 bg-slate-900/45 px-3 py-3">
                                  <div className="grid gap-3 md:grid-cols-3">
                                    <input
                                      value={reference.title}
                                      onChange={(event) => updateReference(scene.id, reference.id, "title", event.target.value)}
                                      className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                                    />
                                    <input
                                      value={reference.source}
                                      onChange={(event) => updateReference(scene.id, reference.id, "source", event.target.value)}
                                      className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeReference(scene.id, reference.id)}
                                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  <textarea
                                    value={reference.description}
                                    onChange={(event) => updateReference(scene.id, reference.id, "description", event.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/60"
                                  />
                                </div>
                              ))
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
                                No references added yet. Use the quick-add cards above to populate this board.
                              </div>
                            )}
                          </div>
                        </CollapsiblePanel>

                        <CollapsiblePanel title="Production Metadata" defaultOpen={false}>
                          <div className="flex flex-wrap gap-2">
                            {[
                              visual?.lens || "35mm",
                              visual?.lighting || "Natural",
                              visual?.composition || "Medium Shot",
                              stats.aspectRatio,
                              visual?.cameraPosition || "Eye Level",
                              visual?.colorPalette || "Neutral",
                            ].map((chip) => (
                              <span
                                key={`${scene.id}-${chip}`}
                                className="rounded-full border border-slate-600/80 bg-slate-900/45 px-3 py-1 text-xs font-medium text-slate-200"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        </CollapsiblePanel>

                        <details className="group rounded-xl border border-slate-700/70 bg-slate-950/30 px-4 py-3">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100">Generated Prompt</summary>
                          <div className="mt-3 space-y-4 border-t border-slate-800/80 pt-3">
                            <div className="rounded-lg border border-slate-700/70 bg-[#0f172a]/85 px-3.5 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Prompt Editor</p>
                                  <p className="mt-1 text-[10px] text-slate-500">Syntax-inspired workspace</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                                  <span className="rounded-full border border-slate-700 px-2 py-1">Character Count: {scene.imagePrompt.length}</span>
                                  <span className="rounded-full border border-slate-700 px-2 py-1">Estimated Tokens: {estimatedTokens}</span>
                                  <span className="rounded-full border border-slate-700 px-2 py-1">AI Compatibility: GPT Image 2</span>
                                  <span className="rounded-full border border-slate-700 px-2 py-1">Prompt Version: {versionHistory[versionHistory.length - 1]?.name ?? "Version 1"}</span>
                                </div>
                              </div>
                              <div className="my-3 h-px bg-slate-800/80" />
                              <textarea
                                value={scene.imagePrompt}
                                onChange={(event) => setSceneField(scene.id, "imagePrompt", event.target.value)}
                                className="min-h-[150px] w-full resize-y rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2.5 font-mono text-xs leading-6 text-slate-200 outline-none"
                              />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                              {[
                                "Copy",
                                "Improve",
                                "Expand",
                                "Edit",
                                "Reset",
                                "History",
                              ].map((action) => (
                                <button
                                  key={`${scene.id}-${action}`}
                                  type="button"
                                  onClick={action === "Copy" ? () => void handleCopy(`${scene.id}-image`, scene.imagePrompt) : undefined}
                                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500"
                                >
                                  {action === "Copy" && copiedKey === `${scene.id}-image` ? "Copied" : action}
                                </button>
                              ))}
                            </div>

                            <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="rounded-lg border border-slate-700/70 bg-slate-900/45 px-3 py-2">Character Count: {scene.imagePrompt.length}</div>
                              <div className="rounded-lg border border-slate-700/70 bg-slate-900/45 px-3 py-2">Estimated Tokens: {estimatedTokens}</div>
                              <div className="rounded-lg border border-slate-700/70 bg-slate-900/45 px-3 py-2">AI Compatibility: GPT Image 2</div>
                              <div className="rounded-lg border border-slate-700/70 bg-slate-900/45 px-3 py-2">Prompt Version: {versionHistory[versionHistory.length - 1]?.name ?? "Initial Draft"}</div>
                            </div>

                            <div className="space-y-2 rounded-lg border border-slate-700/70 bg-slate-900/45 px-3.5 py-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Prompt History</p>
                              <div className="grid gap-2 sm:grid-cols-3">
                                {versionHistory.slice(-3).map((version) => (
                                  <button
                                    key={`${scene.id}-${version.id}-prompt`}
                                    type="button"
                                    className="rounded-lg border border-slate-700 bg-slate-950/55 px-3 py-2 text-xs font-semibold text-slate-300"
                                  >
                                    {version.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </details>

                        <CollapsiblePanel title="Prompt Statistics" defaultOpen={false}>
                          <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                            <PromptStat label="Prompt Length" value={`${stats.promptLength} chars`} />
                            <PromptStat label="Word Count" value={wordCountLabel} />
                            <PromptStat label="Style" value={stats.style} />
                            <PromptStat label="Aspect Ratio" value={stats.aspectRatio} />
                            <PromptStat label="Lens" value={stats.lens} />
                            <PromptStat label="Lighting" value={stats.lighting} />
                            <PromptStat label="Subject Count" value={`${stats.subjectCount}`} />
                          </div>
                        </CollapsiblePanel>

                        <CollapsiblePanel title="Production Score" defaultOpen={false}>
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">Overall Score</p>
                                <p className="text-3xl font-semibold text-white">{productionScoreLabel}</p>
                              </div>
                              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                                Production Ready
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800">
                              <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${productionScore}%` }} />
                            </div>
                            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                              {[
                                ["Composition", "Excellent"],
                                ["Lighting", "Excellent"],
                                ["Framing", "Excellent"],
                                ["Readability", "Passed"],
                                ["Subject Clarity", "Excellent"],
                                ["Camera", "Passed"],
                                ["Color Harmony", "Passed"],
                                ["Subtitle Safe Zone", "Passed"],
                                ["Motion Safe", "Passed"],
                                ["Platform Ready", "Excellent"],
                              ].map(([label, value]) => (
                                <PromptStat key={`${scene.id}-${label}`} label={label} value={value} />
                              ))}
                            </div>
                          </div>
                        </CollapsiblePanel>

                        <CollapsiblePanel title="AI Director Notes" defaultOpen={false}>
                          <div className="space-y-2 text-sm leading-6 text-slate-200">
                            {["Protect subtitle safe zones in the lower third and avoid critical content near edges.", "Leave breathing room for overlays so titles never compete with the main subject.", "Maintain eye contact cues when talent appears to preserve audience trust.", "Preserve lighting consistency across adjacent shots to avoid visual jumps.", "Maintain wardrobe and prop continuity to protect narrative credibility.", "Avoid distracting backgrounds that pull focus from the message.", "Keep camera movement style consistent with the scene pacing strategy."].map((note) => (
                              <p key={`${scene.id}-note-${note}`} className="rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">{note}</p>
                            ))}
                          </div>
                        </CollapsiblePanel>

                        <CollapsiblePanel title="Prompt Tips" defaultOpen={false}>
                          <p className="text-sm text-slate-300">This prompt is optimized for:</p>
                          <div className="mt-2 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
                            <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> GPT Image 2</p>
                            <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Midjourney</p>
                            <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Flux</p>
                            <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Gemini</p>
                            <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Stable Diffusion</p>
                          </div>
                        </CollapsiblePanel>

                        <CollapsiblePanel title="Quality Checklist" defaultOpen={false}>
                          <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                            {["Subject clear", "Lighting defined", "Composition defined", "Aspect ratio ready", "Cinematic framing"].map((item) => (
                              <p key={`${scene.id}-quality-${item}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2">
                                <Check size={13} className="text-emerald-300" /> {item}
                              </p>
                            ))}
                          </div>
                        </CollapsiblePanel>
                      </article>

                      {index < scenes.length - 1 ? (
                        <div className="space-y-3 py-1">
                          <CollapsiblePanel title="Continuity Review" defaultOpen={false}>
                            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                              {[
                                "Wardrobe",
                                "Props",
                                "Lighting",
                                "Color Grade",
                                "Camera Angle",
                                "Lens",
                                "Character Position",
                                "Time of Day",
                                "Environment",
                                "Weather",
                                "Visual Style",
                                "Subtitle Safe Zone",
                              ].map((item) => (
                                <span key={`${scene.id}-${item}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/45 px-3 py-2 text-sm text-slate-200">
                                  <Check size={11} className="text-emerald-300" />
                                  {item}
                                </span>
                              ))}
                            </div>
                          </CollapsiblePanel>

                          <div className="space-y-1 py-1 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next Scene</p>
                            <p className="text-slate-500">↓</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <section className="space-y-3 rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Image Production Complete</p>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Overall Production Progress</p>
                    <p className="mt-1 text-3xl font-semibold text-white">100%</p>
                  </div>
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Image Production Complete
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div className="h-2 rounded-full bg-cyan-300" style={{ width: "100%" }} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-slate-700/70 bg-slate-950/35 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">Completed</p>
                    <div className="space-y-2 text-sm text-slate-200">
                      <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Story</p>
                      <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Creative Direction</p>
                      <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Visual Concepts</p>
                      <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Reference Board</p>
                      <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Prompt Optimization</p>
                      <p className="inline-flex items-center gap-2"><Check size={13} className="text-emerald-300" /> Image Prompt Ready</p>
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl border border-slate-700/70 bg-slate-950/35 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">Next Step</p>
                    <div className="space-y-2 text-sm text-slate-200">
                      <p className="inline-flex items-center gap-2 text-slate-300">↓</p>
                      <p className="inline-flex items-center gap-2 text-slate-300">Animation Director</p>
                      <p className="inline-flex items-center gap-2 text-slate-300">Motion Prompt Optimization</p>
                      <p className="inline-flex items-center gap-2 text-slate-300">Copy Prompt</p>
                      <p className="inline-flex items-center gap-2 text-slate-300">Open Google Flow or OpenAI Sora</p>
                    </div>
                  </div>
                </div>
              </section>
            </section>
          ) : null}

          {activeStep === "animation-prompt-builder" ? (
            <section className="space-y-8">
              <div className="space-y-4 rounded-2xl border border-slate-700/60 bg-slate-900/45 p-4 sm:p-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Animation Director</p>
                  <h3 className="text-2xl font-semibold text-white">Transform your approved static frame into renderer-ready motion direction.</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {animationRendererOptions.map((option) => {
                    const isActive = option.id === selectedRenderer;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedRenderer(option.id)}
                        className={`min-h-12 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-slate-950 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="text-left">{option.label}</span>
                          {option.badge ? (
                            <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
                              {option.badge}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400 font-mono break-words">
                  {selectedRenderer === "sora-2" ? "→ Balanced cinematic simulations | Rapid engine text processing" : selectedRenderer === "sora-2-pro" ? "→ Premium volumetric depth scale | Extended motion tracking" : "→ Physics-aware fluid vectors | High-fidelity cinematic loops"}
                </p>
                <p className="text-sm leading-6 text-slate-500">{activeRendererOption.optimizationCopy}</p>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-4">
                  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Approved Static Composition Frame - Reference Only</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {animationInput ? `${animationInput.sceneLabel} - ${animationInput.sceneTitle}` : "Master Image Required"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Reference Only</span>
                    </div>

                    {animationInput?.masterImageUrl ? (
                      <div className="mt-4 space-y-4">
                        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={animationInput.masterImageUrl}
                            alt={`${animationInput.sceneLabel} approved master image`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-400 font-mono mt-3 px-1 border-t border-slate-50 pt-3 min-w-0">
                          <span className="break-words">
                            Scene 04 | Tamparuli Courtyard | Duration: 8s | Status: Locked Reference Composition
                          </span>
                        </div>
                        <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-slate-900">Scene:</span> {animationInput.sceneLabel}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-900">Scene Number:</span> {extractSceneNumber(animationInput.sceneLabel) ?? "N/A"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Inherited Visual Prompt Summary</p>
                          <p className="mt-1 break-words">{animationInput.universalPrompt}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm leading-7 text-slate-600">
                        Step 4 requires an approved Master Image from Step 3.
                      </div>
                    )}
                  </article>
                </div>

                <div className="min-w-0">
                  <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    {animationPrompt ? (
                      <div className="space-y-1 border-l-4 border-slate-900 pl-4 py-1 transition-all duration-300">
                        <p className="text-sm font-semibold tracking-wide text-slate-950 uppercase">
                          ✓ ANIMATION PROMPT LOCKED & READY
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                          Move to your external target app to execute rendering. Creative direction optimized for {selectedRenderer === "sora-2" ? "OpenAI Sora 2" : selectedRenderer === "sora-2-pro" ? "OpenAI Sora 2 Pro" : "Google Flow"}.
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                        Animation Prompt Direction
                      </div>
                    )}
                    <section className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Generation Status</p>
                      {isGeneratingAnimationPrompt ? (
                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          {animationGenerationMessages.map((message, index) => {
                            const isActive = index <= animationGenerationStageIndex;
                            return (
                              <p
                                key={message}
                                className={`text-sm leading-6 ${isActive ? "text-slate-900" : "text-slate-400"}`}
                              >
                                {isActive ? "✓" : "•"} {message}
                              </p>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-slate-700">
                          {isAnimationPromptReady ? "Prompt generated and ready for external rendering workflow." : "Ready to generate motion direction from the approved Step 3 handoff context."}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => void generateAnimationPromptFromHandoff()}
                        disabled={!canGenerateAnimationPrompt || isGeneratingAnimationPrompt}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-slate-100 px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {isGeneratingAnimationPrompt ? "Generating Animation Prompt..." : "Generate Animation Prompt"}
                      </button>
                    </section>

                    <section className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Final Animation Prompt</p>
                      <textarea
                        value={animationPrompt}
                        readOnly
                        placeholder="Generate Animation Prompt to create your renderer-ready motion script."
                        className="min-h-[320px] w-full resize-y break-words rounded-2xl bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-50 shadow-sm outline-none"
                      />
                    </section>

                    <section className="space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Analysis</p>
                      <div className="space-y-4">
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Camera Motion</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{(animationPromptAnalysis ?? defaultAnimationAnalysis).cameraMotion}</p>
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject Motion</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{(animationPromptAnalysis ?? defaultAnimationAnalysis).subjectMotion}</p>
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Environmental Motion</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{(animationPromptAnalysis ?? defaultAnimationAnalysis).environmentalMotion}</p>
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Continuity Safeguards</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{(animationPromptAnalysis ?? defaultAnimationAnalysis).continuitySafeguards}</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <button
                        type="button"
                        onClick={() => void copyPromptAndOpenPlatform()}
                        disabled={!isAnimationPromptReady}
                        className="h-12 w-full rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {copiedAnimationPrompt ? "✓ Prompt Copied" : "Copy Prompt & Open Platform"}
                      </button>
                      <p className="text-xs leading-6 text-slate-600">
                        Rendering occurs entirely on external servers. Paste your copied script direction into your destination engine to process the asset.
                      </p>
                    </section>
                  </article>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === "review" ? (
            <section className="space-y-8">
              <SectionHeader title="Voice & Audio" subtitle="Narration and acoustic planning workspace" />

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-4">
                  <article className="space-y-3 rounded-2xl bg-slate-900/45 p-4 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Production Context Reference</p>
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-slate-800">
                        {studioRecord.futureAssets.masterImageSelection?.masterImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={studioRecord.futureAssets.masterImageSelection.masterImage}
                            alt="Locked reference frame"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">No frame</div>
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-[11px] font-mono text-slate-400 break-words">Scene 04 | Locked Reference Frame</p>
                        <p className="text-sm text-slate-300 break-words">Camera Direction: Wide-angle panning tracking arc.</p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="min-w-0">
                  <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <section className="space-y-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {[
                          { id: "narrator-mode" as const, label: "Narrator Mode" },
                          { id: "executive-tone" as const, label: "Executive Tone" },
                          { id: "dynamic-pace" as const, label: "Dynamic Pace" },
                        ].map((option) => {
                          const isActive = selectedVoicePersona === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSelectedVoicePersona(option.id)}
                              className={`h-12 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-slate-950 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-slate-400 font-mono break-words">
                        {selectedVoicePersona === "narrator-mode" ? "→ Tailoring cadence tokens for slow, deep cinematic documentary delivery." : selectedVoicePersona === "executive-tone" ? "→ Adjusting vocabulary constraints for corporate and professional real estate overviews." : "→ Formatting short, punchy hooks optimized for high-retention social content."}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Narration Script Blueprint</p>
                      <textarea
                        value={narrationScript}
                        onChange={(event) => setNarrationScript(event.target.value)}
                        className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 shadow-sm outline-none"
                        placeholder={defaultNarrationScript}
                      />
                    </section>

                    <section className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acoustic Background Direction (Suno / Udio Prompt)</p>
                      <div className="rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100">
                        {acousticBackgroundPrompt}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <button
                        type="button"
                        onClick={() => void copyAudioBlueprintPackage()}
                        className="h-12 w-full rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        {copiedAudioBlueprint ? "✓ Package Copied" : "Copy Audio Blueprint Package"}
                      </button>
                      <p className="text-xs leading-6 text-slate-500">
                        Creative planning workspace only. Copying captures both your text dialogue and optimized Suno/Udio prompts for manual processing on external audio platforms.
                      </p>
                    </section>
                  </article>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === "export-prompts" ? (
            <section className="space-y-8 min-w-0">
              <SectionHeader title="Publishing" subtitle="Pre-flight staging workspace for caption refinement and metadata organization" />

              <div className="mb-6 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowPublishingInheritedContext((value) => !value)}
                  className="h-12 w-full text-left font-mono text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100"
                >
                  {showPublishingInheritedContext ? "▾" : "▸"} Inherited Campaign Context
                </button>

                {showPublishingInheritedContext ? (
                  <div className="mt-3 space-y-4 font-mono text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-slate-700">Inherited Project Title</p>
                      <p className="break-words whitespace-pre-wrap">{inheritedProjectTitle}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-slate-700">Target Platform</p>
                      <p className="break-words whitespace-pre-wrap">{inheritedTargetPlatform}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-slate-700">Approved Phase 2 Post Caption</p>
                      <p className="break-words whitespace-pre-wrap">{inheritedApprovedCaption}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-slate-700">Phase 4 Production Manifest</p>
                      <p className="break-words whitespace-pre-wrap">{inheritedManifestPreview}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 min-w-0">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    { id: "facebook-core" as const, label: "Facebook Core" },
                    { id: "instagram-reels" as const, label: "Instagram Reels" },
                    { id: "tiktok-business" as const, label: "TikTok Business" },
                  ].map((option) => {
                    const isActive = selectedPublishingPlatform === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedPublishingPlatform(option.id)}
                        className={`h-12 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-slate-950 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-slate-400 font-mono break-words">
                  {publishingConfigMessage}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] min-w-0">
                <div className="min-w-0">
                  <article className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 sm:p-6">
                    <p className="text-sm font-semibold tracking-wide text-slate-950">Finalized Production Plan Context — Reference Only</p>
                    <div className="space-y-5 min-w-0">
                      {scenes.map((scene, index) => {
                        const sceneNumber = String(index + 1).padStart(2, "0");
                        const sceneTitle = (sceneTitleFallbackById[scene.id] ?? creativeDirection[scene.id]?.title ?? scene.beat).toUpperCase();
                        const visualPrompt = buildUniversalPromptForScene(scene, creativeDirection[scene.id]) || scene.imagePrompt || "Visual prompt unavailable.";
                        const narrationLine = (narrationScript.trim() || defaultNarrationScript).split("\n")[0] || defaultNarrationScript;

                        return (
                          <div key={`publishing-reference-${scene.id}`} className="space-y-2 border-t border-slate-50 pt-4 first:border-t-0 first:pt-0 min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 break-words">{`SCENE ${sceneNumber} : ${sceneTitle}`}</p>
                            <p className="font-mono bg-slate-50 p-4 rounded-xl text-sm leading-6 text-slate-700 break-words whitespace-pre-wrap">{visualPrompt}</p>
                            <p className="font-mono bg-slate-50 p-4 rounded-xl text-sm leading-6 text-slate-700 break-words whitespace-pre-wrap">{`Locked Narration: ${narrationLine}`}</p>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </div>

                <div className="min-w-0">
                  <article className="space-y-6 bg-white p-4 sm:p-6">
                    <section className="space-y-3">
                      <p className="text-sm font-semibold tracking-wide text-slate-950">Final Post Caption Blueprint</p>
                      <textarea
                        value={publishingCaptionBlueprint}
                        onChange={(event) => setPublishingCaptionBlueprint(event.target.value)}
                        className="min-h-[380px] w-full resize-y rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-50 shadow-sm outline-none break-words whitespace-pre-wrap"
                      />
                    </section>

                    <section className="space-y-3 border-t border-slate-100 pt-4">
                      {copiedPublishingPayload ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                          ✓ PUBLISHING PAYLOAD DISPATCHED
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleCopyPublishingPayloadAndOpenChannel()}
                        className="h-12 w-full rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        {copiedPublishingPayload ? "✓ Publishing Payload Dispatched" : "Continue to AI Content Intelligence"}
                      </button>
                      <p className="text-xs leading-6 text-slate-500 break-words">
                        Direct background API posting is restricted. Copying secures your optimized caption payload for manual insertion into your target publishing network.
                      </p>
                    </section>
                  </article>
                </div>
              </div>

              <section className="space-y-8 border-t border-slate-100 pt-8 min-w-0">
                <SectionHeader title="AI Content Intelligence" subtitle="Manual post-mortem strategic reflection deck" />

                <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-6 min-w-0">
                  <p className="text-sm font-semibold tracking-wide text-slate-950">Inherited Publishing Dispatch Context (Read-only)</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Selected Channel</p>
                      <p className="text-sm leading-6 text-slate-700 break-words whitespace-pre-wrap">{intelligencePublishingRecord?.selectedChannelLabel || "Not dispatched yet"}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Dispatch Timestamp</p>
                      <p className="text-sm leading-6 text-slate-700 break-words whitespace-pre-wrap">{intelligencePublishingRecord?.dispatchedAt || "Not dispatched yet"}</p>
                    </div>
                    <div className="space-y-1 min-w-0 sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Published Payload</p>
                      <p className="text-sm leading-6 text-slate-700 break-words whitespace-pre-wrap">{intelligencePublishingRecord?.dispatchedPayload || "No publishing payload found yet."}</p>
                    </div>
                    <div className="space-y-1 min-w-0 sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Production Manifest Summary</p>
                      <p className="text-sm leading-6 text-slate-700 break-words whitespace-pre-wrap">{intelligencePublishingRecord?.sourceManifestSummary || inheritedManifestPreview}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-b border-slate-100 pb-6 min-w-0">
                  <p className="text-sm font-semibold tracking-wide text-slate-950">Post-Mortem Performance Logs</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 min-w-0">
                    <label className="space-y-2 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Reach</p>
                      <input
                        value={intelligenceReach}
                        onChange={(event) => setIntelligenceReach(event.target.value)}
                        placeholder="e.g., 12,500"
                        className="bg-white border border-slate-200 h-12 rounded-lg px-3 text-sm focus:border-slate-400 focus:outline-none w-full"
                      />
                    </label>

                    <label className="space-y-2 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Engagement</p>
                      <input
                        value={intelligenceEngagement}
                        onChange={(event) => setIntelligenceEngagement(event.target.value)}
                        placeholder="e.g., 850"
                        className="bg-white border border-slate-200 h-12 rounded-lg px-3 text-sm focus:border-slate-400 focus:outline-none w-full"
                      />
                    </label>

                    <label className="space-y-2 min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Link Clicks / DMs</p>
                      <input
                        value={intelligenceLinkClicks}
                        onChange={(event) => setIntelligenceLinkClicks(event.target.value)}
                        placeholder="e.g., 42"
                        className="bg-white border border-slate-200 h-12 rounded-lg px-3 text-sm focus:border-slate-400 focus:outline-none w-full"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)] min-w-0">
                  <div className="min-w-0">
                    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 space-y-4 min-w-0">
                      <div>
                        <p className="text-sm font-semibold tracking-wide text-slate-950">Historical Asset Execution Context</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Read-only condensed context inherited from previous production phases.</p>
                      </div>

                      {hasHistoricalContext ? (
                        <div className="space-y-5 min-w-0">
                          <div className="border-t border-slate-50 pt-5 space-y-3 min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400">VISUAL PROMPT SUMMARY</p>
                            <p className="text-sm leading-6 text-slate-600 break-words whitespace-pre-wrap">{intelligenceHistoricalVisualSummary}</p>
                          </div>
                          <div className="border-t border-slate-50 pt-5 space-y-3 min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400">ANIMATION VECTOR DIRECTION SUMMARY</p>
                            <p className="text-sm leading-6 text-slate-600 break-words whitespace-pre-wrap">{intelligenceAnimationSummary || "Animation direction summary not available yet."}</p>
                          </div>
                          <div className="border-t border-slate-50 pt-5 space-y-3 min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400">VOICE / NARRATION SUMMARY</p>
                            <p className="text-sm leading-6 text-slate-600 break-words whitespace-pre-wrap">{intelligenceVoiceSummary}</p>
                          </div>
                          <div className="border-t border-slate-50 pt-5 space-y-3 min-w-0">
                            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400">PUBLISHING CAPTION SUMMARY</p>
                            <p className="text-sm leading-6 text-slate-600 break-words whitespace-pre-wrap">{intelligencePublishingSummary}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-slate-600 break-words whitespace-pre-wrap">
                          No historical production context found. Complete the previous production phases before finalizing content intelligence.
                        </p>
                      )}
                    </article>
                  </div>

                  <div className="min-w-0">
                    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 space-y-4 min-w-0">
                      <p className="text-sm font-semibold tracking-wide text-slate-950">AI Strategic Guidance Deck</p>
                      <div className="font-mono bg-slate-50 p-4 rounded-xl text-xs leading-6 text-slate-700 break-words whitespace-pre-wrap border border-slate-100">
                        {`→ Optimization Token:\n${intelligenceOptimizationToken}\n\n→ Strategic Reading:\n${intelligenceStrategicReading}\n\n→ Next Campaign Recommendation:\n${intelligenceNextCampaignRecommendation}\n\n→ Next Brief Seed:\n${intelligenceNextBriefSeed}`}
                      </div>
                    </article>
                  </div>
                </div>

                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={finalizeIntelligenceCycleAndResetStudio}
                    className="h-12 w-full rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Start Next Creative Project
                  </button>
                  <p className="mt-3 text-xs leading-5 text-slate-400 break-words">
                    Finalizing closes the current lifecycle. Strategic intelligence insights will be locked into regional context tokens to dynamically optimize your next creative idea generation brief.
                  </p>
                  {intelligenceFinalized ? (
                    <p className="mt-3 text-xs font-mono text-emerald-600 break-words">
                      ✓ INTELLIGENCE CYCLE COMPLETE
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] leading-5 text-slate-400 font-mono break-words">
                    Local strategy payloads stored in memory: {intelligencePayloads.length}
                  </p>
                </div>
              </section>
            </section>
          ) : null}

          {activeStep === "scene-planner" ? (
            <section className="space-y-3 rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">Production Summary</p>
              <div className="space-y-2">
                <ChecklistItem text="Story approved" />
                <ChecklistItem text="Scene sequence completed" />
                <ChecklistItem text="Narration prepared" />
                <ChecklistItem text="Visual direction prepared" />
                <ChecklistItem text="Animation direction prepared" />
              </div>
              <p className="pt-1 text-sm text-slate-200">
                Ready for: <span className="font-semibold text-cyan-100">Image Prompt Builder</span>
              </p>
            </section>
          ) : null}

          {showBridgeRefreshModal ? (
            <div className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm">
              <div className="mx-auto mt-24 w-[92%] max-w-xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl shadow-slate-950/50">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">New Approved Viral Review Detected</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Choose how to continue</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  A newer approved Viral Scanner handoff is available. Your current Production Studio work will remain unchanged unless you choose to start from the latest approved review.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBridgeRefreshModal(false);
                      setPendingBridgeBrief(null);
                    }}
                    className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                  >
                    Resume Existing Studio
                  </button>
                  <button
                    type="button"
                    onClick={handleStartFromLatestApprovedViralReview}
                    className="h-11 rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    Start From Latest Approved Viral Review
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {toast ? (
            <div className="fixed bottom-5 right-5 z-50 max-w-xs rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur">
              <p className={`text-sm font-semibold ${toast.tone === "good" ? "text-emerald-200" : toast.tone === "error" ? "text-amber-200" : "text-cyan-100"}`}>
                {toast.message}
              </p>
            </div>
          ) : null}

          {isVersionDrawerOpen ? (
            <div className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm">
              <div className="absolute right-0 top-0 h-full w-full max-w-[420px] border-l border-slate-700 bg-slate-950 px-5 py-5 shadow-2xl shadow-slate-950/50">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Version History</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Saved production snapshots</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVersionDrawerOpen(false)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-3 overflow-y-auto pb-8" style={{ maxHeight: "calc(100vh - 120px)" }}>
                  {versionHistory.length > 0 ? (
                    versionHistory.slice().reverse().map((version) => (
                      <article key={version.id} className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{version.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{formatSavedTimeLabel(version.createdAt)}</p>
                            <p className="mt-1 text-xs text-slate-500">Author: {version.author}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${version.approved ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"}`}>
                            Score {version.productionScore}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                          <span className="rounded-full border border-slate-700 px-2 py-1">{version.approved ? "Approved" : "Draft"}</span>
                          <span className="rounded-full border border-slate-700 px-2 py-1">Step {steps.findIndex((step) => step.id === version.snapshot.currentStep) + 1}</span>
                          <span className="rounded-full border border-slate-700 px-2 py-1">{version.snapshot.platform}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                          <button type="button" onClick={() => openVersion(version.id)} className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-2">Open</button>
                          <button type="button" onClick={() => duplicateVersion(version.id)} className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-2">Duplicate</button>
                          <button type="button" onClick={() => restoreVersion(version.id)} className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-2">Restore</button>
                          <button type="button" onClick={() => deleteVersion(version.id)} className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-2">Delete</button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-700 px-4 py-4 text-sm text-slate-400">
                      No versions yet. Save a version to populate this drawer.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-800/80 pt-6">
            <div className="flex flex-col gap-3 rounded-xl bg-slate-900/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goPrevious}
                disabled={activeIndex === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight size={14} className="rotate-180" />
                Back
              </button>

              {activeStep === "visual-prompt-builder" ? (
                <div className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold sm:w-auto ${hasMasterImageSelected ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-amber-300/30 bg-amber-400/10 text-amber-100"}`}>
                  <p>{hasMasterImageSelected ? "✓ Master Image Selected" : "⚠ Select a Master Image before continuing."}</p>
                  <p className="mt-1 uppercase tracking-[0.12em] text-[10px]">{hasMasterImageSelected ? "Ready for Animation Director" : "Needs Master Image"}</p>
                </div>
              ) : null}

              {nextStep ? (
                <div className="flex flex-col items-end gap-2">
                  {activeStep === "review" ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">✓ PRODUCTION MANIFEST READY</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  >
                    {activeStep === "review" ? "Continue to Publishing" : "Continue"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">
        <Sparkles size={14} /> {subtitle}
      </p>
      <h2 className="text-2xl font-semibold text-white md:text-3xl">{title}</h2>
    </div>
  );
}

function BriefField({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <article>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-1.5 leading-7 ${emphasize ? "text-sm font-medium text-slate-100" : "text-sm text-slate-200"}`}>
        {value}
      </p>
    </article>
  );
}

function SceneLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-7 text-slate-200">
      <span className="font-semibold text-slate-100">{label}:</span> {value}
    </p>
  );
}

function ConceptField({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-700/70 bg-slate-950/35 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </article>
  );
}

function PromptStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </article>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "info";
}) {
  const classes = tone === "good"
    ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
    : "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function CollapsiblePanel({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="rounded-xl border border-slate-700/70 bg-slate-950/35 px-4 py-3" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-200">
        {title}
      </summary>
      <div className="mt-3 border-t border-slate-800/80 pt-3">{children}</div>
    </details>
  );
}

function buildPromptStats(
  prompt: string,
  visual?: {
    colorPalette: string;
    lens: string;
    lighting: string;
  },
) {
  const lowered = prompt.toLowerCase();
  const style = lowered.includes("cinematic")
    ? "Cinematic"
    : lowered.includes("realistic")
      ? "Realistic"
      : "Editorial";

  const aspectRatioMatch = prompt.match(/\b\d+:\d+\b/);
  const subjectHints = ["presenter", "creator", "document", "checklist", "map", "title overlay"];
  const subjectCount = Math.max(1, subjectHints.filter((hint) => lowered.includes(hint)).length);

  return {
    promptLength: prompt.length,
    style,
    aspectRatio: aspectRatioMatch?.[0] ?? "9:16",
    lens: visual?.lens ?? "35mm",
    lighting: visual?.lighting ?? "Natural",
    subjectCount,
  };
}

function EmotionChip({
  emotion,
}: {
  emotion: "Curiosity" | "Trust" | "Fear" | "Confidence" | "Relief";
}) {
  const styles: Record<typeof emotion, string> = {
    Curiosity: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
    Trust: "border-blue-300/30 bg-blue-400/10 text-blue-100",
    Fear: "border-amber-300/30 bg-amber-400/10 text-amber-100",
    Confidence: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
    Relief: "border-violet-300/30 bg-violet-400/10 text-violet-100",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[emotion]}`}>
      {emotion}
    </span>
  );
}

function formatDurationBadge(duration: string) {
  const matches = duration.match(/\d+/g) ?? [];
  if (matches.length >= 2) {
    const start = Number(matches[0]);
    const end = Number(matches[1]);
    const mid = Math.max(1, Math.round((start + end) / 2));
    return `${mid} sec`;
  }

  if (matches.length === 1) {
    return `${matches[0]} sec`;
  }

  return "5 sec";
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-slate-100">
      <Check size={14} className="text-emerald-300" />
      {text}
    </p>
  );
}

