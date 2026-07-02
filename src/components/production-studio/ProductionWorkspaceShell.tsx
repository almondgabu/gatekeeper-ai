"use client";

import { useState } from "react";
import { ProductionWorkspaceProject } from "@/types/production-studio";
import SourceIdeaPanel from "./SourceIdeaPanel";
import ScriptEditorPanel from "./ScriptEditorPanel";
import ProductionMetadataPanel from "./ProductionMetadataPanel";
import AIDirectorStudio from "./AIDirectorStudio";

type ProductionWorkspaceShellProps = {
  project: ProductionWorkspaceProject;
  onChange: (project: ProductionWorkspaceProject) => void;
  autosaveState?: "saving" | "saved" | "idle" | "error";
  lastSavedLabel?: string;
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
  autosaveState = "idle",
  lastSavedLabel = "Not saved yet",
}: ProductionWorkspaceShellProps) {
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [imageGenerationNotice, setImageGenerationNotice] = useState<string | null>(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const isNormalPostWorkspace =
    project.sourceMetadata?.ideaType === "social_post" ||
    project.sourceMetadata?.bestFormat === "Normal Post";
  const isVideoReelWorkspace =
    project.sourceMetadata?.ideaType === "short_video" ||
    project.sourceMetadata?.bestFormat === "Reel / Video";

  const mainPostDraft = getBlockValue("normal_post_editor");

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
    const imagePrompt = project.sourceMetadata?.keyVisualPrompt || "No key visual prompt provided.";
    const recommendations = [
      "Improve Hook",
      "Add Emotion",
      "Local Context",
      "Stronger CTA",
    ];
    const wordCount = mainPostDraft.trim().length === 0 ? 0 : mainPostDraft.trim().split(/\s+/).length;
    const autosaveTone = autosaveState === "saved"
      ? "text-emerald-300"
      : autosaveState === "saving"
        ? "text-yellow-200"
        : autosaveState === "error"
          ? "text-rose-300"
          : "text-slate-300";

    return (
      <div className="h-full w-full bg-[#0A1023] text-white">
        <div className="hidden min-[1200px]:block">
          <header className="sticky top-0 flex h-16 items-center justify-between gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/90 px-6 backdrop-blur">
            <div className="min-w-0">
              <h1 className="truncate text-[30px] font-semibold leading-tight text-white">Post Workspace</h1>
              <p className="mt-1 truncate text-sm text-slate-300">Project: <span className="text-slate-100">{project.name}</span></p>
            </div>

            <div className="flex items-center gap-2">
              <div className="mr-2 inline-flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-2 text-[13px] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className={autosaveTone}>
                  {autosaveState === "saving" ? "Saving..." : autosaveState === "saved" ? `Autosaved ${lastSavedLabel}` : autosaveState === "error" ? "Save error" : "Idle"}
                </span>
              </div>
              <button
                type="button"
                className="rounded-lg border border-violet-500/35 bg-violet-500/15 px-3 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25"
              >
                AI Assistant
              </button>
              <button type="button" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500">Save</button>
              <button type="button" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500">Export</button>
              <button type="button" className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400">Publish</button>
            </div>
          </header>

          <div className="mt-6 grid justify-center gap-6 min-[1200px]:grid-cols-[320px_minmax(620px,1fr)_360px] min-[1600px]:grid-cols-[360px_760px_420px] min-[1728px]:grid-cols-[360px_820px_420px] min-[2560px]:grid-cols-[360px_980px_420px] min-[3440px]:grid-cols-[380px_980px_440px]">
            <aside className="sticky top-24 self-start rounded-2xl border border-slate-800/70 bg-slate-950/75 p-4">
              <section>
                <button
                  type="button"
                  onClick={() => setAdvancedSettingsOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-white">Content Settings</h2>
                    <p className="mt-1 text-[13px] text-slate-400">Platform, tone, audience, length</p>
                  </div>
                  <span className="text-sm text-slate-300">{advancedSettingsOpen ? "▲" : "▼"}</span>
                </button>
                {advancedSettingsOpen ? (
                  <div className="mt-3 space-y-2">
                    <LockedMetadataRow label="Platform" value={project.sourceMetadata?.platform} />
                    <LockedMetadataRow label="Tone" value={project.sourceMetadata?.inheritedTone} />
                    <LockedMetadataRow label="Audience" value={project.targetAudience} />
                    <LockedMetadataRow label="Length" value={wordCount > 0 ? `${wordCount} words` : "Medium"} />
                  </div>
                ) : null}
              </section>

              <section className="mt-6">
                <h2 className="text-xl font-semibold text-white">Idea</h2>
                <div className="mt-3 space-y-2 rounded-xl bg-slate-900/80 p-3">
                  <p className="text-[15px] font-semibold text-slate-100">{project.name}</p>
                  <p className="text-[13px] leading-6 text-slate-300">
                    {project.description || "A practical post idea tailored for your selected audience and platform."}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-[13px] font-medium text-violet-300 transition hover:text-violet-200"
                  >
                    Change Idea
                  </button>
                </div>
              </section>

              <section className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAiSuggestions((prev) => !prev)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] font-medium text-slate-200 transition hover:border-violet-400/50 hover:text-violet-100"
                >
                  ✨ AI Suggestions
                </button>
                {showAiSuggestions ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendations.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-[13px] text-violet-100 transition hover:bg-violet-500/20"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-yellow-300">Ready to Create?</p>
                <button
                  type="button"
                  onClick={generateProductionPackage}
                  disabled={generating}
                  className="mt-3 w-full rounded-lg bg-yellow-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? "Generating..." : "Generate Professional Post"}
                </button>
              </section>

              {generationError ? (
                <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{generationError}</p>
              ) : null}
            </aside>

            <main className="min-w-0 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-4">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <button type="button" className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200">Paragraph</button>
                  <button type="button" className="rounded-md px-2 py-1.5 text-slate-200">H1</button>
                  <button type="button" className="rounded-md px-2 py-1.5 text-slate-200">H2</button>
                  <button type="button" className="rounded-md px-2 py-1.5 text-slate-200">H3</button>
                  <button type="button" className="rounded-md px-2 py-1.5 text-slate-200">B</button>
                  <button type="button" className="rounded-md px-2 py-1.5 text-slate-200">I</button>
                  <button type="button" className="rounded-md px-2 py-1.5 text-slate-200">U</button>
                  <span className="ml-auto text-slate-400">{wordCount} words</span>
                </div>
              </div>

              <section className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Post Draft</h2>
                  <span className="text-[13px] text-slate-400">{wordCount} words</span>
                </div>
                <textarea
                  value={mainPostDraft}
                  onChange={(event) => updateBlockValue("normal_post_editor", event.target.value, "paragraph")}
                  rows={22}
                  className="h-[560px] w-full resize-none rounded-xl border border-slate-700/35 bg-slate-900/60 px-5 py-5 text-[17px] leading-8 text-slate-100 placeholder:text-slate-500 focus:border-yellow-400/55 focus:outline-none"
                  placeholder="Write the final post draft here."
                />
              </section>

              <section className="mt-4 rounded-xl border border-slate-800/70 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Image Prompt</h2>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    disabled={!project.sourceMetadata?.keyVisualPrompt}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[13px] text-slate-100 transition hover:border-yellow-500/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copiedPrompt ? "Copied" : "Copy Prompt"}
                  </button>
                </div>
                <textarea
                  value={imagePrompt}
                  readOnly
                  rows={8}
                  className="h-[240px] w-full resize-none rounded-xl border border-slate-700/35 bg-slate-900/60 px-5 py-5 text-base leading-7 text-slate-100"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[13px] text-slate-400">Prompt remains ready for copy and refinement.</p>
                  <button
                    type="button"
                    onClick={generateFinalImage}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    Generate Image
                  </button>
                </div>
              </section>
            </main>

            <aside className="sticky top-24 self-start rounded-2xl border border-slate-800/70 bg-slate-950/75 p-4">
              <section>
                <h2 className="text-xl font-semibold text-white">Image Preview</h2>
                <div className="mt-3 flex min-h-[420px] items-center justify-center rounded-xl bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.15),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.2),transparent_45%),#0b1226] p-4 text-sm text-slate-300">
                  Image preview canvas
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" onClick={generateFinalImage} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-100">Change Image</button>
                  <button type="button" onClick={generateFinalImage} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-100">Regenerate</button>
                  <button type="button" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] text-slate-100">Download</button>
                </div>
              </section>

              <section className="mt-5 flex gap-2">
                <button type="button" className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-[13px] text-slate-100">Export</button>
                <button type="button" className="rounded-lg bg-yellow-500 px-4 py-2 text-[13px] font-semibold text-slate-950">Publish</button>
              </section>
            </aside>
          </div>
        </div>

        <div className="min-[1200px]:hidden">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">Post Workspace</h1>
              <p className="mt-2 text-sm text-slate-300">
                Editing <span className="font-semibold text-yellow-200">{project.name}</span>
              </p>
              <p className={`mt-3 text-sm font-medium ${autosaveTone}`}>
                {autosaveState === "saving" ? "Saving..." : autosaveState === "saved" ? `Saved ${lastSavedLabel}` : autosaveState === "error" ? "Save error" : "Idle"}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xl font-semibold text-white">Post Draft</h2>
              <textarea
                value={mainPostDraft}
                onChange={(event) => updateBlockValue("normal_post_editor", event.target.value, "paragraph")}
                rows={16}
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base leading-7 text-slate-100 placeholder:text-slate-500"
                placeholder="Write the final post draft here."
              />
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <button
                type="button"
                onClick={() => setShowAiSuggestions((prev) => !prev)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[13px] font-medium text-slate-200"
              >
                ✨ AI Suggestions
              </button>
              {showAiSuggestions ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendations.map((item) => (
                    <button key={item} type="button" className="rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-[13px] text-violet-100">
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <h2 className="text-xl font-semibold text-white">Image Prompt</h2>
              <textarea
                value={imagePrompt}
                readOnly
                rows={8}
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-[15px] leading-7 text-slate-100"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[13px] text-slate-400">Image Prompt</p>
                <button
                  type="button"
                  onClick={generateFinalImage}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Generate Image
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <button
                type="button"
                onClick={generateProductionPackage}
                disabled={generating}
                className="w-full rounded-xl bg-yellow-500 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate Post"}
              </button>
              {generationError ? (
                <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{generationError}</p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (isVideoReelWorkspace) {
    return (
      <AIDirectorStudio
        project={project}
        onProjectChange={onChange}
        autosaveState={autosaveState}
        lastSavedLabel={lastSavedLabel}
      />
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

function QualityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px] text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-yellow-400" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
