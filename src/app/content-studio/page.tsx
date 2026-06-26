"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Clapperboard,
  Copy,
  FileVideo,
  ImagePlay,
  Languages,
  Lightbulb,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
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
  contentType: string;
  platform: string;
  aspectRatio: string;
  sections: PackageSection[];
};

type InspirationIdea = {
  title: string;
  angle: string;
  suggestedContentType: string;
  whyItMayWork: string;
  engagementPotential: "Low" | "Medium" | "High";
};

const contentTypes: ContentTypeOption[] = [
  { value: "standard-post", label: "Standard Post" },
  { value: "reel-short-video", label: "Reel / Short Video" },
  { value: "property-listing", label: "Property Listing" },
  { value: "educational-content", label: "Educational Content" },
  { value: "drone-showcase", label: "Drone Showcase" },
  { value: "construction-progress", label: "Construction Progress" },
  { value: "storytelling", label: "Storytelling" },
  { value: "custom", label: "Custom" },
];

const platforms = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube-shorts", label: "YouTube Shorts" },
];

const aspectRatios = ["4:5", "9:16", "1:1", "16:9"];
const tones = ["Professional", "Sabahan", "Educational", "Investor", "Funny", "Storytelling"];
const languages = ["English", "Sabahan", "Both"];
const goals = ["Engagement", "Education", "Selling", "Brand Awareness", "Weekly Facebook Task"];
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

const contentTypeAspectRatioDefaults: Record<string, string> = {
  "standard-post": "4:5",
  "reel-short-video": "9:16",
  "drone-showcase": "9:16",
  "construction-progress": "9:16",
  "property-listing": "4:5",
};

function getDefaultAspectRatio(contentType: string) {
  return contentTypeAspectRatioDefaults[contentType] ?? "4:5";
}

function formatPackageForCopy(contentPackage: GeneratedPackage) {
  return [
    contentPackage.title,
    `Content Type: ${contentPackage.contentType}`,
    `Platform: ${contentPackage.platform}`,
    `Aspect Ratio: ${contentPackage.aspectRatio}`,
    "",
    ...contentPackage.sections.flatMap((section) => [section.label, section.value, ""]),
  ].join("\n");
}

export default function ContentStudioPage() {
  const [mode, setMode] = useState<"create-content" | "inspiration">("create-content");
  const [contentType, setContentType] = useState("standard-post");
  const [platform, setPlatform] = useState("facebook");
  const [aspectRatio, setAspectRatio] = useState(getDefaultAspectRatio("standard-post"));
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [language, setLanguage] = useState("English");
  const [goal, setGoal] = useState("Engagement");
  const [category, setCategory] = useState("Property Education");
  const [targetAudience, setTargetAudience] = useState("Buyers");
  const [ideaGoal, setIdeaGoal] = useState("Education");
  const [ideaCount, setIdeaCount] = useState("10");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedPackage, setGeneratedPackage] = useState<GeneratedPackage | null>(null);
  const [ideas, setIdeas] = useState<InspirationIdea[]>([]);

  useEffect(() => {
    if (!aspectRatioLocked) {
      setAspectRatio(getDefaultAspectRatio(contentType));
    }
  }, [contentType, aspectRatioLocked]);

  const requestPayload = useMemo(
    () => ({
      mode: "create-content",
      contentType,
      platform,
      aspectRatio,
      topic,
      tone,
      language,
      goal,
    }),
    [contentType, platform, aspectRatio, topic, tone, language, goal]
  );

  const inspirationPayload = useMemo(
    () => ({
      mode: "inspiration",
      category,
      targetAudience,
      goal: ideaGoal,
      ideaCount: Number(ideaCount),
    }),
    [category, targetAudience, ideaGoal, ideaCount]
  );

  async function generateContent() {
    if (!topic.trim()) {
      setError("Topic is required.");
      return;
    }

    setGenerating(true);
    setError(null);
    setCopied(false);

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
        throw new Error(result.error || "Failed to generate content package.");
      }

      setGeneratedPackage(result as GeneratedPackage);
    } catch (generationError: any) {
      setError(generationError?.message ?? "Failed to generate content package.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateIdeas() {
    setGenerating(true);
    setError(null);
    setCopied(false);

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

  async function copyOutput() {
    if (!generatedPackage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatPackageForCopy(generatedPackage));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy content package.");
    }
  }

  function useIdea(idea: InspirationIdea) {
    setTopic(`${idea.title}: ${idea.angle}`);
    setMode("create-content");
    setError(null);
  }

  return (
    <div className="min-h-screen w-full px-6 py-8 text-white md:px-10 md:py-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-400">Content Studio v1</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">Professional content packages for Borneo Land Gatekeeper</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              Build complete post and video packages with structured outputs, platform-aware formatting, and strict brand rules.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
            Always includes <span className="font-semibold">#BorneoLandGatekeeper</span> and never exceeds 5 hashtags.
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-2xl border border-slate-800 bg-slate-950 p-1">
          <ModeButton label="Create Content" active={mode === "create-content"} onClick={() => setMode("create-content")} />
          <ModeButton label="Inspiration" active={mode === "inspiration"} onClick={() => setMode("inspiration")} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          {mode === "create-content" ? (
            <>
              <div className="flex items-center gap-3">
                <Clapperboard className="text-yellow-400" size={22} />
                <h2 className="text-2xl font-semibold">Studio Setup</h2>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <SelectField label="Content Type" value={contentType} onChange={setContentType} options={contentTypes} />
                <SelectField label="Platform" value={platform} onChange={setPlatform} options={platforms} />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Aspect Ratio</label>
                  <div className="flex gap-3">
                    <select
                      value={aspectRatio}
                      onChange={(event) => {
                        setAspectRatioLocked(true);
                        setAspectRatio(event.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
                    >
                      {aspectRatios.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setAspectRatioLocked(false);
                        setAspectRatio(getDefaultAspectRatio(contentType));
                      }}
                      className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-yellow-500/40 hover:text-white"
                    >
                      Auto
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Auto default: {getDefaultAspectRatio(contentType)} {aspectRatioLocked ? "• manual override active" : "• auto-select active"}
                  </p>
                </div>

                <SelectField
                  label="Tone"
                  value={tone}
                  onChange={setTone}
                  options={tones.map((option) => ({ value: option, label: option }))}
                />
                <SelectField
                  label="Language"
                  value={language}
                  onChange={setLanguage}
                  options={languages.map((option) => ({ value: option, label: option }))}
                />
                <SelectField label="Goal" value={goal} onChange={setGoal} options={goals.map((option) => ({ value: option, label: option }))} />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-200">Topic</label>
                <textarea
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  rows={5}
                  placeholder="Example: Weekly Facebook task about why land buyers should verify title status before committing."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white placeholder:text-slate-500"
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={<Megaphone size={18} className="text-yellow-400" />}
                  title="Content Rules"
                  body="No invented property facts. Professional by default. Emojis only when Funny is selected."
                />
                <InfoCard
                  icon={<ImagePlay size={18} className="text-yellow-400" />}
                  title="Video Package"
                  body="Reel, drone, and progress formats include script, prompts, music style, and thumbnail guidance."
                />
              </div>
            </>
          ) : (
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
          )}

          {error && (
            <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

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
                  {generating ? "Generating..." : "Generate Package"}
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
              </>
            ) : (
              <button
                type="button"
                onClick={generateIdeas}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles size={18} />
                {generating ? "Generating..." : "Generate Ideas"}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                {mode === "create-content" ? <FileVideo className="text-yellow-400" size={22} /> : <Lightbulb className="text-yellow-400" size={22} />}
                <h2 className="text-2xl font-semibold">{mode === "create-content" ? "Generated Package" : "Idea Cards"}</h2>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {mode === "create-content"
                  ? "Output is structured for copy-and-paste publishing or creative production handoff."
                  : "Generate concept-level ideas first, then push the best one back into Create Content."}
              </p>
            </div>

            {mode === "create-content" && (
              <button
                type="button"
                onClick={copyOutput}
                disabled={!generatedPackage}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy Output"}
              </button>
            )}
          </div>

          {mode === "create-content" ? (
            !generatedPackage ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Set up your package on the left, then generate content for Borneo Land Gatekeeper.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <h3 className="text-xl font-semibold text-white">{generatedPackage.title}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MetaPill icon={<Clapperboard size={14} />} label={generatedPackage.contentType} />
                    <MetaPill icon={<Languages size={14} />} label={generatedPackage.platform} />
                    <MetaPill icon={<Target size={14} />} label={generatedPackage.aspectRatio} />
                  </div>
                </div>

                {generatedPackage.sections.map((section) => (
                  <div key={section.label} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{section.label}</p>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{section.value}</div>
                  </div>
                ))}
              </div>
            )
          ) : ideas.length === 0 ? (
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