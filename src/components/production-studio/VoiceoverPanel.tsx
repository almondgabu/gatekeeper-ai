"use client";

import { useState } from "react";
import { ReactNode } from "react";
import { Copy, Megaphone, MicVocal, Tags } from "lucide-react";

type VoiceoverPanelProps = {
  voiceover: string;
  cta: string;
  hashtags: string;
};

export default function VoiceoverPanel({ voiceover, cta, hashtags }: VoiceoverPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1200);
    } catch {
      setCopiedKey(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-[0_16px_45px_rgba(2,6,23,0.26)]">
      <div className="flex items-start gap-2.5">
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-1.5 text-cyan-200">
          <MicVocal size={14} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">Voiceover & Copy Deck</h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">Narration script, conversion CTA, and production-ready hashtag set.</p>
        </div>
      </div>

      <PanelBlock
        title="Voiceover"
        icon={<MicVocal size={12} />}
        value={voiceover}
        actionLabel={copiedKey === "voiceover" ? "Copied" : "Copy Voiceover"}
        emphasize
        onAction={() => copy(voiceover, "voiceover")}
      />
      <PanelBlock
        title="CTA"
        icon={<Megaphone size={12} />}
        value={cta}
        actionLabel={copiedKey === "cta" ? "Copied" : "Copy CTA"}
        onAction={() => copy(cta, "cta")}
      />
      <PanelBlock
        title="Hashtags"
        icon={<Tags size={12} />}
        value={hashtags}
        actionLabel={copiedKey === "hashtags" ? "Copied" : "Copy Tags"}
        mono
        onAction={() => copy(hashtags, "hashtags")}
      />
    </section>
  );
}

function PanelBlock({ title, icon, value, actionLabel, onAction, emphasize = false, mono = false }: { title: string; icon: ReactNode; value: string; actionLabel: string; onAction: () => void; emphasize?: boolean; mono?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${emphasize ? "border-cyan-300/25 bg-cyan-400/5" : "border-slate-700/80 bg-slate-950/60"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"><span className="text-cyan-200">{icon}</span>{title}</p>
        <button
          type="button"
          onClick={onAction}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${emphasize ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-50 hover:border-cyan-200/60" : "border-slate-700 text-slate-200 hover:border-cyan-300/40"}`}
        >
          <Copy size={11} />
          {actionLabel}
        </button>
      </div>
      <p className={`mt-2.5 whitespace-pre-wrap rounded-lg px-3 py-2.5 text-sm leading-7 ${mono ? "bg-slate-900/50 font-medium text-cyan-50" : "bg-slate-900/30 text-slate-200"}`}>{value}</p>
    </div>
  );
}
