import { BrainCircuit, Star } from "lucide-react";

const ratings = [
  { label: "Hook", stars: "★★★★★" },
  { label: "Emotion", stars: "★★★★☆" },
  { label: "Curiosity", stars: "★★★★★" },
];

export default function DirectorAdvice() {
  return (
    <section className="rounded-2xl border border-cyan-300/30 bg-[linear-gradient(160deg,rgba(8,47,73,0.35),rgba(15,23,42,0.8))] p-5 shadow-[0_20px_55px_rgba(2,6,23,0.35)]">
      <div className="flex items-start gap-2.5">
        <div className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 p-1.5 text-cyan-100">
          <BrainCircuit size={14} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-50">Director Advice</h3>
          <p className="mt-1 text-xs leading-6 text-cyan-100/70">AI-directed feedback for retention and emotional pacing.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2.5 text-sm">
        {ratings.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-cyan-300/20 bg-slate-950/45 px-3.5 py-2.5">
            <span className="text-slate-100">{item.label}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-yellow-300"><Star size={12} fill="currentColor" /> {item.stars}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3.5 py-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-50">Retention Estimate</p>
            <p className="mt-1 text-xl font-semibold text-white">89%</p>
          </div>
          <p className="text-xs text-cyan-100/75">Strong opening retention</p>
        </div>
      </div>
    </section>
  );
}
