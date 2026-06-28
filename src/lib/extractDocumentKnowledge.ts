import { analyzeImageDocument } from "@/lib/analyzeImageDocument";
import { openai } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  AIVisionMetadata,
  DocumentKnowledgeMetadata,
  DocumentMetadataRecord,
  KnowledgePropertyDetails,
  mergeDocumentMetadata,
  readDocumentMetadata,
} from "@/lib/vaultDocumentMetadata";

const knowledgeModel = "gpt-5-mini";
const maxChunkCount = 12;
const maxContextLength = 12000;

const imageMimeTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

type ExtractDocumentKnowledgeOptions = {
  force?: boolean;
};

type DocumentRow = {
  id: string;
  filename: string | null;
  storage_path: string;
  mime_type: string | null;
  status: string | null;
  project_id: string | null;
};

type ChunkRow = {
  chunk_index: number;
  content: string;
};

export type ExtractDocumentKnowledgeResult = {
  documentId: string;
  extractionAttempted: boolean;
  persisted: boolean;
  metadataColumnAvailable: boolean;
  metadata: DocumentMetadataRecord | null;
  knowledge: DocumentKnowledgeMetadata | null;
  message?: string;
};

export class ExtractDocumentKnowledgeError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ExtractDocumentKnowledgeError";
    this.status = status;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.replace(/\s+/g, " ").trim();
}

function normalizeStringList(value: unknown, limit = 8) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => normalizeText(entry))
        .filter((entry) => entry.length > 0)
    )
  ).slice(0, limit);
}

function normalizePropertyDetails(value: unknown): KnowledgePropertyDetails {
  const propertyDetails = isPlainObject(value) ? value : {};

  return {
    titleType: normalizeText(propertyDetails.titleType),
    landSize: normalizeText(propertyDetails.landSize),
    district: normalizeText(propertyDetails.district),
    coordinates: normalizeText(propertyDetails.coordinates),
    price: normalizeText(propertyDetails.price),
    usage: normalizeText(propertyDetails.usage),
    restrictions: normalizeText(propertyDetails.restrictions),
  };
}

function emptyPropertyDetails(): KnowledgePropertyDetails {
  return {
    titleType: "",
    landSize: "",
    district: "",
    coordinates: "",
    price: "",
    usage: "",
    restrictions: "",
  };
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

function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").trim().slice(0, 180);
}

function buildKnowledgeRecord(
  status: DocumentKnowledgeMetadata["status"],
  patch: Partial<DocumentKnowledgeMetadata> = {}
): DocumentKnowledgeMetadata {
  return {
    status,
    extractedAt: patch.extractedAt || new Date().toISOString(),
    model: patch.model || knowledgeModel,
    summary: patch.summary || "",
    keyFacts: patch.keyFacts || [],
    people: patch.people || [],
    companies: patch.companies || [],
    locations: patch.locations || [],
    propertyDetails: patch.propertyDetails || emptyPropertyDetails(),
    dates: patch.dates || [],
    risks: patch.risks || [],
    tasks: patch.tasks || [],
    decisions: patch.decisions || [],
    suggestedQuestions: patch.suggestedQuestions || [],
    relatedProjectHints: patch.relatedProjectHints || [],
    contentIdeas: patch.contentIdeas || [],
    ...(patch.error ? { error: patch.error } : {}),
  };
}

function normalizeKnowledgeMetadata(rawText: string): DocumentKnowledgeMetadata {
  const parsed = JSON.parse(extractJsonObject(rawText)) as Record<string, unknown>;

  return buildKnowledgeRecord("completed", {
    summary: normalizeText(parsed.summary).slice(0, 700),
    keyFacts: normalizeStringList(parsed.keyFacts, 10),
    people: normalizeStringList(parsed.people, 10),
    companies: normalizeStringList(parsed.companies, 10),
    locations: normalizeStringList(parsed.locations, 10),
    propertyDetails: normalizePropertyDetails(parsed.propertyDetails),
    dates: normalizeStringList(parsed.dates, 10),
    risks: normalizeStringList(parsed.risks, 10),
    tasks: normalizeStringList(parsed.tasks, 10),
    decisions: normalizeStringList(parsed.decisions, 10),
    suggestedQuestions: normalizeStringList(parsed.suggestedQuestions, 10),
    relatedProjectHints: normalizeStringList(parsed.relatedProjectHints, 10),
    contentIdeas: normalizeStringList(parsed.contentIdeas, 10),
  });
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
  if (extension === "pdf") return "application/pdf";
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "txt") return "text/plain";
  if (extension === "csv") return "text/csv";

  return "application/octet-stream";
}

function isImageDocument(document: DocumentRow) {
  return imageMimeTypes.has(getMimeType(document)) || (document.status || "").toLowerCase() === "image_asset";
}

function isCompletedKnowledge(value: unknown): value is DocumentKnowledgeMetadata {
  return typeof value === "object" && value !== null && (value as DocumentKnowledgeMetadata).status === "completed";
}

function getExistingKnowledge(metadata: DocumentMetadataRecord | null) {
  if (!metadata || !isPlainObject(metadata.knowledge)) {
    return null;
  }

  return metadata.knowledge as DocumentKnowledgeMetadata;
}

async function fetchDocument(documentId: string) {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id, filename, storage_path, mime_type, status, project_id")
    .eq("id", documentId)
    .single();

  if (error || !data) {
    throw new ExtractDocumentKnowledgeError("document not found", 404);
  }

  return data as DocumentRow;
}

async function fetchTextChunks(documentId: string) {
  const { data, error } = await supabaseAdmin
    .from("document_chunks")
    .select("chunk_index, content")
    .eq("document_id", documentId)
    .order("chunk_index", { ascending: true })
    .limit(maxChunkCount);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ChunkRow[])
    .map((chunk) => ({
      chunk_index: chunk.chunk_index,
      content: normalizeText(chunk.content),
    }))
    .filter((chunk) => chunk.content.length > 0);
}

function buildChunkContext(chunks: ChunkRow[]) {
  const context = chunks.map((chunk) => `[Chunk ${chunk.chunk_index + 1}] ${chunk.content}`).join("\n\n");
  return context.slice(0, maxContextLength);
}

async function ensureImageVisionContext(documentId: string, metadata: DocumentMetadataRecord | null) {
  const existingAiVision = isPlainObject(metadata?.aiVision) ? (metadata?.aiVision as AIVisionMetadata) : null;

  if (existingAiVision?.status === "completed") {
    return existingAiVision;
  }

  const result = await analyzeImageDocument(documentId, {
    force: false,
    allowTransientWithoutStorage: true,
  });

  return result.aiVision?.status === "completed" ? result.aiVision : null;
}

async function persistKnowledge(
  documentId: string,
  knowledge: DocumentKnowledgeMetadata
): Promise<ExtractDocumentKnowledgeResult> {
  const metadataResult = await mergeDocumentMetadata(documentId, { knowledge });

  if (!metadataResult.saved && metadataResult.error) {
    console.warn("Failed to save knowledge metadata", metadataResult.error);
  }

  return {
    documentId,
    extractionAttempted: knowledge.status === "completed" || knowledge.status === "failed",
    persisted: metadataResult.saved,
    metadataColumnAvailable: metadataResult.metadataColumnAvailable,
    metadata: metadataResult.metadata,
    knowledge,
    message:
      knowledge.status === "completed"
        ? metadataResult.saved
          ? "Knowledge extracted successfully."
          : "Knowledge extracted but could not be persisted."
        : knowledge.status === "skipped"
          ? knowledge.summary || "Knowledge extraction skipped."
          : "Knowledge extraction failed, but the upload remains usable.",
  };
}

export async function extractDocumentKnowledge(
  documentId: string,
  options: ExtractDocumentKnowledgeOptions = {}
): Promise<ExtractDocumentKnowledgeResult> {
  const { force = false } = options;
  const document = await fetchDocument(documentId);
  const metadataState = await readDocumentMetadata(document.id);
  const existingMetadata = metadataState.metadata ?? null;
  const existingKnowledge = getExistingKnowledge(existingMetadata);

  if (!force && isCompletedKnowledge(existingKnowledge)) {
    return {
      documentId: document.id,
      extractionAttempted: false,
      persisted: metadataState.metadataColumnAvailable,
      metadataColumnAvailable: metadataState.metadataColumnAvailable,
      metadata: existingMetadata,
      knowledge: existingKnowledge,
      message: "Knowledge already extracted.",
    };
  }

  if (!metadataState.metadataColumnAvailable) {
    return {
      documentId: document.id,
      extractionAttempted: false,
      persisted: false,
      metadataColumnAvailable: false,
      metadata: null,
      knowledge: null,
      message: "Knowledge metadata storage unavailable because documents.metadata does not exist.",
    };
  }

  try {
    const mimeType = getMimeType(document);
    const imageDocument = isImageDocument(document);

    if (imageDocument) {
      const aiVision = await ensureImageVisionContext(document.id, existingMetadata);

      if (!aiVision) {
        return persistKnowledge(
          document.id,
          buildKnowledgeRecord("skipped", {
            summary: "Knowledge extraction skipped because no usable AI image analysis is available yet.",
          })
        );
      }

      const response = await openai.responses.create({
        model: knowledgeModel,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  "You extract structured knowledge for a real-estate-focused Knowledge Vault.",
                  "Use only the evidence provided. Do not invent missing facts.",
                  "Return strict JSON with these keys only:",
                  "summary, keyFacts, people, companies, locations, propertyDetails, dates, risks, tasks, decisions, suggestedQuestions, relatedProjectHints, contentIdeas.",
                  "All list fields must be arrays of short strings.",
                  "propertyDetails must be an object with titleType, landSize, district, coordinates, price, usage, restrictions.",
                  `Filename: ${document.filename || document.storage_path}.`,
                  `Mime type: ${mimeType}.`,
                  `Project id: ${document.project_id || "global"}.`,
                  `AI vision description: ${aiVision.aiDescription || ""}`,
                  `Detected scene: ${aiVision.detectedScene || ""}`,
                  `Suggested tags: ${(aiVision.suggestedTags || []).join(", ") || "none"}`,
                  `Possible use cases: ${(aiVision.possibleUseCases || []).join(", ") || "none"}`,
                  `Confidence notes: ${aiVision.confidenceNotes || ""}`,
                  "If the evidence is visual only, keep uncertain fields empty instead of guessing.",
                ].join("\n"),
              },
            ],
          },
        ],
      });

      return persistKnowledge(document.id, normalizeKnowledgeMetadata(response.output_text || ""));
    }

    const chunks = await fetchTextChunks(document.id);

    if (chunks.length === 0) {
      return persistKnowledge(
        document.id,
        buildKnowledgeRecord("skipped", {
          summary: "Knowledge extraction skipped because no text chunks are available for this document.",
        })
      );
    }

    const response = await openai.responses.create({
      model: knowledgeModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "You extract structured knowledge for a real-estate-focused Knowledge Vault.",
                "Use only the supplied document evidence. Do not invent missing facts.",
                "Return strict JSON with these keys only:",
                "summary, keyFacts, people, companies, locations, propertyDetails, dates, risks, tasks, decisions, suggestedQuestions, relatedProjectHints, contentIdeas.",
                "All list fields must be arrays of short strings.",
                "propertyDetails must be an object with titleType, landSize, district, coordinates, price, usage, restrictions.",
                "Prefer concise, retrieval-friendly phrases.",
                `Filename: ${document.filename || document.storage_path}.`,
                `Mime type: ${mimeType}.`,
                `Project id: ${document.project_id || "global"}.`,
                "Document evidence begins below.",
                buildChunkContext(chunks),
              ].join("\n\n"),
            },
          ],
        },
      ],
    });

    return persistKnowledge(document.id, normalizeKnowledgeMetadata(response.output_text || ""));
  } catch (error) {
    return persistKnowledge(
      document.id,
      buildKnowledgeRecord("failed", {
        summary: "Knowledge extraction failed safely.",
        error: safeErrorMessage(error),
      })
    );
  }
}