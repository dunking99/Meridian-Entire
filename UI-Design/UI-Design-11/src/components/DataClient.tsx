"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Td, Th } from "@/components/ui";
import { relativeTime } from "@/lib/format";

export type Coverage = { symbol: string; name: string; days: number; first: string; last: string };
export type SyncRow = {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  source: string;
  symbolsRequested: number;
  symbolsUpdated: number;
  rowsWritten: number;
  message: string | null;
};

export default function DataClient({
  coverage,
  logs,
  riskFreeRate,
}: {
  coverage: Coverage[];
  logs: SyncRow[];
  riskFreeRate: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [rf, setRf] = useState(riskFreeRate);
  const [filter, setFilter] = useState("");
  const [newSym, setNewSym] = useState({ symbol: "", yahooSymbol: "", name: "", assetClass: "etf", currency: "USD" });

  async function sync(scope: string, range: string, label: string) {
    setBusy(label);
    setStatus(`Running ${label}…`);
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, range }),
    });
    const json = await res.json();
    setStatus(
      `${label}: ${json.symbolsUpdated}/${json.symbolsRequested} symbols, ${(json.rowsWritten ?? 0).toLocaleString()} rows` +
        (json.synthetic ? " (offline model)" : ""),
    );
    setBusy(null);
    router.refresh();
  }

  async function saveRf() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "riskFreeRate", value: rf }),
    });
    setStatus("Risk-free rate saved");
    router.refresh();
  }

  async function addInstrument(e: React.FormEvent) {
    e.preventDefault();
    if (!newSym.symbol) return;
    setBusy("add");
    const res = await fetch("/api/instruments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSym),
    });
    const json = await res.json();
    setStatus(json.ok ? `Added ${json.symbol} with ${json.rows ?? 0} price rows` : json.error ?? "failed");
    setNewSym({ symbol: "", yahooSymbol: "", name: "", assetClass: "etf", currency: "USD" });
    setBusy(null);
    router.refresh();
  }

  const filtered = coverage.filter((c) => c.symbol.toLowerCase().includes(filter.toLowerCase()));
  const input = "rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500/60";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Price pipeline</h2>
          <p className="mt-0.5 text-xs text-slate-500">Yahoo Finance chart endpoint, deduplicated on (symbol, day).</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => sync("tracked", "1mo", "Quick refresh")} disabled={busy !== null} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50 disabled:opacity-50">
              {busy === "Quick refresh" ? "Running…" : "Quick refresh (1mo)"}
            </button>
            <button onClick={() => sync("tracked", "5y", "Deep backfill")} disabled={busy !== null} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50 disabled:opacity-50">
              {busy === "Deep backfill" ? "Running…" : "Deep backfill (5y)"}
            </button>
            <button onClick={() => sync("universe", "5y", "Whole universe")} disabled={busy !== null} className="rounded-md bg-indigo-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
              {busy === "Whole universe" ? "Running…" : "Whole universe"}
            </button>
          </div>
          {status && <p className="mt-3 text-xs text-slate-400">{status}</p>}

          <h2 className="mt-5 text-sm font-semibold text-slate-200">Recent runs</h2>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <Th>When</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Symbols</Th>
                  <Th className="text-right">Rows</Th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-slate-900/60 last:border-0">
                    <Td className="text-slate-400">{relativeTime(l.finishedAt ?? l.startedAt)}</Td>
                    <Td>
                      <Badge tone={l.status === "ok" ? "emerald" : l.status === "error" ? "rose" : "amber"}>{l.status}</Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{l.symbolsUpdated}/{l.symbolsRequested}</Td>
                    <Td className="text-right tabular-nums">{l.rowsWritten.toLocaleString()}</Td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-center text-slate-600">No runs yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-slate-200">Add an instrument</h2>
            <p className="mt-0.5 text-xs text-slate-500">Registered in the universe, then backfilled immediately.</p>
            <form onSubmit={addInstrument} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Symbol (MERIDIAN id)" value={newSym.symbol} onChange={(e) => setNewSym({ ...newSym, symbol: e.target.value.toUpperCase() })} required />
              <input className={input} placeholder="Yahoo ticker" value={newSym.yahooSymbol} onChange={(e) => setNewSym({ ...newSym, yahooSymbol: e.target.value })} />
              <input className={input} placeholder="Display name" value={newSym.name} onChange={(e) => setNewSym({ ...newSym, name: e.target.value })} />
              <select className={input} value={newSym.assetClass} onChange={(e) => setNewSym({ ...newSym, assetClass: e.target.value })}>
                {["equity", "etf", "bond", "commodity", "fx", "index", "crypto"].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <input className={input} placeholder="Currency" value={newSym.currency} onChange={(e) => setNewSym({ ...newSym, currency: e.target.value.toUpperCase() })} />
              <button disabled={busy === "add"} className="rounded-md bg-indigo-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                {busy === "add" ? "Adding…" : "Add & backfill"}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-slate-200">Model settings</h2>
            <p className="mt-0.5 text-xs text-slate-500">Used by Sharpe, Sortino and alpha calculations.</p>
            <div className="mt-3 flex items-center gap-2">
              <label className="flex flex-1 items-center gap-2 text-xs text-slate-400">
                Risk-free rate
                <input
                  type="number"
                  step={0.1}
                  value={(rf * 100).toFixed(1)}
                  onChange={(e) => setRf(Number(e.target.value) / 100)}
                  className="w-20 rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-right text-sm tabular-nums text-slate-200 outline-none focus:border-indigo-500/60"
                />
                %
              </label>
              <button onClick={saveRf} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50">
                Save
              </button>
              <a href="/api/export" className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50">
                Export ledger CSV
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50">
        <header className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Archive coverage</h2>
            <p className="mt-0.5 text-xs text-slate-500">{coverage.length} symbols with stored daily history</p>
          </div>
          <input
            placeholder="Filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-40 rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500/60"
          />
        </header>
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-900">
              <tr className="border-b border-slate-800">
                <Th>Symbol</Th>
                <Th>Name</Th>
                <Th className="text-right">Days</Th>
                <Th className="text-right">First</Th>
                <Th className="text-right">Last</Th>
                <Th>Depth</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.symbol} className="border-b border-slate-900/60 last:border-0">
                  <Td className="font-medium text-slate-100">{c.symbol}</Td>
                  <Td className="max-w-[240px] truncate text-xs text-slate-500">{c.name}</Td>
                  <Td className="text-right tabular-nums">{c.days.toLocaleString()}</Td>
                  <Td className="text-right tabular-nums text-slate-500">{c.first}</Td>
                  <Td className="text-right tabular-nums text-slate-500">{c.last}</Td>
                  <Td>
                    <div className="h-1.5 w-28 rounded bg-slate-800">
                      <div className="h-1.5 rounded bg-indigo-500/80" style={{ width: `${Math.min(100, (c.days / 1300) * 100)}%` }} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
