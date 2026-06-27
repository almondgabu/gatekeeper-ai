import { NextResponse } from "next/server";
import {
  GATEKEEPER_DEFAULT_TIME_ZONE,
  getTimeOfDayGreeting,
} from "@/lib/greeting";
import { buildOpportunityDashboardSummary, type OpportunityRecord } from "@/lib/opportunityIntelligence";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const RECENT_ACTIVITY_DAYS = 7;
const MAX_BRIEFING_ITEMS = 5;
const MAX_PRIORITY_ITEMS = 6;
const MAX_ATTENTION_ITEMS = 8;

type ProjectRow = {
  id: string;
  name: string;
};

type OpenTaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type MemoryRow = {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
  memory_type: string;
};

type ConversationRow = {
  id: number;
  project_id: string | null;
  title: string | null;
  created_at: string;
};

type DocumentRow = {
  id: string;
  project_id: string | null;
  filename: string | null;
  status: string | null;
  created_at: string | null;
};

type OpportunityRow = OpportunityRecord;

type BriefingItem = {
  type: "decision" | "session_summary" | "task" | "document";
  projectId: string | null;
  projectName: string;
  title: string;
  createdAt: string;
  detail: string | null;
};

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  const offsetValue = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = offsetValue.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/i);

  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");

  return sign * (hours * 60 + minutes);
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  return { year, month, day };
}

function getTimeZoneDayWindow(date: Date, timeZone: string) {
  const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(
    new Date(Date.UTC(year, month - 1, day, 12, 0, 0)),
    timeZone
  );
  const startUtcMillis = Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60_000;
  const endUtcMillis = startUtcMillis + 24 * 60 * 60 * 1000;

  return {
    startIso: new Date(startUtcMillis).toISOString(),
    endIso: new Date(endUtcMillis).toISOString(),
  };
}

function getProjectName(projectId: string | null, projectNameById: Map<string, string>) {
  if (!projectId) {
    return "Unassigned";
  }

  return projectNameById.get(projectId) ?? `Project ${projectId}`;
}

function summarizeContent(value: string, maxLength = 140) {
  const collapsed = collapseWhitespace(value);
  return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength - 1).trimEnd()}…` : collapsed;
}

function formatBriefingItem(item: BriefingItem) {
  if (item.type === "decision") {
    return `Decision in ${item.projectName}: ${item.title}`;
  }

  if (item.type === "session_summary") {
    return `Session summary captured for ${item.projectName}: ${item.title}`;
  }

  if (item.type === "task") {
    return `Open task in ${item.projectName}: ${item.title}`;
  }

  return `Document indexed for ${item.projectName}: ${item.title}`;
}

function sortOpenTasks(tasks: OpenTaskRow[], recentActiveProjectIds: Set<string>) {
  return [...tasks].sort((left, right) => {
    const leftIsRecent = recentActiveProjectIds.has(left.project_id) ? 1 : 0;
    const rightIsRecent = recentActiveProjectIds.has(right.project_id) ? 1 : 0;

    if (leftIsRecent !== rightIsRecent) {
      return rightIsRecent - leftIsRecent;
    }

    if (left.due_date && right.due_date && left.due_date !== right.due_date) {
      return left.due_date.localeCompare(right.due_date);
    }

    if (left.due_date && !right.due_date) {
      return -1;
    }

    if (!left.due_date && right.due_date) {
      return 1;
    }

    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });
}

function isMissingOpportunitiesTableError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("public.opportunities") || message.includes("relation \"opportunities\"") || message.includes("schema cache");
}

export async function GET() {
  const now = new Date();
  const todayWindow = getTimeZoneDayWindow(now, GATEKEEPER_DEFAULT_TIME_ZONE);
  const recentActivityStartIso = new Date(
    now.getTime() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    { data: projects, error: projectsError },
    { count: totalDocuments, error: totalDocumentsError },
    { count: totalConversations, error: totalConversationsError },
    { count: openTasksCount, error: openTasksCountError },
    { count: recentDecisionCount, error: recentDecisionCountError },
    { count: sessionSummaryCount, error: sessionSummaryCountError },
    { count: sessionSummariesCreatedToday, error: sessionSummariesTodayError },
    { count: decisionsLearnedToday, error: decisionsLearnedTodayError },
    { count: tasksCreatedToday, error: tasksCreatedTodayError },
    { count: documentsIndexedToday, error: documentsIndexedTodayError },
    { data: openTasks, error: openTasksError },
    { data: recentDecisionMemories, error: recentDecisionMemoriesError },
    { data: recentSessionSummaries, error: recentSessionSummariesError },
    { data: recentProjectConversations, error: recentProjectConversationsError },
    { data: recentCompletedDocuments, error: recentCompletedDocumentsError },
    { data: opportunities, error: opportunitiesError },
  ] = await Promise.all([
    supabaseAdmin.from("projects").select("id, name").order("name", { ascending: true }),
    supabaseAdmin.from("documents").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("conversations").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("project_tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin
      .from("project_memories")
      .select("id", { count: "exact", head: true })
      .eq("memory_type", "decision")
      .gte("created_at", recentActivityStartIso),
    supabaseAdmin
      .from("project_memories")
      .select("id", { count: "exact", head: true })
      .eq("memory_type", "session_summary"),
    supabaseAdmin
      .from("project_memories")
      .select("id", { count: "exact", head: true })
      .eq("memory_type", "session_summary")
      .gte("created_at", todayWindow.startIso)
      .lt("created_at", todayWindow.endIso),
    supabaseAdmin
      .from("project_memories")
      .select("id", { count: "exact", head: true })
      .eq("memory_type", "decision")
      .gte("created_at", todayWindow.startIso)
      .lt("created_at", todayWindow.endIso),
    supabaseAdmin
      .from("project_tasks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayWindow.startIso)
      .lt("created_at", todayWindow.endIso),
    supabaseAdmin
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", todayWindow.startIso)
      .lt("created_at", todayWindow.endIso),
    supabaseAdmin
      .from("project_tasks")
      .select("id, project_id, title, description, due_date, created_at, updated_at")
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabaseAdmin
      .from("project_memories")
      .select("id, project_id, title, content, created_at, memory_type")
      .eq("memory_type", "decision")
      .gte("created_at", recentActivityStartIso)
      .order("created_at", { ascending: false })
      .limit(12),
    supabaseAdmin
      .from("project_memories")
      .select("id, project_id, title, content, created_at, memory_type")
      .eq("memory_type", "session_summary")
      .gte("created_at", recentActivityStartIso)
      .order("created_at", { ascending: false })
      .limit(12),
    supabaseAdmin
      .from("conversations")
      .select("id, project_id, title, created_at")
      .not("project_id", "is", null)
      .gte("created_at", recentActivityStartIso)
      .order("created_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("documents")
      .select("id, project_id, filename, status, created_at")
      .eq("status", "completed")
      .gte("created_at", recentActivityStartIso)
      .order("created_at", { ascending: false })
      .limit(12),
    supabaseAdmin
      .from("opportunities")
      .select(
        "id, title, opportunity_type, stage, contact_name, location_summary, description, estimated_value, estimated_commission, urgency, next_action, follow_up_date, qualification_notes, checklist_completed, converted_project_id, created_at, updated_at"
      )
      .order("updated_at", { ascending: false }),
  ]);

  const possibleErrors = [
    projectsError,
    totalDocumentsError,
    totalConversationsError,
    openTasksCountError,
    recentDecisionCountError,
    sessionSummaryCountError,
    sessionSummariesTodayError,
    decisionsLearnedTodayError,
    tasksCreatedTodayError,
    documentsIndexedTodayError,
    openTasksError,
    recentDecisionMemoriesError,
    recentSessionSummariesError,
    recentProjectConversationsError,
    recentCompletedDocumentsError,
    opportunitiesError && !isMissingOpportunitiesTableError(opportunitiesError) ? opportunitiesError : null,
  ].filter(Boolean);

  if (possibleErrors.length > 0) {
    return NextResponse.json(
      { error: possibleErrors[0]?.message ?? "failed to load dashboard" },
      { status: 500 }
    );
  }

  const projectRows = (projects ?? []) as ProjectRow[];
  const projectNameById = new Map(projectRows.map((project) => [project.id, project.name]));
  const openTaskRows = (openTasks ?? []) as OpenTaskRow[];
  const decisionRows = (recentDecisionMemories ?? []) as MemoryRow[];
  const sessionSummaryRows = (recentSessionSummaries ?? []) as MemoryRow[];
  const conversationRows = (recentProjectConversations ?? []) as ConversationRow[];
  const recentDocumentRows = (recentCompletedDocuments ?? []) as DocumentRow[];
  const opportunityRows = opportunitiesError && isMissingOpportunitiesTableError(opportunitiesError)
    ? []
    : ((opportunities ?? []) as OpportunityRow[]);
  const opportunitySummary = buildOpportunityDashboardSummary(opportunityRows, now);

  const recentActiveProjectIds = new Set(
    conversationRows
      .map((conversation) => conversation.project_id)
      .filter((projectId): projectId is string => typeof projectId === "string" && projectId.trim().length > 0)
  );

  const briefingItems: BriefingItem[] = [
    ...decisionRows.map((memory) => ({
      type: "decision" as const,
      projectId: memory.project_id,
      projectName: getProjectName(memory.project_id, projectNameById),
      title: memory.title,
      createdAt: memory.created_at,
      detail: summarizeContent(memory.content),
    })),
    ...sessionSummaryRows.map((memory) => ({
      type: "session_summary" as const,
      projectId: memory.project_id,
      projectName: getProjectName(memory.project_id, projectNameById),
      title: summarizeContent(memory.content),
      createdAt: memory.created_at,
      detail: memory.title,
    })),
    ...openTaskRows.slice(0, 10).map((task) => ({
      type: "task" as const,
      projectId: task.project_id,
      projectName: getProjectName(task.project_id, projectNameById),
      title: task.title,
      createdAt: task.created_at,
      detail: task.description,
    })),
    ...recentDocumentRows.map((document) => ({
      type: "document" as const,
      projectId: document.project_id,
      projectName: getProjectName(document.project_id, projectNameById),
      title: document.filename?.trim() || "Untitled document",
      createdAt: document.created_at ?? now.toISOString(),
      detail: null,
    })),
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, MAX_BRIEFING_ITEMS);

  const sortedPriorityTasks = sortOpenTasks(openTaskRows, recentActiveProjectIds).slice(0, MAX_PRIORITY_ITEMS);

  const recommendedTask = sortedPriorityTasks[0] ?? null;
  const fallbackConversation = conversationRows.find((conversation) => typeof conversation.project_id === "string" && conversation.project_id.trim());
  const fallbackDocument = recentDocumentRows.find((document) => typeof document.project_id === "string" && document.project_id.trim());

  let recommendedNextAction: string | null = null;

  if (recommendedTask) {
    recommendedNextAction = `Focus on ${recommendedTask.title} for ${getProjectName(recommendedTask.project_id, projectNameById)}.`;
  } else if (fallbackConversation?.project_id) {
    recommendedNextAction = `Review the latest conversation activity for ${getProjectName(fallbackConversation.project_id, projectNameById)}.`;
  } else if (fallbackDocument?.project_id) {
    recommendedNextAction = `Review newly indexed documents for ${getProjectName(fallbackDocument.project_id, projectNameById)}.`;
  }

  const attentionByProject = new Map<
    string,
    {
      projectId: string;
      projectName: string;
      openTaskCount: number;
      recentDecisionCount: number;
      recentSessionSummaryCount: number;
      lastActivityAt: string | null;
    }
  >();

  function ensureAttentionProject(projectId: string) {
    const existing = attentionByProject.get(projectId);

    if (existing) {
      return existing;
    }

    const created = {
      projectId,
      projectName: getProjectName(projectId, projectNameById),
      openTaskCount: 0,
      recentDecisionCount: 0,
      recentSessionSummaryCount: 0,
      lastActivityAt: null as string | null,
    };

    attentionByProject.set(projectId, created);
    return created;
  }

  function updateLastActivity(target: { lastActivityAt: string | null }, timestamp: string | null) {
    if (!timestamp) {
      return;
    }

    if (!target.lastActivityAt || new Date(timestamp).getTime() > new Date(target.lastActivityAt).getTime()) {
      target.lastActivityAt = timestamp;
    }
  }

  for (const task of openTaskRows) {
    const project = ensureAttentionProject(task.project_id);
    project.openTaskCount += 1;
    updateLastActivity(project, task.updated_at);
  }

  for (const memory of decisionRows) {
    const project = ensureAttentionProject(memory.project_id);
    project.recentDecisionCount += 1;
    updateLastActivity(project, memory.created_at);
  }

  for (const memory of sessionSummaryRows) {
    const project = ensureAttentionProject(memory.project_id);
    project.recentSessionSummaryCount += 1;
    updateLastActivity(project, memory.created_at);
  }

  const projectsRequiringAttention = [...attentionByProject.values()]
    .sort((left, right) => {
      const rightActivity = right.lastActivityAt ? new Date(right.lastActivityAt).getTime() : 0;
      const leftActivity = left.lastActivityAt ? new Date(left.lastActivityAt).getTime() : 0;

      if (rightActivity !== leftActivity) {
        return rightActivity - leftActivity;
      }

      return (
        right.openTaskCount + right.recentDecisionCount + right.recentSessionSummaryCount
      ) - (
        left.openTaskCount + left.recentDecisionCount + left.recentSessionSummaryCount
      );
    })
    .slice(0, MAX_ATTENTION_ITEMS);

  return NextResponse.json({
    greeting: getTimeOfDayGreeting(now, GATEKEEPER_DEFAULT_TIME_ZONE),
    timeZone: GATEKEEPER_DEFAULT_TIME_ZONE,
    stats: {
      totalProjects: projectRows.length,
      totalDocuments: totalDocuments ?? 0,
      totalConversations: totalConversations ?? 0,
      openTasks: openTasksCount ?? 0,
      recentDecisions: recentDecisionCount ?? 0,
      sessionSummaries: sessionSummaryCount ?? 0,
    },
    aiBriefing: {
      whatChangedRecently: briefingItems.map(formatBriefingItem),
      recommendedNextAction,
    },
    todaysPriorities: sortedPriorityTasks.map((task) => ({
      taskId: task.id,
      projectId: task.project_id,
      projectName: getProjectName(task.project_id, projectNameById),
      title: task.title,
      description: task.description,
      dueDate: task.due_date,
      updatedAt: task.updated_at,
      reason: recentActiveProjectIds.has(task.project_id)
        ? "Open task in a recently active project"
        : task.due_date
          ? "Open task with a due date"
          : "Most recently updated open task",
    })),
    projectsRequiringAttention,
    opportunitySummary,
    aiLearningToday: {
      sessionSummariesCreated: sessionSummariesCreatedToday ?? 0,
      decisionsLearned: decisionsLearnedToday ?? 0,
      tasksCreated: tasksCreatedToday ?? 0,
      documentsIndexed: documentsIndexedToday ?? 0,
    },
  });
}