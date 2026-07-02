"use client";

import type { AcademySection } from "@/lib/academy/types";
import AcademySearch from "./AcademySearch";

export default function AcademySidebar({
  sections,
  activeId,
  onJump,
}: {
  sections: AcademySection[];
  activeId: string;
  onJump: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <AcademySearch sections={sections} onJump={onJump} />

      <nav aria-label="Academy section navigation" className="space-y-1">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onJump(section.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                isActive
                  ? "bg-cyan-400/10 text-cyan-200"
                  : "text-slate-300 hover:bg-slate-800/70"
              }`}
            >
              {section.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
