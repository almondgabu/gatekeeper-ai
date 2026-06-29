"use client";

import { useState } from "react";
import { ProductionWorkspaceProject } from "@/types/production-studio";
import SourceIdeaPanel from "./SourceIdeaPanel";
import ScriptEditorPanel from "./ScriptEditorPanel";
import ProductionMetadataPanel from "./ProductionMetadataPanel";

type ProductionWorkspaceShellProps = {
  project: ProductionWorkspaceProject;
  onChange: (project: ProductionWorkspaceProject) => void;
};

/**
 * Production Workspace Shell Component
 *
 * A responsive three-column layout shell for the Production Studio workspace.
 * This is a layout-only component with placeholder content as specified.
 *
 * Left Column: Source Idea Panel (placeholder)
 * Center Column: Script Workspace Panel (placeholder)
 * Right Column: Production Metadata Panel (placeholder)
 */
export default function ProductionWorkspaceShell({
  project,
  onChange,
}: ProductionWorkspaceShellProps) {
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  async function generateProductionPackage() {
    setGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/production-studio/expand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message = typeof result?.error === "string"
          ? result.error
          : `Failed to generate production package (${response.status}).`;
        throw new Error(message);
      }

      if (!result || typeof result !== "object") {
        throw new Error("Invalid expansion response.");
      }

      const nextProject: ProductionWorkspaceProject = {
        ...project,
        ...(result as Partial<ProductionWorkspaceProject>),
        updatedAt: typeof (result as Partial<ProductionWorkspaceProject>).updatedAt === "string"
          ? (result as Partial<ProductionWorkspaceProject>).updatedAt as string
          : new Date().toISOString(),
      };

      onChange(nextProject);
    } catch (error: unknown) {
      setGenerationError(error instanceof Error ? error.message : "Failed to generate production package.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="h-full w-full bg-[#0A1023] p-6">
      {/* Workspace Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Production Workspace</h1>
            <p className="mt-1 text-slate-400">
              Editing: <span className="text-yellow-300">{project.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={generateProductionPackage}
            disabled={generating}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Production Package"}
          </button>
        </div>
        {generationError ? (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {generationError}
          </p>
        ) : null}
      </div>

      {/* Three Column Layout */}
      <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-6 md:grid-cols-[1fr_2fr_1fr]">
        {/* Left Column - Source Idea Panel */}
        <SourceIdeaPanel project={project} />

        {/* Center Column - Script Workspace Panel */}
        <ScriptEditorPanel project={project} onChange={onChange} />

        {/* Right Column - Production Metadata Panel */}
        <ProductionMetadataPanel project={project} />
      </div>

      {/* Workspace Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="text-sm text-slate-400">
          Status: <span className="font-medium text-yellow-300">{project.status}</span>
        </div>
        <div className="text-sm text-slate-400">
          Content Type: <span className="font-medium text-yellow-300">{project.contentType}</span>
        </div>
      </div>
    </div>
  );
}
