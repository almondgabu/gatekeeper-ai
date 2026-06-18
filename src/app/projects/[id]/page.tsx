"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  Brain,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderOpen,
  MessageSquare,
  Star,
  Trash2,
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

type ProjectConversation = {
  id: number;
  title: string;
  created_at: string;
  project_id?: string | null;
  messageCount?: number;
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = id.trim();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [conversations, setConversations] = useState<ProjectConversation[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
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

  async function loadConversations() {
    if (!projectId) {
      setLoadingConversations(false);
      return;
    }

    const response = await fetch(`/api/conversations?projectId=${projectId}`, {
      cache: "no-store",
    });
    const result = await response.json();
    setLoadingConversations(false);

    if (!response.ok) {
      console.error(result.error || "failed to load conversations");
      return;
    }

    setConversations((result ?? []) as ProjectConversation[]);
  }

  useEffect(() => {
    setLoadingDocuments(true);
    setLoadingConversations(true);
    loadProject();
    loadConversations();
  }, [projectId]);

  async function unassignDocument(documentId: string) {
    const confirmed = confirm("Remove this document from the project?");

    if (!confirmed) {
      return;
    }

    const response = await fetch("/api/vault/documents", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId,
        projectId: null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to remove document from project.");
      return;
    }

    await loadProject();
    await loadConversations();
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

  const latestDocument = documents[0];
  const documentCount = project?.documentCount ?? documents.length;

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
            View every document linked to this project and open a project-scoped chat that retrieves only from this workspace.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/projects/${projectId}/chat`}
            className={`flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400 ${!project ? "pointer-events-none opacity-60" : ""}`}
            aria-disabled={!project}
          >
            <MessageSquare size={18} />
            Chat With Project
          </Link>

          <Link
            href={`/vault?projectId=${encodeURIComponent(projectId)}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
          >
            <FileText size={18} />
            Upload Document
          </Link>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 border-b border-slate-800 pb-4">
        <button className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300">
          Files
        </button>
        <Link
          href={`/projects/${projectId}/chat`}
          className={`rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-yellow-500/40 hover:text-white ${!project ? "pointer-events-none opacity-60" : ""}`}
          aria-disabled={!project}
        >
          Chat
        </Link>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <StatCard
          icon={<FileText size={28} />}
          color="yellow"
          title="Documents"
          value={documentCount}
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
        <div className="space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="text-yellow-400" size={24} />
              <div>
                <h2 className="text-2xl font-semibold">Documents</h2>
                <p className="text-sm text-slate-400">
                  Only documents with this project&apos;s `project_id` appear here.
                </p>
              </div>
            </div>

            <div className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200">
              Document Count: {documentCount}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-700 p-6 md:p-8">
            {loadingDocuments || loadingProject ? (
              <p className="text-sm text-slate-400">Loading project documents...</p>
            ) : documents.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-500/10">
                  <FileText className="text-yellow-400" size={40} />
                </div>

                <h3 className="text-xl font-semibold">No documents uploaded yet</h3>
                <p className="mt-3 max-w-lg text-slate-400">
                  Upload documents from the Vault using this project context to keep retrieval isolated from the rest of the Knowledge Vault.
                </p>
                <Link
                  href={`/vault?projectId=${encodeURIComponent(projectId)}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400"
                >
                  <FileText size={18} />
                  Upload Document
                </Link>
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

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="text-yellow-400" size={24} />
            <div>
              <h2 className="text-2xl font-semibold">Recent Conversations</h2>
              <p className="text-sm text-slate-400">
                Only conversations saved under this project appear here.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-700 p-6 md:p-8">
            {loadingConversations || loadingProject ? (
              <p className="text-sm text-slate-400">Loading project conversations...</p>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-slate-400">No conversations yet</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{conversation.title || `Conversation #${conversation.id}`}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {conversation.created_at ? new Date(conversation.created_at).toLocaleDateString() : "No date"}
                        {" • "}
                        {typeof conversation.messageCount === "number"
                          ? `${conversation.messageCount} message${conversation.messageCount === 1 ? "" : "s"}`
                          : "Message count unavailable"}
                      </p>
                    </div>

                    <Link
                      href={`/chat?conversationId=${conversation.id}&projectId=${encodeURIComponent(projectId)}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
                    >
                      Open
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        </div>

        <aside className="space-y-6">
          <SideCard
            icon={<MessageSquare size={22} />}
            color="purple"
            title="Project Chat"
            desc="Open a chat session that only retrieves this project&apos;s documents."
            button="Chat With Project"
            href={`/projects/${projectId}/chat`}
            disabled={!project}
          />

          <SideCard
            icon={<Brain size={22} />}
            color="green"
            title="Retrieval Scope"
            desc="Knowledge Vault retrieval now filters by `documents.project_id` when project context exists."
            button="Upload Document"
            href={`/vault?projectId=${encodeURIComponent(projectId)}`}
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

function SideCard({ icon, title, desc, button, color, href, disabled }: any) {
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

      <Link
        href={href}
        aria-disabled={disabled}
        className={`flex w-full items-center justify-between rounded-xl border border-slate-700 px-4 py-3 text-slate-200 hover:border-yellow-500/40 ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {button}
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}