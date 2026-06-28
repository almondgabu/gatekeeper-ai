"use client";

import {
  Trash2,
  FileText,
  Download,
  Eye,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Copy,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProjectOption = {
  id: string;
  name: string;
};

type VaultAIVision = {
  status: "completed" | "failed";
  aiDescription?: string;
  detectedScene?: string;
  suggestedTags?: string[];
  possibleUseCases?: string[];
  confidenceNotes?: string;
  error?: string;
  model?: string;
  analyzedAt?: string;
};

type VaultKnowledgePropertyDetails = {
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

type VaultKnowledgeBusinessInsights = {
  negotiations?: string[];
  commitments?: string[];
  deadlines?: string[];
  followUpActions?: string[];
};

type VaultKnowledgeLegalInsights = {
  plaintiff?: string[];
  defendant?: string[];
  lawyers?: string[];
  claims?: string[];
  evidence?: string[];
  courtDates?: string[];
};

type VaultKnowledgeMarketingInsights = {
  sellingPoints?: string[];
  weaknesses?: string[];
  buyerObjections?: string[];
  opportunities?: string[];
};

type VaultKnowledge = {
  status: "completed" | "failed" | "skipped";
  version?: string;
  extractedAt?: string;
  updatedAt?: string;
  model?: string;
  summary?: string;
  keyFacts?: string[];
  people?: string[];
  companies?: string[];
  locations?: string[];
  propertyDetails?: VaultKnowledgePropertyDetails;
  landInformation?: string[];
  prices?: string[];
  dates?: string[];
  risks?: string[];
  tasks?: string[];
  decisions?: string[];
  suggestedQuestions?: string[];
  relatedProjectHints?: string[];
  relatedDocumentHints?: string[];
  contentIdeas?: string[];
  importantNumbers?: string[];
  relationships?: string[];
  confidenceScore?: number;
  businessInsights?: VaultKnowledgeBusinessInsights;
  legalInsights?: VaultKnowledgeLegalInsights;
  marketingInsights?: VaultKnowledgeMarketingInsights;
  error?: string;
};

type VaultDocumentMetadata = {
  assetType?: string;
  imageMimeType?: string;
  imageProcessing?: string;
  aiVision?: VaultAIVision;
  knowledge?: VaultKnowledge;
};

type VaultDocument = {
  id: string;
  filename: string | null;
  storage_path: string;
  status: string | null;
  mime_type?: string | null;
  metadata?: VaultDocumentMetadata | null;
  created_at?: string | null;
  file_size?: number | null;
  project_id?: string | null;
  projectName?: string | null;
};

type UploadQueueStatus = "waiting" | "uploading" | "uploaded" | "failed";

type UploadQueueItem = {
  id: string;
  file: File;
  filename: string;
  mimeType: string;
  size: number;
  status: UploadQueueStatus;
  error?: string;
};

type VaultViewMode = "list" | "gallery";
type VaultAssetFilter = "all" | "images" | "documents";

const supportedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const supportedExtensions = new Set(["pdf", "docx", "txt", "csv", "png", "jpg", "jpeg", "webp"]);

const uploadInputAccept =
  ".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,image/png,image/jpeg,image/webp";

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getFileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedVaultFile(file: File) {
  const normalizedMimeType = file.type.trim().toLowerCase();
  if (normalizedMimeType && supportedMimeTypes.has(normalizedMimeType)) {
    return true;
  }

  return supportedExtensions.has(getFileExtension(file.name));
}

function getDocumentExtension(document: VaultDocument) {
  return getFileExtension(document.filename || document.storage_path);
}

function isImageDocument(document: VaultDocument) {
  const status = (document.status || "").toLowerCase();
  const mimeType = (document.mime_type || "").toLowerCase();
  const extension = getDocumentExtension(document);

  if (status === "image_asset") return true;
  if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mimeType)) return true;
  return ["png", "jpg", "jpeg", "webp"].includes(extension);
}

function getFileTypeBadge(document: VaultDocument) {
  if (isImageDocument(document)) return "Image";

  const extension = getDocumentExtension(document);
  if (extension === "pdf") return "PDF";
  if (extension === "docx") return "DOCX";
  if (extension === "txt") return "TXT";
  if (extension === "csv") return "CSV";
  return "Document";
}

function getDocumentAIVision(document: VaultDocument) {
  return document.metadata?.aiVision ?? null;
}

function getDocumentKnowledge(document: VaultDocument) {
  return document.metadata?.knowledge ?? null;
}

function getDocumentAIStatus(document: VaultDocument): "analyzed" | "failed" | "pending" | "unavailable" | null {
  if (!isImageDocument(document)) {
    return null;
  }

  const aiVision = getDocumentAIVision(document);

  if (aiVision?.status === "completed") {
    return "analyzed";
  }

  if (aiVision?.status === "failed") {
    return "failed";
  }

  if (document.metadata) {
    return "pending";
  }

  return "unavailable";
}

function getAIStatusBadge(status: "analyzed" | "failed" | "pending" | "unavailable") {
  if (status === "analyzed") {
    return {
      label: "AI analyzed",
      className: "bg-emerald-500/15 text-emerald-300",
    };
  }

  if (status === "failed") {
    return {
      label: "AI failed",
      className: "bg-red-500/15 text-red-300",
    };
  }

  if (status === "pending") {
    return {
      label: "AI pending",
      className: "bg-amber-500/15 text-amber-200",
    };
  }

  return {
    label: "AI unavailable",
    className: "bg-slate-700 text-slate-200",
  };
}

function getDocumentKnowledgeStatus(document: VaultDocument): "completed" | "failed" | "skipped" | "pending" {
  const knowledge = getDocumentKnowledge(document);

  if (knowledge?.status === "completed") {
    return "completed";
  }

  if (knowledge?.status === "failed") {
    return "failed";
  }

  if (knowledge?.status === "skipped") {
    return "skipped";
  }

  return "pending";
}

function getKnowledgeStatusBadge(status: "completed" | "failed" | "skipped" | "pending") {
  if (status === "completed") {
    return {
      label: "Knowledge extracted",
      className: "bg-emerald-500/15 text-emerald-300",
    };
  }

  if (status === "failed") {
    return {
      label: "Knowledge failed",
      className: "bg-red-500/15 text-red-300",
    };
  }

  if (status === "skipped") {
    return {
      label: "Knowledge skipped",
      className: "bg-slate-700 text-slate-200",
    };
  }

  return {
    label: "Knowledge pending",
    className: "bg-amber-500/15 text-amber-200",
  };
}

function getKnowledgePropertyDetails(document: VaultDocument) {
  const propertyDetails = getDocumentKnowledge(document)?.propertyDetails;

  if (!propertyDetails) {
    return [] as string[];
  }

  return [
    propertyDetails.titleType,
    propertyDetails.landSize,
    propertyDetails.district,
    propertyDetails.coordinates,
    propertyDetails.access,
    propertyDetails.roadFrontage,
    propertyDetails.askingPrice,
    propertyDetails.price,
    propertyDetails.usage,
    propertyDetails.restrictions,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function getKnowledgeInsightValues(knowledge: VaultKnowledge | null) {
  if (!knowledge) {
    return [] as string[];
  }

  return [
    ...(knowledge.businessInsights?.negotiations || []),
    ...(knowledge.businessInsights?.commitments || []),
    ...(knowledge.businessInsights?.deadlines || []),
    ...(knowledge.businessInsights?.followUpActions || []),
    ...(knowledge.legalInsights?.plaintiff || []),
    ...(knowledge.legalInsights?.defendant || []),
    ...(knowledge.legalInsights?.lawyers || []),
    ...(knowledge.legalInsights?.claims || []),
    ...(knowledge.legalInsights?.evidence || []),
    ...(knowledge.legalInsights?.courtDates || []),
    ...(knowledge.marketingInsights?.sellingPoints || []),
    ...(knowledge.marketingInsights?.weaknesses || []),
    ...(knowledge.marketingInsights?.buyerObjections || []),
    ...(knowledge.marketingInsights?.opportunities || []),
  ];
}

function formatKnowledgeList(items: string[] | undefined) {
  return (items || []).filter((item) => item.trim().length > 0).join("\n");
}

function hasListValues(items: string[] | undefined) {
  return Boolean(items && items.length > 0);
}

function getDocumentSearchText(document: VaultDocument) {
  const aiVision = getDocumentAIVision(document);
  const knowledge = getDocumentKnowledge(document);

  return [
    document.filename || document.storage_path,
    document.storage_path,
    document.projectName || "",
    aiVision?.aiDescription || "",
    aiVision?.detectedScene || "",
    ...(aiVision?.suggestedTags || []),
    ...(aiVision?.possibleUseCases || []),
    knowledge?.summary || "",
    ...(knowledge?.keyFacts || []),
    ...(knowledge?.people || []),
    ...(knowledge?.companies || []),
    ...(knowledge?.locations || []),
    ...getKnowledgePropertyDetails(document),
    ...(knowledge?.landInformation || []),
    ...(knowledge?.prices || []),
    ...(knowledge?.dates || []),
    ...(knowledge?.risks || []),
    ...(knowledge?.tasks || []),
    ...(knowledge?.decisions || []),
    ...(knowledge?.suggestedQuestions || []),
    ...(knowledge?.relatedProjectHints || []),
    ...(knowledge?.relatedDocumentHints || []),
    ...(knowledge?.contentIdeas || []),
    ...(knowledge?.importantNumbers || []),
    ...(knowledge?.relationships || []),
    ...getKnowledgeInsightValues(knowledge),
  ]
    .join(" ")
    .toLowerCase();
}

function hasKnowledgeDetails(knowledge: VaultKnowledge | null) {
  if (!knowledge) {
    return false;
  }

  return Boolean(
    knowledge.summary ||
      (knowledge.keyFacts && knowledge.keyFacts.length > 0) ||
      (knowledge.people && knowledge.people.length > 0) ||
      (knowledge.locations && knowledge.locations.length > 0) ||
      (knowledge.companies && knowledge.companies.length > 0) ||
      (knowledge.landInformation && knowledge.landInformation.length > 0) ||
      (knowledge.prices && knowledge.prices.length > 0) ||
      (knowledge.dates && knowledge.dates.length > 0) ||
      getKnowledgePropertyDetails({
        id: "",
        filename: null,
        storage_path: "",
        status: null,
        metadata: { knowledge },
      }).length > 0 ||
      (knowledge.risks && knowledge.risks.length > 0) ||
      (knowledge.tasks && knowledge.tasks.length > 0) ||
      (knowledge.decisions && knowledge.decisions.length > 0) ||
      (knowledge.suggestedQuestions && knowledge.suggestedQuestions.length > 0) ||
      (knowledge.relatedProjectHints && knowledge.relatedProjectHints.length > 0) ||
      (knowledge.relatedDocumentHints && knowledge.relatedDocumentHints.length > 0) ||
      (knowledge.contentIdeas && knowledge.contentIdeas.length > 0) ||
      (knowledge.importantNumbers && knowledge.importantNumbers.length > 0) ||
      (knowledge.relationships && knowledge.relationships.length > 0) ||
      getKnowledgeInsightValues(knowledge).length > 0
  );
}

function queueStatusClass(status: UploadQueueStatus) {
  if (status === "uploaded") return "bg-green-500/15 text-green-300";
  if (status === "uploading") return "bg-yellow-500/15 text-yellow-300";
  if (status === "failed") return "bg-red-500/15 text-red-300";
  return "bg-slate-700 text-slate-200";
}

export default function VaultPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [metadataColumnAvailable, setMetadataColumnAvailable] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documentProjectSelections, setDocumentProjectSelections] = useState<Record<string, string>>({});
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [analyzingDocumentId, setAnalyzingDocumentId] = useState<string | null>(null);
  const [extractingKnowledgeDocumentId, setExtractingKnowledgeDocumentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<VaultViewMode>("list");
  const [assetFilter, setAssetFilter] = useState<VaultAssetFilter>("all");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [previewDocument, setPreviewDocument] = useState<VaultDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [collapsedKnowledgeSections, setCollapsedKnowledgeSections] = useState<Record<string, boolean>>({});

  const getKnowledgeSectionStateKey = (documentId: string, sectionKey: string) => `${documentId}:${sectionKey}`;

  const isKnowledgeSectionCollapsed = (documentId: string, sectionKey: string) =>
    collapsedKnowledgeSections[getKnowledgeSectionStateKey(documentId, sectionKey)] === true;

  const toggleKnowledgeSection = (documentId: string, sectionKey: string) => {
    const stateKey = getKnowledgeSectionStateKey(documentId, sectionKey);
    setCollapsedKnowledgeSections((currentSections) => ({
      ...currentSections,
      [stateKey]: !currentSections[stateKey],
    }));
  };

  const copyKnowledgeSection = async (document: VaultDocument, label: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setNotice({
        type: "success",
        message: `Copied ${label.toLowerCase()} for ${document.filename || document.storage_path}.`,
      });
    } catch (error: any) {
      setNotice({
        type: "error",
        message: error?.message || `Failed to copy ${label.toLowerCase()}.`,
      });
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesSearch = getDocumentSearchText(document).includes(searchTerm.toLowerCase());

      if (!matchesSearch) {
        return false;
      }

      if (assetFilter === "images") {
        return isImageDocument(document);
      }

      if (assetFilter === "documents") {
        return !isImageDocument(document);
      }

      return true;
    });
  }, [documents, searchTerm, assetFilter]);

  const totalStorageUsed = documents.reduce((total, document) => total + (document.file_size || 0), 0);
  const totalStorageUsedMB = (totalStorageUsed / 1024 / 1024).toFixed(2);
  const uploadedQueueCount = uploadQueue.filter((item) => item.status === "uploaded").length;
  const failedQueueCount = uploadQueue.filter((item) => item.status === "failed").length;

  const loadFiles = async () => {
    const response = await fetch("/api/vault/documents", { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      console.error(result.error || "Failed to load vault documents.");
      return;
    }

    const nextDocuments = (result.documents ?? []) as VaultDocument[];
    setMetadataColumnAvailable(result.metadataColumnAvailable !== false);
    setDocuments(nextDocuments);
    setDocumentProjectSelections(
      Object.fromEntries(nextDocuments.map((document) => [document.id, document.project_id ?? ""]))
    );
  };

  const loadProjects = async () => {
    const response = await fetch("/api/projects", { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      console.error(result.error || "Failed to load projects.");
      return;
    }

    setProjects((result.projects ?? []) as ProjectOption[]);
  };

  const getSignedUrl = async (storagePath: string, expiresIn = 60) => {
    const { data, error } = await supabase.storage
      .from("knowledge-vault")
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message || "Failed to generate signed URL.");
    }

    return data.signedUrl;
  };

  const ensureSignedUrl = async (document: VaultDocument, expiresIn = 600) => {
    const existing = signedUrls[document.id];
    if (existing) {
      return existing;
    }

    const nextSignedUrl = await getSignedUrl(document.storage_path, expiresIn);
    setSignedUrls((currentUrls) => ({
      ...currentUrls,
      [document.id]: nextSignedUrl,
    }));

    return nextSignedUrl;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const scopeLabel = selectedProjectId
      ? projects.find((project) => project.id === selectedProjectId)?.name || "selected project"
      : "Global Vault";

    const queueItems: UploadQueueItem[] = selectedFiles.map((file, index) => {
      const supported = isSupportedVaultFile(file);

      return {
        id: `${Date.now()}-${index}-${file.name}`,
        file,
        filename: file.name,
        mimeType: file.type || `.${getFileExtension(file.name)}`,
        size: file.size,
        status: supported ? "waiting" : "failed",
        error: supported ? undefined : "Unsupported file type.",
      };
    });

    setUploadQueue(queueItems);
    setUploading(true);
    setNotice(null);

    let uploadedCount = 0;
    let failedCount = queueItems.filter((item) => item.status === "failed").length;
    const aiVisionMessages: string[] = [];
    const knowledgeMessages: string[] = [];

    for (const item of queueItems) {
      if (item.status === "failed") {
        continue;
      }

      setUploadQueue((currentQueue) =>
        currentQueue.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, status: "uploading", error: undefined }
            : currentItem
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        if (selectedProjectId.trim()) {
          formData.append("projectId", selectedProjectId.trim());
        }

        const response = await fetch("/api/vault/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          failedCount += 1;
          setUploadQueue((currentQueue) =>
            currentQueue.map((currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    status: "failed",
                    error: result.error || "Upload failed.",
                  }
                : currentItem
            )
          );
          continue;
        }

        uploadedCount += 1;
        if (typeof result.aiVisionMessage === "string" && result.aiVisionMessage.trim()) {
          aiVisionMessages.push(`${item.filename}: ${result.aiVisionMessage.trim()}`);
        }
        if (typeof result.knowledgeMessage === "string" && result.knowledgeMessage.trim()) {
          knowledgeMessages.push(`${item.filename}: ${result.knowledgeMessage.trim()}`);
        }
        setUploadQueue((currentQueue) =>
          currentQueue.map((currentItem) =>
            currentItem.id === item.id
              ? { ...currentItem, status: "uploaded", error: undefined }
              : currentItem
          )
        );
      } catch (uploadError: any) {
        failedCount += 1;
        setUploadQueue((currentQueue) =>
          currentQueue.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  status: "failed",
                  error: uploadError?.message ?? "Upload failed.",
                }
              : currentItem
          )
        );
      }
    }

    await loadFiles();

    if (failedCount === 0) {
      setNotice({
        type: "success",
        message: `Uploaded ${uploadedCount} of ${queueItems.length} files. Scope: ${scopeLabel}${
          aiVisionMessages.length > 0 ? ` AI: ${aiVisionMessages[0]}` : ""
        }${knowledgeMessages.length > 0 ? ` Knowledge: ${knowledgeMessages[0]}` : ""}`,
      });
    } else {
      setNotice({
        type: "error",
        message: `Uploaded ${uploadedCount} of ${queueItems.length} files. ${failedCount} failed. Scope: ${scopeLabel}${
          aiVisionMessages.length > 0 ? ` AI: ${aiVisionMessages[0]}` : ""
        }${knowledgeMessages.length > 0 ? ` Knowledge: ${knowledgeMessages[0]}` : ""}`,
      });
    }

    setUploading(false);
    event.target.value = "";
  };

  const deleteFile = async (documentId: string, storagePath: string) => {
    const confirmDelete = confirm("Delete this file?");

    if (!confirmDelete) return;

    const response = await fetch("/api/vault/documents", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ documentId, storagePath }),
    });

    const result = await response.json();

    if (!response.ok) {
      setNotice({ type: "error", message: result.error || "Delete failed." });
    } else {
      setNotice({ type: "success", message: "File deleted." });
      await loadFiles();
    }
  };

  const saveDocumentProject = async (document: VaultDocument) => {
    const nextProjectId = documentProjectSelections[document.id] ?? "";
    setSavingDocumentId(document.id);

    const response = await fetch("/api/vault/documents", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId: document.id,
        projectId: nextProjectId || null,
      }),
    });

    const result = await response.json();
    setSavingDocumentId(null);

    if (!response.ok) {
      setNotice({ type: "error", message: result.error || "Failed to update document project." });
      return;
    }

    const updatedDocument = result.document as VaultDocument;
    setDocuments((currentDocuments) =>
      currentDocuments.map((currentDocument) =>
        currentDocument.id === updatedDocument.id ? updatedDocument : currentDocument
      )
    );
    setDocumentProjectSelections((currentSelections) => ({
      ...currentSelections,
      [updatedDocument.id]: updatedDocument.project_id ?? "",
    }));

    setNotice({
      type: "success",
      message: `Document moved to ${updatedDocument.projectName || "Global Vault"}.`,
    });
  };

  const downloadFile = async (storagePath: string, filename: string | null) => {
    const { data, error } = await supabase.storage
      .from("knowledge-vault")
      .download(storagePath);

    if (error) {
      alert(error.message);
      return;
    }

    const url = URL.createObjectURL(data);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename || storagePath;
    link.click();

    URL.revokeObjectURL(url);
  };

  const openFile = async (storagePath: string) => {
    try {
      const signedUrl = await getSignedUrl(storagePath, 60);
      window.open(signedUrl, "_blank");
    } catch (error: any) {
      alert(error?.message || "Failed to open file.");
    }
  };

  const copyFileUrl = async (document: VaultDocument) => {
    try {
      const signedUrl = await ensureSignedUrl(document);
      await navigator.clipboard.writeText(signedUrl);
      setNotice({ type: "success", message: `Copied URL for ${document.filename || document.storage_path}` });
    } catch (error: any) {
      setNotice({ type: "error", message: error?.message || "Failed to copy URL." });
    }
  };

  const openDocumentPreview = async (document: VaultDocument) => {
    try {
      setPreviewDocument(document);

      if (isImageDocument(document)) {
        const signedUrl = await ensureSignedUrl(document);
        setPreviewUrl(signedUrl);
        return;
      }

      setPreviewUrl(null);
    } catch (error: any) {
      setNotice({ type: "error", message: error?.message || "Failed to load image preview." });
    }
  };

  const closeImagePreview = () => {
    setPreviewDocument(null);
    setPreviewUrl(null);
  };

  const mergeDocumentMetadata = (documentId: string, metadata: VaultDocumentMetadata | null) => {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => (document.id === documentId ? { ...document, metadata } : document))
    );

    setPreviewDocument((currentDocument) =>
      currentDocument && currentDocument.id === documentId
        ? { ...currentDocument, metadata }
        : currentDocument
    );
  };

  const analyzeDocumentImage = async (document: VaultDocument, force = true) => {
    setAnalyzingDocumentId(document.id);

    try {
      const response = await fetch("/api/vault/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          force,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "AI image analysis failed.");
      }

      setMetadataColumnAvailable(result.metadataColumnAvailable !== false);

      if (result.metadata) {
        mergeDocumentMetadata(document.id, result.metadata as VaultDocumentMetadata);
      }

      setNotice({
        type: result.aiVision?.status === "failed" ? "error" : "success",
        message:
          typeof result.message === "string" && result.message.trim()
            ? result.message
            : "AI image analysis completed.",
      });
    } catch (error: any) {
      setNotice({
        type: "error",
        message: error?.message || "AI image analysis failed.",
      });
    } finally {
      setAnalyzingDocumentId(null);
    }
  };

  const extractDocumentKnowledge = async (document: VaultDocument, force = true) => {
    setExtractingKnowledgeDocumentId(document.id);

    try {
      const response = await fetch("/api/vault/extract-knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: document.id,
          force,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Knowledge extraction failed.");
      }

      setMetadataColumnAvailable(result.metadataColumnAvailable !== false);

      if (result.metadata) {
        mergeDocumentMetadata(document.id, result.metadata as VaultDocumentMetadata);
      }

      setNotice({
        type: result.knowledge?.status === "failed" ? "error" : "success",
        message:
          typeof result.message === "string" && result.message.trim()
            ? result.message
            : "Knowledge extraction completed.",
      });
    } catch (error: any) {
      setNotice({
        type: "error",
        message: error?.message || "Knowledge extraction failed.",
      });
    } finally {
      setExtractingKnowledgeDocumentId(null);
    }
  };

  useEffect(() => {
    loadFiles();
    loadProjects();
  }, []);

  useEffect(() => {
    const imageDocs = documents.filter((document) => isImageDocument(document));

    for (const imageDoc of imageDocs) {
      if (!signedUrls[imageDoc.id]) {
        ensureSignedUrl(imageDoc).catch(() => {
          // Keep placeholder card when signed URL cannot be generated.
        });
      }
    }
  }, [documents]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImagePreview();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="box-border w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Knowledge Vault</h1>

        <p className="mt-1 text-sm leading-6 text-slate-400 sm:mt-2 sm:text-base sm:leading-7">
          Your private second brain. Store, organize and retrieve knowledge.
        </p>

        {notice && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {notice.message}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div className="box-border w-full max-w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 p-5 text-center sm:p-6 lg:p-10">
          <div className="mb-3 text-3xl sm:mb-4 sm:text-4xl">📄</div>

          <h3 className="text-lg font-semibold sm:text-xl">Upload Documents</h3>

          <p className="mt-1 text-sm text-slate-400 sm:mt-2 sm:text-base">Drag & drop files or click to browse</p>

          <div className="mt-5 text-left sm:mt-6">
            <label className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm">Project Scope</label>

            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={uploading}
              className="box-border w-full max-w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white sm:px-4 sm:py-3"
            >
              <option value="">No Project / Global Vault</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Leave this unset to keep the document available to global vault retrieval.
            </p>
          </div>

          <input
            type="file"
            multiple
            accept={uploadInputAccept}
            onChange={handleUpload}
            disabled={uploading}
            className="mt-5 box-border w-full max-w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border file:border-slate-600 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-slate-100 sm:mt-6"
          />
          {uploading && <p className="mt-3 text-sm text-yellow-400">Uploading...</p>}

          <p className="mt-3 break-words text-xs text-slate-500 sm:mt-4">PDF, DOCX, TXT, CSV, PNG, JPG, JPEG, WEBP</p>

          {uploadQueue.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-left sm:p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-300 sm:text-sm">
                <span className="rounded-full bg-slate-800 px-2.5 py-1">Selected: {uploadQueue.length}</span>
                <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-green-300">Uploaded: {uploadedQueueCount}</span>
                <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-red-300">Failed: {failedQueueCount}</span>
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {uploadQueue.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 max-w-full break-all text-xs text-white sm:text-sm">{item.filename}</p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${queueStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                      {(item.mimeType || "unknown").toLowerCase()} • {formatFileSize(item.size)}
                    </p>
                    {item.error ? <p className="mt-1 text-[11px] text-red-300 sm:text-xs">{item.error}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="box-border min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Vault Status</h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Documents</p>
              <p className="text-2xl font-bold text-white">{documents.length}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Storage Used</p>
              <p className="text-2xl font-bold text-yellow-400">{totalStorageUsedMB} MB</p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Status</p>
              <p className="text-green-400">Connected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white sm:mt-8 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Documents</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium sm:text-sm ${
                  viewMode === "list" ? "bg-yellow-500 text-black" : "text-slate-200 hover:text-white"
                }`}
              >
                <List size={14} />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("gallery")}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium sm:text-sm ${
                  viewMode === "gallery" ? "bg-yellow-500 text-black" : "text-slate-200 hover:text-white"
                }`}
              >
                <LayoutGrid size={14} />
                Gallery
              </button>
            </div>

            <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1">
              {(["all", "images", "documents"] as VaultAssetFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setAssetFilter(filter)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize sm:text-sm ${
                    assetFilter === filter ? "bg-yellow-500 text-black" : "text-slate-200 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="mb-4 box-border w-full max-w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 sm:px-4"
        />

        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <p className="text-sm text-slate-400">No documents uploaded yet.</p>
          ) : viewMode === "list" ? (
            filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {(() => {
                  const aiStatus = getDocumentAIStatus(document);
                  const aiBadge = aiStatus ? getAIStatusBadge(aiStatus) : null;
                  const knowledgeStatus = getDocumentKnowledgeStatus(document);
                  const knowledgeBadge = getKnowledgeStatusBadge(knowledgeStatus);

                  return (
                <div className="min-w-0 flex items-center gap-3">
                  <FileText size={18} className="shrink-0 text-yellow-400" />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-white">{document.filename || document.storage_path}</p>
                      <span className="inline-flex rounded-full bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-100">
                        {getFileTypeBadge(document)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          document.project_id ? "bg-yellow-500/15 text-yellow-300" : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {document.projectName || "Global Vault"}
                      </span>
                      {aiBadge ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${aiBadge.className}`}
                        >
                          {aiBadge.label}
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${knowledgeBadge.className}`}
                      >
                        {knowledgeBadge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      {typeof document.file_size === "number" ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : "Unknown size"}
                      {" • "}
                      {document.created_at ? new Date(document.created_at).toLocaleDateString() : "No date"}
                      {" • "}
                      {document.status || "unknown"}
                    </p>
                  </div>
                </div>
                  );
                })()}

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
                  <div className="flex items-center gap-2">
                    <select
                      value={documentProjectSelections[document.id] ?? document.project_id ?? ""}
                      onChange={(event) =>
                        setDocumentProjectSelections((currentSelections) => ({
                          ...currentSelections,
                          [document.id]: event.target.value,
                        }))
                      }
                      disabled={savingDocumentId === document.id}
                      className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Global Vault</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => saveDocumentProject(document)}
                      disabled={
                        savingDocumentId === document.id ||
                        (documentProjectSelections[document.id] ?? document.project_id ?? "") === (document.project_id ?? "")
                      }
                      className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingDocumentId === document.id ? "Saving..." : document.project_id ? "Save" : "Assign"}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openDocumentPreview(document)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-yellow-500/10 hover:text-yellow-400"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() => copyFileUrl(document)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-yellow-500/10 hover:text-yellow-400"
                    >
                      <LinkIcon size={18} />
                    </button>

                    <button
                      onClick={() => downloadFile(document.storage_path, document.filename)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-yellow-500/10 hover:text-yellow-400"
                    >
                      <Download size={18} />
                    </button>

                    <button
                      onClick={() => deleteFile(document.id, document.storage_path)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredDocuments.map((document) => {
                const isImage = isImageDocument(document);
                const thumbnail = signedUrls[document.id] || null;
                const aiVision = getDocumentAIVision(document);
                const aiStatus = getDocumentAIStatus(document);
                const aiBadge = aiStatus ? getAIStatusBadge(aiStatus) : null;
                const knowledge = getDocumentKnowledge(document);
                const knowledgeBadge = getKnowledgeStatusBadge(getDocumentKnowledgeStatus(document));
                const tagPreview = aiVision?.suggestedTags?.slice(0, 5) ?? [];

                return (
                  <div
                    key={document.id}
                    className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800"
                  >
                    <div className="relative h-36 w-full border-b border-slate-700 bg-slate-900">
                      {isImage && thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={document.filename || "Image asset"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          {isImage ? <ImageIcon size={28} /> : <FileText size={28} />}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <p className="break-all text-sm font-medium text-white">{document.filename || document.storage_path}</p>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-100">
                          {getFileTypeBadge(document)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            document.status === "image_asset"
                              ? "bg-cyan-500/15 text-cyan-300"
                              : "bg-green-500/15 text-green-300"
                          }`}
                        >
                          {document.status || "unknown"}
                        </span>
                        {aiBadge ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${aiBadge.className}`}
                          >
                            {aiBadge.label}
                          </span>
                        ) : null}
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${knowledgeBadge.className}`}
                        >
                          {knowledgeBadge.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">{document.projectName || "Global Vault"}</p>
                      <p className="text-xs text-slate-500">
                        {document.created_at ? new Date(document.created_at).toLocaleDateString() : "No date"}
                      </p>

                      {tagPreview.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tagPreview.map((tag) => (
                            <span
                              key={`${document.id}-${tag}`}
                              className="inline-flex rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {knowledge?.summary ? (
                        <p className="line-clamp-3 text-xs leading-5 text-slate-300">{knowledge.summary}</p>
                      ) : null}

                      {!aiVision && isImage ? (
                        <p className="text-xs text-slate-500">
                          {metadataColumnAvailable
                            ? "AI analysis pending/unavailable."
                            : "AI analysis unavailable in this environment."}
                        </p>
                      ) : null}

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openDocumentPreview(document)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2.5 py-1.5 text-xs text-slate-200 hover:text-white"
                        >
                          <Eye size={13} />
                          View
                        </button>

                        <button
                          onClick={() => copyFileUrl(document)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2.5 py-1.5 text-xs text-slate-200 hover:text-white"
                        >
                          <LinkIcon size={13} />
                          Copy URL
                        </button>

                        <button
                          onClick={() => deleteFile(document.id, document.storage_path)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2.5 py-1.5 text-xs text-red-300 hover:text-red-200"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {previewDocument ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {previewDocument.filename || previewDocument.storage_path}
                </p>
                <p className="text-xs text-slate-400">
                  {previewDocument.projectName || "Global Vault"} • {previewDocument.status || "unknown"}
                </p>
              </div>
              <button
                onClick={closeImagePreview}
                className="rounded-md p-1 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-slate-950 p-3">
              {isImageDocument(previewDocument) && previewUrl ? (
                <img
                  src={previewUrl}
                  alt={previewDocument.filename || "Image preview"}
                  className="mx-auto h-auto max-h-[70vh] w-auto max-w-full rounded-lg"
                />
              ) : (
                <div className="mx-auto flex max-w-3xl items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 text-left">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {previewDocument.filename || previewDocument.storage_path}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {getFileTypeBadge(previewDocument)} • {previewDocument.projectName || "Global Vault"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openFile(previewDocument.storage_path)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    Open File
                  </button>
                </div>
              )}

              {isImageDocument(previewDocument) ? (
                <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-4 text-left">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">AI Image Analysis</h3>
                    <button
                      type="button"
                      onClick={() => analyzeDocumentImage(previewDocument, true)}
                      disabled={analyzingDocumentId === previewDocument.id}
                      className="rounded-lg border border-yellow-500/50 px-3 py-1.5 text-xs font-medium text-yellow-200 transition hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {analyzingDocumentId === previewDocument.id ? "Analyzing..." : "Analyze Image"}
                    </button>
                  </div>

                  {(() => {
                    const aiVision = getDocumentAIVision(previewDocument);

                    if (!aiVision) {
                      return (
                        <p className="text-sm text-slate-400">
                          {metadataColumnAvailable
                            ? "AI analysis pending/unavailable."
                            : "AI analysis unavailable because documents.metadata does not exist in this environment."}
                        </p>
                      );
                    }

                    if (aiVision.status === "failed") {
                      return (
                        <div className="space-y-2">
                          <span className="inline-flex rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300">
                            AI failed
                          </span>
                          <p className="text-sm text-red-300">
                            AI analysis failed safely. {aiVision.error || "No additional error details."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3 text-sm text-slate-200">
                        <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                          AI analyzed
                        </span>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Description</p>
                          <p className="mt-1 text-sm leading-6 text-slate-200">
                            {aiVision.aiDescription || "No description available."}
                          </p>
                        </div>

                        {aiVision.detectedScene ? (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Detected Scene</p>
                            <p className="mt-1 text-sm text-slate-200">{aiVision.detectedScene}</p>
                          </div>
                        ) : null}

                        {aiVision.suggestedTags && aiVision.suggestedTags.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tags</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {aiVision.suggestedTags.map((tag) => (
                                <span
                                  key={`${previewDocument.id}-${tag}`}
                                  className="inline-flex rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {aiVision.possibleUseCases && aiVision.possibleUseCases.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Possible Use Cases</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {aiVision.possibleUseCases.map((useCase) => (
                                <span
                                  key={`${previewDocument.id}-${useCase}`}
                                  className="inline-flex rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200"
                                >
                                  {useCase}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {aiVision.confidenceNotes ? (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Confidence Notes</p>
                            <p className="mt-1 text-sm text-slate-300">{aiVision.confidenceNotes}</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              <div className="mx-auto mt-4 max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-4 text-left">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Structured Knowledge</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Extracted summary, facts, entities, risks, and follow-up questions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => extractDocumentKnowledge(previewDocument, true)}
                    disabled={extractingKnowledgeDocumentId === previewDocument.id}
                    className="rounded-lg border border-cyan-500/50 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {extractingKnowledgeDocumentId === previewDocument.id ? "Extracting..." : "Extract Knowledge"}
                  </button>
                </div>

                {(() => {
                  const knowledge = getDocumentKnowledge(previewDocument);
                  const knowledgeStatus = getDocumentKnowledgeStatus(previewDocument);
                  const knowledgeBadge = getKnowledgeStatusBadge(knowledgeStatus);
                  const propertyEntries = Object.entries(knowledge?.propertyDetails || {}).filter(
                    ([, value]) => typeof value === "string" && value.trim().length > 0
                  );

                  if (!knowledge) {
                    return (
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${knowledgeBadge.className}`}
                        >
                          {knowledgeBadge.label}
                        </span>
                        <p className="text-sm text-slate-400">
                          {metadataColumnAvailable
                            ? "Knowledge extraction is pending or has not been run yet."
                            : "Knowledge extraction is unavailable because documents.metadata does not exist in this environment."}
                        </p>
                      </div>
                    );
                  }

                  if (knowledge.status === "failed") {
                    return (
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${knowledgeBadge.className}`}
                        >
                          {knowledgeBadge.label}
                        </span>
                        <p className="text-sm text-red-300">
                          {knowledge.error || knowledge.summary || "Knowledge extraction failed safely."}
                        </p>
                      </div>
                    );
                  }

                  if (knowledge.status === "skipped") {
                    return (
                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${knowledgeBadge.className}`}
                        >
                          {knowledgeBadge.label}
                        </span>
                        <p className="text-sm text-slate-300">
                          {knowledge.summary || "Knowledge extraction was skipped because there was no usable content."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 text-sm text-slate-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${knowledgeBadge.className}`}
                        >
                          {knowledgeBadge.label}
                        </span>
                        {knowledge.extractedAt ? (
                          <span className="text-xs text-slate-400">
                            {new Date(knowledge.extractedAt).toLocaleString()}
                          </span>
                        ) : null}
                        {knowledge.version ? <span className="text-xs text-slate-500">{knowledge.version}</span> : null}
                        {typeof knowledge.confidenceScore === "number" ? (
                          <span className="text-xs text-slate-500">
                            Confidence {Math.round(knowledge.confidenceScore * 100)}%
                          </span>
                        ) : null}
                      </div>

                      {knowledge.summary ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/40">
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleKnowledgeSection(previewDocument.id, "summary")}
                              className="flex items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400"
                            >
                              {isKnowledgeSectionCollapsed(previewDocument.id, "summary") ? (
                                <ChevronRight size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              Summary
                            </button>
                            <button
                              type="button"
                              onClick={() => copyKnowledgeSection(previewDocument, "Summary", knowledge.summary || "")}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                            >
                              <Copy size={12} />
                              Copy
                            </button>
                          </div>
                          {!isKnowledgeSectionCollapsed(previewDocument.id, "summary") ? (
                            <div className="border-t border-slate-800 px-3 py-3">
                              <p className="text-sm leading-6 text-slate-200">{knowledge.summary}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {knowledge.keyFacts && knowledge.keyFacts.length > 0 ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/40">
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleKnowledgeSection(previewDocument.id, "keyFacts")}
                              className="flex items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400"
                            >
                              {isKnowledgeSectionCollapsed(previewDocument.id, "keyFacts") ? (
                                <ChevronRight size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              Key Facts
                            </button>
                            <button
                              type="button"
                              onClick={() => copyKnowledgeSection(previewDocument, "Key Facts", formatKnowledgeList(knowledge.keyFacts))}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                            >
                              <Copy size={12} />
                              Copy
                            </button>
                          </div>
                          {!isKnowledgeSectionCollapsed(previewDocument.id, "keyFacts") ? (
                            <div className="border-t border-slate-800 px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                {knowledge.keyFacts.map((fact) => (
                                  <span
                                    key={`${previewDocument.id}-${fact}`}
                                    className="inline-flex rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-200"
                                  >
                                    {fact}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {hasListValues(knowledge.people) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">People</p>
                          <p className="mt-1 text-sm text-slate-200">{knowledge.people?.join(", ")}</p>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.locations) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Locations</p>
                          <p className="mt-1 text-sm text-slate-200">{knowledge.locations?.join(", ")}</p>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.companies) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Companies</p>
                          <p className="mt-1 text-sm text-slate-200">{knowledge.companies?.join(", ")}</p>
                        </div>
                      ) : null}

                      {propertyEntries.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Property Details</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {propertyEntries.map(([key, value]) => (
                              <div key={`${previewDocument.id}-${key}`} className="rounded-lg bg-slate-950/70 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500">{key}</p>
                                <p className="mt-1 text-sm text-slate-200">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.landInformation) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Land Information</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {knowledge.landInformation?.map((item) => (
                              <li key={`${previewDocument.id}-${item}`}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.prices) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Prices</p>
                          <p className="mt-1 text-sm text-slate-200">{knowledge.prices?.join(", ")}</p>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.importantNumbers) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Important Numbers</p>
                          <p className="mt-1 text-sm text-slate-200">{knowledge.importantNumbers?.join(", ")}</p>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.relationships) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Relationships</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {knowledge.relationships?.map((relationship) => (
                              <li key={`${previewDocument.id}-${relationship}`}>• {relationship}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.risks) ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/40">
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleKnowledgeSection(previewDocument.id, "risks")}
                              className="flex items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400"
                            >
                              {isKnowledgeSectionCollapsed(previewDocument.id, "risks") ? (
                                <ChevronRight size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              Risks
                            </button>
                            <button
                              type="button"
                              onClick={() => copyKnowledgeSection(previewDocument, "Risks", formatKnowledgeList(knowledge.risks))}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                            >
                              <Copy size={12} />
                              Copy
                            </button>
                          </div>
                          {!isKnowledgeSectionCollapsed(previewDocument.id, "risks") ? (
                            <div className="border-t border-slate-800 px-3 py-3">
                              <ul className="space-y-1 text-sm text-slate-200">
                                {knowledge.risks?.map((risk) => (
                                  <li key={`${previewDocument.id}-${risk}`}>• {risk}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {hasListValues(knowledge.tasks) ? (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/40">
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleKnowledgeSection(previewDocument.id, "tasks")}
                              className="flex items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-slate-400"
                            >
                              {isKnowledgeSectionCollapsed(previewDocument.id, "tasks") ? (
                                <ChevronRight size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                              Tasks
                            </button>
                            <button
                              type="button"
                              onClick={() => copyKnowledgeSection(previewDocument, "Tasks", formatKnowledgeList(knowledge.tasks))}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                            >
                              <Copy size={12} />
                              Copy
                            </button>
                          </div>
                          {!isKnowledgeSectionCollapsed(previewDocument.id, "tasks") ? (
                            <div className="border-t border-slate-800 px-3 py-3">
                              <ul className="space-y-1 text-sm text-slate-200">
                                {knowledge.tasks?.map((task) => (
                                  <li key={`${previewDocument.id}-${task}`}>• {task}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {hasListValues(knowledge.decisions) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Decisions</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {knowledge.decisions?.map((decision) => (
                              <li key={`${previewDocument.id}-${decision}`}>• {decision}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.dates) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Dates</p>
                          <p className="mt-1 text-sm text-slate-200">{knowledge.dates?.join(", ")}</p>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.relatedProjectHints) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Project Hints</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {knowledge.relatedProjectHints?.map((hint) => (
                              <li key={`${previewDocument.id}-${hint}`}>• {hint}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.relatedDocumentHints) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Related Document Hints</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {knowledge.relatedDocumentHints?.map((hint) => (
                              <li key={`${previewDocument.id}-${hint}`}>• {hint}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.suggestedQuestions) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Suggested Questions</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {knowledge.suggestedQuestions?.map((question) => (
                              <li key={`${previewDocument.id}-${question}`}>• {question}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {hasListValues(knowledge.contentIdeas) ? (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Content Ideas</p>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {knowledge.contentIdeas?.map((idea) => (
                              <li key={`${previewDocument.id}-${idea}`}>• {idea}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {getKnowledgeInsightValues(knowledge).length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                          {hasListValues(knowledge.businessInsights?.negotiations) ||
                          hasListValues(knowledge.businessInsights?.commitments) ||
                          hasListValues(knowledge.businessInsights?.deadlines) ||
                          hasListValues(knowledge.businessInsights?.followUpActions) ? (
                            <div className="rounded-lg bg-slate-950/70 px-3 py-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Business</p>
                              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                                {(knowledge.businessInsights?.negotiations || []).map((item) => (
                                  <li key={`${previewDocument.id}-negotiation-${item}`}>Negotiation: {item}</li>
                                ))}
                                {(knowledge.businessInsights?.commitments || []).map((item) => (
                                  <li key={`${previewDocument.id}-commitment-${item}`}>Commitment: {item}</li>
                                ))}
                                {(knowledge.businessInsights?.deadlines || []).map((item) => (
                                  <li key={`${previewDocument.id}-deadline-${item}`}>Deadline: {item}</li>
                                ))}
                                {(knowledge.businessInsights?.followUpActions || []).map((item) => (
                                  <li key={`${previewDocument.id}-followup-${item}`}>Follow-up: {item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {hasListValues(knowledge.legalInsights?.plaintiff) ||
                          hasListValues(knowledge.legalInsights?.defendant) ||
                          hasListValues(knowledge.legalInsights?.lawyers) ||
                          hasListValues(knowledge.legalInsights?.claims) ||
                          hasListValues(knowledge.legalInsights?.evidence) ||
                          hasListValues(knowledge.legalInsights?.courtDates) ? (
                            <div className="rounded-lg bg-slate-950/70 px-3 py-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Legal</p>
                              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                                {(knowledge.legalInsights?.plaintiff || []).map((item) => (
                                  <li key={`${previewDocument.id}-plaintiff-${item}`}>Plaintiff: {item}</li>
                                ))}
                                {(knowledge.legalInsights?.defendant || []).map((item) => (
                                  <li key={`${previewDocument.id}-defendant-${item}`}>Defendant: {item}</li>
                                ))}
                                {(knowledge.legalInsights?.lawyers || []).map((item) => (
                                  <li key={`${previewDocument.id}-lawyer-${item}`}>Lawyer: {item}</li>
                                ))}
                                {(knowledge.legalInsights?.claims || []).map((item) => (
                                  <li key={`${previewDocument.id}-claim-${item}`}>Claim: {item}</li>
                                ))}
                                {(knowledge.legalInsights?.evidence || []).map((item) => (
                                  <li key={`${previewDocument.id}-evidence-${item}`}>Evidence: {item}</li>
                                ))}
                                {(knowledge.legalInsights?.courtDates || []).map((item) => (
                                  <li key={`${previewDocument.id}-court-${item}`}>Court date: {item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {hasListValues(knowledge.marketingInsights?.sellingPoints) ||
                          hasListValues(knowledge.marketingInsights?.weaknesses) ||
                          hasListValues(knowledge.marketingInsights?.buyerObjections) ||
                          hasListValues(knowledge.marketingInsights?.opportunities) ? (
                            <div className="rounded-lg bg-slate-950/70 px-3 py-3">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Marketing</p>
                              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                                {(knowledge.marketingInsights?.sellingPoints || []).map((item) => (
                                  <li key={`${previewDocument.id}-selling-${item}`}>Selling point: {item}</li>
                                ))}
                                {(knowledge.marketingInsights?.weaknesses || []).map((item) => (
                                  <li key={`${previewDocument.id}-weakness-${item}`}>Weakness: {item}</li>
                                ))}
                                {(knowledge.marketingInsights?.buyerObjections || []).map((item) => (
                                  <li key={`${previewDocument.id}-objection-${item}`}>Objection: {item}</li>
                                ))}
                                {(knowledge.marketingInsights?.opportunities || []).map((item) => (
                                  <li key={`${previewDocument.id}-opportunity-${item}`}>Opportunity: {item}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {!hasKnowledgeDetails(knowledge) ? (
                        <p className="text-sm text-slate-400">No compact knowledge details are available yet.</p>
                      ) : null}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
