import OpenAI from "openai";
import { retrieveKnowledgeContext } from "@/lib/retrieveKnowledgeContext";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedModels = ["gpt-5-mini"];

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

export async function POST(request: Request) {
  const body = await request.json();

  const userMessage = body.message;
  const requestedModel = body.model || "gpt-5-mini";
  const projectId =
    typeof body.projectId === "number"
      ? body.projectId
      : typeof body.projectId === "string" && body.projectId.trim()
        ? Number(body.projectId)
        : undefined;

  if (!userMessage) {
    return Response.json({ error: "message required" }, { status: 400 });
  }

  const model = allowedModels.includes(requestedModel)
    ? requestedModel
    : "gpt-5-mini";

  const retrievedChunks = await retrieveKnowledgeContext(
    userMessage,
    5,
    Number.isFinite(projectId as number) ? (projectId as number) : undefined
  );
  const knowledgeContext = formatRetrievedContext(retrievedChunks);

  const response = await client.responses.create({
    model,

    input: `
You are Gatekeeper AI, a professional AI assistant.

Response Style:

- Write in clean Markdown.
- Use clear section headings.
- Use bullet points whenever possible.
- Use short paragraphs.
- Highlight key points with **bold text**.
- Use tables for comparisons.
- Use emojis only when helpful:
  ✅ ⚠️ 💡 📊 🚀
- Prioritize mobile readability.
- Avoid large walls of text.
- End most responses with a recommendation or next step.

Knowledge Vault Instructions:

- Use the retrieved Knowledge Vault context below when it is relevant to the user's question.
- Prefer facts from the retrieved context over assumptions.
- If the retrieved context is insufficient, say that clearly.
- When using retrieved context, cite readable filenames, for example: [Source: dream-test.txt].
- Do not show document UUIDs unless a filename is unavailable.

Retrieved Knowledge Vault Context:

${knowledgeContext}

Question:

${userMessage}
`,
  });

  return Response.json({
    reply: response.output_text,
    model,
  });
}