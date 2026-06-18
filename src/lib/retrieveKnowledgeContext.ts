import { createEmbedding } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type RetrievedChunk = {
  document_id: string;
  filename?: string | null;
  content: string;
  similarity?: number;
};

export async function retrieveKnowledgeContext(query: string, matchCount = 5, projectId?: number) {
  let allowedDocumentIds: Set<string> | null = null;

  if (typeof projectId === "number" && Number.isFinite(projectId)) {
    allowedDocumentIds = await resolveProjectDocumentIds(projectId);

    if (allowedDocumentIds.size === 0) {
      return [];
    }
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

async function resolveProjectDocumentIds(projectId: number) {
  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return new Set<string>();
  }

  const projectName = project.name;
  const documentIds = new Set<string>();

  const { data: projectFiles, error: projectFilesError } = await supabaseAdmin
    .from("project_files")
    .select("file_name")
    .eq("project_name", projectName);

  if (projectFilesError) {
    throw new Error(projectFilesError.message);
  }

  const fileNames = [...new Set((projectFiles ?? []).map((file) => file.file_name).filter(Boolean))];

  if (fileNames.length === 0) {
    return documentIds;
  }

  const [storagePathDocuments, filenameDocuments] = await Promise.all([
    supabaseAdmin.from("documents").select("id").in("storage_path", fileNames),
    supabaseAdmin.from("documents").select("id").in("filename", fileNames),
  ]);

  if (storagePathDocuments.error) {
    throw new Error(storagePathDocuments.error.message);
  }

  if (filenameDocuments.error) {
    throw new Error(filenameDocuments.error.message);
  }

  for (const document of storagePathDocuments.data ?? []) {
    documentIds.add(document.id);
  }

  for (const document of filenameDocuments.data ?? []) {
    documentIds.add(document.id);
  }

  return documentIds;
}