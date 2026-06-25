import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SuggestedMemoryResponse =
  | {
      shouldSuggest: false;
    }
  | {
      shouldSuggest: true;
      memoryType: string;
      importance: number;
      title: string;
      content: string;
    };

function clampImportance(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

function parseConversationId(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return NaN;
}

function parseJsonResponse(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  return JSON.parse(withoutFence);
}

function normalizeSuggestion(value: unknown): SuggestedMemoryResponse {
  if (!value || typeof value !== "object") {
    return { shouldSuggest: false };
  }

  const suggestion = value as Record<string, unknown>;

  if (suggestion.shouldSuggest !== true) {
    return { shouldSuggest: false };
  }

  const memoryType = typeof suggestion.memoryType === "string" ? suggestion.memoryType.trim().toLowerCase() : "";
  const title = typeof suggestion.title === "string" ? suggestion.title.trim() : "";
  const content = typeof suggestion.content === "string" ? suggestion.content.trim() : "";
  const importance = clampImportance(
    typeof suggestion.importance === "number"
      ? suggestion.importance
      : typeof suggestion.importance === "string"
        ? Number(suggestion.importance)
        : 1
  );

  if (!memoryType || !title || !content) {
    return { shouldSuggest: false };
  }

  return {
    shouldSuggest: true,
    memoryType,
    importance,
    title,
    content,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
    const assistantMessage =
      typeof body?.assistantMessage === "string" ? body.assistantMessage.trim() : "";
    const conversationId = parseConversationId(body?.conversationId);

    if (!projectId || !assistantMessage) {
      return NextResponse.json(
        { error: "projectId and assistantMessage are required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(conversationId)) {
      return NextResponse.json({ error: "conversationId must be a number" }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are Gatekeeper AI, extracting a single durable project memory suggestion from an assistant reply.

Only suggest a memory when the reply contains durable project knowledge worth saving long-term.

Suggest only for:
- decisions
- legal facts
- financial assumptions
- technical decisions
- property facts
- commitments
- action items
- important project context

Do not suggest for:
- greetings
- generic explanations
- temporary wording
- simple UI instructions
- repeated information

Return exactly one JSON object and no other text.

If there is no useful durable memory, return:
{"shouldSuggest":false}

If there is a useful memory, return:
{
  "shouldSuggest": true,
  "memoryType": "decision",
  "importance": 4,
  "title": "Budget Approved",
  "content": "Owner approved phased rollout funding."
}

Rules:
- Return at most one suggestion.
- Keep memoryType short and lowercase.
- Keep title concise and specific.
- Keep content to one or two factual sentences.
- importance must be an integer from 1 to 5.
- Base the result only on the assistant reply.
- If the reply is generic, temporary, repetitive, or not durable, return shouldSuggest false.

Project ID: ${projectId}
Conversation ID: ${conversationId}

Assistant Reply:
${assistantMessage}
`,
    });

    return NextResponse.json(normalizeSuggestion(parseJsonResponse(response.output_text)));
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}