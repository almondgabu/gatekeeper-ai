"use client";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Library,
  Settings,
  Shield,
  Plus,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";


const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Knowledge Vault", href: "/vault", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  return (
  <aside
  className={`
    min-h-screen bg-[#0A1023]
    border-r border-slate-800
    transition-all duration-300
    ${collapsed ? "w-20 p-3" : "w-72 p-6"}
  `}
>
    <div className="flex justify-end mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-slate-400 hover:text-white"
      >
        {collapsed ? (
          <PanelLeftOpen size={20} />
        ) : (
          <PanelLeftClose size={20} />
        )}
      </button>
    </div>

    <div className="mb-10">
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-11 h-11 rounded-xl bg-yellow-500 flex items-center justify-center">
          <Shield size={22} className="text-black" />
        </div>

        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-[#D4AF37]">
              Gatekeeper AI
            </h1>

            <p className="text-xs text-slate-400">
              Your Knowledge. Your Advantage.
            </p>
          </div>
        )}
      </div>
    </div>

      <nav className="space-y-3">
 {menuItems.map((item) => {
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
<Link
  key={item.href}
  href={item.href}
  className={`group flex items-center ${
    collapsed ? "justify-center" : "gap-3"
  } px-4 py-3 rounded-xl transition-all duration-200 ${
    isActive
      ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-300 border border-yellow-500/20"
      : "text-slate-300 hover:bg-slate-800/60"
  }`}
>
  <Icon size={18} />

  {!collapsed && (
  <span>{item.name}</span>
)}
</Link>
  );
})}
      </nav>

<div className="mt-6">
  <button
    className="
      w-full
      bg-yellow-500
      hover:bg-yellow-400
      text-slate-950
      font-semibold
      rounded-xl
      py-3
      transition
      flex items-center justify-center gap-2
    "
  >
    <Plus size={18} />

    {!collapsed && (
      <span>New Chat</span>
    )}
  </button>


  
</div>

    </aside>
  );
}