import { createEmbedding } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type RetrievedProjectMemory = {
  memory_type: string;
  title: string;
  content: string;
  importance: number;
  created_at: string;
};

type RetrievedProjectMemoryRow = RetrievedProjectMemory & {
  id: string;
};

type SemanticProjectMemoryRow = RetrievedProjectMemoryRow & {
  similarity: number;
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

function normalizeMemory<T extends RetrievedProjectMemory>(memory: T): T {
  return {
    ...memory,
    title: collapseWhitespace(memory.title),
    content: collapseWhitespace(memory.content),
  };
}

function rankSemanticMemories(memories: SemanticProjectMemoryRow[]) {
  return [...memories].sort((left, right) => {
    const leftScore = left.similarity + left.importance * 0.03;
    const rightScore = right.similarity + right.importance * 0.03;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    if (right.similarity !== left.similarity) {
      return right.similarity - left.similarity;
    }

    if (right.importance !== left.importance) {
      return right.importance - left.importance;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

async function fetchFallbackMemories(projectId: string) {
  const { data, error } = await supabaseAdmin
    .from("project_memories")
    .select("id, memory_type, title, content, importance, created_at")
    .eq("project_id", projectId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RetrievedProjectMemoryRow[]).map(normalizeMemory);
}

function selectFallbackMemories(
  memories: RetrievedProjectMemoryRow[],
  keywords: string[]
) {
  const keywordMatches = memories.filter((memory) => matchesAnyKeyword(memory, keywords));
  return keywordMatches.length > 0 ? keywordMatches : memories;
}

function mergeSemanticAndFallback(
  semanticMemories: SemanticProjectMemoryRow[],
  fallbackMemories: RetrievedProjectMemoryRow[],
  limit: number
) {
  const merged = new Map<string, RetrievedProjectMemoryRow>();

  for (const memory of semanticMemories) {
    merged.set(memory.id, memory);
  }

  for (const memory of fallbackMemories) {
    if (merged.size >= limit) {
      break;
    }

    if (!merged.has(memory.id)) {
      merged.set(memory.id, memory);
    }
  }

  return [...merged.values()].slice(0, limit).map(({ id: _id, ...memory }) => memory);
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
  const normalizedQuery = query.trim();
  const keywords = normalizeQueryKeywords(normalizedQuery);
  const fallbackMemories = selectFallbackMemories(
    await fetchFallbackMemories(normalizedProjectId),
    keywords
  );

  if (!normalizedQuery) {
    return fallbackMemories.slice(0, safeLimit).map(({ id: _id, ...memory }) => memory);
  }

  try {
    const queryEmbedding = await createEmbedding(normalizedQuery);
    const { data, error } = await supabaseAdmin.rpc("match_project_memories", {
      query_embedding: queryEmbedding,
      match_project_id: normalizedProjectId,
      match_count: Math.max(safeLimit * 3, 12),
    });

    if (error) {
      throw new Error(error.message);
    }

    const semanticMemories = rankSemanticMemories(
      ((data ?? []) as SemanticProjectMemoryRow[])
        .map(normalizeMemory)
        .filter((memory) => Number.isFinite(memory.similarity))
    );

    if (semanticMemories.length === 0) {
      return fallbackMemories.slice(0, safeLimit).map(({ id: _id, ...memory }) => memory);
    }

    return mergeSemanticAndFallback(semanticMemories, fallbackMemories, safeLimit);
  } catch (error: any) {
    console.error(
      `project memory semantic retrieval failed for project ${normalizedProjectId}:`,
      error?.message ?? error
    );

    return fallbackMemories.slice(0, safeLimit).map(({ id: _id, ...memory }) => memory);
  }
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