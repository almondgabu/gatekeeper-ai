type ProjectIntelligenceDocument = {
  status: string | null;
  created_at?: string | null;
};

type ProjectIntelligenceConversation = {
  created_at: string;
  messageCount?: number;
};

type ProjectIntelligenceMemory = {
  memory_type: string;
  importance: number;
  created_at: string;
};

type ProjectIntelligenceTask = {
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectIntelligenceTone = "good" | "warning" | "critical" | "neutral" | "active";

export type ProjectIntelligenceMetric = {
  score: number;
  label: string;
  explanation: string;
  tone: ProjectIntelligenceTone;
};

export type RecommendedProjectAction = {
  key:
    | "resolve-overdue-tasks"
    | "review-open-tasks"
    | "upload-documents"
    | "start-project-chat"
    | "capture-project-memory"
    | "build-session-history"
    | "review-stalled-project"
    | "maintain-project-rhythm";
  title: string;
  description: string;
  actionLabel: string;
};

export type ProjectIntelligenceResult = {
  health: ProjectIntelligenceMetric;
  confidence: ProjectIntelligenceMetric;
  priority: ProjectIntelligenceMetric;
  risk: ProjectIntelligenceMetric;
  momentum: ProjectIntelligenceMetric;
  recommendedNextAction: RecommendedProjectAction;
};

type ProjectIntelligenceInput = {
  documents: ProjectIntelligenceDocument[];
  conversations: ProjectIntelligenceConversation[];
  memories: ProjectIntelligenceMemory[];
  tasks: ProjectIntelligenceTask[];
  now?: Date;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getDaysSince(timestamp: number, nowMs: number) {
  if (!timestamp) {
    return Number.POSITIVE_INFINITY;
  }

  return (nowMs - timestamp) / (1000 * 60 * 60 * 24);
}

function getLatestTimestamp(values: number[]) {
  return values.reduce((latest, current) => (current > latest ? current : latest), 0);
}

function createMetric(score: number, label: string, explanation: string, tone: ProjectIntelligenceTone): ProjectIntelligenceMetric {
  return {
    score: clampScore(score),
    label,
    explanation,
    tone,
  };
}

function getHealthMetric(input: {
  documentCount: number;
  conversationCount: number;
  memoryCount: number;
  openTaskCount: number;
  recentActivityDays: number;
  decisionCount: number;
  sessionSummaryCount: number;
  failedDocumentCount: number;
}) {
  const {
    documentCount,
    conversationCount,
    memoryCount,
    openTaskCount,
    recentActivityDays,
    decisionCount,
    sessionSummaryCount,
    failedDocumentCount,
  } = input;

  let score = 0;
  score += Math.min(20, documentCount * 10);
  score += Math.min(15, conversationCount * 6);
  score += Math.min(15, memoryCount * 4);
  score += Math.min(15, decisionCount * 8);
  score += sessionSummaryCount > 0 ? 10 : 0;
  score += openTaskCount > 0 ? 10 : 5;
  score += recentActivityDays <= 7 ? 15 : recentActivityDays <= 30 ? 8 : 0;
  score -= Math.min(15, failedDocumentCount * 8);

  if (documentCount === 0 && conversationCount === 0 && memoryCount === 0) {
    return createMetric(8, "Empty", "The workspace has no documents, conversations, or saved memories yet.", "neutral");
  }

  if (score >= 75) {
    return createMetric(score, "Strong", "Recent activity and durable project context indicate this workspace is in good working shape.", "good");
  }

  if (score >= 45) {
    return createMetric(score, "Developing", "The project has usable context, but it still depends on a few thin or incomplete signals.", "warning");
  }

  return createMetric(score, "Fragile", "This project is still missing enough recent or durable context to feel stable.", "critical");
}

function getConfidenceMetric(input: {
  documentCount: number;
  conversationCount: number;
  memoryCount: number;
  decisionCount: number;
  sessionSummaryCount: number;
  totalMessageCount: number;
}) {
  const {
    documentCount,
    conversationCount,
    memoryCount,
    decisionCount,
    sessionSummaryCount,
    totalMessageCount,
  } = input;

  let score = 0;
  score += Math.min(35, documentCount * 12);
  score += Math.min(20, conversationCount * 6);
  score += Math.min(15, memoryCount * 3);
  score += Math.min(15, decisionCount * 8);
  score += sessionSummaryCount > 0 ? 10 : 0;
  score += totalMessageCount >= 8 ? 5 : totalMessageCount >= 4 ? 2 : 0;
  if (conversationCount > 0 && documentCount === 0 && memoryCount === 0) {
    score -= 18;
  }

  if (score >= 75) {
    return createMetric(score, "Grounded", "Documents, conversation history, and durable memories provide strong support for future project work.", "good");
  }

  if (score >= 45) {
    return createMetric(score, "Partial", "There is some usable project context, but durable evidence is still uneven.", "warning");
  }

  return createMetric(score, "Thin", "Future work would rely on limited supporting context because the workspace is still sparse.", "critical");
}

function getPriorityMetric(input: {
  openTaskCount: number;
  overdueTaskCount: number;
  dueSoonTaskCount: number;
  recentActivityDays: number;
  decisionCount: number;
}) {
  const { openTaskCount, overdueTaskCount, dueSoonTaskCount, recentActivityDays, decisionCount } = input;
  let score = 0;
  score += Math.min(45, openTaskCount * 14);
  score += Math.min(25, overdueTaskCount * 20);
  score += Math.min(15, dueSoonTaskCount * 8);
  score += recentActivityDays <= 7 && openTaskCount > 0 ? 10 : 0;
  score += decisionCount > 0 && openTaskCount > 0 ? 5 : 0;

  if (score >= 75) {
    return createMetric(score, "Urgent", "Active work is open now and should be addressed quickly because unresolved tasks are already accumulating.", "critical");
  }

  if (score >= 45) {
    return createMetric(score, "High", "This project has active work that deserves near-term attention to keep momentum intact.", "warning");
  }

  if (score >= 20) {
    return createMetric(score, "Medium", "There is work to do, but it is not yet pressing compared with more active projects.", "active");
  }

  return createMetric(score, "Low", "No immediate workload signal is pushing this project to the front right now.", "neutral");
}

function getRiskMetric(input: {
  documentCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  pendingDocumentCount: number;
  failedDocumentCount: number;
  decisionCount: number;
  sessionSummaryCount: number;
  conversationCount: number;
  recentActivityDays: number;
}) {
  const {
    documentCount,
    openTaskCount,
    overdueTaskCount,
    pendingDocumentCount,
    failedDocumentCount,
    decisionCount,
    sessionSummaryCount,
    conversationCount,
    recentActivityDays,
  } = input;

  let score = 20;
  score += documentCount === 0 && conversationCount > 0 ? 20 : 0;
  score += openTaskCount > 0 && recentActivityDays > 14 ? 20 : 0;
  score += Math.min(20, overdueTaskCount * 15);
  score += Math.min(12, pendingDocumentCount * 6);
  score += Math.min(15, failedDocumentCount * 8);
  score += conversationCount > 0 && decisionCount === 0 && sessionSummaryCount === 0 ? 12 : 0;
  score -= documentCount > 0 ? 8 : 0;
  score -= decisionCount > 0 ? 8 : 0;
  score -= sessionSummaryCount > 0 ? 10 : 0;

  if (score >= 70) {
    return createMetric(score, "High", "Unresolved work or weak supporting context creates a real chance of project drift.", "critical");
  }

  if (score >= 40) {
    return createMetric(score, "Moderate", "Some project risk is visible because follow-through or context coverage is still uneven.", "warning");
  }

  return createMetric(score, "Low", "The project has enough structure and recent signal to keep operational risk contained.", "good");
}

function getMomentumMetric(input: {
  recentConversationCount: number;
  recentMemoryCount: number;
  recentTaskChangeCount: number;
  recentDocumentCount: number;
  recentActivityDays: number;
}) {
  const {
    recentConversationCount,
    recentMemoryCount,
    recentTaskChangeCount,
    recentDocumentCount,
    recentActivityDays,
  } = input;

  let score = 0;
  score += Math.min(30, recentConversationCount * 12);
  score += Math.min(20, recentMemoryCount * 8);
  score += Math.min(25, recentTaskChangeCount * 10);
  score += Math.min(15, recentDocumentCount * 8);
  score += recentActivityDays <= 7 ? 10 : recentActivityDays <= 30 ? 4 : 0;

  if (score >= 70) {
    return createMetric(score, "Strong", "Multiple parts of the project moved recently, so momentum is clearly present.", "good");
  }

  if (score >= 35) {
    return createMetric(score, "Building", "The project is moving, but the pace still depends on a limited number of recent updates.", "active");
  }

  if (score >= 15) {
    return createMetric(score, "Slow", "Some project motion exists, but it is not yet consistent enough to feel self-sustaining.", "warning");
  }

  return createMetric(score, "Stalled", "There is little recent movement across tasks, memories, documents, or conversations.", "critical");
}

function getRecommendedNextAction(input: {
  documentCount: number;
  conversationCount: number;
  memoryCount: number;
  decisionCount: number;
  sessionSummaryCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  dueSoonTaskCount: number;
  recentActivityDays: number;
}) : RecommendedProjectAction {
  const {
    documentCount,
    conversationCount,
    memoryCount,
    decisionCount,
    sessionSummaryCount,
    openTaskCount,
    overdueTaskCount,
    dueSoonTaskCount,
    recentActivityDays,
  } = input;

  if (overdueTaskCount > 0) {
    return {
      key: "resolve-overdue-tasks",
      title: "Resolve overdue project tasks",
      description: "At least one task is already past due, so the next step should be to unblock or close overdue work first.",
      actionLabel: "Review Tasks",
    };
  }

  if (openTaskCount > 0) {
    return {
      key: "review-open-tasks",
      title: dueSoonTaskCount > 0 ? "Prioritize the next due task" : "Review current open tasks",
      description: "This project already has active task work, so the clearest next move is to advance or close the current task list.",
      actionLabel: "Open Tasks",
    };
  }

  if (documentCount === 0) {
    return {
      key: "upload-documents",
      title: "Upload the first project document",
      description: "The workspace still lacks source material, so adding a document will improve future retrieval and project grounding.",
      actionLabel: "Upload Document",
    };
  }

  if (conversationCount === 0) {
    return {
      key: "start-project-chat",
      title: "Start the first project conversation",
      description: "A scoped conversation will create project history and give the workspace live working context.",
      actionLabel: "Chat With Project",
    };
  }

  if (memoryCount === 0 || decisionCount === 0) {
    return {
      key: "capture-project-memory",
      title: "Capture a durable project memory",
      description: "The project has activity, but durable decisions or constraints have not been saved strongly enough yet.",
      actionLabel: "Review Memories",
    };
  }

  if (sessionSummaryCount === 0) {
    return {
      key: "build-session-history",
      title: "Continue the project chat to build session history",
      description: "The workspace has useful context, but it does not yet have a saved session summary to anchor the latest work.",
      actionLabel: "Open Project Chat",
    };
  }

  if (recentActivityDays > 30) {
    return {
      key: "review-stalled-project",
      title: "Reconfirm the next project milestone",
      description: "The project has context but has gone quiet, so the next step is to re-open it and confirm the next concrete milestone.",
      actionLabel: "Review Project",
    };
  }

  return {
    key: "maintain-project-rhythm",
    title: "Maintain the current project rhythm",
    description: "The project is in a workable state, so the next step is to keep updating tasks, decisions, and conversation history as work progresses.",
    actionLabel: "Continue Working",
  };
}

export function buildProjectIntelligence({ documents, conversations, memories, tasks, now = new Date() }: ProjectIntelligenceInput): ProjectIntelligenceResult {
  const nowMs = now.getTime();
  const documentCount = documents.length;
  const conversationCount = conversations.length;
  const memoryCount = memories.length;
  const taskCount = tasks.length;
  const decisionCount = memories.filter((memory) => memory.memory_type === "decision").length;
  const sessionSummaryCount = memories.filter((memory) => memory.memory_type === "session_summary").length;
  const openTaskCount = tasks.filter((task) => task.status !== "completed").length;
  const pendingDocumentCount = documents.filter((document) => document.status === "pending").length;
  const failedDocumentCount = documents.filter((document) => document.status === "failed").length;
  const totalMessageCount = conversations.reduce((sum, conversation) => sum + (conversation.messageCount ?? 0), 0);

  const overdueTaskCount = tasks.filter((task) => {
    if (task.status === "completed" || !task.due_date) {
      return false;
    }

    return getTimestamp(`${task.due_date}T23:59:59`) < nowMs;
  }).length;

  const dueSoonTaskCount = tasks.filter((task) => {
    if (task.status === "completed" || !task.due_date) {
      return false;
    }

    const dueTimestamp = getTimestamp(`${task.due_date}T23:59:59`);
    const diffDays = getDaysSince(nowMs, dueTimestamp);
    return diffDays <= 0 && Math.abs(diffDays) <= 3;
  }).length;

  const latestProjectTimestamp = getLatestTimestamp([
    ...documents.map((document) => getTimestamp(document.created_at)),
    ...conversations.map((conversation) => getTimestamp(conversation.created_at)),
    ...memories.map((memory) => getTimestamp(memory.created_at)),
    ...tasks.map((task) => Math.max(getTimestamp(task.created_at), getTimestamp(task.updated_at))),
  ]);

  const recentActivityDays = getDaysSince(latestProjectTimestamp, nowMs);
  const recentConversationCount = conversations.filter((conversation) => getDaysSince(getTimestamp(conversation.created_at), nowMs) <= 7).length;
  const recentMemoryCount = memories.filter((memory) => getDaysSince(getTimestamp(memory.created_at), nowMs) <= 7).length;
  const recentTaskChangeCount = tasks.filter((task) => getDaysSince(Math.max(getTimestamp(task.created_at), getTimestamp(task.updated_at)), nowMs) <= 7).length;
  const recentDocumentCount = documents.filter((document) => getDaysSince(getTimestamp(document.created_at), nowMs) <= 7).length;

  const health = getHealthMetric({
    documentCount,
    conversationCount,
    memoryCount,
    openTaskCount,
    recentActivityDays,
    decisionCount,
    sessionSummaryCount,
    failedDocumentCount,
  });
  const confidence = getConfidenceMetric({
    documentCount,
    conversationCount,
    memoryCount,
    decisionCount,
    sessionSummaryCount,
    totalMessageCount,
  });
  const priority = getPriorityMetric({
    openTaskCount,
    overdueTaskCount,
    dueSoonTaskCount,
    recentActivityDays,
    decisionCount,
  });
  const risk = getRiskMetric({
    documentCount,
    openTaskCount,
    overdueTaskCount,
    pendingDocumentCount,
    failedDocumentCount,
    decisionCount,
    sessionSummaryCount,
    conversationCount,
    recentActivityDays,
  });
  const momentum = getMomentumMetric({
    recentConversationCount,
    recentMemoryCount,
    recentTaskChangeCount,
    recentDocumentCount,
    recentActivityDays,
  });

  return {
    health,
    confidence,
    priority,
    risk,
    momentum,
    recommendedNextAction: getRecommendedNextAction({
      documentCount,
      conversationCount,
      memoryCount,
      decisionCount,
      sessionSummaryCount,
      openTaskCount,
      overdueTaskCount,
      dueSoonTaskCount,
      recentActivityDays,
    }),
  };
}