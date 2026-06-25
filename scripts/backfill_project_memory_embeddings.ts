import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

type ProjectMemoryRow = {
  id: string;
  memory_type: string;
  title: string;
  content: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildProjectMemoryEmbeddingInput(memoryType: string, title: string, content: string) {
  return [`Type: ${memoryType}`, `Title: ${title}`, `Content: ${content}`].join("\n");
}

async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding as number[];
}

async function main() {
  if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variables.");
  }

  let updatedCount = 0;
  let failedCount = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("project_memories")
      .select("id, memory_type, title, content")
      .is("embedding", null)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    const memories = (data ?? []) as ProjectMemoryRow[];

    if (memories.length === 0) {
      break;
    }

    for (const memory of memories) {
      try {
        const embedding = await createEmbedding(
          buildProjectMemoryEmbeddingInput(memory.memory_type, memory.title, memory.content)
        );

        const { error: updateError } = await supabaseAdmin
          .from("project_memories")
          .update({ embedding })
          .eq("id", memory.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        updatedCount += 1;
        console.log(`Updated ${memory.id}`);
      } catch (error: any) {
        failedCount += 1;
        console.error(`Failed ${memory.id}: ${error?.message ?? error}`);
      }
    }
  }

  console.log(`Backfill complete. Updated: ${updatedCount}. Failed: ${failedCount}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});