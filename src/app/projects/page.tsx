"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Project = {
  id: number;
  name: string;
  created_at: string;
};

export default function ProjectsPage() {
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setProjects(data || []);
  }

  async function createProject() {
    if (!projectName.trim()) return;

    const { error } = await supabase
      .from("projects")
      .insert([{ name: projectName }]);

    if (error) {
      console.error(error);
      return;
    }

    setProjectName("");
    loadProjects();
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-6">Projects</h1>

      <div className="bg-slate-900 rounded-2xl p-6 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="flex-1 bg-slate-800 text-white p-3 rounded-xl"
          />

          <button
            onClick={createProject}
            className="bg-yellow-500 text-slate-950 px-6 py-3 rounded-xl font-semibold"
          >
            Create Project
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Supabase Projects</h2>

        {projects.length === 0 ? (
          <p className="text-slate-400">No projects yet.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="bg-slate-800 p-4 rounded-xl">
                📁 {project.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}