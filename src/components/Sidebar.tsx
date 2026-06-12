"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Dashboard", href: "/" },
  { name: "Chat", href: "/chat" },
  { name: "Projects", href: "/projects" },
  { name: "Knowledge Vault", href: "/vault" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#0A1023] border-r border-slate-800 p-6">
      <div className="mb-10">
  <h1 className="text-3xl font-bold text-[#D4AF37] tracking-tight">
    Gatekeeper AI
  </h1>

  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mt-2">
    PRIVATE INTELLIGENCE WORKSPACE
  </p>
</div>
      <nav className="space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl ${
                isActive
                  ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-300 border border-yellow-500/20"
: "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}