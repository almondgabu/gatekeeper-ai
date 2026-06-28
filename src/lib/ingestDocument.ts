import { chunkText } from "@/lib/chunkText";
import { createEmbedding } from "@/lib/embeddings";
import { extractText } from "@/lib/extractText";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildBaseImageMetadata, mergeDocumentMetadata } from "@/lib/vaultDocumentMetadata";

const imageMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const imageAssetStatus = "image_asset";
const fallbackSuccessStatus = "completed";

function stripInvalidUtf16Surrogates(input: string) {
  let sanitized = "";

  for (let index = 0; index < input.length; index++) {
    const codeUnit = input.charCodeAt(index);

    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = input.charCodeAt(index + 1);

      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        sanitized += input[index] + input[index + 1];
        index += 1;
      }

      continue;
    }

    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      continue;
    }

    sanitized += input[index];
  }

  return sanitized;
}

function sanitizeExtractedText(input: string) {
  return stripInvalidUtf16Surrogates(input)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class IngestDocumentError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "IngestDocumentError";
    this.status = status;
  }
}

export async function ingestDocument(documentId: string) {
  const { data: doc, error: fetchErr } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (fetchErr || !doc) {
    throw new IngestDocumentError("document not found", 404);
  }

  const storagePath = doc.storage_path ?? doc.filename ?? doc.file_name;
  const documentMimeType = (doc.mime_type || "").toLowerCase().trim();
  const mimeType =
    documentMimeType && documentMimeType !== "application/octet-stream"
      ? documentMimeType
      : getMimeType(storagePath).toLowerCase();

  if (imageMimeTypes.has(mimeType)) {
    await markImageAssetReady(doc.id, mimeType);
    return { chunks: 0 };
  }

  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from("knowledge-vault")
    .download(storagePath);

  if (downloadError || !fileData) {
    await markDocumentFailed(doc.id, downloadError?.message ?? "download failed");
    throw new IngestDocumentError("failed to download file", 500);
  }

  const arrayBuffer = await (fileData as Blob).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const text = sanitizeExtractedText(await extractText(buffer, mimeType));

  if (!text || text.trim().length === 0) {
    const errorMessage =
      "No extractable text found. This file may be scanned/image-based and requires OCR.";

    await markDocumentFailed(doc.id, errorMessage);
    throw new IngestDocumentError(errorMessage, 400);
  }

  const chunks = chunkText(text, 1000, 200)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  const { error: deleteChunksError } = await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", doc.id);

  if (deleteChunksError) {
    await markDocumentFailed(doc.id, deleteChunksError.message);
    throw new IngestDocumentError("failed to delete existing chunks", 500);
  }

  const payloads: Array<{
    document_id: string;
    chunk_index: number;
    content: string;
    embedding: number[];
  }> = [];

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];

    try {
      const embedding = await createEmbedding(chunk);

      payloads.push({
        document_id: doc.id,
        chunk_index: index,
        content: chunk,
        embedding,
      });
    } catch (error: any) {
      console.error("embedding error", error?.message ?? error);
    }
  }

  if (payloads.length > 0) {
    const { error: insertErr } = await supabaseAdmin.from("document_chunks").insert(payloads);

    if (insertErr) {
      await markDocumentFailed(doc.id, insertErr.message);
      throw new IngestDocumentError("failed to insert chunks", 500);
    }
  }

  await supabaseAdmin.from("documents").update({ status: "completed" }).eq("id", doc.id);

  return { chunks: payloads.length };
}

async function markDocumentFailed(documentId: string, errorMessage: string) {
  await supabaseAdmin.from("documents").update({ status: "failed" }).eq("id", documentId);
  await supabaseAdmin.from("indexing_status").insert({
    document_id: documentId,
    stage: "failed",
    progress: 0,
    error_message: errorMessage,
  });
}

async function markImageAssetReady(documentId: string, mimeType: string) {
  const { error: imageStatusError } = await supabaseAdmin
    .from("documents")
    .update({ status: imageAssetStatus })
    .eq("id", documentId);

  if (imageStatusError) {
    await supabaseAdmin
      .from("documents")
      .update({ status: fallbackSuccessStatus })
      .eq("id", documentId);
  }

  const metadataResult = await mergeDocumentMetadata(documentId, buildBaseImageMetadata(mimeType));

  if (!metadataResult.saved && metadataResult.error) {
    console.warn("Failed to save image metadata", metadataResult.error);
  }
}

function getMimeType(path: string) {
  const normalizedPath = path || "";
  const ext = normalizedPath.split(".").pop()?.toLowerCase();

  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (ext === "txt") return "text/plain";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";

  return "application/octet-stream";
}