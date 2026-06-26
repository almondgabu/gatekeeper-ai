import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embeddings";
import { buildProjectSessionSummaryContext } from "@/lib/buildProjectSessionSummaryContext";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MIN_NEW_MESSAGES = 4;
const MIN_NEW_USER_MESSAGES = 2;
const MIN_NEW_CHARACTERS = 500;

type SummaryDecision = {
  title: string;
  content: string;
  importance: number;
};

type SummaryTask = {
  title: string;
  description: string;
};

type SummaryResponse = {
  shouldPersist: boolean;
  sessionSummary: string;
  decisions: SummaryDecision[];
  openTasks: SummaryTask[];
};

function clampImportance(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseJsonResponse(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  return JSON.parse(withoutFence);
}

function normalizeSummaryResponse(value: unknown): SummaryResponse {
  if (!value || typeof value !== "object") {
    return {
      shouldPersist: false,
      sessionSummary: "",
      decisions: [],
      openTasks: [],
    };
  }

  const payload = value as Record<string, unknown>;
  const shouldPersist = payload.shouldPersist === true;
  const sessionSummary = typeof payload.sessionSummary === "string" ? payload.sessionSummary.trim() : "";
  const decisions = Array.isArray(payload.decisions)
    ? payload.decisions
        .map((decision) => {
          if (!decision || typeof decision !== "object") {
            return null;
          }

          const record = decision as Record<string, unknown>;
          const title = typeof record.title === "string" ? record.title.trim() : "";
          const content = typeof record.content === "string" ? record.content.trim() : "";
          const importance = clampImportance(
            typeof record.importance === "number"
              ? record.importance
              : typeof record.importance === "string"
                ? Number(record.importance)
                : 1
          );

          if (!title || !content) {
            return null;
          }

          return { title, content, importance };
        })
        .filter(Boolean) as SummaryDecision[]
    : [];
  const openTasks = Array.isArray(payload.openTasks)
    ? payload.openTasks
        .map((task) => {
          if (!task || typeof task !== "object") {
            return null;
          }

          const record = task as Record<string, unknown>;
          const title = typeof record.title === "string" ? record.title.trim() : "";
          const description = typeof record.description === "string" ? record.description.trim() : "";

          if (!title) {
            return null;
          }

          return { title, description };
        })
        .filter(Boolean) as SummaryTask[]
    : [];

  return {
    shouldPersist,
    sessionSummary,
    decisions,
    openTasks,
  };
}

function shouldAttemptSummary(newMessages: Array<{ id: number; role: string; content: string }>) {
  const userMessageCount = newMessages.filter((message) => message.role === "user").length;
  const totalCharacters = newMessages.reduce((sum, message) => sum + message.content.length, 0);

  return (
    newMessages.length >= MIN_NEW_MESSAGES &&
    userMessageCount >= MIN_NEW_USER_MESSAGES &&
    totalCharacters >= MIN_NEW_CHARACTERS
  );
}

function appendSummaryMetadata(summary: string, lastMessageId: number) {
  return `${summary.trim()}\n\n[last_summarized_message_id:${lastMessageId}]`;
}

function normalizeKey(value: string) {
  return collapseWhitespace(value).toLowerCase();
}

function buildProjectMemoryEmbeddingInput(memoryType: string, title: string, content: string) {
  return [`Type: ${memoryType}`, `Title: ${title}`, `Content: ${content}`].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
    const conversationId = typeof body?.conversationId === "number"
      ? body.conversationId
      : typeof body?.conversationId === "string" && body.conversationId.trim()
        ? Number(body.conversationId)
        : NaN;

    if (!projectId || !Number.isFinite(conversationId)) {
      return NextResponse.json(
        { error: "projectId and conversationId are required" },
        { status: 400 }
      );
    }

    const context = await buildProjectSessionSummaryContext({
      projectId,
      conversationId,
    });

    if (!shouldAttemptSummary(context.newMessages)) {
      return NextResponse.json({
        skipped: true,
        reason: "not-enough-new-content",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are Gatekeeper AI, creating a conservative project session summary from a project-scoped conversation.

Your job is to persist only high-value information.

Return exactly one JSON object with this shape:
{
  "shouldPersist": true,
  "sessionSummary": "short summary",
  "decisions": [
    {
      "title": "short decision title",
      "content": "1-2 factual sentences",
      "importance": 4
    }
  ],
  "openTasks": [
    {
      "title": "explicit next action",
      "description": "short optional detail"
    }
  ]
}

Rules:
- Be conservative.
- Set shouldPersist to false when the new conversation content is not meaningful enough.
- sessionSummary must be concise and useful for future orientation.
- Extract decisions only when the conversation contains a clear durable decision, approval, constraint, or preference worth remembering later.
- Do not restate generic explanations as decisions.
- Extract openTasks only when the conversation contains an explicit next action, follow-up, or commitment.
- Do not invent due dates.
- Do not create tasks for vague suggestions.
- Keep decisions and tasks dedupe-friendly by making titles concise and specific.
- Base the output only on the provided context.

${context.contextText}
`,
    });

    const normalized = normalizeSummaryResponse(parseJsonResponse(response.output_text));

    if (!normalized.shouldPersist || !normalized.sessionSummary.trim()) {
      return NextResponse.json({ skipped: true, reason: "model-declined" });
    }

    const lastMessageId = context.newMessages.at(-1)?.id;

    if (!lastMessageId) {
      return NextResponse.json({ skipped: true, reason: "no-last-message-id" });
    }

    const summaryTitle = "Session Summary";
    const summaryContent = appendSummaryMetadata(normalized.sessionSummary, lastMessageId);

    let summaryEmbedding: number[] | null = null;

    try {
      summaryEmbedding = await createEmbedding(
        buildProjectMemoryEmbeddingInput("session_summary", summaryTitle, normalized.sessionSummary)
      );
    } catch (error: any) {
      console.error("session summary embedding failed", error?.message ?? error);
    }

    if (context.summaryMemory) {
      const { error: updateError } = await supabaseAdmin
        .from("project_memories")
        .update({
          title: summaryTitle,
          content: summaryContent,
          importance: 3,
          embedding: summaryEmbedding,
          updated_at: new Date().toISOString(),
        })
        .eq("id", context.summaryMemory.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("project_memories")
        .insert({
          project_id: projectId,
          memory_type: "session_summary",
          title: summaryTitle,
          content: summaryContent,
          source_conversation_id: conversationId,
          importance: 3,
          embedding: summaryEmbedding,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const existingDecisionKeys = new Set(
      context.existingDecisionMemories.map((memory) => normalizeKey(`${memory.title} ${memory.content}`))
    );

    for (const decision of normalized.decisions) {
      const decisionKey = normalizeKey(`${decision.title} ${decision.content}`);

      if (existingDecisionKeys.has(decisionKey)) {
        continue;
      }

      let decisionEmbedding: number[] | null = null;

      try {
        decisionEmbedding = await createEmbedding(
          buildProjectMemoryEmbeddingInput("decision", decision.title, decision.content)
        );
      } catch (error: any) {
        console.error("decision embedding failed", error?.message ?? error);
      }

      const { error: decisionError } = await supabaseAdmin
        .from("project_memories")
        .insert({
          project_id: projectId,
          memory_type: "decision",
          title: decision.title,
          content: decision.content,
          source_conversation_id: conversationId,
          importance: decision.importance,
          embedding: decisionEmbedding,
        });

      if (decisionError) {
        throw new Error(decisionError.message);
      }

      existingDecisionKeys.add(decisionKey);
    }

    const existingTaskKeys = new Set(
      context.existingTasks
        .filter((task) => task.status !== "completed")
        .map((task) => normalizeKey(task.title))
    );

    for (const task of normalized.openTasks) {
      const taskKey = normalizeKey(task.title);

      if (existingTaskKeys.has(taskKey)) {
        continue;
      }

      const { error: taskError } = await supabaseAdmin
        .from("project_tasks")
        .insert({
          project_id: projectId,
          title: task.title,
          description: task.description || null,
          source_conversation_id: conversationId,
        });

      if (taskError) {
        throw new Error(taskError.message);
      }

      existingTaskKeys.add(taskKey);
    }

    return NextResponse.json({
      persisted: true,
      decisions: normalized.decisions.length,
      openTasks: normalized.openTasks.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}