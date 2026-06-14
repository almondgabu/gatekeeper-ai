"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([
    "Dream World Resort",
    "SMK Kundasang",
    "Drone Survey Planner",
    "BLG Content Library",
  ]);

  const [newProject, setNewProject] = useState("");

  const createProject = () => {
    if (!newProject.trim()) return;

    setProjects([...projects, newProject]);
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
  {projects.map((project) => (
  <Link
    href={`/projects/${project.toLowerCase().replace(/\s+/g, "-")}`}
    key={project}
  >
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-yellow-500/40 transition cursor-pointer">
      <h3 className="font-semibold text-lg text-white">
        {project}
      </h3>

      <p className="text-slate-400 text-sm mt-2">
        0 Documents
      </p>
    </div>
  </Link>
))}
      </div>
    </div>
  );
}