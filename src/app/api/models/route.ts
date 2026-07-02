import { openai } from "@/lib/embeddings";

export async function GET() {
  const models = await openai.models.list();

  return Response.json(
    models.data.map((model) => model.id)
  );
}