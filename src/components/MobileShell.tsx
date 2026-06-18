"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, Brain } from "lucide-react";

export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Mobile drawer does not mount extra body-level debug elements in production

  return (
    <div className="flex min-h-screen h-screen w-full overflow-hidden bg-[#020617] text-white">
      {/* Desktop Sidebar */}
      <div className="hidden h-full md:block">
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
          <div className="md:hidden fixed left-0 top-0 h-[100dvh] min-h-[100dvh] overflow-hidden z-50 w-[300px] max-w-[85vw] bg-[#0A1023] border-r border-slate-800 shadow-xl">
            <div className="relative h-full min-h-[100dvh]">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-0 h-full overflow-x-hidden overflow-y-auto bg-[#020617] text-white pt-12 md:pt-0">
        {children}
      </main>
    </div>
  );
}