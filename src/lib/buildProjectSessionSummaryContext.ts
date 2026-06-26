import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BuildProjectSessionSummaryContextInput = {
  projectId: string;
  conversationId: number;
};

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
};

type MessageRow = {
  id: number;
  role: string;
  content: string;
};

type MemoryRow = {
  id: string;
  memory_type: string;
  title: string;
  content: string;
  importance: number;
  source_conversation_id: number | null;
  updated_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  source_conversation_id: number | null;
  updated_at: string;
};

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractLastSummarizedMessageId(content: string) {
  const match = content.match(/\[last_summarized_message_id:(\d+)\]\s*$/i);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function stripSummaryMetadata(content: string) {
  return content.replace(/\n?\[last_summarized_message_id:\d+\]\s*$/i, "").trim();
}

function formatProjectSummary(project: ProjectRow) {
  return [
    "Project:",
    `- Name: ${project.name}`,
    `- Created: ${new Date(project.created_at).toLocaleDateString("en-CA")}`,
  ].join("\n");
}

function formatMessages(messages: MessageRow[]) {
  if (messages.length === 0) {
    return "New Conversation Messages:\n- None.";
  }

  return [
    "New Conversation Messages:",
    ...messages.map((message) => `- ${message.role}: ${collapseWhitespace(message.content)}`),
  ].join("\n");
}

function formatExistingSummary(memory: MemoryRow | null) {
  if (!memory) {
    return "Existing Session Summary:\n- None.";
  }

  return [
    "Existing Session Summary:",
    `- Title: ${memory.title}`,
    `- Content: ${stripSummaryMetadata(memory.content)}`,
  ].join("\n");
}

function formatExistingConversationDecisions(memories: MemoryRow[]) {
  if (memories.length === 0) {
    return "Existing Conversation Decisions:\n- None.";
  }

  return [
    "Existing Conversation Decisions:",
    ...memories.map((memory) => `- ${memory.title}: ${collapseWhitespace(memory.content)}`),
  ].join("\n");
}

function formatExistingConversationTasks(tasks: TaskRow[]) {
  if (tasks.length === 0) {
    return "Existing Conversation Tasks:\n- None.";
  }

  return [
    "Existing Conversation Tasks:",
    ...tasks.map((task) => `- [${task.status}] ${task.title}${task.description ? `: ${collapseWhitespace(task.description)}` : ""}`),
  ].join("\n");
}

export async function buildProjectSessionSummaryContext({
  projectId,
  conversationId,
}: BuildProjectSessionSummaryContextInput) {
  const [{ data: project, error: projectError }, { data: messages, error: messagesError }, { data: memories, error: memoriesError }, { data: tasks, error: tasksError }] =
    await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, name, created_at")
        .eq("id", projectId)
        .single(),
      supabaseAdmin
        .from("messages")
        .select("id, role, content")
        .eq("conversation_id", conversationId)
        .order("id", { ascending: true }),
      supabaseAdmin
        .from("project_memories")
        .select("id, memory_type, title, content, importance, source_conversation_id, updated_at")
        .eq("project_id", projectId)
        .eq("source_conversation_id", conversationId)
        .in("memory_type", ["session_summary", "decision"])
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("project_tasks")
        .select("id, title, description, status, source_conversation_id, updated_at")
        .eq("project_id", projectId)
        .eq("source_conversation_id", conversationId)
        .order("updated_at", { ascending: false }),
    ]);

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "project not found");
  }

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  if (memoriesError) {
    throw new Error(memoriesError.message);
  }

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const memoryRows = (memories ?? []) as MemoryRow[];
  const taskRows = (tasks ?? []) as TaskRow[];
  const summaryMemory = memoryRows.find((memory) => memory.memory_type === "session_summary") ?? null;
  const lastSummarizedMessageId = summaryMemory ? extractLastSummarizedMessageId(summaryMemory.content) : null;
  const allMessages = (messages ?? []) as MessageRow[];
  const newMessages = lastSummarizedMessageId === null
    ? allMessages
    : allMessages.filter((message) => message.id > lastSummarizedMessageId);

  return {
    summaryMemory,
    lastSummarizedMessageId,
    allMessages,
    newMessages,
    existingDecisionMemories: memoryRows.filter((memory) => memory.memory_type === "decision"),
    existingTasks: taskRows,
    contextText: [
      formatProjectSummary(project as ProjectRow),
      formatExistingSummary(summaryMemory),
      formatExistingConversationDecisions(memoryRows.filter((memory) => memory.memory_type === "decision")),
      formatExistingConversationTasks(taskRows),
      formatMessages(newMessages),
    ].join("\n\n"),
  };
}