type StudioMode = "create-content" | "inspiration" | "saved";

type WorkflowNavigatorProps = {
  mode: StudioMode;
  step2Title: string;
  step2Description: string;
  step2Enabled: boolean;
  onSelectStep: (nextMode: StudioMode) => void;
};

export default function WorkflowNavigator({
  mode,
  step2Title,
  step2Description,
  step2Enabled,
  onSelectStep,
}: WorkflowNavigatorProps) {
  const steps: Array<{
    id: StudioMode;
    stepNumber: string;
    title: string;
    description: string;
    disabled?: boolean;
  }> = [
    {
      id: "inspiration",
      stepNumber: "Step 1",
      title: "🧠 AI Idea Explorer",
      description: "Generate • Explore • Select",
    },
    {
      id: "create-content",
      stepNumber: "Step 2",
      title: step2Title,
      description: step2Description,
      disabled: !step2Enabled,
    },
    {
      id: "saved",
      stepNumber: "Step 3",
      title: "📁 Saved Projects",
      description: "Resume ideas, drafts and workspaces",
    },
  ];

  const activeIndex = steps.findIndex((step) => step.id === mode);

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const isActive = mode === step.id;
          const isCompleted = index < activeIndex;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              disabled={step.disabled}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                isActive
                  ? "border-yellow-500/50 bg-yellow-500/10"
                  : isCompleted
                    ? "border-slate-700 bg-slate-900/80"
                    : "border-slate-800 bg-slate-900/40"
              } ${step.disabled ? "cursor-not-allowed opacity-60" : "hover:border-yellow-500/40"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{step.stepNumber}</p>
                {isActive ? (
                  <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-yellow-200">
                    Active
                  </span>
                ) : isCompleted ? (
                  <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300">
                    Complete
                  </span>
                ) : null}
              </div>

              <h3 className="mt-2 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}