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
    <aside className="w-72 bg-slate-900 border-r border-slate-800 p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-1">
        Gatekeeper AI
      </h1>

      <p className="text-sm text-slate-400 mb-8">
        Your Knowledge. Your Advantage.
      </p>

      <nav className="space-y-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl ${
                isActive
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "text-slate-300 hover:bg-slate-800"
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