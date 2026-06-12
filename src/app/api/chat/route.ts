import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedModels = ["gpt-5-mini"];

export async function POST(request: Request) {
  const body = await request.json();

  const userMessage = body.message;
  const requestedModel = body.model || "gpt-5-mini";

  const model = allowedModels.includes(requestedModel)
    ? requestedModel
    : "gpt-5-mini";

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

Question:

${userMessage}
`,
});

  return Response.json({
    reply: response.output_text,
    model,
  });
}