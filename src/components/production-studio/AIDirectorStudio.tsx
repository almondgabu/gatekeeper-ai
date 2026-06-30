import { ProductionWorkspaceProject } from "@/types/production-studio";
import { Clapperboard, Compass, Sparkles, WandSparkles } from "lucide-react";
import DirectorDashboard from "./DirectorDashboard";
import ProjectOverview from "./ProjectOverview";
import StoryArc from "./StoryArc";
import StoryboardTimeline from "./StoryboardTimeline";
import DirectorNotes from "./DirectorNotes";
import DirectorAdvice from "./DirectorAdvice";
import VoiceoverPanel from "./VoiceoverPanel";
import GoogleFlowPanel from "./GoogleFlowPanel";
import ProductionProgress from "./ProductionProgress";

type AIDirectorStudioProps = {
  project: ProductionWorkspaceProject;
  autosaveState?: "saving" | "saved" | "idle" | "error";
  lastSavedLabel?: string;
};

const mockScenes = [
  {
    sceneNumber: 1,
    timestamp: "0-8 sec",
    purpose: "Opening Hook",
    description: "Open with a high-contrast location reveal and a bold tension question.",
    narration: "What if the most profitable land deal in Sabah is hidden in plain sight?",
    imagePrompt: "Cinematic drone reveal of Sabah hillside property at sunrise, premium grading, high contrast.",
    videoPrompt: "8-second vertical video, drone push-in over Sabah ridge, cinematic pace, no text overlay.",
  },
  {
    sceneNumber: 2,
    timestamp: "8-16 sec",
    purpose: "Problem",
    description: "Show the confusion buyers face when evaluating opportunities quickly.",
    narration: "Most buyers lose money by skipping the due diligence sequence.",
    imagePrompt: "Professional close-up of investor reviewing land checklist and map on tablet.",
    videoPrompt: "8-second handheld-style shot of checklist review, subtle camera drift, documentary tone.",
  },
  {
    sceneNumber: 3,
    timestamp: "16-24 sec",
    purpose: "Discovery",
    description: "Introduce the core framework that resolves the uncertainty.",
    narration: "Use a five-step framework to validate location, access, title, and upside.",
    imagePrompt: "Minimal infographic board with five-step verification framework, premium lighting.",
    videoPrompt: "8-second motion sequence over framework board, gentle parallax movement, clean transitions.",
  },
  {
    sceneNumber: 4,
    timestamp: "24-32 sec",
    purpose: "Solution",
    description: "Demonstrate confidence through a practical before/after decision comparison.",
    narration: "Structured checks turn risky guesses into confident acquisition decisions.",
    imagePrompt: "Split-frame concept showing risky guess vs validated purchase decision in Sabah context.",
    videoPrompt: "8-second split-screen montage, left uncertain buyer, right confident buyer, cinematic documentary style.",
  },
  {
    sceneNumber: 5,
    timestamp: "32-40 sec",
    purpose: "Call To Action",
    description: "Finish with momentum and a direct action prompt.",
    narration: "Follow for weekly Sabah land intelligence before your next site visit.",
    imagePrompt: "Premium closing frame with confident buyer at overlook, warm sunset, aspirational tone.",
    videoPrompt: "8-second closing hero shot, slow pull-back, emotional resolution, no text overlay.",
  },
];

export default function AIDirectorStudio({ project, autosaveState = "idle", lastSavedLabel = "Not saved yet" }: AIDirectorStudioProps) {
  const autosaveStatusLine = autosaveState === "saving"
    ? "\u25cf Saving..."
    : autosaveState === "error"
      ? "\u25cf Save issue"
      : "\u2713 Saved";

  return (
    <div className="max-w-full overflow-x-hidden rounded-[30px] border border-slate-700/80 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_35%),linear-gradient(160deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] p-5 shadow-[0_30px_100px_rgba(2,6,23,0.45)] md:p-7 xl:p-8">
      <div className="mb-6 rounded-2xl border border-slate-700/70 bg-slate-950/50 px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-3">
          <div className="mt-0.5 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-200">
            <Clapperboard size={18} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">AI Director Studio</p>
            <h1 className="mt-2 text-[1.5rem] font-semibold leading-snug text-white md:text-[1.75rem]">Film-grade creative planning workspace</h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">Premium storyboard dashboard for scene pacing, prompts, and production readiness. Phase 2.0 remains UI-only with placeholder data.</p>
          </div>
          <div className="shrink-0 pt-0.5 text-right">
            <p className="text-[11px] font-medium text-slate-300">{autosaveStatusLine}</p>
            <p className="mt-1 text-[11px] text-slate-500">Last saved {lastSavedLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <JourneyCard icon={<Compass size={14} />} label="Plan" value="Map the narrative direction" />
          <JourneyCard icon={<Sparkles size={14} />} label="Think" value="Shape hooks, pacing, and scene logic" />
          <JourneyCard icon={<Clapperboard size={14} />} label="Direct" value="Review prompts and performance cues" />
          <JourneyCard icon={<WandSparkles size={14} />} label="Produce" value="Prepare export-ready creative assets" />
        </div>
      </div>

      <div className="space-y-5 md:space-y-6">
        <ProjectOverview project={project} duration="40 seconds" sceneCount={mockScenes.length} />
        <DirectorDashboard project={project} />
        <StoryArc />
        <StoryboardTimeline scenes={mockScenes} />

        <div className="grid gap-5 2xl:grid-cols-2">
          <DirectorNotes note="This story opens with an emotional retention hook, escalates with a concrete buyer pain point, then resolves through a structured framework before a high-intent CTA." />
          <DirectorAdvice />
          <VoiceoverPanel
            voiceover="What if your next land purchase in Sabah could be validated in under one hour? Start with location truth, verify access, confirm title clarity, evaluate growth signals, and execute with confidence."
            cta="DM 'CHECKLIST' to get the full buyer due diligence framework."
            hashtags="#BorneoLandGatekeeper #SabahProperty #LandInvestment #RealEstateStrategy"
          />
          <GoogleFlowPanel />
        </div>

        <ProductionProgress />
      </div>
    </div>
  );
}

function JourneyCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
