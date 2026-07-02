"use client";

import { GraduationCap, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AcademySidebar from "./AcademySidebar";
import AcademySection from "./AcademySection";
import AcademyTableOfContents from "./AcademyTableOfContents";
import { academySections } from "@/lib/academy/sections";

function scrollToSection(id: string) {
  const node = document.getElementById(id);
  if (!node) {
    return;
  }

  node.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function AcademyContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(academySections[0]?.id ?? "welcome");

  const sectionIds = useMemo(() => academySections.map((section) => section.id), []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSectionId(visible.target.id);
        }
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    for (const id of sectionIds) {
      const node = document.getElementById(id);
      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  function handleJump(id: string) {
    setActiveSectionId(id);
    scrollToSection(id);
    setDrawerOpen(false);
  }

  return (
    <section className="min-h-screen w-full overflow-x-hidden px-4 py-6 text-white md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1360px]">
        <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-5 md:px-7 md:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Gatekeeper Academy</p>
              <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">Gatekeeper AI Knowledge Center</h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-300">
                Version 1.0 | Creative Operating System. A permanent, read-only source of truth for users, developers, product owners, and future contributors.
              </p>
            </div>

            <button
              type="button"
              aria-label={drawerOpen ? "Close academy navigation" : "Open academy navigation"}
              onClick={() => setDrawerOpen((state) => !state)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100 md:hidden"
            >
              {drawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <div className="sticky top-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <AcademySidebar sections={academySections} activeId={activeSectionId} onJump={handleJump} />
            </div>
          </aside>

          {drawerOpen ? (
            <aside className="md:hidden">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                <AcademySidebar sections={academySections} activeId={activeSectionId} onJump={handleJump} />
              </div>
            </aside>
          ) : null}

          <main className="min-w-0 space-y-6" aria-label="Academy content">
            <AcademyTableOfContents sections={academySections} />

            <section id="welcome-title" className="rounded-2xl border border-slate-800 bg-slate-950/55 px-5 py-6 md:px-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500 text-slate-950">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Version 1.0</p>
                  <p className="text-base font-semibold text-white">Creative Operating System</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Gatekeeper AI is an AI Creative Director. It plans creative work, orchestrates approvals, and keeps campaign context flowing across modules. It does not render media or auto-publish to channels.
              </p>
            </section>

            {academySections.map((section) => (
              <AcademySection key={section.id} section={section} />
            ))}
          </main>
        </div>
      </div>
    </section>
  );
}
