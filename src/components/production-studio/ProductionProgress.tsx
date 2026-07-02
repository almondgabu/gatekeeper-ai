import { BarChart3, CheckCircle2 } from "lucide-react";

const progressItems = [
  { label: "Story", value: 92 },
  { label: "Storyboard", value: 84 },
  { label: "Voiceover", value: 78 },
  { label: "Image Prompts", value: 88 },
  { label: "Video Prompts", value: 85 },
  { label: "Ready for Google Flow", value: 63 },
];

export default function ProductionProgress() {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-[0_16px_45px_rgba(2,6,23,0.26)]">
      <div className="flex items-start gap-2.5">
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-1.5 text-cyan-200">
          <BarChart3 size={14} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">Production Progress</h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">Completion confidence across script, visuals, and export readiness.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {progressItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3.5">
            <div className="mb-2.5 flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium text-slate-200">{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
        <CheckCircle2 size={12} /> Premium readiness improving
      </div>
    </section>
  );
}
