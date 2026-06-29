"use client";

import { ProductionWorkspaceProject } from "@/types/production-studio";

type ScriptEditorPanelProps = {
  project: ProductionWorkspaceProject;
  onChange: (project: ProductionWorkspaceProject) => void;
};

export default function ScriptEditorPanel({ project, onChange }: ScriptEditorPanelProps) {
  function handleBlockContentChange(blockId: string, nextContent: string) {
    const nextProject: ProductionWorkspaceProject = {
      ...project,
      updatedAt: new Date().toISOString(),
      contentBlocks: project.contentBlocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: nextContent,
              updatedAt: new Date().toISOString(),
            }
          : block,
      ),
    };

    onChange(nextProject);
  }

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
                <textarea
                  value={block.content}
                  onChange={(event) => handleBlockContentChange(block.id, event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                  placeholder="Write block content..."
                />
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