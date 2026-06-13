"use client";
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Library,
  Settings,
  Plus,
  Shield,
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

  return (
    <aside className="w-60 bg-[#0A1023] border-r border-slate-800 p-6">
      <div className="mb-10">
  <div className="flex items-center gap-3">

    <div className="w-11 h-11 rounded-xl bg-yellow-500 flex items-center justify-center">
      <Shield size={22} className="text-black" />
    </div>

    <div>
      <h1 className="text-xl font-bold text-[#D4AF37]">
        Gatekeeper AI
      </h1>

      <p className="text-xs text-slate-400">
        Your Knowledge. Your Advantage.
      </p>
    </div>

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
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
        isActive
          ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-300 border border-yellow-500/20"
          : "text-slate-300 hover:bg-slate-800/60"
      }`}
    >
      <Icon size={18} />
      <span>{item.name}</span>
    </Link>
  );
})}
      </nav>
    </aside>
  );
}