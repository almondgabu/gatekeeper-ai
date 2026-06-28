import { openai } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  AIVisionMetadata,
  buildBaseImageMetadata,
  mergeDocumentMetadata,
  readDocumentMetadata,
} from "@/lib/vaultDocumentMetadata";

const visionModel = "gpt-5-mini";

const imageMimeTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

type AnalyzeImageDocumentOptions = {
  force?: boolean;
  allowTransientWithoutStorage?: boolean;
};

type DocumentRow = {
  id: string;
  filename: string | null;
  storage_path: string;
  mime_type: string | null;
  status: string | null;
};

export type AnalyzeImageDocumentResult = {
  documentId: string;
  analysisAttempted: boolean;
  persisted: boolean;
  metadataColumnAvailable: boolean;
  metadata: Record<string, unknown> | null;
  aiVision: AIVisionMetadata | null;
  message?: string;
};

export class AnalyzeImageDocumentError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AnalyzeImageDocumentError";
    this.status = status;
  }
}

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function normalizeStringList(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const nextValues = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(nextValues)).slice(0, 8);
}

function extractJsonObject(text: string) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("AI response was empty.");
  }

  const withoutFences = trimmedText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBraceIndex = withoutFences.indexOf("{");
  const lastBraceIndex = withoutFences.lastIndexOf("}");

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
    throw new Error("AI response did not contain valid JSON.");
  }

  return withoutFences.slice(firstBraceIndex, lastBraceIndex + 1);
}

function normalizeVisionMetadata(rawText: string): AIVisionMetadata {
  const parsed = JSON.parse(extractJsonObject(rawText)) as Record<string, unknown>;

  const aiDescription = normalizeText(parsed.aiDescription || parsed.description);
  const detectedScene = normalizeText(parsed.detectedScene);
  const confidenceNotes = normalizeText(parsed.confidenceNotes);
  const suggestedTags = normalizeStringList(parsed.suggestedTags);
  const possibleUseCases = normalizeStringList(parsed.possibleUseCases, [
    "Production Studio",
    "Property Listing",
    "Investor Presentation",
  ]);

  return {
    status: "completed",
    aiDescription: aiDescription || "No detailed description returned.",
    detectedScene,
    suggestedTags,
    possibleUseCases,
    confidenceNotes,
    model: visionModel,
    analyzedAt: new Date().toISOString(),
  };
}

function getMimeType(document: DocumentRow) {
  const normalizedMimeType = (document.mime_type || "").trim().toLowerCase();

  if (normalizedMimeType) {
    return normalizedMimeType;
  }

  const extension = document.storage_path.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  return "application/octet-stream";
}

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").trim().slice(0, 180);
}

function isCompletedVisionMetadata(value: unknown): value is AIVisionMetadata {
  return typeof value === "object" && value !== null && (value as AIVisionMetadata).status === "completed";
}

async function fetchDocument(documentId: string) {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id, filename, storage_path, mime_type, status")
    .eq("id", documentId)
    .single();

  if (error || !data) {
    throw new AnalyzeImageDocumentError("document not found", 404);
  }

  return data as DocumentRow;
}

async function persistVisionResult(
  documentId: string,
  mimeType: string,
  aiVision: AIVisionMetadata
) {
  const metadataResult = await mergeDocumentMetadata(documentId, {
    ...buildBaseImageMetadata(mimeType),
    aiVision,
  });

  if (!metadataResult.saved && metadataResult.error) {
    console.warn("Failed to save AI vision metadata", metadataResult.error);
  }

  return metadataResult;
}

export async function analyzeImageDocument(
  documentId: string,
  options: AnalyzeImageDocumentOptions = {}
): Promise<AnalyzeImageDocumentResult> {
  const { force = false, allowTransientWithoutStorage = false } = options;
  const document = await fetchDocument(documentId);
  const mimeType = getMimeType(document);

  if (!imageMimeTypes.has(mimeType)) {
    throw new AnalyzeImageDocumentError("document is not an image asset", 400);
  }

  const metadataState = await readDocumentMetadata(document.id);
  const existingMetadata = metadataState.metadata ?? null;
  const existingAiVision =
    existingMetadata && typeof existingMetadata.aiVision === "object" && existingMetadata.aiVision !== null
      ? (existingMetadata.aiVision as AIVisionMetadata)
      : null;

  if (!force && isCompletedVisionMetadata(existingAiVision)) {
    return {
      documentId: document.id,
      analysisAttempted: false,
      persisted: metadataState.metadataColumnAvailable,
      metadataColumnAvailable: metadataState.metadataColumnAvailable,
      metadata: existingMetadata,
      aiVision: existingAiVision,
      message: "AI analysis already available.",
    };
  }

  if (!metadataState.metadataColumnAvailable && !allowTransientWithoutStorage) {
    return {
      documentId: document.id,
      analysisAttempted: false,
      persisted: false,
      metadataColumnAvailable: false,
      metadata: null,
      aiVision: null,
      message: "AI metadata storage unavailable because documents.metadata does not exist.",
    };
  }

  try {
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from("knowledge-vault")
      .createSignedUrl(document.storage_path, 300);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(signedUrlError?.message || "Failed to generate signed URL.");
    }

    const response = await openai.responses.create({
      model: visionModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "You are analyzing real estate-related images for a Knowledge Vault focused on Sabah properties and land opportunities.",
                "Describe only what is visible without inventing facts.",
                "If the image appears to show land, road, river, title document, map, building, vegetation, mountain view, or drone perspective, mention it.",
                "Do not guess price, title type, ownership, legal status, or exact location unless it is clearly visible in the image.",
                "Return strict JSON with these keys only: aiDescription, detectedScene, suggestedTags, possibleUseCases, confidenceNotes.",
                "Keep suggestedTags concise and useful for real-estate knowledge retrieval.",
              ].join(" "),
            },
            {
              type: "input_image",
              image_url: signedUrlData.signedUrl,
              detail: "auto",
            },
          ],
        },
      ],
    });

    const aiVision = normalizeVisionMetadata(response.output_text || "");
    const persistedResult = await persistVisionResult(document.id, mimeType, aiVision);

    return {
      documentId: document.id,
      analysisAttempted: true,
      persisted: persistedResult.saved,
      metadataColumnAvailable: persistedResult.metadataColumnAvailable,
      metadata:
        persistedResult.metadata ?? {
          ...buildBaseImageMetadata(mimeType),
          aiVision,
        },
      aiVision,
      message: persistedResult.saved
        ? "AI image metadata generated."
        : "AI image metadata generated but could not be persisted.",
    };
  } catch (error) {
    const aiVision: AIVisionMetadata = {
      status: "failed",
      error: safeErrorMessage(error),
      model: visionModel,
      analyzedAt: new Date().toISOString(),
    };

    const persistedResult = await persistVisionResult(document.id, mimeType, aiVision);

    return {
      documentId: document.id,
      analysisAttempted: true,
      persisted: persistedResult.saved,
      metadataColumnAvailable: persistedResult.metadataColumnAvailable,
      metadata:
        persistedResult.metadata ??
        (allowTransientWithoutStorage
          ? {
              ...buildBaseImageMetadata(mimeType),
              aiVision,
            }
          : null),
      aiVision,
      message: "AI image analysis failed, but the image asset remains usable.",
    };
  }
}