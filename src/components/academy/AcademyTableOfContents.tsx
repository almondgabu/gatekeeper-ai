import type { AcademySection } from "@/lib/academy/types";

export default function AcademyTableOfContents({ sections }: { sections: AcademySection[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Table of Contents</p>
      <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        {sections.map((section) => (
          <li key={section.id}>{section.title}</li>
        ))}
      </ul>
    </div>
  );
}
