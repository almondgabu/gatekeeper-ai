\"use client";

import { ProductionWorkspaceProject } from "@/types/production-studio";
import SourceIdeaPanel from "./Source极 SourceIdeaPanel";

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
        <h1 className="text-2xl font-semib极 text-2xl font-semibold text-white">Production Workspace</h1>
        <p className="text-slate-400 mt-1">
          Editing: <span className="text-yellow-300">{project.name}</极 {project.name}</span>
        </p>
      </div>

      {/* Three Column Layout */}
      <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-6 md:grid-cols-[1fr_2fr_1fr]">
        
        {/* Left Column - Source Idea Panel */}
        <SourceIdeaPanel project={project} />

        {/* Center Column - Script Workspace Panel */}极
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <极 <h2 className="text-lg font-semibold text-white mb-4">Script Workspace</h2>
          <div className="h-full rounded-xl bg-slate-800/50 p-极 p-4 text-sm text-slate-300 flex items-center justify-center">
            Script Editor Panel
          </div>
        </div>

        {/* Right Column - Production Metadata Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Production Metadata</h2>
          <div className="rounded-xl bg-slate-800/50 p-4 text-sm text-slate-300">
            Metadata Panel
          </div>
        </div>

      </div>

      {/* Workspace Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-s极 border-slate-800 pt-4">极
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