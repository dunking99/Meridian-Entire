"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ReactNode } from "react";

const NAV: { href: string; label: string; glyph: string; hint: string }[] = [
  { href: "/", label: "Overview", glyph: "◈", hint: "Command centre" },
  { href: "/portfolio", label: "Portfolio", glyph: "▦", hint: "Holdings & cost basis" },
  { href: "/performance", label: "Performance", glyph: "◢", hint: "Returns vs benchmark" },
  { href: "/allocation", label: "Allocation", glyph: "◔", hint: "Drift & rebalancing" },
  { href: "/markets", label: "Markets", glyph: "◫", hint: "Indices, FX, commodities" },
  { href: "/watchlist", label: "Watchlist", glyph: "☆", hint: "Ideas with alerts" },
  { href: "/risk", label: "Risk", glyph: "⚠", hint: "Volatility, beta, drawdown" },
  { href: "/income", label: "Income", glyph: "⌾", hint: "Dividends & yield" },
  { href: "/ledger", label: "Ledger", glyph: "☰", hint: "Every transaction" },
  { href: "/lab", label: "Strategy Lab", glyph: "⚗", hint: "Backtests & what-ifs" },
  { href: "/data", label: "Data & Settings", glyph: "⚙", hint: "Pipeline & config" },
];

export default function AppShell({ children, lastSync }: { children: ReactNode; lastSync: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().slice(17, 25) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function runSync(scope: string, range: string) {
    setSyncing(true);
    setStatus(`Syncing ${scope}…`);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, range }),
      });
      const json = await res.json();
      setStatus(`${json.symbolsUpdated ?? 0} symbols · ${json.rowsWritten ?? 0} rows${json.synthetic ? " (offline model)" : ""}`);
    } catch {
      setStatus("Sync failed");
    } finally {
      setSyncing(false);
      start(() => router.refresh());
    }
  }

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-200">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-800/80 bg-[#0a0f1c]/80 px-3 py-4 backdrop-blur lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30">◈</div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-100">MERIDIAN</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">personal terminal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.hint}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                  active ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-500/25" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <span className="w-4 text-center text-xs opacity-80">{item.glyph}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-[10px] text-slate-500">
          <p className="uppercase tracking-widest text-slate-600">Clock</p>
          <p className="mt-0.5 tabular-nums text-slate-300">{clock || "—"}</p>
          <p className="mt-1.5 uppercase tracking-widest text-slate-600">Last sync</p>
          <p className="tabular-nums text-slate-300">{lastSync ? new Date(lastSync).toUTCString().slice(0, 22) + "Z" : "never"}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-[#070b14]/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid h-7 w-7 place-items-center rounded bg-indigo-500/20 text-indigo-300">◈</span>
            <span className="text-sm font-semibold">MERIDIAN</span>
          </div>
          <div className="hidden gap-1 overflow-x-auto lg:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`rounded px-2 py-1 text-[11px] ${active ? "text-indigo-300" : "text-slate-600 hover:text-slate-400"}`}>
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {status && <span className="hidden max-w-[280px] truncate text-[11px] text-slate-500 sm:block">{status}</span>}
            <button onClick={() => runSync("tracked", "1mo")} disabled={syncing}
              className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-indigo-500/50 hover:text-indigo-200 disabled:opacity-50">
              {syncing ? "Syncing…" : "Quick sync"}
            </button>
            <button onClick={() => runSync("universe", "5y")} disabled={syncing}
              className="rounded-md bg-indigo-500/90 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50">
              Full refresh
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>

        <footer className="border-t border-slate-800/80 px-6 py-3 text-[11px] text-slate-600">
          Meridian · single-user local terminal · prices via Yahoo Finance · history accumulates in Postgres
        </footer>
      </div>
    </div>
  );
}
