import { ingestDocument } from "@/lib/ingestDocument";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type StoreDocumentInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string | null;
  projectId?: string | null;
};

type StoredDocumentResult = {
  success: true;
  documentId: string;
  storagePath: string;
  indexed: boolean;
  chunks?: number;
  indexingError?: string;
};

function buildStoragePath(filename: string) {
  const normalizedFilename = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-") || "document.txt";
  return `${Date.now()}-${normalizedFilename}`;
}

export async function storeAndIngestDocument({
  buffer,
  filename,
  mimeType,
  projectId = null,
}: StoreDocumentInput): Promise<StoredDocumentResult> {
  const storagePath = buildStoragePath(filename);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("knowledge-vault")
    .upload(storagePath, buffer, {
      contentType: mimeType || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: document, error: insertError } = await supabaseAdmin
    .from("documents")
    .insert({
      filename,
      storage_path: storagePath,
      file_size: buffer.byteLength,
      mime_type: mimeType,
      project_id: projectId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !document) {
    await supabaseAdmin.storage.from("knowledge-vault").remove([storagePath]);
    throw new Error(insertError?.message ?? "failed to create document row");
  }

  try {
    const ingestResult = await ingestDocument(document.id);

    return {
      success: true,
      documentId: document.id,
      storagePath,
      indexed: true,
      chunks: ingestResult.chunks,
    };
  } catch (error: any) {
    return {
      success: true,
      documentId: document.id,
      storagePath,
      indexed: false,
      indexingError: error?.message ?? String(error),
    };
  }
}