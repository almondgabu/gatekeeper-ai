import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type RetrievedProjectMemory = {
  memory_type: string;
  title: string;
  content: string;
  importance: number;
  created_at: string;
};

type RetrieveProjectMemoriesInput = {
  projectId: string;
  query: string;
  limit?: number;
};

function normalizeQueryKeywords(query: string) {
  return [...new Set(
    query
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length >= 3)
  )];
}

function matchesAnyKeyword(memory: RetrievedProjectMemory, keywords: string[]) {
  if (keywords.length === 0) {
    return true;
  }

  const haystack = `${memory.title} ${memory.content} ${memory.memory_type}`.toLowerCase();

  return keywords.some((keyword) => haystack.includes(keyword));
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function retrieveProjectMemories({
  projectId,
  query,
  limit = 10,
}: RetrieveProjectMemoriesInput): Promise<RetrievedProjectMemory[]> {
  const normalizedProjectId = projectId.trim();

  if (!normalizedProjectId) {
    return [];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const keywords = normalizeQueryKeywords(query);

  const { data, error } = await supabaseAdmin
    .from("project_memories")
    .select("memory_type, title, content, importance, created_at")
    .eq("project_id", normalizedProjectId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  const memories = ((data ?? []) as RetrievedProjectMemory[]).map((memory) => ({
    ...memory,
    title: collapseWhitespace(memory.title),
    content: collapseWhitespace(memory.content),
  }));

  const keywordMatches = memories.filter((memory) => matchesAnyKeyword(memory, keywords));
  const prioritizedMemories = keywordMatches.length > 0 ? keywordMatches : memories;

  return prioritizedMemories.slice(0, safeLimit);
}

export function formatProjectMemoriesContext(memories: RetrievedProjectMemory[]) {
  if (memories.length === 0) {
    return "Project Memories:\n- No relevant project memories were retrieved.";
  }

  return [
    "Project Memories:",
    ...memories.map(
      (memory) =>
        `- [${memory.memory_type}][importance ${memory.importance}] ${memory.title}: ${memory.content}`
    ),
  ].join("\n");
}