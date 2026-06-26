import {
  formatProjectMemoriesContext,
  retrieveProjectMemories,
} from "@/lib/retrieveProjectMemories";
import {
  retrieveKnowledgeContext,
  type RetrievedChunk,
} from "@/lib/retrieveKnowledgeContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BuildProjectChatContextInput = {
  projectId: string;
  conversationId?: number | string;
  userMessage: string;
};

type ProjectSummaryRow = {
  id: string;
  name: string;
  created_at: string;
};

type RecentMessageRow = {
  id: number;
  role: string;
  content: string;
};

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeConversationId(value?: number | string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatRetrievedContext(
  chunks: Array<{ document_id: string; filename?: string | null; content: string }>
) {
  if (chunks.length === 0) {
    return "No Knowledge Vault context was retrieved.";
  }

  return chunks
    .map((chunk, index) => {
      const sourceLabel = chunk.filename?.trim() || chunk.document_id;

      return `Source ${index + 1} | filename: ${sourceLabel}\n${chunk.content}`;
    })
    .join("\n\n---\n\n");
}

function formatProjectSummary(
  project: ProjectSummaryRow,
  counts: {
    documentCount: number;
    conversationCount: number;
    memoryCount: number;
  }
) {
  return [
    "Project Summary:",
    `- Name: ${project.name}`,
    `- Created: ${new Date(project.created_at).toLocaleDateString("en-CA")}`,
    `- Knowledge Vault documents: ${counts.documentCount}`,
    `- Project conversations: ${counts.conversationCount}`,
    `- Project memories: ${counts.memoryCount}`,
  ].join("\n");
}

function trimRecentMessages(messages: RecentMessageRow[], userMessage: string) {
  const normalizedUserMessage = collapseWhitespace(userMessage);
  const trimmedMessages = [...messages];
  const lastMessage = trimmedMessages.at(-1);

  if (
    lastMessage?.role === "user" &&
    collapseWhitespace(lastMessage.content) === normalizedUserMessage
  ) {
    trimmedMessages.pop();
  }

  return trimmedMessages;
}

function formatRecentConversationMessages(messages: RecentMessageRow[]) {
  if (messages.length === 0) {
    return "Recent Conversation Messages:\n- No earlier messages were available for this conversation.";
  }

  return [
    "Recent Conversation Messages:",
    ...messages.map((message) => `- ${message.role}: ${collapseWhitespace(message.content)}`),
  ].join("\n");
}

async function fetchProjectSummary(projectId: string) {
  const [{ data: project, error: projectError }, documentsResult, conversationsResult, memoriesResult] =
    await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, name, created_at")
        .eq("id", projectId)
        .single(),
      supabaseAdmin
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabaseAdmin
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabaseAdmin
        .from("project_memories")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
    ]);

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "project not found");
  }

  if (documentsResult.error) {
    throw new Error(documentsResult.error.message);
  }

  if (conversationsResult.error) {
    throw new Error(conversationsResult.error.message);
  }

  if (memoriesResult.error) {
    throw new Error(memoriesResult.error.message);
  }

  return formatProjectSummary(project as ProjectSummaryRow, {
    documentCount: documentsResult.count ?? 0,
    conversationCount: conversationsResult.count ?? 0,
    memoryCount: memoriesResult.count ?? 0,
  });
}

async function fetchRecentConversationMessages(
  conversationId: number | null,
  userMessage: string
) {
  if (!conversationId) {
    return "Recent Conversation Messages:\n- No conversation ID was provided for continuity.";
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("id, role, content")
    .eq("conversation_id", conversationId)
    .order("id", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(error.message);
  }

  const messages = trimRecentMessages(
    ((data ?? []) as RecentMessageRow[]).reverse(),
    userMessage
  );

  return formatRecentConversationMessages(messages);
}

export async function buildProjectChatContext({
  projectId,
  conversationId,
  userMessage,
}: BuildProjectChatContextInput) {
  const normalizedProjectId = projectId.trim();

  if (!normalizedProjectId) {
    throw new Error("projectId required");
  }

  const normalizedConversationId = normalizeConversationId(conversationId);

  const [projectSummary, recentConversationMessages, projectMemories, retrievedChunks] =
    await Promise.all([
      fetchProjectSummary(normalizedProjectId),
      fetchRecentConversationMessages(normalizedConversationId, userMessage),
      retrieveProjectMemories({
        projectId: normalizedProjectId,
        query: userMessage,
        limit: 10,
      }),
      retrieveKnowledgeContext(userMessage, 5, normalizedProjectId),
    ]);

  return {
    projectSummary,
    recentConversationMessages,
    projectMemoryContext: formatProjectMemoriesContext(projectMemories),
    knowledgeContext: formatRetrievedContext(retrievedChunks as RetrievedChunk[]),
  };
}