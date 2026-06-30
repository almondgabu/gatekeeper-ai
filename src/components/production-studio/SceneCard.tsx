"use client";

import { useState } from "react";
import { Copy, RefreshCw, Sparkles, Video } from "lucide-react";

type SceneCardProps = {
  sceneNumber: number;
  timestamp: string;
  purpose: string;
  description: string;
  narration: string;
  imagePrompt: string;
  videoPrompt: string;
};

export default function SceneCard({
  sceneNumber,
  timestamp,
  purpose,
  description,
  narration,
  imagePrompt,
  videoPrompt,
}: SceneCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copyValue(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1200);
    } catch {
      setCopiedKey(null);
    }
  }

  return (
    <article className="w-[400px] shrink-0 rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.3)]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/90 pb-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
            {sceneNumber}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Scene {sceneNumber}</p>
            <p className="mt-1 text-sm font-semibold text-cyan-200">{timestamp}</p>
            <span className="mt-2 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-cyan-100">
              {purpose}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40"
        >
          <RefreshCw size={12} />
          Regenerate Scene
        </button>
      </div>

      <div className="mt-3.5 space-y-3 text-sm text-slate-200">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Narration</p>
          <p className="mt-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 leading-6 text-slate-200">{narration}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Description</p>
          <p className="mt-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 leading-6 text-slate-300">{description}</p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500"><Sparkles size={12} /> Image Prompt</p>
            <button
              type="button"
              onClick={() => copyValue(imagePrompt, `image-${sceneNumber}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40"
            >
              <Copy size={11} />
              {copiedKey === `image-${sceneNumber}` ? "Copied" : "Copy Image Prompt"}
            </button>
          </div>
          <p className="mt-2 rounded-lg bg-slate-900/40 px-2.5 py-2 text-xs leading-6 text-slate-300">{imagePrompt}</p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950/90 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500"><Video size={12} /> Video Prompt</p>
            <button
              type="button"
              onClick={() => copyValue(videoPrompt, `video-${sceneNumber}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40"
            >
              <Copy size={11} />
              {copiedKey === `video-${sceneNumber}` ? "Copied" : "Copy Video Prompt"}
            </button>
          </div>
          <p className="mt-2 rounded-lg bg-slate-900/40 px-2.5 py-2 text-xs leading-6 text-slate-300">{videoPrompt}</p>
        </div>
      </div>
    </article>
  );
}
