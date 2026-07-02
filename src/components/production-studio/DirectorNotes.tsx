import { NotebookPen } from "lucide-react";

type DirectorNotesProps = {
  note: string;
};

export default function DirectorNotes({ note }: DirectorNotesProps) {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.88))] p-5 shadow-[0_16px_45px_rgba(2,6,23,0.26)]">
      <div className="flex items-start gap-2.5">
        <div className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-1.5 text-cyan-200">
          <NotebookPen size={14} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-200">Director Notes</h3>
          <p className="mt-1 text-xs leading-6 text-slate-400">Why the current structure was chosen for audience psychology and pacing.</p>
          <p className="mt-2.5 text-sm leading-8 text-slate-300">{note}</p>
        </div>
      </div>
    </section>
  );
}
