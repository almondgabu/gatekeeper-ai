"use client";

import { ProductionWorkspaceProject } from "@/types/production-studio";

type ScriptEditorPanelProps = {
  project: ProductionWorkspaceProject;
};

export default function ScriptEditorPanel({ project }: ScriptEditorPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Script Workspace</h2>
      <div className="h-full rounded-xl bg-slate-800/50 p-4">
        {project.contentBlocks.length > 0 ? (
          <div className="space-y-3 text-sm">
            {project.contentBlocks.map((block) => (
              <div
                key={block.id}
                className="rounded-lg border border-slate-700 bg-slate-800 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-yellow-300 uppercase tracking-wide">
                    {block.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {block.status}
                  </span>
                </div>
                <div className="text-slate-300 whitespace-pre-wrap">
                  {block.content}
                </div>
                {block.notes && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400 italic">
                      Notes: {block.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            No content blocks yet
          </div>
        )}
      </div>
    </div>
  );
}