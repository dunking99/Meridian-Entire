"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SearchPayload = {
  instruments: { symbol: string; name: string; sector: string | null }[];
  news: { id: number; headline: string; source: string }[];
  notes: { id: number; title: string; kind: string }[];
  theses: { id: number; title: string; status: string }[];
  trades: { trade: { id: number; side: string; quantity: number; price: number }; symbol: string }[];
  journal: { id: number; title: string; kind: string }[];
};

const NAV: { group: string; items: { href: string; label: string; hint: string }[] }[] = [
  { group: "Desk", items: [{ href: "/", label: "Today", hint: "Cross-domain brief" }] },
  {
    group: "Portfolio",
    items: [
      { href: "/portfolio", label: "Overview", hint: "Positions, allocation, attribution" },
      { href: "/portfolio/trades", label: "Trade log", hint: "Every fill + rationale" },
    ],
  },
  {
    group: "Markets",
    items: [
      { href: "/markets", label: "Overview", hint: "Indices, sectors, breadth" },
      { href: "/markets/screener", label: "Screener", hint: "Filter the universe" },
      { href: "/markets/calendar", label: "Calendar", hint: "Catalysts, earnings, macro" },
    ],
  },
  {
    group: "News",
    items: [
      { href: "/news", label: "Feed", hint: "Relevance-ranked tape" },
      { href: "/news?scope=mine", label: "Impacting book", hint: "Held names only" },
      { href: "/news?scope=saved", label: "Saved", hint: "Reading list" },
    ],
  },
  {
    group: "Research",
    items: [
      { href: "/research", label: "Cockpit", hint: "Theses + conviction" },
      { href: "/research/notes", label: "Notes", hint: "Memos, models, sources" },
      { href: "/journal", label: "Journal", hint: "Decisions + reviews" },
    ],
  },
  {
    group: "Radar",
    items: [
      { href: "/watchlists", label: "Watchlists", hint: "Triggers + reasons" },
      { href: "/alerts", label: "Alerts", hint: "Rules + fired events" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/search", label: "Search", hint: "Everything, one box" },
      { href: "/settings", label: "Settings", hint: "Accounts, data ops" },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-4 px-2 py-3 text-sm">
      {NAV.map((group) => (
        <div key={group.group}>
          <div className="px-2 pb-1 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">{group.group}</div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const base = item.href.split("?")[0];
              const active = base === "/" ? pathname === "/" : pathname.startsWith(base);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.hint}
                    className={`block rounded-md px-2 py-1.5 transition ${
                      active ? "bg-slate-800/80 text-slate-100" : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchPayload | null>(null);
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 1) {
      setData(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setData((await res.json()) as SearchPayload);
    }, 160);
    return () => clearTimeout(t);
  }, [q, open]);

  const results = useMemo(() => {
    if (!data) return [] as { label: string; sub: string; href: string; kind: string }[];
    return [
      ...data.instruments.map((i) => ({ label: i.symbol, sub: `${i.name} · ${i.sector ?? "—"}`, href: `/markets/${encodeURIComponent(i.symbol)}`, kind: "Instrument" })),
      ...data.theses.map((t) => ({ label: t.title, sub: t.status, href: `/research/theses/${t.id}`, kind: "Thesis" })),
      ...data.news.map((n) => ({ label: n.headline, sub: n.source, href: `/news/${n.id}`, kind: "News" })),
      ...data.notes.map((n) => ({ label: n.title, sub: n.kind, href: `/research/notes/${n.id}`, kind: "Note" })),
      ...data.journal.map((j) => ({ label: j.title, sub: j.kind, href: `/journal`, kind: "Journal" })),
      ...data.trades.map((t) => ({ label: `${t.trade.side.toUpperCase()} ${t.symbol} @ ${t.trade.price}`, sub: `trade #${t.trade.id}`, href: `/portfolio/trades`, kind: "Trade" })),
    ].slice(0, 24);
  }, [data]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQ("");
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
      >
        <span>Search</span>
        <kbd className="rounded border border-slate-700 bg-slate-800 px-1 text-[10px] text-slate-500">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 p-4 pt-24 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => Math.min(c + 1, results.length - 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => Math.max(c - 1, 0));
                }
                if (e.key === "Enter" && results[cursor]) go(results[cursor].href);
              }}
              placeholder="Search instruments, theses, news, notes…"
              className="w-full border-b border-slate-800 bg-transparent px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && <p className="px-4 py-6 text-center text-xs text-slate-500">{q ? "No matches yet." : "Type a ticker, theme, or phrase."}</p>}
              {results.map((r, i) => (
                <button
                  key={`${r.kind}-${r.href}-${i}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(r.href)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs transition ${
                    i === cursor ? "bg-slate-800/80" : "hover:bg-slate-800/50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-slate-200">{r.label}</span>
                    <span className="block truncate text-[11px] text-slate-500">{r.sub}</span>
                  </span>
                  <span className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">{r.kind}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
