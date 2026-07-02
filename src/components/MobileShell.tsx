"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, Brain } from "lucide-react";

export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // Mobile drawer does not mount extra body-level debug elements in production

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#020617] text-white md:h-screen md:overflow-y-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden h-full min-h-0 md:block">
        <Sidebar />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-start px-3 py-2 bg-[#020617] border-b border-slate-800">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3 ml-3">
          <div className="w-9 h-9 rounded-md bg-yellow-500 flex items-center justify-center">
            <Brain size={18} className="text-black" />
          </div>
          <h1 className="font-semibold text-yellow-400">Gatekeeper AI</h1>
        </div>
      </div>

      {/* Mobile Overlay */}
      {/* Mobile Overlay + Left Panel */}
      {open && (
        <>
          {/* Dark backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/70"
            onClick={() => setOpen(false)}
          />

          {/* Left drawer panel */}
          <div className="md:hidden fixed inset-y-0 left-0 z-50 h-dvh w-[300px] max-w-[85vw] overflow-hidden border-r border-slate-800 bg-[#0A1023] shadow-xl">
            <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden overflow-y-visible bg-[#020617] pt-12 text-white md:h-full md:min-h-0 md:overflow-y-auto md:pt-0">
        {children}
        <footer className="mt-8 border-t border-slate-800/80 px-5 py-6 text-xs text-slate-500 md:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl space-y-1.5">
            <p className="text-slate-400">Gatekeeper AI Version 1.0</p>
            <p>Designed &amp; Owned by Almond Gabu</p>
            <p>Creative Operating System</p>
            <p>Powered by Next.js, React, TypeScript &amp; OpenAI</p>
            <p className="pt-1 text-slate-600">© {currentYear} Almond Gabu. All Rights Reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}