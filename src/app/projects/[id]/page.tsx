"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { use, useEffect, useState } from "react";
import {
  Brain,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  FolderOpen,
  MessageSquare,
  RotateCw,
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

type ProjectMemory = {
  id: string;
  memory_type: string;
  title: string;
  content: string;
  source_conversation_id: number | null;
  importance: number;
  created_at: string;
};

type ActivityItem = {
  id: string;
  type: "memory" | "conversation" | "document";
  title: string;
  href?: string;
  timestamp: number;
  createdAt?: string | null;
  meta: string;
};

const MEMORY_TYPE_FILTERS = ["all", "technical", "decision", "legal", "financial", "property"] as const;

type MemoryTypeFilter = (typeof MEMORY_TYPE_FILTERS)[number];

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
  const [memories, setMemories] = useState<ProjectMemory[]>([]);
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<MemoryTypeFilter>("all");
  const [projectBrief, setProjectBrief] = useState("");
  const [briefError, setBriefError] = useState<string | null>(null);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMemories, setLoadingMemories] = useState(false);
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

  async function loadMemories() {
    if (!projectId) {
      setLoadingMemories(false);
      return;
    }

    const response = await fetch(`/api/project-memories?projectId=${projectId}`, {
      cache: "no-store",
    });
    const result = await response.json();
    setLoadingMemories(false);

    if (!response.ok) {
      console.error(result.error || "failed to load project memories");
      return;
    }

    setMemories((result.memories ?? []) as ProjectMemory[]);
  }

  useEffect(() => {
    setLoadingDocuments(true);
    setLoadingConversations(true);
    setLoadingMemories(true);
    loadProject();
    loadConversations();
    loadMemories();
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

  async function generateProjectBrief() {
    if (!projectId) {
      return;
    }

    setGeneratingBrief(true);
    setBriefError(null);

    const response = await fetch("/api/project-brief", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectId }),
    });

    const result = await response.json();
    setGeneratingBrief(false);

    if (!response.ok) {
      setBriefError(result.error || "Failed to generate project brief.");
      return;
    }

    setProjectBrief(typeof result.brief === "string" ? result.brief : "");
  }

  async function copyProjectBrief() {
    if (!projectBrief) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(projectBrief);
      } else {
        fallbackCopyText(projectBrief);
      }
      setCopiedBrief(true);
      window.setTimeout(() => {
        setCopiedBrief(false);
      }, 2000);
    } catch {
      try {
        fallbackCopyText(projectBrief);
        setCopiedBrief(true);
        window.setTimeout(() => {
          setCopiedBrief(false);
        }, 2000);
        setBriefError(null);
      } catch {
        setBriefError("Failed to copy project brief.");
      }
    }
  }

  const latestDocument = documents[0];
  const documentCount = project?.documentCount ?? documents.length;
  const conversationCount = conversations.length;
  const memoryCount = memories.length;
  const normalizedMemorySearch = memorySearch.trim().toLowerCase();
  const filteredMemories = memories.filter((memory) => {
    const matchesType =
      memoryTypeFilter === "all" || memory.memory_type.toLowerCase() === memoryTypeFilter;

    if (!matchesType) {
      return false;
    }

    if (!normalizedMemorySearch) {
      return true;
    }

    const searchableText = `${memory.title} ${memory.content} ${memory.memory_type}`.toLowerCase();
    return searchableText.includes(normalizedMemorySearch);
  });
  const recentActivity = buildRecentActivity({
    documents,
    conversations,
    memories,
    projectId,
  });
  const projectHealth = getProjectHealth({
    documentCount,
    conversationCount,
    memoryCount,
    recentActivity,
  });
  const briefAvailable = Boolean(projectBrief.trim());
  const aiSuggestions = [
    documentCount === 0
      ? {
          id: "upload-documents",
          title: "Upload project documents",
          description: "Add contracts, notes, or reference files so project retrieval has source material.",
          href: `/vault?projectId=${encodeURIComponent(projectId)}`,
          actionLabel: "Upload Document",
        }
      : null,
    memoryCount === 0
      ? {
          id: "save-memories",
          title: "Save important memories",
          description: "Capture decisions, constraints, and recurring facts so project chat can reuse them.",
          href: `/projects/${projectId}/chat`,
          actionLabel: "Open Project Chat",
        }
      : null,
    conversationCount === 0
      ? {
          id: "start-chat",
          title: "Start project chat",
          description: "Create the first scoped conversation to build history and source-linked memories.",
          href: `/projects/${projectId}/chat`,
          actionLabel: "Chat With Project",
        }
      : null,
    documentCount > 0 && memoryCount > 0 && !briefAvailable
      ? {
          id: "generate-brief",
          title: "Generate project brief",
          description: "You already have enough project context to produce a current AI brief.",
          actionLabel: generatingBrief ? "Generating..." : "Generate Brief",
          onClick: generateProjectBrief,
          disabled: generatingBrief || !projectId,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: string;
    title: string;
    description: string;
    href?: string;
    actionLabel: string;
    onClick?: () => void;
    disabled?: boolean;
  }>;

  function getMemoryPreview(content: string) {
    const normalizedContent = content.replace(/\s+/g, " ").trim();

    if (normalizedContent.length <= 180) {
      return normalizedContent;
    }

    return `${normalizedContent.slice(0, 177)}...`;
  }

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
          {!projectBrief && (
            <button
              type="button"
              onClick={generateProjectBrief}
              disabled={generatingBrief || !projectId}
              className="flex items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-3 font-semibold text-green-200 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Brain size={18} />
              {generatingBrief ? "Generating..." : "Generate Project Brief"}
            </button>
          )}

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

      <section className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Project Intelligence Overview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">AI overview before the detail view</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Health, counts, activity, and next actions are derived from the project&apos;s current documents, conversations, memories, and in-page brief state.
            </p>
          </div>

          <div className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200">
            {projectHealth.label} project
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Project Health</p>
                    <h3 className="mt-1 text-xl font-semibold text-white">{projectHealth.label}</h3>
                  </div>
                  <span className={`inline-flex h-3 w-3 rounded-full ${projectHealth.dotClass}`} />
                </div>
                <p className="text-sm text-slate-300">{projectHealth.description}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="mb-4">
                  <p className="text-sm text-slate-400">Latest Brief</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    {briefAvailable ? "Brief available" : "Generate brief"}
                  </h3>
                </div>
                <p className="text-sm text-slate-300">
                  {briefAvailable
                    ? "A project brief is loaded in the current page state and can be copied or regenerated below."
                    : "No brief is loaded in the current page state yet."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!briefAvailable && (
                    <button
                      type="button"
                      onClick={generateProjectBrief}
                      disabled={generatingBrief || !projectId}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Brain size={16} />
                      {generatingBrief ? "Generating..." : "Generate Brief"}
                    </button>
                  )}

                  {briefAvailable && (
                    <>
                      <button
                        type="button"
                        onClick={copyProjectBrief}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
                      >
                        <Copy size={16} />
                        {copiedBrief ? "Copied" : "Copy Brief"}
                      </button>

                      <button
                        type="button"
                        onClick={generateProjectBrief}
                        disabled={generatingBrief || !projectId}
                        className="inline-flex items-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <RotateCw size={16} className={generatingBrief ? "animate-spin" : undefined} />
                        {generatingBrief ? "Generating..." : "Regenerate Brief"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-5 flex items-center gap-3">
                <FileText className="text-yellow-400" size={20} />
                <div>
                  <p className="text-sm text-slate-400">Project Stats</p>
                  <h3 className="text-xl font-semibold text-white">Current workspace counts</h3>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MiniStatCard
                  icon={<FileText size={18} />}
                  title="Documents"
                  value={documentCount}
                  color="yellow"
                />
                <MiniStatCard
                  icon={<MessageSquare size={18} />}
                  title="Conversations"
                  value={conversationCount}
                  color="purple"
                />
                <MiniStatCard
                  icon={<Brain size={18} />}
                  title="Memories"
                  value={memoryCount}
                  color="green"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-5 flex items-center gap-3">
                <FolderOpen className="text-yellow-400" size={20} />
                <div>
                  <p className="text-sm text-slate-400">Recent Activity</p>
                  <h3 className="text-xl font-semibold text-white">Latest project signals</h3>
                </div>
              </div>

              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No activity yet. Upload a document, start a conversation, or save a memory to populate the timeline.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {activity.type}
                          </p>
                          <p className="mt-2 truncate font-medium text-white">{activity.title}</p>
                          <p className="mt-2 text-sm text-slate-400">{activity.meta}</p>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                          <p className="text-xs text-slate-500">{formatRelativeTime(activity.timestamp)}</p>
                          {activity.href && (
                            <Link
                              href={activity.href}
                              className="inline-flex items-center gap-2 text-sm font-medium text-yellow-300 transition hover:text-yellow-200"
                            >
                              Open
                              <ChevronRight size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-5 flex items-center gap-3">
                <Brain className="text-green-400" size={20} />
                <div>
                  <p className="text-sm text-slate-400">AI Suggestions</p>
                  <h3 className="text-xl font-semibold text-white">Next useful actions</h3>
                </div>
              </div>

              {aiSuggestions.length === 0 ? (
                <p className="text-sm text-slate-300">
                  Project context is in good shape. Continue the project chat or refresh the brief when the workspace changes.
                </p>
              ) : (
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                    >
                      <p className="font-medium text-white">{suggestion.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{suggestion.description}</p>

                      <div className="mt-4">
                        {suggestion.href ? (
                          <Link
                            href={suggestion.href}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
                          >
                            {suggestion.actionLabel}
                            <ChevronRight size={14} />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={suggestion.onClick}
                            disabled={suggestion.disabled}
                            className="inline-flex items-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Brain size={14} />
                            {suggestion.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {(generatingBrief || briefError || projectBrief) && (
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <Brain className="text-green-400" size={24} />
              <div>
                <h2 className="text-2xl font-semibold">Project Brief</h2>
                <p className="text-sm text-slate-400">
                  AI-generated summary across project memories, documents, and recent conversations.
                </p>
              </div>
            </div>

            {projectBrief && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyProjectBrief}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
                >
                  <Copy size={16} />
                  {copiedBrief ? "Copied" : "Copy Brief"}
                </button>

                <button
                  type="button"
                  onClick={generateProjectBrief}
                  disabled={generatingBrief || !projectId}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCw size={16} className={generatingBrief ? "animate-spin" : undefined} />
                  {generatingBrief ? "Generating..." : "Regenerate Brief"}
                </button>
              </div>
            )}
          </div>

          {generatingBrief && (
            <p className="text-sm text-slate-400">Generating project brief...</p>
          )}

          {!generatingBrief && briefError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {briefError}
            </p>
          )}

          {!generatingBrief && !briefError && projectBrief && (
            <div className="chat-markdown max-w-none rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{projectBrief}</ReactMarkdown>
            </div>
          )}
        </section>
      )}

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
            <Brain className="text-green-400" size={24} />
            <div>
              <h2 className="text-2xl font-semibold">Project Memories</h2>
              <p className="text-sm text-slate-400">
                Saved memories for this project are listed here without changing retrieval behavior.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-700 p-6 md:p-8">
            {loadingMemories || loadingProject ? (
              <p className="text-sm text-slate-400">Loading project memories...</p>
            ) : memories.length === 0 ? (
              <p className="text-sm text-slate-400">No memories saved yet.</p>
            ) : (
              <div>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <input
                    value={memorySearch}
                    onChange={(event) => setMemorySearch(event.target.value)}
                    placeholder="Search memories..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 md:max-w-sm"
                  />

                  <div className="flex flex-wrap gap-2">
                    {MEMORY_TYPE_FILTERS.map((filter) => {
                      const isActive = memoryTypeFilter === filter;

                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setMemoryTypeFilter(filter)}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                            isActive
                              ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                              : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-white"
                          }`}
                        >
                          {filter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredMemories.length === 0 ? (
                  <p className="text-sm text-slate-400">No memories match the current search or filter.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredMemories.map((memory) => (
                  <div
                    key={memory.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-300">
                            {memory.memory_type}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                            <Star size={12} className="text-yellow-400" />
                            Importance {memory.importance}
                          </span>
                        </div>

                        <h3 className="mt-3 font-semibold text-white">{memory.title}</h3>
                        <p className="mt-2 text-sm text-slate-300">{getMemoryPreview(memory.content)}</p>

                        {memory.source_conversation_id ? (
                          <Link
                            href={`/chat?conversationId=${memory.source_conversation_id}&projectId=${encodeURIComponent(projectId)}`}
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-yellow-300 transition hover:text-yellow-200"
                          >
                            Open Source Conversation
                            <ChevronRight size={14} />
                          </Link>
                        ) : (
                          <p className="mt-4 text-sm text-slate-500">No source conversation</p>
                        )}
                      </div>

                      <p className="shrink-0 text-xs text-slate-500">
                        {new Date(memory.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
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

        </aside>
      </div>
    </div>
  );
}

function MiniStatCard({ icon, title, value, color }: any) {
  const colors: Record<string, string> = {
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/70">
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
        </div>
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

function buildRecentActivity({
  documents,
  conversations,
  memories,
  projectId,
}: {
  documents: ProjectDocument[];
  conversations: ProjectConversation[];
  memories: ProjectMemory[];
  projectId: string;
}): ActivityItem[] {
  const documentActivity = documents.map((document) => ({
    id: `document-${document.id}`,
    type: "document" as const,
    title: document.filename || document.storage_path,
    timestamp: getTimestamp(document.created_at),
    createdAt: document.created_at,
    meta: `Document uploaded${document.status ? ` • ${document.status}` : ""}`,
  }));

  const conversationActivity = conversations.map((conversation) => ({
    id: `conversation-${conversation.id}`,
    type: "conversation" as const,
    title: conversation.title || `Conversation #${conversation.id}`,
    href: `/chat?conversationId=${conversation.id}&projectId=${encodeURIComponent(projectId)}`,
    timestamp: getTimestamp(conversation.created_at),
    createdAt: conversation.created_at,
    meta:
      typeof conversation.messageCount === "number"
        ? `${conversation.messageCount} message${conversation.messageCount === 1 ? "" : "s"}`
        : "Project conversation",
  }));

  const memoryActivity = memories.map((memory) => ({
    id: `memory-${memory.id}`,
    type: "memory" as const,
    title: memory.title,
    href: memory.source_conversation_id
      ? `/chat?conversationId=${memory.source_conversation_id}&projectId=${encodeURIComponent(projectId)}`
      : undefined,
    timestamp: getTimestamp(memory.created_at),
    createdAt: memory.created_at,
    meta: `${memory.memory_type} memory • Importance ${memory.importance}`,
  }));

  return [...memoryActivity, ...conversationActivity, ...documentActivity]
    .filter((activity) => activity.timestamp > 0)
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5);
}

function getProjectHealth({
  documentCount,
  conversationCount,
  memoryCount,
  recentActivity,
}: {
  documentCount: number;
  conversationCount: number;
  memoryCount: number;
  recentActivity: ActivityItem[];
}) {
  if (documentCount === 0 && conversationCount === 0 && memoryCount === 0) {
    return {
      label: "Empty",
      description: "No project documents, conversations, or memories exist yet.",
      dotClass: "bg-slate-500",
    };
  }

  const latestTimestamp = recentActivity[0]?.timestamp ?? 0;
  const daysSinceLatest = latestTimestamp > 0
    ? (Date.now() - latestTimestamp) / (1000 * 60 * 60 * 24)
    : Number.POSITIVE_INFINITY;

  if (daysSinceLatest <= 7) {
    return {
      label: "Active",
      description: "Recent project activity was detected within the last 7 days.",
      dotClass: "bg-green-400",
    };
  }

  if (daysSinceLatest <= 30) {
    return {
      label: "Recent",
      description: "The project has activity in the last 30 days but is not currently busy.",
      dotClass: "bg-yellow-400",
    };
  }

  return {
    label: "Quiet",
    description: "Project data exists, but there has been no recent activity in the last 30 days.",
    dotClass: "bg-slate-400",
  };
}

function getTimestamp(value?: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatRelativeTime(timestamp: number) {
  if (!timestamp) {
    return "Unknown date";
  }

  const diffInMinutes = Math.max(1, Math.round((Date.now() - timestamp) / (1000 * 60)));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

function fallbackCopyText(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error("copy failed");
  }
}