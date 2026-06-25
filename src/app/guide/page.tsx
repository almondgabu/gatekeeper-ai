import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  FolderKanban,
  HelpCircle,
  Lightbulb,
  ListTodo,
  MessageSquare,
  Rocket,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";

const guideSections = [
  { id: "getting-started", title: "Getting Started", icon: Compass },
  { id: "core-concepts", title: "Core Concepts", icon: BookOpen },
  { id: "features", title: "Features", icon: Sparkles },
  { id: "recommended-workflow", title: "Recommended Workflow", icon: Workflow },
  { id: "best-practices", title: "Best Practices", icon: Lightbulb },
  { id: "roadmap", title: "Roadmap", icon: Rocket },
  { id: "faq", title: "FAQ", icon: HelpCircle },
];

const whatsNew = [
  "Simple Project Tasks",
  "Recent Activity Timeline",
  "AI Project Dashboard",
  "Semantic Project Memory Retrieval",
  "Project Brief Generator",
];

const completedRoadmap = [
  "Knowledge Vault",
  "Project Memories",
  "Semantic Memory Retrieval",
  "Project Briefs",
  "AI Dashboard",
  "Recent Activity",
  "Project Tasks",
];

const futureIdeas = [
  "Cross-project search",
  "Gmail and Google Drive integration",
  "WhatsApp import",
  "Advanced automation and workflows",
];

export default function GuidePage() {
  return (
    <div className="min-h-screen w-full px-6 py-8 text-white md:px-10 md:py-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_320px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-400">Learning Center</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">User Guide</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              Gatekeeper AI helps you organize project knowledge, retrieve the right context quickly, and keep work moving.
              This guide explains how the platform works in plain language so you can use it confidently without guessing.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
              >
                <FolderKanban size={18} />
                Open Projects
              </Link>

              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
              >
                <MessageSquare size={18} />
                Open Chat
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">On This Page</p>
            <div className="mt-4 space-y-2">
              {guideSections.map((section) => {
                const Icon = section.icon;

                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 px-4 py-3 text-sm text-slate-300 transition hover:border-yellow-500/30 hover:bg-slate-900 hover:text-white"
                  >
                    <Icon size={16} className="text-yellow-400" />
                    {section.title}
                  </a>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_340px]">
        <div className="space-y-8">
          <GuideCard id="getting-started" icon={<Compass className="text-yellow-400" size={22} />} title="Getting Started">
            <p>
              Start by creating a project. A project is your workspace for documents, conversations, memories, tasks, and summaries tied to one matter or objective.
            </p>
            <p>
              Upload project documents into the Knowledge Vault with a project selected. Then use project chat so retrieval stays focused on that project instead of mixing in unrelated material.
            </p>
            <p>
              As you use the system, save important memories and keep tasks updated. Over time, the dashboard, timeline, and project brief become more useful because they reflect real usage.
            </p>
          </GuideCard>

          <GuideCard id="core-concepts" icon={<BookOpen className="text-yellow-400" size={22} />} title="Core Concepts">
            <ConceptList
              items={[
                {
                  title: "Projects",
                  body: "Projects are structured workspaces that keep documents, chat, memories, tasks, and summaries grouped together.",
                },
                {
                  title: "Documents",
                  body: "Documents are uploaded files that can be indexed for retrieval so the AI can answer with project-specific source context.",
                },
                {
                  title: "Conversations",
                  body: "Conversations are chat histories. In a project chat, retrieval is scoped to that project.",
                },
                {
                  title: "Memories",
                  body: "Memories are durable facts, decisions, constraints, and insights saved to a project for future retrieval.",
                },
                {
                  title: "Tasks",
                  body: "Tasks are lightweight action items inside a project. They help turn knowledge into next steps without needing a separate tool.",
                },
              ]}
            />
          </GuideCard>

          <GuideCard id="features" icon={<Sparkles className="text-yellow-400" size={22} />} title="Features">
            <FeatureList
              items={[
                {
                  title: "Suggested Memory",
                  body: "After useful assistant responses in project chat, Gatekeeper AI can suggest a memory worth saving. You decide whether to keep it.",
                },
                {
                  title: "Semantic Search",
                  body: "Project memories can now be retrieved semantically, which means related memories can still be found even when your wording is different.",
                },
                {
                  title: "Project Brief",
                  body: "The brief generator summarizes what the platform currently knows about a project using available documents, memories, and conversations.",
                },
                {
                  title: "AI Dashboard",
                  body: "The dashboard gives a quick overview of project health, stats, brief status, suggestions, and recent activity.",
                },
                {
                  title: "Recent Activity",
                  body: "The timeline shows what changed recently, including memories, conversations, documents, briefs, and tasks.",
                },
                {
                  title: "Project Tasks",
                  body: "Tasks let you track open work and completed work directly inside the project without adding extra workflow complexity.",
                },
              ]}
            />
          </GuideCard>

          <GuideCard id="recommended-workflow" icon={<Workflow className="text-yellow-400" size={22} />} title="Recommended Workflow">
            <ol className="space-y-4 text-slate-300">
              <li>1. Create a project for the matter, client, or workstream you want to organize.</li>
              <li>2. Upload relevant documents into the project so retrieval has source material.</li>
              <li>3. Use project chat for analysis, drafting, and follow-up questions.</li>
              <li>4. Save or accept important memories when key decisions, facts, or constraints appear.</li>
              <li>5. Add project tasks for clear next actions that should not be lost in conversation history.</li>
              <li>6. Generate a project brief when you want a current snapshot of what the system knows.</li>
              <li>7. Review the dashboard and recent activity timeline to stay oriented.</li>
            </ol>
          </GuideCard>

          <GuideCard id="best-practices" icon={<Lightbulb className="text-yellow-400" size={22} />} title="Best Practices">
            <ul className="space-y-4 text-slate-300">
              <li>Use one project per real workstream so retrieval stays focused.</li>
              <li>Save memories for facts that should still matter weeks later, not for every minor note.</li>
              <li>Keep task titles short and action-oriented.</li>
              <li>Generate briefs after meaningful project changes, not on every small edit.</li>
              <li>Use project chat instead of global chat when you want the answer grounded in project context.</li>
              <li>Watch the timeline and dashboard suggestions to spot missing context early.</li>
            </ul>
          </GuideCard>

          <GuideCard id="roadmap" icon={<Rocket className="text-yellow-400" size={22} />} title="Roadmap / Future Ideas">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="text-lg font-semibold text-white">Completed</h3>
                <ul className="mt-4 space-y-3 text-slate-300">
                  {completedRoadmap.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <h3 className="text-lg font-semibold text-white">Future Ideas</h3>
                <ul className="mt-4 space-y-3 text-slate-300">
                  {futureIdeas.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Rocket size={16} className="text-yellow-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
              <h3 className="text-lg font-semibold text-yellow-200">Should We Build This?</h3>
              <p className="mt-3 text-slate-300">
                New features should be added only after real usage shows they are needed. The goal is to solve real workflow pain, not to accumulate shiny options that create complexity without improving outcomes.
              </p>
              <p className="mt-3 text-slate-300">
                If a future idea does not clearly improve daily usage, retrieval quality, or operational clarity, it should probably wait.
              </p>
            </div>
          </GuideCard>

          <GuideCard id="faq" icon={<HelpCircle className="text-yellow-400" size={22} />} title="FAQ">
            <FaqList
              items={[
                {
                  question: "When should I use a project instead of global chat?",
                  answer: "Use a project whenever the answer should depend on project-specific documents, memories, tasks, or conversation history.",
                },
                {
                  question: "What is the difference between a memory and a task?",
                  answer: "A memory stores something important to know later. A task stores something important to do later.",
                },
                {
                  question: "Why does Suggested Memory ask before saving?",
                  answer: "Because not every assistant message deserves long-term storage. You stay in control of what becomes durable knowledge.",
                },
                {
                  question: "Does the project brief update automatically?",
                  answer: "No. It reflects the brief currently generated in the page state. Regenerate it when you want a refreshed summary.",
                },
                {
                  question: "What should I do if a project feels empty or unhelpful?",
                  answer: "Upload a few core documents, start a project chat, save a couple of key memories, and add the next task. That is usually enough to make the workspace useful.",
                },
              ]}
            />
          </GuideCard>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <Brain className="text-yellow-400" size={20} />
              <h2 className="text-lg font-semibold">What&apos;s New</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {whatsNew.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-yellow-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <Search className="text-yellow-400" size={20} />
              <h2 className="text-lg font-semibold">Quick Understanding</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Projects organize work.</li>
              <li>Documents provide evidence.</li>
              <li>Conversations capture interaction history.</li>
              <li>Memories preserve durable facts.</li>
              <li>Tasks track action items.</li>
              <li>Briefs summarize the current known state.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <ListTodo className="text-yellow-400" size={20} />
              <h2 className="text-lg font-semibold">Use It Well</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Gatekeeper AI works best when the team uses it consistently enough for patterns to emerge. Start simple, observe what is helpful, and only expand the workflow where it clearly saves time or reduces missed context.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function GuideCard({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 scroll-mt-6">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="mt-5 space-y-4 leading-7 text-slate-300">{children}</div>
    </section>
  );
}

function ConceptList({
  items,
}: {
  items: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureList({
  items,
}: {
  items: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

function FaqList({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.question} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <h3 className="text-lg font-semibold text-white">{item.question}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}