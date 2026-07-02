import { BadgeCheck, ClipboardCheck } from "lucide-react";

const checklistItems = ["Hook", "Problem", "Curiosity", "Emotion", "Solution", "CTA"];

export default function DirectorChecklist() {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-[0_16px_45px_rgba(2,6,23,0.26)] md:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-2 text-cyan-200">
          <ClipboardCheck size={16} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white md:text-lg">Director Checklist</h2>
          <p className="mt-1 text-xs text-slate-400">Narrative checkpoints across pacing and conversion intent.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
        {checklistItems.map((item) => (
          <div key={item} className="flex items-center justify-between rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5">
            <p className="text-sm font-medium text-slate-100">{item}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
              <BadgeCheck size={14} />
              Ready
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-400/10 p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">Story Score</p>
            <p className="mt-2 text-2xl font-semibold text-white">92%</p>
          </div>
          <p className="text-xs text-cyan-100/80">High retention confidence</p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-slate-900/60">
          <div className="h-2.5 rounded-full bg-cyan-300" style={{ width: "92%" }} />
        </div>
      </div>
    </section>
  );
}
