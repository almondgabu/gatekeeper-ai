import { ArrowRight, Brain, Lightbulb, Megaphone, ShieldAlert, Sparkles } from "lucide-react";

const arcSteps = ["Hook", "Problem", "Discovery", "Solution", "Call To Action"];

const arcIcons = [Lightbulb, ShieldAlert, Brain, Sparkles, Megaphone];

export default function StoryArc() {
  return (
    <section className="max-w-full rounded-2xl border border-slate-700/80 bg-slate-900/70 p-6 shadow-[0_16px_45px_rgba(2,6,23,0.26)] md:p-7">
      <h2 className="text-base font-semibold text-white md:text-lg">Story Arc</h2>
      <p className="mt-1 text-xs leading-6 text-slate-400">Pacing sequence for retention from first second to conversion trigger.</p>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2.5">
        {arcSteps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-100">
              {(() => {
                const Icon = arcIcons[index];
                return <Icon size={13} className="text-cyan-200" />;
              })()}
              {step}
            </div>
            {index < arcSteps.length - 1 ? <div className="flex items-center gap-1 px-0.5"><div className="h-px w-6 bg-slate-700" /><ArrowRight size={13} className="text-slate-500" /></div> : null}
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}
