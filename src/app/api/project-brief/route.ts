import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ProjectMemoryRow = {
  memory_type: string;
  title: string;
  content: string;
  importance: number;
  created_at: string;
};

type ProjectDocumentRow = {
  id: string;
  filename: string | null;
  status: string | null;
  created_at: string | null;
};

type DocumentChunkRow = {
  document_id: string;
  chunk_index: number;
  content: string;
};

type ProjectConversationRow = {
  id: number;
  title: string | null;
  created_at: string | null;
};

type MessageRow = {
  conversation_id: number;
  role: string;
  content: string;
};

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function limitText(value: string, maxLength: number) {
  const normalized = collapseWhitespace(value);
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function formatProjectMemories(memories: ProjectMemoryRow[]) {
  if (memories.length === 0) {
    return "None.";
  }

  return memories
    .map(
      (memory) =>
        `- [${memory.memory_type}][importance ${memory.importance}] ${collapseWhitespace(memory.title)}: ${limitText(memory.content, 240)}`
    )
    .join("\n");
}

function formatProjectDocuments(documents: ProjectDocumentRow[], chunksByDocumentId: Map<string, DocumentChunkRow[]>) {
  if (documents.length === 0) {
    return "None.";
  }

  return documents
    .map((document) => {
      const filename = document.filename?.trim() || document.id;
      const excerpt = (chunksByDocumentId.get(document.id) ?? [])
        .sort((left, right) => left.chunk_index - right.chunk_index)
        .slice(0, 2)
        .map((chunk) => limitText(chunk.content, 220))
        .join(" ");

      const createdAt = document.created_at ? new Date(document.created_at).toLocaleDateString("en-CA") : "unknown";
      return `- ${filename} | status: ${document.status || "unknown"} | created: ${createdAt}${excerpt ? ` | excerpt: ${excerpt}` : ""}`;
    })
    .join("\n");
}

function formatRecentConversations(
  conversations: ProjectConversationRow[],
  messagesByConversationId: Map<number, MessageRow[]>
) {
  if (conversations.length === 0) {
    return "None.";
  }

  return conversations
    .map((conversation) => {
      const title = conversation.title?.trim() || `Conversation #${conversation.id}`;
      const createdAt = conversation.created_at ? new Date(conversation.created_at).toLocaleDateString("en-CA") : "unknown";
      const transcript = (messagesByConversationId.get(conversation.id) ?? [])
        .slice(0, 4)
        .map((message) => `  - ${message.role}: ${limitText(message.content, 180)}`)
        .join("\n");

      return [`- ${title} | created: ${createdAt}`, transcript || "  - No messages captured."].join("\n");
    })
    .join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name, created_at")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: projectError?.message ?? "project not found" },
        { status: 404 }
      );
    }

    const [memoriesResult, documentsResult, conversationsResult] = await Promise.all([
      supabaseAdmin
        .from("project_memories")
        .select("memory_type, title, content, importance, created_at")
        .eq("project_id", projectId)
        .order("importance", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12),
      supabaseAdmin
        .from("documents")
        .select("id, filename, status, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("conversations")
        .select("id, title, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (memoriesResult.error) {
      throw new Error(memoriesResult.error.message);
    }

    if (documentsResult.error) {
      throw new Error(documentsResult.error.message);
    }

    if (conversationsResult.error) {
      throw new Error(conversationsResult.error.message);
    }

    const memories = (memoriesResult.data ?? []) as ProjectMemoryRow[];
    const documents = (documentsResult.data ?? []) as ProjectDocumentRow[];
    const conversations = (conversationsResult.data ?? []) as ProjectConversationRow[];

    const documentIds = documents.map((document) => document.id).filter(Boolean);
    const conversationIds = conversations.map((conversation) => conversation.id).filter(Boolean);

    const [chunksResult, messagesResult] = await Promise.all([
      documentIds.length > 0
        ? supabaseAdmin
            .from("document_chunks")
            .select("document_id, chunk_index, content")
            .in("document_id", documentIds)
            .order("chunk_index", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      conversationIds.length > 0
        ? supabaseAdmin
            .from("messages")
            .select("conversation_id, role, content")
            .in("conversation_id", conversationIds)
            .order("id", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (chunksResult.error) {
      throw new Error(chunksResult.error.message);
    }

    if (messagesResult.error) {
      throw new Error(messagesResult.error.message);
    }

    const chunksByDocumentId = new Map<string, DocumentChunkRow[]>();
    for (const chunk of (chunksResult.data ?? []) as DocumentChunkRow[]) {
      const current = chunksByDocumentId.get(chunk.document_id) ?? [];
      current.push(chunk);
      chunksByDocumentId.set(chunk.document_id, current);
    }

    const messagesByConversationId = new Map<number, MessageRow[]>();
    for (const message of (messagesResult.data ?? []) as MessageRow[]) {
      const current = messagesByConversationId.get(message.conversation_id) ?? [];
      current.push(message);
      messagesByConversationId.set(message.conversation_id, current);
    }

    const prompt = `
You are Gatekeeper AI, generating a concise project brief in Markdown.

Write exactly these sections, in this order:
1. Project Overview
2. Key Facts
3. Important Decisions
4. Open Issues
5. Action Items
6. Important Documents
7. Timeline Summary

Rules:
- Be concise, practical, and structured.
- Use bullet points where helpful.
- If a section has insufficient information, say that clearly.
- Base the brief only on the supplied project material.
- Do not invent filenames, dates, decisions, or issues.
- Do not expose UUIDs.

PROJECT
- Name: ${project.name}
- Created: ${project.created_at ? new Date(project.created_at).toLocaleDateString("en-CA") : "unknown"}

PROJECT MEMORIES
${formatProjectMemories(memories)}

PROJECT DOCUMENTS
${formatProjectDocuments(documents, chunksByDocumentId)}

RECENT CONVERSATIONS
${formatRecentConversations(conversations, messagesByConversationId)}
`;

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    return NextResponse.json({
      brief: response.output_text,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}