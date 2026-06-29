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
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [imageGenerationNotice, setImageGenerationNotice] = useState<string | null>(null);

  const isNormalPostWorkspace =
    project.sourceMetadata?.ideaType === "social_post" ||
    project.sourceMetadata?.bestFormat === "Normal Post";

  function getBlockValue(blockId: string) {
    return project.contentBlocks.find((block) => block.id === blockId)?.content ?? "";
  }

  function updateBlockValue(blockId: string, nextContent: string, fallbackType: "paragraph" | "callout" | "list") {
    const now = new Date().toISOString();
    const existingBlock = project.contentBlocks.find((block) => block.id === blockId);
    const nextBlocks = existingBlock
      ? project.contentBlocks.map((block) => (block.id === blockId
        ? {
            ...block,
            content: nextContent,
            updatedAt: now,
          }
        : block))
      : [
          ...project.contentBlocks,
          {
            id: blockId,
            type: fallbackType,
            content: nextContent,
            order: project.contentBlocks.length + 1,
            status: "draft" as const,
            createdAt: now,
            updatedAt: now,
          },
        ];

    onChange({
      ...project,
      contentBlocks: nextBlocks,
      updatedAt: now,
    });
  }

  async function copyPrompt() {
    const prompt = project.sourceMetadata?.keyVisualPrompt?.trim() ?? "";

    if (!prompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1200);
    } catch {
      setCopiedPrompt(false);
    }
  }

  function generateFinalImage() {
    setImageGenerationNotice("Final image generation will be enabled in a later phase.");
  }

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

  if (isNormalPostWorkspace) {
    return (
      <div className="h-full w-full bg-[#0A1023] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Post Workspace</h1>
          <p className="mt-1 text-slate-400">
            Editing: <span className="text-yellow-300">{project.name}</span>
          </p>
        </div>

        <div className="grid h-[calc(100vh-210px)] grid-cols-1 gap-6 md:grid-cols-[1fr_2fr_1fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Content Settings</h2>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-400">Read-only from Idea Explorer</p>
            <div className="space-y-3 rounded-xl bg-slate-800/50 p-4 text-sm">
              <LockedMetadataRow label="Goal" value={project.sourceMetadata?.inheritedGoal} />
              <LockedMetadataRow label="Platform" value={project.sourceMetadata?.platform} />
              <LockedMetadataRow label="Tone" value={project.sourceMetadata?.inheritedTone} />
              <LockedMetadataRow label="Style" value={project.sourceMetadata?.inheritedStyle} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Post Draft</h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Selected Idea</p>
                <h3 className="mt-2 text-base font-semibold text-white">{project.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{project.description || "No idea summary provided."}</p>
                <p className="mt-2 text-xs text-slate-400">{project.sourceMetadata?.whyThisWorks || ""}</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-200">Main Post Editor</label>
                <textarea
                  value={getBlockValue("normal_post_editor")}
                  onChange={(event) => updateBlockValue("normal_post_editor", event.target.value, "paragraph")}
                  rows={8}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                  placeholder="Write the final Facebook post content here."
                />
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-200">Call To Action (CTA)</label>
                <textarea
                  value={getBlockValue("normal_post_cta")}
                  onChange={(event) => updateBlockValue("normal_post_cta", event.target.value, "callout")}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                  placeholder="Add a single call-to-action."
                />
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <label className="mb-2 block text-sm font-medium text-slate-200">Hashtags</label>
                <textarea
                  value={getBlockValue("normal_post_hashtags")}
                  onChange={(event) => updateBlockValue("normal_post_hashtags", event.target.value, "list")}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                  placeholder="#BorneoLandGatekeeper #SabahProperty"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Key Visual</h2>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Key Visual Preview</p>
                <div className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
                  Preview will appear after final image generation.
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-sm font-medium text-slate-200">Professional Image Prompt</p>
                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200">
                  {project.sourceMetadata?.keyVisualPrompt || "No key visual prompt provided."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyPrompt}
                  disabled={!project.sourceMetadata?.keyVisualPrompt}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-yellow-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copiedPrompt ? "Copied" : "Copy Prompt"}
                </button>
                <button
                  type="button"
                  onClick={generateFinalImage}
                  className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
                >
                  Generate Final Image
                </button>
              </div>

              {imageGenerationNotice ? (
                <p className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300">
                  {imageGenerationNotice}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    );
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

function LockedMetadataRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-100">{value || "Not set"}</p>
    </div>
  );
}
