import { createEmbedding } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type RetrievedChunk = {
  id?: number;
  document_id: string;
  filename?: string | null;
  content: string;
  similarity?: number;
};

export async function retrieveKnowledgeContext(query: string, projectId?: string): Promise<RetrievedChunk[]>;
export async function retrieveKnowledgeContext(
  query: string,
  matchCount: number,
  projectId?: string
): Promise<RetrievedChunk[]>;
export async function retrieveKnowledgeContext(
  query: string,
  matchCountOrProjectId: number | string = 5,
  explicitProjectId?: string
) {
  const matchCount = typeof matchCountOrProjectId === "number" ? matchCountOrProjectId : 5;
  const projectId =
    typeof matchCountOrProjectId === "string" ? matchCountOrProjectId : explicitProjectId;
  const normalizedProjectId = typeof projectId === "string" && projectId.trim() ? projectId.trim() : undefined;

  if (!normalizedProjectId) {
    console.log("Global Retrieval");
  } else {
    console.log(`Project Retrieval: ${normalizedProjectId}`);
  }

  const queryEmbedding = await createEmbedding(query);

  if (normalizedProjectId) {
    const projectChunks = await retrieveProjectKnowledgeContext(
      queryEmbedding,
      matchCount,
      normalizedProjectId
    );

    if (projectChunks) {
      return projectChunks;
    }
  }

  const { data, error } = await supabaseAdmin.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(error.message);
  }

  const chunks = ((data ?? []) as RetrievedChunk[]).slice(0, matchCount);

  if (chunks.length === 0) {
    return chunks;
  }

  return hydrateChunkFilenames(chunks);
}

async function retrieveProjectKnowledgeContext(
  queryEmbedding: number[],
  matchCount: number,
  projectId: string
) {
  const { data, error } = await supabaseAdmin.rpc("match_project_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    target_project_id: projectId,
  });

  if (!error) {
    const chunks = ((data ?? []) as RetrievedChunk[]).slice(0, matchCount);

    if (chunks.length === 0) {
      return chunks;
    }

    if (chunks.every((chunk) => typeof chunk.filename !== "undefined")) {
      return chunks;
    }

    return hydrateChunkFilenames(chunks);
  }

  console.error(`match_project_document_chunks failed for project ${projectId}: ${error.message}`);

  const allowedDocumentIds = await resolveProjectDocumentIds(projectId);

  if (allowedDocumentIds.size === 0) {
    return [];
  }

  const fallback = await supabaseAdmin.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: Math.max(matchCount * 10, 50),
  });

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }

  const chunks = ((fallback.data ?? []) as RetrievedChunk[])
    .filter((chunk) => allowedDocumentIds.has(chunk.document_id))
    .slice(0, matchCount);

  if (chunks.length === 0) {
    return chunks;
  }

  return hydrateChunkFilenames(chunks);
}
async function hydrateChunkFilenames(chunks: RetrievedChunk[]) {
  const documentIds = [...new Set(chunks.map((chunk) => chunk.document_id).filter(Boolean))];

  const { data: documents, error: documentsError } = await supabaseAdmin
    .from("documents")
    .select("id, filename")
    .in("id", documentIds);

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  const filenameByDocumentId = new Map(
    (documents ?? []).map((document) => [document.id as string, document.filename as string | null])
  );

  return chunks.map((chunk) => ({
    ...chunk,
    filename: chunk.filename ?? filenameByDocumentId.get(chunk.document_id) ?? null,
  }));
}

async function resolveProjectDocumentIds(projectId: string) {
  const { data: documents, error } = await supabaseAdmin
    .from("documents")
    .select("id")
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((documents ?? []).map((document) => document.id as string).filter(Boolean));
}
