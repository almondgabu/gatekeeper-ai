"use client";

import { Trash2, FileText, Download } from "lucide-react";
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

export default function VaultPage() {

  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
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
  const handleUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (selectedProjectId.trim()) {
      formData.append("projectId", selectedProjectId.trim());
    }

    const response = await fetch("/api/vault/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Upload failed.");
    } else {
      const scopeLabel = selectedProjectId
        ? projects.find((project) => project.id === selectedProjectId)?.name || "selected project"
        : "Global Vault";
      alert(`Upload successful! Scope: ${scopeLabel}`);
      await loadFiles();
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
    alert(result.error || "Delete failed.");
  } else {
    alert("File deleted.");
    await loadFiles();
  }
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

useEffect(() => {
  loadFiles();
  loadProjects();
}, []);
  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Knowledge Vault
        </h1>

        <p className="text-slate-400 mt-2">
          Your private second brain. Store, organize and retrieve knowledge.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Upload */}
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center">
  <div className="text-5xl mb-4">📄</div>

  <h3 className="text-xl font-semibold">
    Upload Documents
  </h3>

  <p className="text-slate-400 mt-2">
    Drag & drop files or click to browse
  </p>

  <div className="mt-6 text-left">
    <label className="mb-2 block text-sm font-medium text-slate-300">
      Project Scope
    </label>

    <select
      value={selectedProjectId}
      onChange={(e) => setSelectedProjectId(e.target.value)}
      disabled={uploading}
      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
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
  onChange={handleUpload}
  disabled={uploading}
  className="mt-6"
/>
{uploading && (
  <p className="mt-3 text-yellow-400">
    Uploading...
  </p>
)}


  <p className="text-xs text-slate-500 mt-4">
    PDF, DOCX, TXT, CSV
  </p>
</div>

        {/* Stats */}
        <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900">
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

      <div className="mt-8 border border-slate-800 rounded-2xl p-6 bg-slate-900 text-white">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Recent Documents
        </h2>
        <input
  type="text"
  placeholder="Search documents..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="w-full mb-4 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400"
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

<div className="flex items-center gap-2">
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
  ))
)}

        </div>
      </div>
    </div>
  );
}