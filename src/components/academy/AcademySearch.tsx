"use client";

import { useMemo, useState } from "react";
import type { AcademySection } from "@/lib/academy/types";

type SearchIndexItem = {
  id: string;
  title: string;
  terms: string;
};

export default function AcademySearch({
  sections,
  onJump,
}: {
  sections: AcademySection[];
  onJump: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const index = useMemo<SearchIndexItem[]>(() => {
    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      terms: [section.title, ...section.keywords].join(" ").toLowerCase(),
    }));
  }, [sections]);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [] as SearchIndexItem[];
    }

    return index.filter((item) => item.terms.includes(normalized)).slice(0, 8);
  }, [index, query]);

  return (
    <div className="space-y-2" role="search" aria-label="Academy search">
      <label htmlFor="academy-search" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Search Documentation
      </label>
      <input
        id="academy-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search headings and keywords"
        className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white outline-none transition focus:border-cyan-300"
      />

      {matches.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-slate-800 bg-slate-950/90 p-2" aria-label="Search results">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                onClick={() => {
                  onJump(match.id);
                  setQuery("");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {match.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
