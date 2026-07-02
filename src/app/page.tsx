"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardResponse = {
  greeting: string;
  timeZone: string;
  stats: {
    totalProjects: number;
    totalDocuments: number;
    totalConversations: number;
    openTasks: number;
    recentDecisions: number;
    sessionSummaries: number;
  };
  aiBriefing: {
    whatChangedRecently: string[];
    recommendedNextAction: string | null;
  };
  todaysPriorities: Array<{
    taskId: string;
    projectId: string;
    projectName: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    updatedAt: string;
    reason: string;
  }>;
  projectsRequiringAttention: Array<{
    projectId: string;
    projectName: string;
    openTaskCount: number;
    recentDecisionCount: number;
    recentSessionSummaryCount: number;
    lastActivityAt: string | null;
  }>;
  opportunitySummary: {
    activeOpportunities: number;
    highPriorityOpportunities: number;
    potentialCommission: number;
    bestOpportunityToday: {
      id: string;
      title: string;
      opportunityType: string;
      stage: string;
      score: number;
      priorityBand: string;
      recommendation: string;
      nextAction: string | null;
      estimatedCommission: number;
      followUpDate: string | null;
    } | null;
  };
  aiLearningToday: {
    sessionSummariesCreated: number;
    decisionsLearned: number;
    tasksCreated: number;
    documentsIndexed: number;
  };
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-sm text-slate-400">
      <p className="font-medium text-slate-200">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to load dashboard.");
        }

        if (!cancelled) {
          setDashboard(data as DashboardResponse);
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorMessage(error?.message ?? "Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const latestProject = dashboard?.projectsRequiringAttention[0] ?? null;

  return (
    <section className="min-h-screen p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-yellow-400/80">AI Command Center</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                {loading ? "Loading your dashboard..." : `${dashboard?.greeting ?? "Welcome"}, Almond`}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-400 md:text-base">
                {loading
                  ? "Preparing your latest project activity, priorities, and learned context."
                  : dashboard?.aiBriefing.recommendedNextAction ||
                    "Your latest priorities, project signals, and AI learning are ready below."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[430px]">
              <MetricTile label="Projects" value={dashboard?.stats.totalProjects ?? 0} />
              <MetricTile label="Documents" value={dashboard?.stats.totalDocuments ?? 0} />
              <MetricTile label="Conversations" value={dashboard?.stats.totalConversations ?? 0} />
              <MetricTile label="Open Tasks" value={dashboard?.stats.openTasks ?? 0} />
            </div>
          </div>
        </div>

        <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Product Identity</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Gatekeeper AI</h3>
              <p className="mt-1 text-sm text-slate-300">Version 1.0 · Creative Operating System</p>
              <p className="mt-1 text-sm text-slate-400">Designed &amp; Owned by Almond Gabu</p>
            </div>
            <Link
              href="/about"
              className="inline-flex rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
            >
              Learn More
            </Link>
          </div>
        </section>

        {errorMessage ? (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">
            <p className="font-semibold">Dashboard unavailable</p>
            <p className="mt-1 text-red-100/80">{errorMessage}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI Briefing</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">What changed recently</h3>
                </div>
                {!loading && dashboard ? (
                  <p className="text-xs text-slate-500">Time zone: {dashboard.timeZone}</p>
                ) : null}
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-5 w-5/6 animate-pulse rounded bg-slate-800" />
                    <div className="h-5 w-4/6 animate-pulse rounded bg-slate-800" />
                    <div className="h-5 w-3/6 animate-pulse rounded bg-slate-800" />
                  </div>
                ) : dashboard && dashboard.aiBriefing.whatChangedRecently.length > 0 ? (
                  <ul className="space-y-3">
                    {dashboard.aiBriefing.whatChangedRecently.map((item) => (
                      <li
                        key={item}
                        className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No notable changes recorded recently"
                    description="Start a project chat, save a memory, or add a task to build today’s AI briefing."
                  />
                )}
              </div>

              {!loading && dashboard?.aiBriefing.recommendedNextAction ? (
                <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  <p className="text-xs uppercase tracking-[0.22em] text-yellow-300/80">Recommended Next Action</p>
                  <p className="mt-2 font-medium">{dashboard.aiBriefing.recommendedNextAction}</p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Today&apos;s Priorities</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Focus areas for today</h3>

              <div className="mt-5 space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-20 animate-pulse rounded-2xl bg-slate-800" />
                    <div className="h-20 animate-pulse rounded-2xl bg-slate-800" />
                  </div>
                ) : dashboard && dashboard.todaysPriorities.length > 0 ? (
                  dashboard.todaysPriorities.map((priority) => (
                    <div key={priority.taskId} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{priority.projectName}</p>
                          <h4 className="mt-2 text-lg font-semibold text-white">{priority.title}</h4>
                          <p className="mt-2 text-sm text-slate-400">
                            {priority.description || "No additional task detail recorded yet."}
                          </p>
                        </div>

                        <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                          <p>{priority.reason}</p>
                          <p className="mt-1 text-slate-500">
                            {priority.dueDate ? `Due ${priority.dueDate}` : `Updated ${formatDateTime(priority.updatedAt)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No open priorities right now"
                    description="You are clear for the moment. Start a new chat, review a project, or upload fresh material to create the next priority." 
                  />
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Projects Requiring Attention</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Where attention is concentrating</h3>

              <div className="mt-5 space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-24 animate-pulse rounded-2xl bg-slate-800" />
                    <div className="h-24 animate-pulse rounded-2xl bg-slate-800" />
                  </div>
                ) : dashboard && dashboard.projectsRequiringAttention.length > 0 ? (
                  dashboard.projectsRequiringAttention.map((project) => (
                    <div key={project.projectId} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{project.projectName}</h4>
                          <p className="mt-2 text-sm text-slate-400">
                            {project.openTaskCount} open tasks, {project.recentDecisionCount} recent decisions, {project.recentSessionSummaryCount} recent summaries.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                          Last activity
                          <p className="mt-1 text-slate-500">{formatDateTime(project.lastActivityAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No projects currently require attention"
                    description="Once open tasks, recent decisions, or session summaries appear, they will surface here automatically." 
                  />
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Opportunity Hub</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Where conversion is most likely</h3>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricTile label="Active" value={dashboard?.opportunitySummary.activeOpportunities ?? 0} />
                <MetricTile label="High Priority" value={dashboard?.opportunitySummary.highPriorityOpportunities ?? 0} />
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Potential Commission</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCurrency(dashboard?.opportunitySummary.potentialCommission ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {!loading && dashboard?.opportunitySummary.bestOpportunityToday ? (
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-yellow-300/80">Best Opportunity Today</p>
                        <h4 className="mt-2 text-lg font-semibold text-white">
                          {dashboard.opportunitySummary.bestOpportunityToday.title}
                        </h4>
                        <p className="mt-2 text-yellow-100/85">
                          {dashboard.opportunitySummary.bestOpportunityToday.recommendation}
                        </p>
                        {dashboard.opportunitySummary.bestOpportunityToday.nextAction ? (
                          <p className="mt-2 text-yellow-100/75">
                            Next action: {dashboard.opportunitySummary.bestOpportunityToday.nextAction}
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 rounded-2xl border border-yellow-500/20 bg-slate-950/40 px-3 py-2 text-xs text-yellow-100">
                        <p>Score {dashboard.opportunitySummary.bestOpportunityToday.score}</p>
                        <p className="mt-1">
                          {dashboard.opportunitySummary.bestOpportunityToday.followUpDate
                            ? `Follow-up ${dashboard.opportunitySummary.bestOpportunityToday.followUpDate}`
                            : formatCurrency(dashboard.opportunitySummary.bestOpportunityToday.estimatedCommission)}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/opportunities/${dashboard.opportunitySummary.bestOpportunityToday.id}`}
                      className="mt-4 inline-flex rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-yellow-400"
                    >
                      Open Opportunity
                    </Link>
                  </div>
                ) : (
                  <EmptyState
                    title="No active opportunities yet"
                    description="Capture a buyer request, listing, match, or follow-up to start surfacing opportunity intelligence here."
                  />
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI Learning Today</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">What Gatekeeper captured</h3>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MetricTile label="Summaries" value={dashboard?.aiLearningToday.sessionSummariesCreated ?? 0} />
                <MetricTile label="Decisions" value={dashboard?.aiLearningToday.decisionsLearned ?? 0} />
                <MetricTile label="Tasks" value={dashboard?.aiLearningToday.tasksCreated ?? 0} />
                <MetricTile label="Indexed" value={dashboard?.aiLearningToday.documentsIndexed ?? 0} />
              </div>

              {!loading && dashboard ? (
                <p className="mt-4 text-sm text-slate-400">
                  {dashboard.aiLearningToday.sessionSummariesCreated === 0 &&
                  dashboard.aiLearningToday.decisionsLearned === 0 &&
                  dashboard.aiLearningToday.tasksCreated === 0 &&
                  dashboard.aiLearningToday.documentsIndexed === 0
                    ? "No new learning has been recorded today yet."
                    : "Today’s learning reflects new summaries, decisions, tasks, and indexed documents already captured by the system."}
                </p>
              ) : null}
            </section>

            <section className="rounded-[26px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick Actions</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Jump back into work</h3>

              <div className="mt-5 space-y-3">
                {latestProject ? (
                  <Link
                    href={`/chat?projectId=${latestProject.projectId}`}
                    className="flex w-full items-center justify-between rounded-2xl bg-yellow-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
                  >
                    <span>Continue Last Project</span>
                    <span className="text-xs font-medium uppercase tracking-[0.2em]">{latestProject.projectName}</span>
                  </Link>
                ) : null}

                <Link
                  href="/chat?new=1"
                  className="flex w-full items-center justify-between rounded-2xl bg-yellow-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-yellow-400"
                >
                  <span>New Chat</span>
                  <span className="text-xs font-medium uppercase tracking-[0.2em]">Start</span>
                </Link>

                <Link
                  href="/opportunities"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 transition hover:bg-slate-700"
                >
                  <span>Open Opportunity Hub</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Pipeline</span>
                </Link>

                <Link
                  href="/vault"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 transition hover:bg-slate-700"
                >
                  <span>Upload Document</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Vault</span>
                </Link>

                <Link
                  href="/vault"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 transition hover:bg-slate-700"
                >
                  <span>Search Vault</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Lookup</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}