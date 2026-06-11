import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  const models = await client.models.list();

  return Response.json(
    models.data.map((model) => model.id)
  );
}