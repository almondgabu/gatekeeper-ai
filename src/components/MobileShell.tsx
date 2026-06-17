"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, X } from "lucide-react";

export default function MobileShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-[#020617] border-b border-slate-800">
        <h1 className="font-bold text-yellow-400">
          Gatekeeper AI
        </h1>

        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60">
          <div className="relative w-[280px] max-w-[85vw] h-full">
            <Sidebar />

            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-[#020617] text-white min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}