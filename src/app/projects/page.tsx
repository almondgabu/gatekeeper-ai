"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  Brain,
  EllipsisVertical,
  FileText,
  FolderPlus,
  MessageSquare,
  Search,
} from "lucide-react";

const TEMP_CONFIRMATION_PASSWORD = "782185";

type ProjectSummary = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string | null;
  documentCount: number;
  conversationCount?: number;
  memoryCount?: number;
};

type ProjectActionState = {
  mode: "rename" | "delete";
  projectId: string;
  projectName: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [newProject, setNewProject] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ProjectActionState | null>(null);
  const [renameName, setRenameName] = useState("");
  const [confirmationName, setConfirmationName] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const createProjectInputRef = useRef<HTMLInputElement | null>(null);

  async function loadProjects() {
    setLoading(true);

    const response = await fetch("/api/projects", { cache: "no-store" });
    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      console.error(result.error || "failed to load projects");
      return;
    }

    setProjects((result.projects ?? []) as ProjectSummary[]);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const createProject = async () => {
    if (!newProject.trim()) return;

    const projectName = newProject.trim();
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: projectName }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to create project.");
      return;
    }

    setProjects((prev) => [
      {
        ...(result.project as ProjectSummary),
        conversationCount: 0,
        memoryCount: 0,
      },
      ...prev,
    ]);
    setNewProject("");
  };

  function openRename(project: ProjectSummary) {
    setOpenMenuProjectId(null);
    setActionState({ mode: "rename", projectId: project.id, projectName: project.name });
    setRenameName(project.name);
    setConfirmationName("");
    setConfirmationPassword("");
    setActionError(null);
  }

  function openDelete(project: ProjectSummary) {
    setOpenMenuProjectId(null);
    setActionState({ mode: "delete", projectId: project.id, projectName: project.name });
    setRenameName(project.name);
    setConfirmationName("");
    setConfirmationPassword("");
    setActionError(null);
  }

  function closeAction() {
    setActionState(null);
    setRenameName("");
    setConfirmationName("");
    setConfirmationPassword("");
    setActionError(null);
    setSubmittingAction(false);
  }

  async function confirmRename() {
    if (!actionState || actionState.mode !== "rename") {
      return;
    }

    setSubmittingAction(true);
    setActionError(null);

    const response = await fetch("/api/projects", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: actionState.projectId,
        name: renameName.trim(),
        password: confirmationPassword,
      }),
    });

    const result = await response.json();
    setSubmittingAction(false);

    if (!response.ok) {
      setActionError(result.error || "Failed to rename project.");
      return;
    }

    setProjects((current) =>
      current.map((project) =>
        project.id === actionState.projectId
          ? {
              ...project,
              ...(result.project as Partial<ProjectSummary>),
            }
          : project
      )
    );
    closeAction();
  }

  async function confirmDelete() {
    if (!actionState || actionState.mode !== "delete") {
      return;
    }

    if (confirmationName !== actionState.projectName) {
      setActionError("Project name must match exactly to delete.");
      return;
    }

    setSubmittingAction(true);
    setActionError(null);

    const response = await fetch("/api/projects", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: actionState.projectId,
        password: confirmationPassword,
      }),
    });

    const result = await response.json();
    setSubmittingAction(false);

    if (!response.ok) {
      setActionError(result.error || "Failed to delete project.");
      return;
    }

    setProjects((current) => current.filter((project) => project.id !== actionState.projectId));
    closeAction();
  }

  const renameEnabled =
    !!actionState &&
    actionState.mode === "rename" &&
    !!renameName.trim() &&
    !!confirmationPassword.trim() &&
    !submittingAction;

  const deleteEnabled =
    !!actionState &&
    actionState.mode === "delete" &&
    !!confirmationPassword.trim() &&
    !submittingAction;

  const filteredProjects = useMemo(() => {
    const normalizedSearch = projectSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return projects;
    }

    return projects.filter((project) => project.name.toLowerCase().includes(normalizedSearch));
  }, [projectSearch, projects]);

  function getProjectTimestamp(project: ProjectSummary) {
    return project.updated_at || project.created_at || null;
  }

  function formatProjectRelativeTime(project: ProjectSummary) {
    const value = getProjectTimestamp(project);

    if (!value) {
      return "Updated recently";
    }

    const timestamp = new Date(value).getTime();
    const diffMs = Date.now() - timestamp;

    if (Number.isNaN(timestamp) || diffMs < 0) {
      return formatProjectDate(project);
    }

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) {
      return "Updated just now";
    }

    if (minutes < 60) {
      return `Updated ${minutes}m ago`;
    }

    if (hours < 24) {
      return `Updated ${hours}h ago`;
    }

    if (days === 1) {
      return "Updated yesterday";
    }

    if (days < 7) {
      return `Updated ${days}d ago`;
    }

    return formatProjectDate(project);
  }

  function formatProjectDate(project: ProjectSummary) {
    const value = project.updated_at || project.created_at;

    if (!value) {
      return "Unknown";
    }

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getProjectStatus(project: ProjectSummary) {
    const value = getProjectTimestamp(project);

    if (!value) {
      return {
        label: "Archived",
        className: "border-slate-700 bg-slate-900 text-slate-300",
      };
    }

    const timestamp = new Date(value).getTime();
    const diffMs = Date.now() - timestamp;
    const days = Math.floor(diffMs / 86400000);

    if (days <= 1) {
      return {
        label: "Active",
        className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      };
    }

    if (days <= 7) {
      return {
        label: "Recent",
        className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
      };
    }

    return {
      label: "Archived",
      className: "border-slate-700 bg-slate-900 text-slate-300",
    };
  }

  function getProjectDescription(project: ProjectSummary) {
    if ((project.memoryCount ?? 0) > 0 || (project.conversationCount ?? 0) > 0) {
      return "Knowledge workspace for project conversations, memories, and retrieval context.";
    }

    if (project.documentCount > 0) {
      return "Document-backed workspace ready for project-scoped research and briefs.";
    }

    return "Start capturing documents, conversations, memories, and briefs in one workspace.";
  }

  function getBriefIndicator(project: ProjectSummary) {
    const hasBriefMaterial =
      project.documentCount > 0 || (project.conversationCount ?? 0) > 0 || (project.memoryCount ?? 0) > 0;

    return hasBriefMaterial ? "Brief Available" : "No Brief Yet";
  }

  function handleCardClick(event: React.MouseEvent<HTMLDivElement>, projectId: string) {
    const target = event.target as HTMLElement | null;

    if (!target) {
      return;
    }

    if (target.closest("button, input, a, textarea")) {
      return;
    }

    router.push(`/projects/${projectId}`);
  }

  return (
    <div className="w-full max-w-[1600px] p-6 md:p-8">
      <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-yellow-400/80">Workspace</p>
          <h1 className="text-3xl font-bold md:text-4xl">
          Projects
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
          Organize documents and conversations by project.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,340px)_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <Search size={18} className="text-slate-500" />
            <input
              value={projectSearch}
              onChange={(event) => setProjectSearch(event.target.value)}
              placeholder="Search projects..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="flex gap-3">
            <input
              ref={createProjectInputRef}
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="New project name..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            />

            <button
              onClick={createProject}
              className="rounded-2xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400"
            >
              Create
            </button>
          </div>
        </div>
      </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 && projects.length === 0 ? (
            <div className="col-span-full rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top,#1f293780,transparent_60%),linear-gradient(180deg,#0f172a,#0b1120)] p-8 text-center shadow-[0_24px_80px_rgba(2,6,23,0.45)] md:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-300">
                <FolderPlus size={28} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">No projects yet</h2>
              <p className="mt-3 text-slate-400">Create your first project to organize:</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2">Documents</span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2">Conversations</span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2">Memories</span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2">Project Briefs</span>
              </div>
              <button
                type="button"
                onClick={() => createProjectInputRef.current?.focus()}
                className="mt-8 rounded-2xl bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400"
              >
                Create Project
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
              No projects match your search.
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={(event) => handleCardClick(event, project.id)}
                className="group relative min-h-[320px] overflow-hidden rounded-[28px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(12,18,32,0.98))] p-6 shadow-[0_16px_60px_rgba(2,6,23,0.35)] transition duration-300 hover:-translate-y-1.5 hover:border-yellow-500/40 hover:shadow-[0_28px_90px_rgba(234,179,8,0.08)]"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                <div className="relative z-20 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getProjectStatus(project).className}`}
                        >
                          {getProjectStatus(project).label}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                          <ClipboardList size={12} className="text-yellow-300" />
                          {getBriefIndicator(project)}
                        </span>
                      </div>

                      <h3 className="mt-4 truncate text-xl font-semibold text-white md:text-2xl">
                        {project.name}
                      </h3>

                      <p className="mt-2 max-w-[32ch] text-sm leading-6 text-slate-400">
                        {getProjectDescription(project)}
                      </p>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuProjectId((current) => (current === project.id ? null : project.id))
                        }
                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-slate-300 transition hover:border-yellow-500/40 hover:text-white"
                        aria-label={`Project actions for ${project.name}`}
                      >
                        <EllipsisVertical size={18} />
                      </button>

                      {openMenuProjectId === project.id && (
                        <div className="absolute right-0 top-12 z-20 min-w-[190px] rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-[0_18px_50px_rgba(2,6,23,0.55)]">
                          <Link
                            href={`/projects/${project.id}`}
                            onClick={() => setOpenMenuProjectId(null)}
                            className="flex rounded-xl px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-900 hover:text-white"
                          >
                            Open Project
                          </Link>
                          <button
                            type="button"
                            onClick={() => openRename(project)}
                            className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-100 transition hover:bg-slate-900 hover:text-white"
                          >
                            Rename Project
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(project)}
                            className="flex w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                          >
                            Delete Project
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <ProjectStat icon={<FileText size={15} />} label="Documents" value={project.documentCount} />
                    <ProjectStat icon={<MessageSquare size={15} />} label="Conversations" value={project.conversationCount ?? 0} />
                    <ProjectStat icon={<Brain size={15} />} label="Memories" value={project.memoryCount ?? 0} />
                  </div>

                  <div className="mt-auto border-t border-slate-800/90 pt-5 text-sm text-slate-500">
                    {formatProjectRelativeTime(project)}
                  </div>

                  {actionState?.projectId === project.id && (
                    <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      {actionState.mode === "rename" ? (
                        <>
                          <p className="text-sm font-semibold text-white">Rename Project</p>
                          <p className="mt-2 text-xs text-slate-400">
                            Enter a new project name and the temporary confirmation password for local testing.
                          </p>

                          <input
                            value={renameName}
                            onChange={(event) => setRenameName(event.target.value)}
                            placeholder="New project name"
                            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                          />

                          <input
                            value={confirmationPassword}
                            onChange={(event) => setConfirmationPassword(event.target.value)}
                            placeholder="Confirmation password"
                            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                          />

                          {actionError && <p className="mt-3 text-sm text-red-300">{actionError}</p>}

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={confirmRename}
                              disabled={!renameEnabled}
                              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submittingAction ? "Renaming..." : "Confirm Rename"}
                            </button>

                            <button
                              type="button"
                              onClick={closeAction}
                              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-red-200">Delete Project</p>
                          <p className="mt-2 text-xs text-red-300/80">
                            This permanently removes the project, its project memories, project conversations, and project-linked documents from the database. Type the exact project name and enter the confirmation password.
                          </p>

                          <input
                            value={confirmationName}
                            onChange={(event) => setConfirmationName(event.target.value)}
                            placeholder={`Type \"${project.name}\" exactly`}
                            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                          />

                          <input
                            value={confirmationPassword}
                            onChange={(event) => setConfirmationPassword(event.target.value)}
                            placeholder="Confirmation password"
                            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                          />

                          {actionError && <p className="mt-3 text-sm text-red-300">{actionError}</p>}

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={confirmDelete}
                              disabled={!deleteEnabled}
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submittingAction ? "Deleting..." : "Confirm Delete"}
                            </button>

                            <button
                              type="button"
                              onClick={closeAction}
                              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
      </div>
    </div>
  );
}

function ProjectStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
      <div className="flex items-center gap-2">
        <span className="text-yellow-300">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}