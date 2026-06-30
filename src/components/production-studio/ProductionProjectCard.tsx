import { Clapperboard, Clock3, Layers3, PlayCircle } from "lucide-react";
import { ProductionWorkspaceProject } from "@/types/production-studio";
import { type ReactNode } from "react";

type ProductionProjectCardProps = {
  project: ProductionWorkspaceProject;
  onOpen: (projectId: string) => void;
  formatLastModified: (value: string) => string;
  isOpening?: boolean;
};

export default function ProductionProjectCard({ project, onOpen, formatLastModified, isOpening = false }: ProductionProjectCardProps) {
  const sourcePlatform = project.sourceMetadata?.platform || "facebook";
  const status = project.productionStatus || "Planning";
  const sceneCount = Number.isFinite(Number(project.sceneCount)) ? Number(project.sceneCount) : 5;
  const lastModified = formatLastModified(project.lastModifiedAt || project.updatedAt);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/95 shadow-[0_20px_56px_rgba(2,6,23,0.26)]">
      <div className="grid gap-5 p-5 md:grid-cols-[280px,1fr] md:gap-6 md:p-6">
        <div className="flex items-center">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-700/70 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_45%),linear-gradient(140deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-4">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(15,23,42,0.18)_50%,transparent_100%)]" />
            <div className="relative flex h-full items-end justify-between rounded-lg border border-slate-700/60 bg-slate-950/50 px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                <Clapperboard size={11} />
                Preview Frame
              </span>
              <span className="text-[10px] text-slate-500">Thumbnail soon</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Production Project</p>
              <h3 className="mt-2 text-[1.7rem] font-semibold leading-tight text-white">{project.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{project.description || "AI Director production workspace"}</p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => onOpen(project.id)}
                disabled={isOpening}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-yellow-500 px-4.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-wait disabled:bg-yellow-500/80"
              >
                <PlayCircle size={16} />
                {isOpening ? "Opening..." : "Open Project"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <CardField label="Platform" value={sourcePlatform} />
            <CardField label="Production Status" value={<StatusBadge status={status} />} />
            <CardField label="Scene Count" value={String(sceneCount)} />
            <CardField label="Last Modified" value={lastModified} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Badge icon={<Clapperboard size={12} />} label={project.category || "Video / Reel"} />
            <Badge icon={<Layers3 size={12} />} label={`v${project.version || 1}`} />
            <Badge icon={<Clock3 size={12} />} label="Local autosave" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CardField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-900/50 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized === "active"
    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
    : normalized === "archived"
      ? "border-slate-500/30 bg-slate-700/30 text-slate-300"
      : "border-amber-400/30 bg-amber-500/15 text-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}

function Badge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
      {icon}
      {label}
    </span>
  );
}
