import { ProductionWorkspaceProject, StoryboardSceneDraft } from "@/types/production-studio";
import { useMemo, useState, type ReactNode } from "react";
import { Clapperboard, Compass, Sparkles, WandSparkles } from "lucide-react";
import DirectorDashboard from "./DirectorDashboard";
import ProjectOverview from "./ProjectOverview";
import StoryArc from "./StoryArc";
import StoryboardTimeline from "./StoryboardTimeline";
import DirectorNotes from "./DirectorNotes";

type AIDirectorStudioProps = {
  project: ProductionWorkspaceProject;
  onProjectChange: (project: ProductionWorkspaceProject) => void;
  autosaveState?: "saving" | "saved" | "idle" | "error";
  lastSavedLabel?: string;
};

type DirectorStageId = "idea" | "story" | "scene-breakdown" | "image-prompts" | "animation-prompts";

const directorStages: Array<{ id: DirectorStageId; label: string; hint: string }> = [
  { id: "idea", label: "Idea", hint: "Select approved concept" },
  { id: "story", label: "Story", hint: "Generate the full narrative" },
  { id: "scene-breakdown", label: "Scene Breakdown", hint: "Split story into scenes" },
  { id: "image-prompts", label: "Image Prompts", hint: "Generate visual prompts" },
  { id: "animation-prompts", label: "Animation Prompts", hint: "Generate motion prompts" },
];

const mockScenes: StoryboardSceneDraft[] = [
  {
    id: "scene-1",
    sceneNumber: 1,
    title: "Opening Hook",
    purpose: "Opening Hook",
    estimatedDuration: "8 sec",
    imagePrompt: "Cinematic drone reveal of Sabah hillside property at sunrise, premium grading, high contrast.",
    videoPrompt: "8-second vertical video, drone push-in over Sabah ridge, cinematic pace, no text overlay.",
    voiceover: "What if the most profitable land deal in Sabah is hidden in plain sight?",
    directorNotes: "Open with high-contrast location reveal and tension question.",
    status: "Planning",
  },
  {
    id: "scene-2",
    sceneNumber: 2,
    title: "Problem",
    purpose: "Problem",
    estimatedDuration: "8 sec",
    imagePrompt: "Professional close-up of investor reviewing land checklist and map on tablet.",
    videoPrompt: "8-second handheld-style shot of checklist review, subtle camera drift, documentary tone.",
    voiceover: "Most buyers lose money by skipping the due diligence sequence.",
    directorNotes: "Show uncertainty and rushed decision-making.",
    status: "Planning",
  },
  {
    id: "scene-3",
    sceneNumber: 3,
    title: "Discovery",
    purpose: "Discovery",
    estimatedDuration: "8 sec",
    imagePrompt: "Minimal infographic board with five-step verification framework, premium lighting.",
    videoPrompt: "8-second motion sequence over framework board, gentle parallax movement, clean transitions.",
    voiceover: "Use a five-step framework to validate location, access, title, and upside.",
    directorNotes: "Transition from problem to method with clarity.",
    status: "Planning",
  },
  {
    id: "scene-4",
    sceneNumber: 4,
    title: "Solution",
    purpose: "Solution",
    estimatedDuration: "8 sec",
    imagePrompt: "Split-frame concept showing risky guess vs validated purchase decision in Sabah context.",
    videoPrompt: "8-second split-screen montage, left uncertain buyer, right confident buyer, cinematic documentary style.",
    voiceover: "Structured checks turn risky guesses into confident acquisition decisions.",
    directorNotes: "Use visual comparison to increase trust and clarity.",
    status: "Planning",
  },
  {
    id: "scene-5",
    sceneNumber: 5,
    title: "Call To Action",
    purpose: "Call To Action",
    estimatedDuration: "8 sec",
    imagePrompt: "Premium closing frame with confident buyer at overlook, warm sunset, aspirational tone.",
    videoPrompt: "8-second closing hero shot, slow pull-back, emotional resolution, no text overlay.",
    voiceover: "Follow for weekly Sabah land intelligence before your next site visit.",
    directorNotes: "End on upward emotional momentum.",
    status: "Planning",
  },
];

export default function AIDirectorStudio({
  project,
  onProjectChange,
  autosaveState = "idle",
  lastSavedLabel = "Not saved yet",
}: AIDirectorStudioProps) {
  const [activeStage, setActiveStage] = useState<DirectorStageId>("idea");
  const autosaveStatusLine = autosaveState === "saving"
    ? "\u25cf Saving..."
    : autosaveState === "error"
      ? "\u25cf Save issue"
      : "\u2713 Saved";
  const storyboardScenes = project.storyboardScenes && project.storyboardScenes.length > 0
    ? project.storyboardScenes
    : mockScenes;
  const stageIndex = directorStages.findIndex((stage) => stage.id === activeStage);
  const nextStage = stageIndex >= 0 && stageIndex < directorStages.length - 1
    ? directorStages[stageIndex + 1]
    : null;
  const primaryActionLabel = useMemo(() => {
    if (activeStage === "idea") {
      return "Confirm the approved idea before generating story output.";
    }
    if (activeStage === "story") {
      return "Generate the full story as the creative foundation.";
    }
    if (activeStage === "scene-breakdown") {
      return "Split the story into logical scenes with purpose and duration.";
    }
    if (activeStage === "image-prompts") {
      return "Generate production-quality image prompts for every scene.";
    }
    return "Generate animation prompts optimized for Google Flow (recommended), OpenAI Sora 2, and OpenAI Sora 2 Pro.";
  }, [activeStage]);

  function handleStoryboardChange(nextScenes: StoryboardSceneDraft[]) {
    const now = new Date().toISOString();

    onProjectChange({
      ...project,
      storyboardScenes: nextScenes,
      sceneCount: nextScenes.length,
      updatedAt: now,
      lastModifiedAt: now,
    });
  }

  return (
    <div className="max-w-full overflow-x-hidden rounded-[26px] border border-slate-700/80 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_35%),linear-gradient(160deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] p-4 shadow-[0_30px_100px_rgba(2,6,23,0.45)] md:rounded-[30px] md:p-7 xl:p-8">
      <div className="mb-6 rounded-2xl border border-slate-700/70 bg-slate-950/50 px-4 py-5 md:px-7 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-3">
          <div className="mt-0.5 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-200">
            <Clapperboard size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">AI Production Studio</p>
            <h1 className="mt-2 text-[1.5rem] font-semibold leading-snug text-white md:text-[1.75rem]">Lean AI video pre-production workflow</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">Gatekeeper AI prepares story and prompts. Creators stay in control of editing and final production tools.</p>
          </div>
          <div className="shrink-0 pt-0.5 text-left md:text-right">
            <p className="text-[11px] font-medium text-slate-300">{autosaveStatusLine}</p>
            <p className="mt-1 text-[11px] text-slate-500">Last saved {lastSavedLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <JourneyCard icon={<Compass size={14} />} label="Story" value="Generate one complete narrative" />
          <JourneyCard icon={<Sparkles size={14} />} label="Scenes" value="Split into logical scene units" />
          <JourneyCard icon={<Clapperboard size={14} />} label="Images" value="Create production-quality image prompts" />
          <JourneyCard icon={<WandSparkles size={14} />} label="Animation" value="Create motion prompts for video tools" />
        </div>

        <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-950/55 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Core Workflow</p>
          <div className="mt-2.5 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
            {directorStages.map((stage, index) => {
              const isActive = stage.id === activeStage;
              const isCompleted = index < stageIndex;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStage(stage.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    isActive
                      ? "border-cyan-300/55 bg-cyan-400/10"
                      : isCompleted
                        ? "border-slate-600/70 bg-slate-900/70"
                        : "border-slate-700/70 bg-slate-900/40 hover:border-cyan-300/35"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">{index + 1}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-100">{stage.label}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">{stage.hint}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-5 md:space-y-6">
        <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
          <span className="font-semibold">Primary focus:</span> {primaryActionLabel}
        </div>

        {activeStage === "idea" ? (
          <>
            <ProjectOverview project={project} duration="40 seconds" sceneCount={storyboardScenes.length} />
            <DirectorDashboard project={project} />
          </>
        ) : null}

        {activeStage === "story" ? (
          <>
            <StoryArc />
            <DirectorNotes note="Generate one complete story first. This becomes the source for scene breakdown, image prompts, and animation prompts." />
          </>
        ) : null}

        {activeStage === "scene-breakdown" ? (
          <StoryboardTimeline scenes={storyboardScenes} onChange={handleStoryboardChange} />
        ) : null}

        {activeStage === "image-prompts" ? (
          <>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
              For each scene, generate image prompts that include subject, environment, composition, camera angle, lighting, mood, style, and aspect ratio.
            </div>
            <StoryboardTimeline scenes={storyboardScenes} onChange={handleStoryboardChange} />
          </>
        ) : null}

        {activeStage === "animation-prompts" ? (
          <>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
              For each scene, generate animation prompts with camera movement, subject movement, environmental motion, and pacing. Avoid unnecessary text overlays.
            </div>
            <StoryboardTimeline scenes={storyboardScenes} onChange={handleStoryboardChange} />
          </>
        ) : null}

        <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">What should the creator do next?</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              {nextStage
                ? `Continue to ${nextStage.label} to keep production momentum.`
                : "Copy prompts, then open Google Flow or OpenAI Sora to render manually."}
            </p>
            {nextStage ? (
              <button
                type="button"
                onClick={() => setActiveStage(nextStage.id)}
                className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/70"
              >
                Continue to {nextStage.label}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/55 px-4 py-3.5">
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
        {icon}
        {label}
      </div>
      <p className="mt-2.5 text-sm leading-6 text-slate-300">{value}</p>
    </div>
  );
}
