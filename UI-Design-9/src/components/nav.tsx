"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Today", icon: "◎" },
  { href: "/portfolio", label: "Portfolio", icon: "◧" },
  { href: "/markets", label: "Markets", icon: "◭" },
  { href: "/watchlists", label: "Watchlists", icon: "☆" },
  { href: "/news", label: "News", icon: "▤" },
  { href: "/research", label: "Research", icon: "✎" },
  { href: "/alerts", label: "Alerts", icon: "◔" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
              active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            }`}
          >
            <span className="w-4 text-center text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SubNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <div className="mb-6 flex gap-1 border-b border-slate-200">
      {items.map((i) => {
        const active = path === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              active ? "border-slate-900 font-medium text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </div>
  );
}
