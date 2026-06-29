"use client";

import { ProductionWorkspaceProject } from "@/types/production-studio";

type SourceIdeaPanelProps = {
  project: ProductionWorkspaceProject;
};

export default function SourceIdeaPanel({ project }: SourceIdeaPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-lg font-semibold text-white mb-4">Source Idea</h2>
      <div className="rounded-xl bg-slate-800/50 p-4 text-sm text-slate-300">
        Source Idea Panel
      </div>
    </div>
  );
}