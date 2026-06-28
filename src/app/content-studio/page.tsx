"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  Clapperboard,
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
  angle: string;
  suggestedContentType: string;
  whyItMayWork: string;
  engagementPotential: "Low" | "Medium" | "High";
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
    category?: string;
    targetAudience?: string;
    ideaGoal?: string;
    ideaCount?: string;
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
const durationOptions = [8, 16, 24, 32, 40, 48, 56, 64];
const productionLevels = ["Quick", "Professional", "Premium"];
const shootingEnvironments = [
  "On-Site Property",
  "Outdoor Location",
  "Interior Space",
  "Office / Studio",
  "Mixed Environment",
];
const equipmentOptions = [
  "Phone",
  "Drone",
  "Gimbal",
  "Tripod",
  "ND Filter",
  "Lavalier Mic",
  "Mirrorless Camera",
];
const inspirationCategories = [
  "Property Education",
  "Property Listing",
  "Investment",
  "Legal",
  "Lifestyle",
  "Drone",
  "Construction",
  "Personal Branding",
  "Funny Sabahan",
  "General",
];
const targetAudiences = ["Buyers", "Investors", "Land Owners", "Developers", "Agents", "General Public"];
const inspirationGoals = ["Education", "Engagement", "Selling", "Lead Generation", "Weekly Facebook Task", "Brand Awareness"];
const ideaCountOptions = [10, 20, 50];
const savedHistoryStorageKey = "gatekeeper-content-studio-history";

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

export default function ContentStudioPage() {
  const hasAppliedOpportunityPrefill = useRef(false);
  const [mode, setMode] = useState<"create-content" | "inspiration" | "saved">("create-content");
  const [contentType, setContentType] = useState("normal-post");
  const [platform, setPlatform] = useState("facebook");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [goal, setGoal] = useState("Engagement");
  const [storyStyle, setStoryStyle] = useState("Educational");
  const [presentationStyle, setPresentationStyle] = useState("Narration");
  const [duration, setDuration] = useState("40");
  const [productionLevel, setProductionLevel] = useState("Professional");
  const [shootingEnvironment, setShootingEnvironment] = useState("On-Site Property");
  const [equipment, setEquipment] = useState<string[]>(["Phone", "Gimbal"]);
  const [category, setCategory] = useState("Property Education");
  const [targetAudience, setTargetAudience] = useState("Buyers");
  const [ideaGoal, setIdeaGoal] = useState("Education");
  const [ideaCount, setIdeaCount] = useState("10");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generatedPackage, setGeneratedPackage] = useState<GeneratedPackage | null>(null);
  const [ideas, setIdeas] = useState<InspirationIdea[]>([]);
  const [savedItems, setSavedItems] = useState<SavedHistoryItem[]>([]);
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
    setIdeas([]);
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
      duration: contentType === "reel-video" ? Number(duration) : null,
      productionLevel,
      shootingEnvironment,
      equipment,
    }),
    [contentType, platform, topic, tone, language, goal, storyStyle, presentationStyle, duration, productionLevel, shootingEnvironment, equipment],
  );

  const inspirationPayload = useMemo(
    () => ({
      mode: "inspiration",
      category,
      targetAudience,
      goal: ideaGoal,
      ideaCount: Number(ideaCount),
    }),
    [category, targetAudience, ideaGoal, ideaCount],
  );

  async function generateContent() {
    if (!topic.trim()) {
      setError("Topic is required.");
      return;
    }

    setGenerating(true);
    setError(null);
    setCopiedKey(null);

    try {
      const response = await fetch("/api/content-studio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate production package.");
      }

      setGeneratedPackage(result as GeneratedPackage);
    } catch (generationError: any) {
      setError(generationError?.message ?? "Failed to generate production package.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateIdeas() {
    setGenerating(true);
    setError(null);
    setCopiedKey(null);

    try {
      const response = await fetch("/api/content-studio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inspirationPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate ideas.");
      }

      setIdeas(Array.isArray(result.ideas) ? (result.ideas as InspirationIdea[]) : []);
    } catch (generationError: any) {
      setError(generationError?.message ?? "Failed to generate ideas.");
    } finally {
      setGenerating(false);
    }
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
          duration,
          productionLevel,
          shootingEnvironment,
          equipment,
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
        preview: idea.angle,
        savedAt: new Date().toISOString(),
        idea,
        context: {
          category,
          targetAudience,
          ideaGoal,
          ideaCount,
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
      setDuration(item.context?.duration ?? "40");
      setProductionLevel(item.context?.productionLevel ?? "Professional");
      setShootingEnvironment(item.context?.shootingEnvironment ?? "On-Site Property");
      setEquipment(item.context?.equipment ?? ["Phone", "Gimbal"]);
      setError(null);
      return;
    }

    if (item.kind === "idea-card" && item.idea) {
      setMode("inspiration");
      setIdeas([item.idea]);
      setCategory(item.context?.category ?? "Property Education");
      setTargetAudience(item.context?.targetAudience ?? "Buyers");
      setIdeaGoal(item.context?.ideaGoal ?? "Education");
      setIdeaCount(item.context?.ideaCount ?? "10");
      setError(null);
    }
  }

  function useIdea(idea: InspirationIdea) {
    setTopic(`${idea.title}: ${idea.angle}`);
    setMode("create-content");
    setError(null);
  }

  function toggleEquipment(item: string) {
    setEquipment((current) => current.includes(item)
      ? current.filter((entry) => entry !== item)
      : [...current, item]);
  }

  const showingStructuredPackage = Boolean(generatedPackage && hasProductionStudioStructure(generatedPackage));

  return (
    <div className="min-h-screen w-full px-6 py-8 text-white md:px-10 md:py-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-400">🎬 Production Studio v1</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">Production-ready posts and Google Flow packages for Borneo Land Gatekeeper</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              Build complete Facebook posts and Google Flow-ready production packages without leaving Gatekeeper AI.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
            Always includes <span className="font-semibold">#BorneoLandGatekeeper</span> and never exceeds 5 hashtags.
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-2xl border border-slate-800 bg-slate-950 p-1">
          <ModeButton label="Production Studio" active={mode === "create-content"} onClick={() => setMode("create-content")} />
          <ModeButton label="Inspiration" active={mode === "inspiration"} onClick={() => setMode("inspiration")} />
          <ModeButton label="Saved" active={mode === "saved"} onClick={() => setMode("saved")} />
        </div>

        {loadedOpportunityTitle ? (
          <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
            Loaded from opportunity: <span className="font-semibold text-white">{loadedOpportunityTitle}</span>
          </div>
        ) : null}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          {mode === "create-content" ? (
            <>
              <div className="flex items-center gap-3">
                <Clapperboard className="text-yellow-400" size={22} />
                <h2 className="text-2xl font-semibold">Director&apos;s Desk</h2>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <SelectField label="Platform" value={platform} onChange={setPlatform} options={platforms} />
                <SelectField label="Content Type" value={contentType} onChange={setContentType} options={contentTypes} />
                <SelectField label="Goal" value={goal} onChange={setGoal} options={goals.map((option) => ({ value: option, label: option }))} />
                <SelectField label="Language" value={language} onChange={setLanguage} options={languages.map((option) => ({ value: option, label: option }))} />
                <SelectField label="Story Style" value={storyStyle} onChange={setStoryStyle} options={storyStyles.map((option) => ({ value: option, label: option }))} />
                <SelectField label="Presentation Style" value={presentationStyle} onChange={setPresentationStyle} options={presentationStyles.map((option) => ({ value: option, label: option }))} />

                {contentType === "reel-video" ? (
                  <SelectField
                    label="Duration"
                    value={duration}
                    onChange={setDuration}
                    options={durationOptions.map((option) => ({ value: String(option), label: `${option} sec` }))}
                  />
                ) : null}

                <SelectField label="Production Level" value={productionLevel} onChange={setProductionLevel} options={productionLevels.map((option) => ({ value: option, label: option }))} />
                <SelectField label="Shooting Environment" value={shootingEnvironment} onChange={setShootingEnvironment} options={shootingEnvironments.map((option) => ({ value: option, label: option }))} />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-200">Topic</label>
                <textarea
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  rows={5}
                  placeholder="Example: 40-second documentary reel explaining why serious land buyers should verify title status before making an offer."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white placeholder:text-slate-500"
                />
              </div>

              <div className="mt-5">
                <label className="mb-3 block text-sm font-medium text-slate-200">Equipment</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {equipmentOptions.map((item) => {
                    const checked = equipment.includes(item);

                    return (
                      <label
                        key={item}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${checked ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-100" : "border-slate-700 bg-slate-950 text-slate-200 hover:border-yellow-500/30"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEquipment(item)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-yellow-500"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
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
          ) : mode === "inspiration" ? (
            <>
              <div className="flex items-center gap-3">
                <Lightbulb className="text-yellow-400" size={22} />
                <h2 className="text-2xl font-semibold">Inspiration Setup</h2>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={inspirationCategories.map((option) => ({ value: option, label: option }))}
                />
                <SelectField
                  label="Target Audience"
                  value={targetAudience}
                  onChange={setTargetAudience}
                  options={targetAudiences.map((option) => ({ value: option, label: option }))}
                />
                <SelectField
                  label="Goal"
                  value={ideaGoal}
                  onChange={setIdeaGoal}
                  options={inspirationGoals.map((option) => ({ value: option, label: option }))}
                />
                <SelectField
                  label="Number of ideas"
                  value={ideaCount}
                  onChange={setIdeaCount}
                  options={ideaCountOptions.map((option) => ({ value: String(option), label: String(option) }))}
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={<Lightbulb size={18} className="text-yellow-400" />}
                  title="Idea Scope"
                  body="Ideas stay at concept level only. No full captions, scripts, CTAs, or hashtag packages are generated here."
                />
                <InfoCard
                  icon={<Megaphone size={18} className="text-yellow-400" />}
                  title="Idea Priorities"
                  body="Ideas are optimized for comments, shares, saves, inquiries, and Sabah land education angles where relevant."
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
              <>
                <button
                  type="button"
                  onClick={generateContent}
                  disabled={generating}
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles size={18} />
                  {generating ? "Generating..." : "Generate Production Package"}
                </button>

                <button
                  type="button"
                  onClick={generateContent}
                  disabled={generating || !generatedPackage}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={18} className={generating ? "animate-spin" : undefined} />
                  Regenerate
                </button>

                <button
                  type="button"
                  onClick={savePackage}
                  disabled={!generatedPackage}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FolderClock size={18} />
                  Save Production Package
                </button>
              </>
            ) : mode === "inspiration" ? (
              <button
                type="button"
                onClick={generateIdeas}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={18} />
                {generating ? "Generating..." : "Generate Ideas"}
              </button>
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
                  <FileVideo className="text-yellow-400" size={22} />
                ) : mode === "inspiration" ? (
                  <Lightbulb className="text-yellow-400" size={22} />
                ) : (
                  <FolderClock className="text-yellow-400" size={22} />
                )}
                <h2 className="text-2xl font-semibold">
                  {mode === "create-content" ? "Production Package" : mode === "inspiration" ? "Idea Cards" : "Saved Items"}
                </h2>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {mode === "create-content"
                  ? "Output is structured for direct copy, Google Flow prompt generation, and production handoff."
                  : mode === "inspiration"
                    ? "Generate concept-level ideas first, then push the best one back into Production Studio."
                    : "Review saved idea cards and generated production packages stored in this browser."}
              </p>
            </div>

            {mode === "create-content" ? (
              <button
                type="button"
                onClick={copyOutput}
                disabled={!generatedPackage}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Copy size={16} />
                {copiedKey === "package" ? "Copied" : "Copy Entire Production Package"}
              </button>
            ) : null}
          </div>

          {mode === "create-content" ? (
            !generatedPackage ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Set up the Director&apos;s Desk on the left, then generate a complete production package.
              </div>
            ) : showingStructuredPackage ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h3 className="text-xl font-semibold text-white">{generatedPackage.title}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
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
                  copyLabel="Copy Production Checklist"
                  copied={copiedKey === "production-checklist"}
                  onCopy={() => copyText(formatProductionChecklistForCopy(generatedPackage), "production-checklist", "Failed to copy production checklist.")}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {(generatedPackage.productionChecklist ?? []).map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                        ✓ {item}
                      </div>
                    ))}
                  </div>
                </CopyCard>

                <CopyCard
                  title="Storyboard"
                  copyLabel="Copy Storyboard"
                  copied={copiedKey === "storyboard"}
                  onCopy={() => copyText(formatStoryboardForCopy(generatedPackage), "storyboard", "Failed to copy storyboard.")}
                >
                  <div className="space-y-3">
                    {(generatedPackage.storyboard ?? []).map((scene, index) => (
                      <div key={`${scene.sceneNumber}-${scene.summary}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scene {scene.sceneNumber}</p>
                        <p className="mt-2 text-sm text-slate-200">{scene.summary}</p>
                        {index < (generatedPackage.storyboard?.length ?? 0) - 1 ? (
                          <p className="mt-3 text-yellow-400">↓</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CopyCard>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Video className="text-yellow-400" size={20} />
                    <div>
                      <h3 className="text-xl font-semibold text-white">Production Board</h3>
                      <p className="text-sm text-slate-400">One scene card per production beat with copy-ready prompts.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(generatedPackage.scenes ?? []).map((scene) => (
                      <div key={scene.sceneNumber} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">🎬 Scene {scene.sceneNumber}</p>
                            <p className="mt-2 text-sm text-slate-300">Estimated Duration: {scene.estimatedDuration}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyText(formatSceneForCopy(scene), `scene-${scene.sceneNumber}`, "Failed to copy scene.")}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
                          >
                            <Copy size={16} />
                            {copiedKey === `scene-${scene.sceneNumber}` ? "Copied" : "Copy Entire Scene"}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                          <div className="space-y-4">
                            <InfoPanel title="Purpose" value={scene.purpose} />
                            <InfoPanel title="Director Notes" value={scene.directorNotes} />
                            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-4">
                              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Thumbnail Placeholder</p>
                              <div className="mt-3 flex min-h-28 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-5 text-center text-sm text-slate-300">
                                {scene.thumbnailPlaceholder}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <PromptCard
                              title="Image Prompt"
                              value={scene.imagePrompt}
                              copyLabel="Copy Image Prompt"
                              copied={copiedKey === `scene-image-${scene.sceneNumber}`}
                              onCopy={() => copyText(scene.imagePrompt, `scene-image-${scene.sceneNumber}`, "Failed to copy image prompt.")}
                            />
                            <PromptCard
                              title="Video Prompt"
                              value={scene.videoPrompt}
                              copyLabel="Copy Video Prompt"
                              copied={copiedKey === `scene-video-${scene.sceneNumber}`}
                              onCopy={() => copyText(scene.videoPrompt, `scene-video-${scene.sceneNumber}`, "Failed to copy video prompt.")}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Megaphone className="text-yellow-400" size={20} />
                    <div>
                      <h3 className="text-xl font-semibold text-white">Final Deliverables</h3>
                      <p className="text-sm text-slate-400">Caption, CTA, and hashtags with dedicated copy actions.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <PromptCard
                      title="Caption"
                      value={generatedPackage.caption ?? ""}
                      copyLabel="Copy Caption"
                      copied={copiedKey === "caption"}
                      onCopy={() => copyText(generatedPackage.caption ?? "", "caption", "Failed to copy caption.")}
                    />
                    <PromptCard
                      title="CTA"
                      value={generatedPackage.cta ?? ""}
                      copyLabel="Copy CTA"
                      copied={copiedKey === "cta"}
                      onCopy={() => copyText(generatedPackage.cta ?? "", "cta", "Failed to copy CTA.")}
                    />
                    <PromptCard
                      title="Hashtags"
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
            ideas.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Choose a category, audience, and goal, then generate idea cards.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {ideas.map((idea) => (
                  <div key={`${idea.title}-${idea.angle}`} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <h3 className="text-xl font-semibold text-white">{idea.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{idea.angle}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => useIdea(idea)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
                      >
                        <Sparkles size={16} />
                        Use Idea
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => saveIdea(idea)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
                      >
                        <FolderClock size={16} />
                        Save Idea
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <IdeaField label="Suggested content type" value={idea.suggestedContentType} />
                      <IdeaField label="Engagement potential" value={idea.engagementPotential} />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Why it may work</p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">{idea.whyItMayWork}</p>
                    </div>
                  </div>
                ))}
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

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-yellow-500 text-slate-950" : "text-slate-300 hover:text-white"
      }`}
    >
      {label}
    </button>
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

function CopyCard({
  title,
  copyLabel,
  copied,
  onCopy,
  children,
}: {
  title: string;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
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
  value,
  copyLabel,
  copied,
  onCopy,
}: {
  title: string;
  value: string;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
        >
          <Copy size={16} />
          {copied ? "Copied" : copyLabel}
        </button>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{value}</div>
    </div>
  );
}

function FieldGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
          <p className="mt-3 text-sm leading-7 text-slate-200">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function InfoPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{value}</p>
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
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
      {icon}
      <span className="capitalize">{label.replace(/-/g, " ")}</span>
    </div>
  );
}