"use client";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Target,
  Library,
  BookOpen,
  Clapperboard,
  Settings,
  Shield,
  Plus,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConversationList from "./ConversationList";


const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Opportunities", href: "/opportunities", icon: Target },
  { name: "Knowledge Vault", href: "/vault", icon: Library },
  // TODO (Phase 1.1): Add "NEW" badge beside AI Idea Explorer navigation item.
  { name: "AI Idea Explorer", href: "/content-studio", icon: Clapperboard },
  { name: "User Guide", href: "/guide", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  return (
  <aside
  className={`
    flex h-full min-h-0 flex-col overflow-hidden bg-[#0A1023]
    border-r border-slate-800
    transition-all duration-300
    ${collapsed ? "w-20 p-3" : "w-64 p-4"}
  `}
>
    <div className="mb-4 hidden shrink-0 justify-end md:flex">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-slate-400 hover:text-white"
      >
        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>
    </div>

    {/* Sticky top: header + New Chat + mobile search */}
    <div className="sticky top-0 z-40 shrink-0 bg-[#0A1023] -mx-4 px-4 py-4 md:py-0">
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} mb-3`}>
        <div className="w-11 h-11 rounded-xl bg-yellow-500 flex items-center justify-center">
          <Shield size={22} className="text-black" />
        </div>

        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-[#D4AF37]">Gatekeeper AI</h1>
            <p className="text-xs text-slate-400">Your Knowledge. Your Advantage.</p>
          </div>
        )}
      </div>

      <div className="md:hidden mb-3">
        <Link
          href="/chat?new=1"
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-semibold rounded-xl py-3 transition flex items-center justify-center gap-2"
          onClick={() => onNavigate?.()}
        >
          <Plus size={18} />
          {!collapsed && <span>New Chat</span>}
        </Link>
      </div>

      {/* mobile search (sticky with header) */}
      <div className="md:hidden mb-2">
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-400"
        />
      </div>
    </div>

      <nav className="shrink-0 space-y-2 text-sm">
 {menuItems.map((item) => {
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      key={item.href}
      href={item.href}
      className={`group flex items-center ${
        collapsed ? "justify-center" : "gap-3"
      } px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-300 border border-yellow-500/20"
          : "text-slate-300 hover:bg-slate-800/60"
      }`}
      onClick={() => onNavigate?.()}
    >
      <Icon size={18} />

      {!collapsed && <span>{item.name}</span>}
    </Link>
  );
})}

      </nav>

    {/* Conversation list (scrollable) */}
    <div className="mt-5 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-0">
      <ConversationList showSearch={false} />
    </div>

    </aside>
  );
}