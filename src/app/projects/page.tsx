"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TEMP_CONFIRMATION_PASSWORD = "782185";

type ProjectSummary = {
  id: string;
  name: string;
  created_at?: string;
  documentCount: number;
};

type ProjectActionState = {
  mode: "rename" | "delete";
  projectId: string;
  projectName: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [newProject, setNewProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ProjectActionState | null>(null);
  const [renameName, setRenameName] = useState("");
  const [confirmationName, setConfirmationName] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

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

    setProjects((prev) => [result.project as ProjectSummary, ...prev]);
    setNewProject("");
  };

  function openRename(project: ProjectSummary) {
    setActionState({ mode: "rename", projectId: project.id, projectName: project.name });
    setRenameName(project.name);
    setConfirmationName("");
    setConfirmationPassword("");
    setActionError(null);
  }

  function openDelete(project: ProjectSummary) {
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
        project.id === actionState.projectId ? (result.project as ProjectSummary) : project
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

  return (
    <div className="p-8 w-full max-w-[1600px]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Projects
        </h1>

        <p className="text-slate-400 mt-2">
          Organize documents and conversations by project.
        </p>
      </div>

      <div className="flex gap-3 mb-8">
        <input
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="New project name..."
          className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
        />

        <button
          onClick={createProject}
          className="px-6 py-3 rounded-xl bg-yellow-500 text-black font-semibold"
        >
          Create
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
  {loading ? (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
      Loading projects...
    </div>
  ) : projects.length === 0 ? (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
      No projects created yet.
    </div>
  ) : (
    projects.map((project) => (
  <div
    key={project.id}
    className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
  >
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl transition hover:text-yellow-200"
    >
      <h3 className="font-semibold text-lg text-white">
        {project.name}
      </h3>

      <p className="text-slate-400 text-sm mt-2">
        {project.documentCount} Documents
      </p>
    </Link>

    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => openRename(project)}
        className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white"
      >
        Rename
      </button>

      <button
        type="button"
        onClick={() => openDelete(project)}
        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
      >
        Delete
      </button>
    </div>

    {actionState?.projectId === project.id && (
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
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
))
  )}
      </div>
    </div>
  );
}