import { analyzeImageDocument } from "@/lib/analyzeImageDocument";
import { ingestDocument } from "@/lib/ingestDocument";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildBaseImageMetadata, mergeDocumentMetadata } from "@/lib/vaultDocumentMetadata";

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
  metadataColumnAvailable?: boolean;
  aiVisionStatus?: "completed" | "failed" | "unavailable";
  aiVisionMessage?: string;
};

const imageMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const imageExtensions = new Set(["png", "jpg", "jpeg", "webp"]);

const imageAssetStatus = "image_asset";
const fallbackSuccessStatus = "completed";

function normalizeMimeType(mimeType: string | null, filename: string) {
  const normalizedMimeType = mimeType?.trim().toLowerCase() ?? "";

  if (normalizedMimeType) {
    return normalizedMimeType;
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";

  return "application/octet-stream";
}

function isImageAsset(mimeType: string, filename: string) {
  if (imageMimeTypes.has(mimeType)) {
    return true;
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return imageExtensions.has(extension);
}

async function setImageAssetStatus(documentId: string) {
  const { error: imageStatusError } = await supabaseAdmin
    .from("documents")
    .update({ status: imageAssetStatus })
    .eq("id", documentId);

  if (!imageStatusError) {
    return;
  }

  await supabaseAdmin
    .from("documents")
    .update({ status: fallbackSuccessStatus })
    .eq("id", documentId);
}

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
  const normalizedMimeType = normalizeMimeType(mimeType, filename);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("knowledge-vault")
    .upload(storagePath, buffer, {
      contentType: normalizedMimeType || undefined,
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
      mime_type: normalizedMimeType,
      project_id: projectId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !document) {
    await supabaseAdmin.storage.from("knowledge-vault").remove([storagePath]);
    throw new Error(insertError?.message ?? "failed to create document row");
  }

  if (isImageAsset(normalizedMimeType, filename)) {
    await setImageAssetStatus(document.id);

    const metadataSaveResult = await mergeDocumentMetadata(
      document.id,
      buildBaseImageMetadata(normalizedMimeType)
    );

    if (!metadataSaveResult.saved && metadataSaveResult.error) {
      console.warn("Failed to save image metadata", metadataSaveResult.error);
    }

    const analysisResult = await analyzeImageDocument(document.id, {
      force: false,
      allowTransientWithoutStorage: false,
    });

    return {
      success: true,
      documentId: document.id,
      storagePath,
      indexed: true,
      chunks: 0,
      metadataColumnAvailable: analysisResult.metadataColumnAvailable,
      aiVisionStatus: analysisResult.aiVision?.status ?? "unavailable",
      aiVisionMessage: analysisResult.message,
    };
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