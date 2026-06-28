import { analyzeImageDocument } from "@/lib/analyzeImageDocument";
import { openai } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  AIVisionMetadata,
  DocumentKnowledgeMetadata,
  DocumentMetadataRecord,
  KnowledgeBusinessInsights,
  KnowledgeLegalInsights,
  KnowledgeMarketingInsights,
  KnowledgePropertyDetails,
  KNOWLEDGE_SCHEMA_VERSION,
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

type RelatedProjectDocumentRow = {
  id: string;
  filename: string | null;
  mime_type: string | null;
  status: string | null;
  metadata: DocumentMetadataRecord | null;
  created_at: string | null;
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

function normalizeConfidenceScore(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(1, Math.max(0, numericValue));
}

function normalizePropertyDetails(value: unknown): KnowledgePropertyDetails {
  const propertyDetails = isPlainObject(value) ? value : {};

  return {
    titleType: normalizeText(propertyDetails.titleType),
    landSize: normalizeText(propertyDetails.landSize),
    district: normalizeText(propertyDetails.district),
    coordinates: normalizeText(propertyDetails.coordinates),
    access: normalizeText(propertyDetails.access),
    roadFrontage: normalizeText(propertyDetails.roadFrontage),
    askingPrice: normalizeText(propertyDetails.askingPrice),
    price: normalizeText(propertyDetails.price),
    usage: normalizeText(propertyDetails.usage),
    restrictions: normalizeText(propertyDetails.restrictions),
  };
}

function normalizeBusinessInsights(value: unknown): KnowledgeBusinessInsights {
  const insights = isPlainObject(value) ? value : {};

  return {
    negotiations: normalizeStringList(insights.negotiations, 10),
    commitments: normalizeStringList(insights.commitments, 10),
    deadlines: normalizeStringList(insights.deadlines, 10),
    followUpActions: normalizeStringList(insights.followUpActions, 10),
  };
}

function normalizeLegalInsights(value: unknown): KnowledgeLegalInsights {
  const insights = isPlainObject(value) ? value : {};

  return {
    plaintiff: normalizeStringList(insights.plaintiff, 10),
    defendant: normalizeStringList(insights.defendant, 10),
    lawyers: normalizeStringList(insights.lawyers, 10),
    claims: normalizeStringList(insights.claims, 10),
    evidence: normalizeStringList(insights.evidence, 10),
    courtDates: normalizeStringList(insights.courtDates, 10),
  };
}

function normalizeMarketingInsights(value: unknown): KnowledgeMarketingInsights {
  const insights = isPlainObject(value) ? value : {};

  return {
    sellingPoints: normalizeStringList(insights.sellingPoints, 10),
    weaknesses: normalizeStringList(insights.weaknesses, 10),
    buyerObjections: normalizeStringList(insights.buyerObjections, 10),
    opportunities: normalizeStringList(insights.opportunities, 10),
  };
}

function emptyPropertyDetails(): KnowledgePropertyDetails {
  return {
    titleType: "",
    landSize: "",
    district: "",
    coordinates: "",
    access: "",
    roadFrontage: "",
    askingPrice: "",
    price: "",
    usage: "",
    restrictions: "",
  };
}

function emptyBusinessInsights(): KnowledgeBusinessInsights {
  return {
    negotiations: [],
    commitments: [],
    deadlines: [],
    followUpActions: [],
  };
}

function emptyLegalInsights(): KnowledgeLegalInsights {
  return {
    plaintiff: [],
    defendant: [],
    lawyers: [],
    claims: [],
    evidence: [],
    courtDates: [],
  };
}

function emptyMarketingInsights(): KnowledgeMarketingInsights {
  return {
    sellingPoints: [],
    weaknesses: [],
    buyerObjections: [],
    opportunities: [],
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
  const now = patch.updatedAt || new Date().toISOString();

  return {
    status,
    version: patch.version || KNOWLEDGE_SCHEMA_VERSION,
    extractedAt: patch.extractedAt || now,
    updatedAt: patch.updatedAt || now,
    model: patch.model || knowledgeModel,
    summary: patch.summary || "",
    keyFacts: patch.keyFacts || [],
    people: patch.people || [],
    companies: patch.companies || [],
    locations: patch.locations || [],
    propertyDetails: patch.propertyDetails || emptyPropertyDetails(),
    landInformation: patch.landInformation || [],
    prices: patch.prices || [],
    dates: patch.dates || [],
    risks: patch.risks || [],
    tasks: patch.tasks || [],
    decisions: patch.decisions || [],
    suggestedQuestions: patch.suggestedQuestions || [],
    relatedProjectHints: patch.relatedProjectHints || [],
    relatedDocumentHints: patch.relatedDocumentHints || [],
    contentIdeas: patch.contentIdeas || [],
    importantNumbers: patch.importantNumbers || [],
    relationships: patch.relationships || [],
    confidenceScore: patch.confidenceScore ?? 0,
    businessInsights: patch.businessInsights || emptyBusinessInsights(),
    legalInsights: patch.legalInsights || emptyLegalInsights(),
    marketingInsights: patch.marketingInsights || emptyMarketingInsights(),
    ...(patch.error ? { error: patch.error } : {}),
  };
}

function normalizeKnowledgeMetadata(rawText: string): DocumentKnowledgeMetadata {
  const parsed = JSON.parse(extractJsonObject(rawText)) as Record<string, unknown>;
  const timestamp = new Date().toISOString();

  return buildKnowledgeRecord("completed", {
    extractedAt: timestamp,
    updatedAt: timestamp,
    summary: normalizeText(parsed.summary).slice(0, 700),
    keyFacts: normalizeStringList(parsed.keyFacts, 10),
    people: normalizeStringList(parsed.people, 10),
    companies: normalizeStringList(parsed.companies, 10),
    locations: normalizeStringList(parsed.locations, 10),
    propertyDetails: normalizePropertyDetails(parsed.propertyDetails),
    landInformation: normalizeStringList(parsed.landInformation, 10),
    prices: normalizeStringList(parsed.prices, 10),
    dates: normalizeStringList(parsed.dates, 10),
    risks: normalizeStringList(parsed.risks, 10),
    tasks: normalizeStringList(parsed.tasks, 10),
    decisions: normalizeStringList(parsed.decisions, 10),
    suggestedQuestions: normalizeStringList(parsed.suggestedQuestions, 10),
    relatedProjectHints: normalizeStringList(parsed.relatedProjectHints, 10),
    relatedDocumentHints: normalizeStringList(parsed.relatedDocumentHints, 10),
    contentIdeas: normalizeStringList(parsed.contentIdeas, 10),
    importantNumbers: normalizeStringList(parsed.importantNumbers, 12),
    relationships: normalizeStringList(parsed.relationships, 12),
    confidenceScore: normalizeConfidenceScore(parsed.confidenceScore),
    businessInsights: normalizeBusinessInsights(parsed.businessInsights),
    legalInsights: normalizeLegalInsights(parsed.legalInsights),
    marketingInsights: normalizeMarketingInsights(parsed.marketingInsights),
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

function isCurrentKnowledgeVersion(knowledge: DocumentKnowledgeMetadata | null) {
  return knowledge?.version === KNOWLEDGE_SCHEMA_VERSION;
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

async function fetchRelatedProjectDocuments(projectId: string, currentDocumentId: string) {
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("id, filename, mime_type, status, metadata, created_at")
    .eq("project_id", projectId)
    .neq("id", currentDocumentId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RelatedProjectDocumentRow[];
}

function buildChunkContext(chunks: ChunkRow[]) {
  const context = chunks.map((chunk) => `[Chunk ${chunk.chunk_index + 1}] ${chunk.content}`).join("\n\n");
  return context.slice(0, maxContextLength);
}

function summarizeRelatedProjectDocument(document: RelatedProjectDocumentRow) {
  const metadata = isPlainObject(document.metadata) ? document.metadata : null;
  const knowledge = metadata && isPlainObject(metadata.knowledge)
    ? (metadata.knowledge as DocumentKnowledgeMetadata)
    : null;
  const aiVision = metadata && isPlainObject(metadata.aiVision)
    ? (metadata.aiVision as AIVisionMetadata)
    : null;

  const summaryParts = [
    `Filename: ${document.filename || document.id}`,
    `Status: ${document.status || "unknown"}`,
  ];

  if (knowledge?.summary) {
    summaryParts.push(`Knowledge summary: ${knowledge.summary}`);
  }

  if (knowledge?.people?.length) {
    summaryParts.push(`People: ${knowledge.people.join(", ")}`);
  }

  if (knowledge?.companies?.length) {
    summaryParts.push(`Companies: ${knowledge.companies.join(", ")}`);
  }

  if (knowledge?.locations?.length) {
    summaryParts.push(`Locations: ${knowledge.locations.join(", ")}`);
  }

  if (knowledge?.prices?.length) {
    summaryParts.push(`Prices: ${knowledge.prices.join(", ")}`);
  }

  if (knowledge?.importantNumbers?.length) {
    summaryParts.push(`Important numbers: ${knowledge.importantNumbers.join(", ")}`);
  }

  if (knowledge?.relatedDocumentHints?.length) {
    summaryParts.push(`Existing related hints: ${knowledge.relatedDocumentHints.join(" | ")}`);
  }

  if (!knowledge?.summary && aiVision?.aiDescription) {
    summaryParts.push(`Image analysis: ${aiVision.aiDescription}`);
  }

  return summaryParts.join("\n");
}

async function buildRelatedProjectContext(projectId: string | null, currentDocumentId: string) {
  if (!projectId) {
    return "";
  }

  const relatedDocuments = await fetchRelatedProjectDocuments(projectId, currentDocumentId);

  if (relatedDocuments.length === 0) {
    return "";
  }

  return relatedDocuments
    .map((document, index) => `Project document ${index + 1}:\n${summarizeRelatedProjectDocument(document)}`)
    .join("\n\n");
}

async function ensureImageVisionContext(documentId: string, metadata: DocumentMetadataRecord | null) {
  const existingAiVision = isPlainObject(metadata?.aiVision) ? (metadata.aiVision as AIVisionMetadata) : null;

  if (existingAiVision?.status === "completed") {
    return existingAiVision;
  }

  const result = await analyzeImageDocument(documentId, {
    force: false,
    allowTransientWithoutStorage: true,
  });

  return result.aiVision?.status === "completed" ? result.aiVision : null;
}

function buildKnowledgePrompt({
  document,
  mimeType,
  primaryContext,
  relatedProjectContext,
}: {
  document: DocumentRow;
  mimeType: string;
  primaryContext: string;
  relatedProjectContext: string;
}) {
  return [
    "You extract structured knowledge for a real-estate-focused Knowledge Vault.",
    "Use only the supplied evidence and never invent facts.",
    "Return strict JSON with these keys only:",
    "summary, keyFacts, people, companies, locations, propertyDetails, landInformation, prices, dates, risks, tasks, decisions, suggestedQuestions, relatedProjectHints, relatedDocumentHints, contentIdeas, importantNumbers, relationships, confidenceScore, businessInsights, legalInsights, marketingInsights.",
    "propertyDetails must be an object with titleType, landSize, district, coordinates, access, roadFrontage, askingPrice, price, usage, restrictions.",
    "businessInsights must be an object with negotiations, commitments, deadlines, followUpActions.",
    "legalInsights must be an object with plaintiff, defendant, lawyers, claims, evidence, courtDates.",
    "marketingInsights must be an object with sellingPoints, weaknesses, buyerObjections, opportunities.",
    "All list fields must be arrays of short strings. confidenceScore must be a number from 0 to 1.",
    "Capture important entities, important numbers, relationships, deadlines, and contradictions when they are explicitly supported by the evidence.",
    "If the document is legal, identify parties, lawyers, claims, evidence, and court dates.",
    "If the document is commercial or negotiation-related, identify commitments, deadlines, and follow-up actions.",
    "If the document is marketing-oriented, identify selling points, weaknesses, buyer objections, and opportunities.",
    `Filename: ${document.filename || document.storage_path}.`,
    `Mime type: ${mimeType}.`,
    `Project id: ${document.project_id || "global"}.`,
    "Primary document evidence:",
    primaryContext,
    relatedProjectContext
      ? [
          "Existing documents from the same project are listed below.",
          "Only create relatedDocumentHints when there is meaningful overlap, contradiction, repetition, dependency, or price/person mismatch.",
          relatedProjectContext,
        ].join("\n\n")
      : "No related project documents were supplied.",
  ].join("\n\n");
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
    extractionAttempted: knowledge.status !== "skipped",
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

  if (!force && isCompletedKnowledge(existingKnowledge) && isCurrentKnowledgeVersion(existingKnowledge)) {
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
    const relatedProjectContext = await buildRelatedProjectContext(document.project_id, document.id);

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
                text: buildKnowledgePrompt({
                  document,
                  mimeType,
                  relatedProjectContext,
                  primaryContext: [
                    `AI vision description: ${aiVision.aiDescription || ""}`,
                    `Detected scene: ${aiVision.detectedScene || ""}`,
                    `Suggested tags: ${(aiVision.suggestedTags || []).join(", ") || "none"}`,
                    `Possible use cases: ${(aiVision.possibleUseCases || []).join(", ") || "none"}`,
                    `Confidence notes: ${aiVision.confidenceNotes || ""}`,
                    "If the evidence is visual only, keep uncertain fields empty instead of guessing.",
                  ].join("\n"),
                }),
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
              text: buildKnowledgePrompt({
                document,
                mimeType,
                relatedProjectContext,
                primaryContext: buildChunkContext(chunks),
              }),
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
