"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProjectSummary = {
  id: string;
  name: string;
  created_at?: string;
  documentCount: number;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [newProject, setNewProject] = useState("");
  const [loading, setLoading] = useState(true);

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
  <Link
    href={`/projects/${project.id}`}
    key={project.id}
  >
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-yellow-500/40 transition cursor-pointer">
      <h3 className="font-semibold text-lg text-white">
        {project.name}
      </h3>

      <p className="text-slate-400 text-sm mt-2">
        {project.documentCount} Documents
      </p>
    </div>
  </Link>
))
  )}
      </div>
    </div>
  );
}