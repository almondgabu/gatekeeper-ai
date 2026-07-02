import Link from "next/link";

const workflowSteps = [
  "AI Idea Explorer",
  "Content Creator",
  "Viral Scanner",
  "AI Production Studio",
  "Publishing",
  "AI Content Intelligence",
  "Next Creative Campaign",
];

export default function AboutPage() {
  return (
    <section className="min-h-screen p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Gatekeeper AI</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">Gatekeeper AI</h1>
          <p className="mt-3 text-lg text-slate-300">Creative Operating System</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1">Version 1.0</span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Production Ready
            </span>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Founder</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Founder &amp; Product Owner</h2>
          <p className="mt-1 text-xl text-yellow-300">Almond Gabu</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Designed, conceived, and continuously developed by Almond Gabu to help creators and property
            professionals transform ideas into complete AI-assisted production workflows.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mission</p>
          <p className="mt-3 text-base leading-8 text-slate-200 md:text-lg">
            Our mission is to empower creators with a complete Creative Operating System that transforms ideas into
            high-quality content through structured planning, production, publishing, and continuous learning.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Product Philosophy</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Gatekeeper AI IS</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>AI Creative Director</li>
                <li>Creative Workflow Planner</li>
                <li>Production Coordinator</li>
                <li>Publishing Assistant</li>
                <li>Strategic Intelligence Engine</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">Gatekeeper AI IS NOT</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>Video Rendering Engine</li>
                <li>Image Rendering Platform</li>
                <li>Automated Publishing Bot</li>
                <li>Social Media Analytics Dashboard</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Core Workflow</p>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <ol className="space-y-2 text-center text-sm text-slate-200">
              {workflowSteps.map((step, index) => (
                <li key={step}>
                  <p>{step}</p>
                  {index < workflowSteps.length - 1 ? <p className="text-slate-500">↓</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Technology</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">Built using:</p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
            <li>Next.js</li>
            <li>React</li>
            <li>TypeScript</li>
            <li>Tailwind CSS</li>
            <li>OpenAI APIs</li>
            <li>GitHub Copilot</li>
            <li>Google Gemini</li>
          </ul>
          <p className="mt-4 text-sm text-slate-400">Powered by modern AI technologies and web frameworks.</p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Version Information</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-400">Product</p>
              <p className="mt-1 font-medium text-white">Gatekeeper AI</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-400">Version</p>
              <p className="mt-1 font-medium text-white">Version 1.0</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-400">Product Line</p>
              <p className="mt-1 font-medium text-white">Creative Operating System</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-slate-400">Workflow Status</p>
              <p className="mt-1 font-medium text-emerald-200">100% Complete</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:col-span-2">
              <p className="text-slate-400">Production Status</p>
              <p className="mt-1 font-medium text-emerald-200">Ready for Live Use</p>
            </div>
          </div>
        </section>

        <div className="pb-2">
          <Link
            href="/"
            className="inline-flex rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}