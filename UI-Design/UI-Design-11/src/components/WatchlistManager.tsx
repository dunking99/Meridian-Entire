"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkline } from "@/components/charts";
import { Badge, Empty, Td, Th } from "@/components/ui";
import { fmtCurrency, fmtNumber } from "@/lib/format";

export type WatchItem = {
  symbol: string;
  note: string | null;
  targetHigh: number | null;
  targetLow: number | null;
};

export type WatchQuote = {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  changePct: number;
  currency: string;
  synthetic: boolean;
  spark: number[];
};

export default function WatchlistManager({
  items,
  quotes,
  suggest,
}: {
  items: WatchItem[];
  quotes: WatchQuote[];
  suggest: string[];
}) {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [note, setNote] = useState("");
  const [high, setHigh] = useState("");
  const [low, setLow] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qmap = new Map(quotes.map((q) => [q.symbol, q]));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: symbol.toUpperCase().trim(),
        note,
        targetHigh: high ? Number(high) : undefined,
        targetLow: low ? Number(low) : undefined,
      }),
    });
    const json = await res.json();
    if (!json.ok) setError(json.error ?? "failed");
    else {
      setSymbol("");
      setNote("");
      setHigh("");
      setLow("");
      router.refresh();
    }
    setBusy(false);
  }

  async function remove(sym: string) {
    await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, { method: "DELETE" });
    router.refresh();
  }

  const input = "rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500/60";

  return (
    <div>
      <form onSubmit={add} className="mb-4 grid gap-2 rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 lg:grid-cols-5">
        <input className={input} placeholder="Symbol (e.g. NVDA)" value={symbol} onChange={(e) => setSymbol(e.target.value)} required />
        <input className={input} placeholder="Thesis / note" value={note} onChange={(e) => setNote(e.target.value)} />
        <input className={input} placeholder="Alert above" inputMode="decimal" value={high} onChange={(e) => setHigh(e.target.value)} />
        <input className={input} placeholder="Alert below" inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value)} />
        <button disabled={busy} className="rounded-md bg-indigo-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
          {busy ? "Saving…" : "Add to watchlist"}
        </button>
        {error && <p className="text-xs text-rose-400 lg:col-span-5">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50">
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <Th>Symbol</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="text-right">Day</Th>
                  <Th className="text-right">Distance to band</Th>
                  <Th>Note</Th>
                  <Th className="text-right">Trend</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const q = qmap.get(it.symbol);
                  const breachHigh = q && it.targetHigh != null && q.price >= it.targetHigh;
                  const breachLow = q && it.targetLow != null && q.price <= it.targetLow;
                  const distHigh = q && it.targetHigh ? ((it.targetHigh / q.price - 1) * 100).toFixed(1) : null;
                  const distLow = q && it.targetLow ? ((q.price / it.targetLow - 1) * 100).toFixed(1) : null;
                  return (
                    <tr key={it.symbol} className="border-b border-slate-900/60 last:border-0">
                      <Td>
                        <p className="font-medium text-slate-100">{it.symbol}</p>
                        <p className="truncate text-xs text-slate-500">{q?.name ?? ""}</p>
                      </Td>
                      <Td>
                        {breachHigh ? (
                          <Badge tone="emerald">above target</Badge>
                        ) : breachLow ? (
                          <Badge tone="rose">below band</Badge>
                        ) : (
                          <Badge tone="slate">watching</Badge>
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">{q ? fmtNumber(q.price, q.price > 100 ? 2 : 4) : "—"}</Td>
                      <Td className={`text-right tabular-nums ${(q?.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {q ? `${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
                      </Td>
                      <Td className="text-right text-xs tabular-nums text-slate-400">
                        {distHigh ? `+${distHigh}% to high` : null}
                        {distHigh && distLow ? " · " : null}
                        {distLow ? `${distLow}% above low` : null}
                        {!distHigh && !distLow ? "—" : null}
                      </Td>
                      <Td className="max-w-[220px] truncate text-xs text-slate-400">{it.note ?? "—"}</Td>
                      <Td className="text-right">
                        {q ? <Sparkline data={q.spark.length > 2 ? q.spark : [q.previousClose, q.price]} width={70} height={22} /> : null}
                      </Td>
                      <Td className="text-right">
                        <button onClick={() => remove(it.symbol)} className="text-xs text-slate-500 hover:text-rose-400">
                          remove
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <Empty>Your watchlist is empty. Add a ticker with an alert band and Meridian will flag breaches.</Empty>
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-slate-600">
        Universe shortcuts: {suggest.slice(0, 24).join(" · ")}
      </p>
      <p className="mt-1 text-[11px] text-slate-600">
        Values shown in each instrument&apos;s native currency — {fmtCurrency(1)} baseline for USD quotes.
      </p>
    </div>
  );
}
