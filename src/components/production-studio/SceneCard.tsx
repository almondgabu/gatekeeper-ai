"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, CopyPlus, Trash2 } from "lucide-react";
import { StoryboardSceneDraft, StoryboardSceneStatus } from "@/types/production-studio";

type SceneCardProps = {
  scene: StoryboardSceneDraft;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isCollapsed: boolean;
  onChange: (nextScene: StoryboardSceneDraft) => void;
  onToggleCollapse: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

const statusOptions: StoryboardSceneStatus[] = [
  "Planning",
  "Ready for Images",
  "Images Completed",
  "Ready for Video",
  "Video Completed",
  "Editing",
  "Completed",
];

export default function SceneCard({
  scene,
  canMoveUp,
  canMoveDown,
  isCollapsed,
  onChange,
  onToggleCollapse,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: SceneCardProps) {
  const [isStatusEditing, setIsStatusEditing] = useState(false);
  const statusTone = getStatusTone(scene.status);

  return (
    <article className="w-full min-w-0 max-w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.3)] md:w-[520px] md:shrink-0">
      <div className="flex flex-col gap-3 border-b border-slate-800/90 pb-3.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
            {scene.sceneNumber}
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={onToggleCollapse}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggleCollapse();
              }
            }}
            className="min-w-0 cursor-pointer rounded-md px-1 py-0.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Scene {scene.sceneNumber}</p>
            <p className="mt-1 truncate text-base font-semibold text-white">{scene.title || `Scene ${scene.sceneNumber}`}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">{scene.estimatedDuration || "8 sec"}</span>
              {isStatusEditing ? (
                <select
                  value={scene.status}
                  onChange={(event) => onChange({ ...scene, status: event.target.value as StoryboardSceneStatus })}
                  onBlur={() => setIsStatusEditing(false)}
                  autoFocus
                  className="rounded-full border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-slate-200"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsStatusEditing(true);
                  }}
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] ${statusTone}`}
                >
                  {scene.status}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-auto">
          <div className="inline-flex flex-wrap items-center justify-end gap-1 rounded-lg border border-slate-700/90 bg-slate-900/70 p-1">
            <IconToolbarButton onClick={onDuplicate} icon={<CopyPlus size={13} />} label="Duplicate" />
            <IconToolbarButton onClick={onMoveUp} disabled={!canMoveUp} icon={<ArrowUp size={13} />} label="Move Up" />
            <IconToolbarButton onClick={onMoveDown} disabled={!canMoveDown} icon={<ArrowDown size={13} />} label="Move Down" />
            <IconToolbarButton onClick={onDelete} icon={<Trash2 size={13} />} label="Delete" tone="danger" />
            <IconToolbarButton
              onClick={onToggleCollapse}
              icon={isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              label={isCollapsed ? "Expand" : "Collapse"}
            />
          </div>
        </div>
      </div>

      <div className={`transition-all duration-200 ${isCollapsed ? "invisible max-h-0 overflow-hidden opacity-0" : "visible mt-4 max-h-[2200px] opacity-100"}`}>
        <div className="space-y-3">
          <EditorBlock label="Description" large>
            <InlineEditableText
              value={scene.title}
              onChange={(value) => onChange({ ...scene, title: value })}
              placeholder="Short scene description"
            />
          </EditorBlock>

          <div className="grid gap-3 md:grid-cols-2">
            <EditorBlock label="Purpose">
              <InlineEditableText
                value={scene.purpose}
                onChange={(value) => onChange({ ...scene, purpose: value })}
                placeholder="Describe scene purpose"
              />
            </EditorBlock>

            <EditorBlock label="Estimated Duration">
              <InlineEditableText
                value={scene.estimatedDuration}
                onChange={(value) => onChange({ ...scene, estimatedDuration: value })}
                placeholder="8 sec"
              />
            </EditorBlock>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <EditorBlock label="Image Prompt">
              <InlineEditableText
                value={scene.imagePrompt}
                onChange={(value) => onChange({ ...scene, imagePrompt: value })}
                placeholder="Describe the generated image direction"
                multiline
                rows={4}
              />
            </EditorBlock>

            <EditorBlock label="Animation Prompt (Google Flow / OpenAI Sora 2 / OpenAI Sora 2 Pro)">
              <InlineEditableText
                value={scene.videoPrompt}
                onChange={(value) => onChange({ ...scene, videoPrompt: value })}
                placeholder="Camera movement, subject movement, environmental motion, pacing"
                multiline
                rows={4}
              />
            </EditorBlock>
          </div>
        </div>
      </div>
    </article>
  );
}

function EditorBlock({ label, children, large = false }: { label: string; children: React.ReactNode; large?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-900/35 px-3.5 py-3">
      <p className={`mb-2 text-slate-400 ${large ? "text-[11px] uppercase tracking-[0.2em]" : "text-[10px] uppercase tracking-[0.16em]"}`}>{label}</p>
      {children}
    </div>
  );
}

function IconToolbarButton({
  onClick,
  icon,
  label,
  disabled,
  tone = "default",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs transition disabled:cursor-not-allowed disabled:opacity-45 ${
        tone === "danger"
          ? "border-rose-500/40 text-rose-200 hover:border-rose-400"
          : "border-slate-700 text-slate-200 hover:border-cyan-300/40"
      }`}
    >
      <span className="sr-only">{label}</span>
      {icon}
    </button>
  );
}

function InlineEditableText({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
          rows={rows}
          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none"
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            setIsEditing(false);
          }
        }}
        autoFocus
        className="w-full rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none"
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="w-full rounded-lg px-2 py-2 text-left transition hover:bg-slate-800/40"
    >
      <span className={`block whitespace-pre-wrap ${multiline ? "min-h-[5.5rem] text-sm leading-6" : "min-h-[2.25rem] text-base leading-7"} text-slate-100`}>
        {value?.trim() || placeholder}
      </span>
    </button>
  );
}

function getStatusTone(status: StoryboardSceneStatus) {
  if (status === "Completed") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
  }

  if (status === "Editing") {
    return "border-violet-400/30 bg-violet-500/15 text-violet-200";
  }

  if (status.includes("Video")) {
    return "border-sky-400/30 bg-sky-500/15 text-sky-200";
  }

  if (status.includes("Images")) {
    return "border-amber-400/30 bg-amber-500/15 text-amber-200";
  }

  return "border-slate-500/40 bg-slate-700/30 text-slate-200";
}
