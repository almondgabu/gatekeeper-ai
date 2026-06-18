import { createEmbedding } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type RetrievedChunk = {
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
  let allowedDocumentIds: Set<string> | null = null;

  if (typeof projectId === "string" && projectId.trim()) {
    console.log(`Project Retrieval: ${projectId}`);
    allowedDocumentIds = await resolveProjectDocumentIds(projectId);

    if (allowedDocumentIds.size === 0) {
      return [];
    }
  } else {
    console.log("Global Retrieval");
  }

  const queryEmbedding = await createEmbedding(query);

  const { data, error } = await supabaseAdmin.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: allowedDocumentIds ? Math.max(matchCount * 10, 50) : matchCount,
  });

  if (error) {
    throw new Error(error.message);
  }

  const chunks = ((data ?? []) as RetrievedChunk[])
    .filter((chunk) => !allowedDocumentIds || allowedDocumentIds.has(chunk.document_id))
    .slice(0, matchCount);

  if (chunks.length === 0) {
    return chunks;
  }

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
    filename: filenameByDocumentId.get(chunk.document_id) ?? null,
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