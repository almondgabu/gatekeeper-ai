import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type DocumentMetadataRecord = Record<string, unknown>;

export type AIVisionStatus = "completed" | "failed";

export type AIVisionMetadata = {
  status: AIVisionStatus;
  aiDescription?: string;
  detectedScene?: string;
  suggestedTags?: string[];
  possibleUseCases?: string[];
  confidenceNotes?: string;
  error?: string;
  model?: string;
  analyzedAt?: string;
};

export const KNOWLEDGE_SCHEMA_VERSION = "v5.0";

export type KnowledgeStatus = "completed" | "failed" | "skipped";

export type KnowledgePropertyDetails = {
  titleType?: string;
  landSize?: string;
  district?: string;
  coordinates?: string;
  access?: string;
  roadFrontage?: string;
  askingPrice?: string;
  price?: string;
  usage?: string;
  restrictions?: string;
};

export type KnowledgeBusinessInsights = {
  negotiations: string[];
  commitments: string[];
  deadlines: string[];
  followUpActions: string[];
};

export type KnowledgeLegalInsights = {
  plaintiff: string[];
  defendant: string[];
  lawyers: string[];
  claims: string[];
  evidence: string[];
  courtDates: string[];
};

export type KnowledgeMarketingInsights = {
  sellingPoints: string[];
  weaknesses: string[];
  buyerObjections: string[];
  opportunities: string[];
};

export type DocumentKnowledgeMetadata = {
  status: KnowledgeStatus;
  version: string;
  extractedAt: string;
  updatedAt: string;
  model: string;
  summary: string;
  keyFacts: string[];
  people: string[];
  companies: string[];
  locations: string[];
  propertyDetails: KnowledgePropertyDetails;
  landInformation: string[];
  prices: string[];
  dates: string[];
  risks: string[];
  tasks: string[];
  decisions: string[];
  suggestedQuestions: string[];
  relatedProjectHints: string[];
  relatedDocumentHints: string[];
  contentIdeas: string[];
  importantNumbers: string[];
  relationships: string[];
  confidenceScore: number;
  businessInsights: KnowledgeBusinessInsights;
  legalInsights: KnowledgeLegalInsights;
  marketingInsights: KnowledgeMarketingInsights;
  error?: string;
};

export type ImageDocumentMetadata = {
  assetType: "image";
  imageMimeType: string;
  imageProcessing: "skipped_text_extraction";
  aiVision?: AIVisionMetadata;
  knowledge?: DocumentKnowledgeMetadata;
};

export type DocumentMetadataSaveResult = {
  saved: boolean;
  metadataColumnAvailable: boolean;
  metadata: DocumentMetadataRecord | null;
  error?: string;
};

let metadataColumnAvailabilityCache: boolean | null = null;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMetadataObjects(
  currentValue: Record<string, unknown>,
  patchValue: Record<string, unknown>
): Record<string, unknown> {
  const nextValue: Record<string, unknown> = { ...currentValue };

  for (const [key, value] of Object.entries(patchValue)) {
    const existingValue = nextValue[key];

    if (isPlainObject(existingValue) && isPlainObject(value)) {
      nextValue[key] = mergeMetadataObjects(existingValue, value);
      continue;
    }

    nextValue[key] = value;
  }

  return nextValue;
}

export function isMissingMetadataColumnError(message: string) {
  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes("metadata") && normalizedMessage.includes("does not exist");
}

export function buildBaseImageMetadata(mimeType: string): ImageDocumentMetadata {
  return {
    assetType: "image",
    imageMimeType: mimeType,
    imageProcessing: "skipped_text_extraction",
  };
}

export async function hasDocumentMetadataColumn() {
  if (metadataColumnAvailabilityCache === true) {
    return true;
  }

  const { error } = await supabaseAdmin.from("documents").select("id, metadata").limit(1);

  if (!error) {
    metadataColumnAvailabilityCache = true;
    return true;
  }

  if (isMissingMetadataColumnError(error.message)) {
    metadataColumnAvailabilityCache = null;
    return false;
  }

  throw new Error(error.message);
}

export async function readDocumentMetadata(documentId: string): Promise<{
  metadataColumnAvailable: boolean;
  metadata: DocumentMetadataRecord | null;
  error?: string;
}> {
  const metadataColumnAvailable = await hasDocumentMetadataColumn();

  if (!metadataColumnAvailable) {
    return { metadataColumnAvailable: false, metadata: null };
  }

  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("metadata")
    .eq("id", documentId)
    .single();

  if (error) {
    if (isMissingMetadataColumnError(error.message)) {
      metadataColumnAvailabilityCache = null;
      return { metadataColumnAvailable: false, metadata: null };
    }

    return {
      metadataColumnAvailable: true,
      metadata: null,
      error: error.message,
    };
  }

  return {
    metadataColumnAvailable: true,
    metadata: isPlainObject((data as { metadata?: unknown } | null)?.metadata)
      ? (((data as { metadata?: unknown }).metadata as Record<string, unknown>) ?? {})
      : {},
  };
}

export async function mergeDocumentMetadata(
  documentId: string,
  patch: DocumentMetadataRecord
): Promise<DocumentMetadataSaveResult> {
  const currentResult = await readDocumentMetadata(documentId);

  if (!currentResult.metadataColumnAvailable) {
    return {
      saved: false,
      metadataColumnAvailable: false,
      metadata: null,
      error: currentResult.error,
    };
  }

  if (currentResult.error) {
    return {
      saved: false,
      metadataColumnAvailable: true,
      metadata: currentResult.metadata,
      error: currentResult.error,
    };
  }

  const nextMetadata = mergeMetadataObjects(currentResult.metadata ?? {}, patch);

  const { error } = await supabaseAdmin
    .from("documents")
    .update({ metadata: nextMetadata } as any)
    .eq("id", documentId);

  if (error) {
    if (isMissingMetadataColumnError(error.message)) {
      metadataColumnAvailabilityCache = null;
      return {
        saved: false,
        metadataColumnAvailable: false,
        metadata: null,
      };
    }

    return {
      saved: false,
      metadataColumnAvailable: true,
      metadata: nextMetadata,
      error: error.message,
    };
  }

  return {
    saved: true,
    metadataColumnAvailable: true,
    metadata: nextMetadata,
  };
}