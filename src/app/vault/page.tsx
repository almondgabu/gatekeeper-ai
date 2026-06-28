"use client";

import { Trash2, FileText, Download, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type ProjectOption = {
  id: string;
  name: string;
};

type VaultDocument = {
  id: string;
  filename: string | null;
  storage_path: string;
  status: string | null;
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

const supportedExtensions = new Set([
  "pdf",
  "docx",
  "txt",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "webp",
]);

const uploadInputAccept = ".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,image/png,image/jpeg,image/webp";

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedVaultFile(file: File) {
  const normalizedMimeType = file.type.trim().toLowerCase();
  if (normalizedMimeType && supportedMimeTypes.has(normalizedMimeType)) {
    return true;
  }

  return supportedExtensions.has(getFileExtension(file.name));
}

export default function VaultPage() {

  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [documentProjectSelections, setDocumentProjectSelections] = useState<Record<string, string>>({});
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const filteredDocuments = documents.filter((document) =>
  (document.filename || document.storage_path).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalStorageUsed = documents.reduce((total, document) => {
  return total + (document.file_size || 0);
}, 0);

const totalStorageUsedMB = (totalStorageUsed / 1024 / 1024).toFixed(2);
  const loadFiles = async () => {
  const response = await fetch("/api/vault/documents", { cache: "no-store" });
  const result = await response.json();

  if (!response.ok) {
    console.error(result.error || "Failed to load vault documents.");
    return;
  }

  setDocuments((result.documents ?? []) as VaultDocument[]);
  setDocumentProjectSelections(
    Object.fromEntries(
      ((result.documents ?? []) as VaultDocument[]).map((document) => [document.id, document.project_id ?? ""])
    )
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
      setNotice({ type: "success", message: `Uploaded ${uploadedCount} of ${queueItems.length} files. Scope: ${scopeLabel}` });
    } else {
      setNotice({ type: "error", message: `Uploaded ${uploadedCount} of ${queueItems.length} files. ${failedCount} failed. Scope: ${scopeLabel}` });
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
  const { data, error } = await supabase.storage
    .from("knowledge-vault")
    .createSignedUrl(storagePath, 60);

  if (error) {
    alert(error.message);
    return;
  }

  window.open(data.signedUrl, "_blank");
};

useEffect(() => {
  loadFiles();
  loadProjects();
}, []);

  const uploadedQueueCount = uploadQueue.filter((item) => item.status === "uploaded").length;
  const failedQueueCount = uploadQueue.filter((item) => item.status === "failed").length;

  function queueStatusClass(status: UploadQueueStatus) {
    if (status === "uploaded") return "bg-green-500/15 text-green-300";
    if (status === "uploading") return "bg-yellow-500/15 text-yellow-300";
    if (status === "failed") return "bg-red-500/15 text-red-300";
    return "bg-slate-700 text-slate-200";
  }

  return (
    <div className="box-border w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Knowledge Vault
        </h1>

        <p className="mt-1 text-sm leading-6 text-slate-400 sm:mt-2 sm:text-base sm:leading-7">
          Your private second brain. Store, organize and retrieve knowledge.
        </p>

        {notice && (
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>
            {notice.message}
          </div>
        )}
      </div>

      {/* TODO: ChatGPT share import disabled because shared pages may require login and may not expose transcript content. */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">

        {/* Upload */}
        <div className="box-border w-full max-w-full overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 p-5 text-center sm:p-6 lg:p-10">
  <div className="mb-3 text-3xl sm:mb-4 sm:text-4xl">📄</div>

  <h3 className="text-lg font-semibold sm:text-xl">
    Upload Documents
  </h3>

  <p className="mt-1 text-sm text-slate-400 sm:mt-2 sm:text-base">
    Drag & drop files or click to browse
  </p>

  <div className="mt-5 text-left sm:mt-6">
    <label className="mb-2 block text-xs font-medium text-slate-300 sm:text-sm">
      Project Scope
    </label>

    <select
      value={selectedProjectId}
      onChange={(e) => setSelectedProjectId(e.target.value)}
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
{uploading && (
  <p className="mt-3 text-sm text-yellow-400">
    Uploading...
  </p>
)}


  <p className="mt-3 break-words text-xs text-slate-500 sm:mt-4">
    PDF, DOCX, TXT, CSV, PNG, JPG, JPEG, WEBP
  </p>

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
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${queueStatusClass(item.status)}`}>
                {item.status}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              {(item.mimeType || "unknown").toLowerCase()} • {formatFileSize(item.size)}
            </p>
            {item.error ? (
              <p className="mt-1 text-[11px] text-red-300 sm:text-xs">{item.error}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )}
</div>

        {/* Stats */}
        <div className="box-border min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">
            Vault Status
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-slate-400 text-sm">
                Documents
              </p>
              <p className="text-2xl font-bold text-white">
  {documents.length}
</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">
                Storage Used
              </p>
              <p className="text-2xl font-bold text-yellow-400">
                {totalStorageUsedMB} MB
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-sm">
                Status
              </p>
              <p className="text-green-400">
                Connected
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Files */}

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-white sm:mt-8 sm:p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Recent Documents
        </h2>
        <input
  type="text"
  placeholder="Search documents..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="mb-4 box-border w-full max-w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 sm:px-4"
/>

        <div className="space-y-3">

          {documents.length === 0 ? (
  <p className="text-slate-400 text-sm">
    No documents uploaded yet.
  </p>
) : (
  filteredDocuments.map((document) => (
    <div
  key={document.id}
  className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
>
  <div className="flex items-center gap-3 min-w-0">
    <FileText
      size={18}
      className="text-yellow-400 shrink-0"
    />

    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-white">
          {document.filename || document.storage_path}
        </p>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${document.project_id ? "bg-yellow-500/15 text-yellow-300" : "bg-slate-700 text-slate-200"}`}>
          {document.projectName || "Global Vault"}
        </span>
      </div>

      <p className="text-xs text-slate-400">
  {typeof document.file_size === "number"
    ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB`
    : "Unknown size"}
  {" • "}
  {document.created_at
    ? new Date(document.created_at).toLocaleDateString()
    : "No date"}
  {" • "}
  {document.status || "unknown"}
</p>
    </div>
  </div>

<div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
  <div className="flex items-center gap-2">
    <select
      value={documentProjectSelections[document.id] ?? document.project_id ?? ""}
      onChange={(e) =>
        setDocumentProjectSelections((currentSelections) => ({
          ...currentSelections,
          [document.id]: e.target.value,
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
      disabled={savingDocumentId === document.id || (documentProjectSelections[document.id] ?? document.project_id ?? "") === (document.project_id ?? "")}
      className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {savingDocumentId === document.id ? "Saving..." : document.project_id ? "Save" : "Assign"}
    </button>
  </div>

  <div className="flex items-center justify-end gap-2">
    <button
      onClick={() => openFile(document.storage_path)}
      className="p-2 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition"
    >
      <Eye size={18} />
    </button>

    <button
      onClick={() => downloadFile(document.storage_path, document.filename)}
      className="p-2 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition"
    >
      <Download size={18} />
    </button>

    <button
      onClick={() => deleteFile(document.id, document.storage_path)}
      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
    >
      <Trash2 size={18} />
    </button>
  </div>
</div>
</div>
  ))
)}

        </div>
      </div>
    </div>
  );
}