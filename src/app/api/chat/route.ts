import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const body = await request.json();

  const userMessage = body.message;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: userMessage,
  });

  return Response.json({
    reply: response.output_text,
  });
}