import { ProductionWorkspaceProject } from "@/types/production-studio";
import { ReactNode } from "react";
import { CircleDollarSign, Clock3, LayoutGrid, Mic2, Palette, Target, Users, Volume2, Waves } from "lucide-react";

type DirectorDashboardProps = {
  project: ProductionWorkspaceProject;
};

function DashboardCard({ label, value, featured = false }: { label: string; value: string; featured?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${featured ? "border-cyan-300/25 bg-cyan-400/8" : "border-slate-700/80 bg-slate-950/60"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 font-medium leading-6 ${featured ? "text-base text-white" : "text-sm text-slate-100"}`}>{value}</p>
    </div>
  );
}

export default function DirectorDashboard({ project }: DirectorDashboardProps) {
  const source = project.sourceMetadata;

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_16px_45px_rgba(2,6,23,0.26)] md:p-7">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-200">
          <LayoutGrid size={16} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white md:text-lg">Director Dashboard</h2>
          <p className="mt-1 text-xs leading-6 text-slate-400">Creative metadata and production guidance at a glance.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3.5 md:grid-cols-2">
        <div className="sm:col-span-2">
          <DashboardCard label="Project Title" value={project.name} featured />
        </div>
        <DashboardCard label="Platform" value={source?.platform || "Instagram Reels"} />
        <DashboardCard label="Duration" value={source?.productionTime || "40 seconds"} />
        <DashboardCard label="Story Style" value={source?.inheritedStyle || "Educational"} />
        <DashboardCard label="Goal" value={source?.inheritedGoal || "Educate"} />
        <div className="md:col-span-2">
          <DashboardCard label="Target Audience" value={project.targetAudience || "Property buyers in Sabah"} />
        </div>
        <DashboardCard label="Narration Style" value="Cinematic Narrative" />
        <DashboardCard label="Voice" value="Confident Male (Warm)" />
        <DashboardCard label="Music Mood" value="Motivational Ambient" />
        <DashboardCard label="Visual Style" value="Documentary Reel" />
        <DashboardCard label="Estimated Production Time" value={source?.productionTime || "Half day"} />
        <DashboardCard label="Estimated AI Cost" value="USD 4.80" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <StatPill icon={<Target size={14} />} label="Goal Locked" />
        <StatPill icon={<Users size={14} />} label="Audience Defined" />
        <StatPill icon={<Palette size={14} />} label="Visual Style" />
        <StatPill icon={<Mic2 size={14} />} label="Voice Ready" />
        <StatPill icon={<Clock3 size={14} />} label="Timed Scenes" />
        <StatPill icon={<CircleDollarSign size={14} />} label="Cost Visible" />
        <StatPill icon={<Volume2 size={14} />} label="Narration Ready" />
        <StatPill icon={<Waves size={14} />} label="Music Mood" />
      </div>
    </section>
  );
}

function StatPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/50 px-2.5 py-2 text-[11px] font-medium text-slate-200">
      <span className="text-cyan-200">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
