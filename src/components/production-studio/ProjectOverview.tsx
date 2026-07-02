import { ProductionWorkspaceProject } from "@/types/production-studio";
import { Clapperboard, Film, Timer, Type } from "lucide-react";

type ProjectOverviewProps = {
  project: ProductionWorkspaceProject;
  duration: string;
  sceneCount: number;
};

export default function ProjectOverview({ project, duration, sceneCount }: ProjectOverviewProps) {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_16px_45px_rgba(2,6,23,0.26)] md:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-200">
          <Film size={16} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white md:text-lg">Project Overview</h2>
          <p className="mt-1 text-xs leading-6 text-slate-400">Core production brief for the current storyboard package.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Video Title</p>
          <p className="mt-2.5 text-base font-semibold leading-7 text-white">{project.name}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Content Type Badge</p>
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
            <Clapperboard size={12} />
            Video / Reel
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Story Summary</p>
          <p className="mt-2.5 max-w-3xl text-sm leading-8 text-slate-300">
            {project.description || "A cinematic short-form story engineered for retention and clear conversion."}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Story Objective</p>
          <p className="mt-2.5 max-w-xl text-sm leading-7 text-slate-200">Educate viewers and drive qualified inquiry through trust-building visual storytelling.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 px-3.5 py-3">
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-500"><Timer size={12} /> Duration</p>
            <p className="mt-2 text-sm font-medium text-white">{duration}</p>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 px-3.5 py-3">
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-500"><Type size={12} /> Scene Count</p>
            <p className="mt-2 text-sm font-medium text-white">{sceneCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
