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
    input: userMessage,
  });

  return Response.json({
    reply: response.output_text,
    model,
  });
}