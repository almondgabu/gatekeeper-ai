import { Sparkles } from "lucide-react";

export default function GoogleFlowPanel() {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-[0_16px_45px_rgba(2,6,23,0.26)]">
      <div className="flex items-start gap-2.5">
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-1.5 text-cyan-200">
          <Sparkles size={14} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">Google Flow Package</h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">Placeholder only for Phase 2.0. Generation is not connected yet.</p>
        </div>
      </div>
      <button
        type="button"
        className="mt-4 w-full cursor-not-allowed rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-4 py-2.5 text-sm font-semibold text-slate-300"
        aria-disabled="true"
      >
        Generate Google Flow Package
      </button>
    </section>
  );
}
