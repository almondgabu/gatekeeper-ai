"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderOpen,
  MessageSquare,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProjectRecord = {
  id: string;
  name: string;
  created_at?: string;
  documentCount: number;
};

type ProjectDocument = {
  id: string;
  filename: string | null;
  storage_path: string;
  status: string | null;
  created_at?: string | null;
  file_size?: number | null;
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const projectId = id.trim();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  async function loadProject() {
    if (!projectId) {
      setLoadingProject(false);
      return;
    }

    const response = await fetch(`/api/projects?id=${projectId}&includeDocuments=1`, {
      cache: "no-store",
    });
    const result = await response.json();
    setLoadingProject(false);
    setLoadingDocuments(false);

    if (!response.ok) {
      console.error(result.error || "failed to load project");
      return;
    }

    setProject(result.project as ProjectRecord);
    setDocuments((result.documents ?? []) as ProjectDocument[]);
  }

  useEffect(() => {
    setLoadingDocuments(true);
    loadProject();
  }, [projectId]);

  async function handleProjectUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !project?.id) {
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", String(project.id));

    const response = await fetch("/api/vault/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    setUploading(false);
    event.target.value = "";

    if (!response.ok) {
      alert(result.error || "Upload failed.");
      return;
    }

    alert(result.indexed === false ? "Upload complete. Indexing still needs attention." : "Upload successful!");
    await loadProject();
  }

  async function unassignDocument(documentId: string) {
    const confirmed = confirm("Remove this document from the project?");

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("documents")
      .update({ project_id: null })
      .eq("id", documentId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProject();
  }

  async function openFile(storagePath: string) {
    const { data, error } = await supabase.storage
      .from("knowledge-vault")
      .createSignedUrl(storagePath, 60);

    if (error) {
      alert(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function downloadFile(storagePath: string, filename: string | null) {
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
  }

  function openProjectChat(startNew = false) {
    const suffix = startNew ? "?new=1" : "";
    router.push(`/projects/${id}/chat${suffix}`);
  }

  const latestDocument = documents[0];

  return (
    <div className="min-h-screen w-full p-8 text-white md:p-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 text-sm text-yellow-400">Project Workspace</p>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold md:text-4xl">{project?.name || (loadingProject ? "Loading project..." : `Project #${id}`)}</h1>
            <Star size={22} className="text-slate-500" />
          </div>

          <p className="mt-3 max-w-2xl text-slate-400">
            Manage project-specific documents and open a project-scoped chat that only retrieves knowledge from this project.
          </p>
        </div>

        <button
          onClick={() => openProjectChat(true)}
          className="flex items-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!project}
        >
          <Sparkles size={18} />
          Ask Project AI
        </button>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 border-b border-slate-800 pb-4">
        <button className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300">
          Files
        </button>
        <button
          onClick={() => openProjectChat(false)}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-yellow-500/40 hover:text-white"
        >
          Chat
        </button>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <StatCard
          icon={<FileText size={28} />}
          color="yellow"
          title="Documents"
          value={project?.documentCount ?? documents.length}
          desc="Files assigned to this project"
        />
        <StatCard
          icon={<MessageSquare size={28} />}
          color="purple"
          title="Conversations"
          value="Project"
          desc="Project-scoped retrieval available"
        />
        <StatCard
          icon={<Brain size={28} />}
          color="green"
          title="Knowledge Scope"
          value={project ? "Scoped" : "Pending"}
          desc="Retrieval filtered by project"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,4fr)_320px]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="text-yellow-400" size={24} />
              <div>
                <h2 className="text-2xl font-semibold">Project Files</h2>
                <p className="text-sm text-slate-400">
                  Only documents with this project&apos;s `project_id` appear here.
                </p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400">
              <Upload size={18} />
              Upload to Project
              <input
                type="file"
                className="hidden"
                onChange={handleProjectUpload}
                disabled={uploading || !project}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-700 p-6 md:p-8">
            {uploading ? (
              <p className="text-sm text-yellow-400">Uploading and indexing document...</p>
            ) : loadingDocuments || loadingProject ? (
              <p className="text-sm text-slate-400">Loading project documents...</p>
            ) : documents.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-500/10">
                  <FileText className="text-yellow-400" size={40} />
                </div>

                <h3 className="text-xl font-semibold">No project files yet</h3>
                <p className="mt-3 max-w-lg text-slate-400">
                  Upload documents from this project workspace to keep retrieval isolated from the rest of the Knowledge Vault.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="shrink-0 text-yellow-400" />
                        <span className="truncate font-medium text-white">
                          {document.filename || document.storage_path}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        Status: {document.status || "unknown"}
                        {document.created_at ? ` • ${new Date(document.created_at).toLocaleDateString()}` : ""}
                        {typeof document.file_size === "number" ? ` • ${(document.file_size / 1024 / 1024).toFixed(2)} MB` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openFile(document.storage_path)}
                        className="rounded-lg bg-slate-800 p-2 transition hover:bg-slate-700"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => downloadFile(document.storage_path, document.filename)}
                        className="rounded-lg bg-slate-800 p-2 transition hover:bg-slate-700"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>

                      <button
                        onClick={() => unassignDocument(document.id)}
                        className="rounded-lg bg-red-600 p-2 transition hover:bg-red-500"
                        title="Remove from project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <SideCard
            icon={<MessageSquare size={22} />}
            color="purple"
            title="Project Chat"
            desc="Open a chat session that only retrieves this project&apos;s documents."
            button="Open Chat"
            onClick={() => openProjectChat(false)}
            disabled={!project}
          />

          <SideCard
            icon={<Brain size={22} />}
            color="green"
            title="Retrieval Scope"
            desc="Knowledge Vault retrieval now filters by `documents.project_id` when project context exists."
            button="Start New Chat"
            onClick={() => openProjectChat(true)}
            disabled={!project}
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
            {latestDocument ? (
              <>
                <p className="text-sm text-slate-300">Latest file: {latestDocument.filename || latestDocument.storage_path}</p>
                <p className="mt-2 text-sm text-slate-500">Status: {latestDocument.status || "unknown"}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-300">Project workspace ready</p>
                <p className="mt-2 text-sm text-slate-500">Upload a document to start project-aware retrieval.</p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, desc, color }: any) {
  const colors: Record<string, string> = {
    yellow: "bg-yellow-500/10 text-yellow-400",
    purple: "bg-purple-500/10 text-purple-400",
    green: "bg-green-500/10 text-green-400",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors[color]}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold md:text-4xl">{value}</p>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>

      <ChevronRight className="text-slate-500" />
    </div>
  );
}

function SideCard({ icon, title, desc, button, color, onClick, disabled }: any) {
  const colors: Record<string, string> = {
    purple: "text-purple-400",
    green: "text-green-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-3 flex items-center gap-3">
        <div className={colors[color]}>{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <p className="mb-5 text-sm text-slate-400">{desc}</p>

      <button
        onClick={onClick}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700 px-4 py-3 text-slate-200 hover:border-yellow-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {button}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}