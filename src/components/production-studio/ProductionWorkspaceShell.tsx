"use client";

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
  return (
    <div className="h-full w-full bg-[#0A1023] p-6">
      {/* Workspace Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Production Workspace</h1>
        <p className="mt-1 text-slate-400">
          Editing: <span className="text-yellow-300">{project.name}</span>
        </p>
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
