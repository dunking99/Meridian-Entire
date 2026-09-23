"use client";

import { useState } from "react";
import { MultiLineChart } from "@/components/charts";
import { Badge, Empty, Td, Th } from "@/components/ui";
import { fmtCurrency, fmtDate, fmtPct } from "@/lib/format";

type Result = {
  name: string;
  series: { day: string; value: number }[];
  final: number;
  cagr: number;
  vol: number;
  sharpe: number;
  maxDrawdown: number;
  contributed: number;
};

const COLORS = ["#818cf8", "#f59e0b", "#10b981", "#f472b6", "#38bdf8"];

export default function LabClient({ universe }: { universe: { symbol: string; name: string; assetClass: string }[] }) {
  const tradable = universe.filter((u) => ["equity", "etf", "bond", "commodity", "crypto"].includes(u.assetClass));
  const [weights, setWeights] = useState<Record<string, number>>({ VOO: 55, VXUS: 15, BND: 20, GLD: 10 });
  const [initial, setInitial] = useState(25000);
  const [monthly, setMonthly] = useState(1500);
  const [years, setYears] = useState(10);
  const [rebalance, setRebalance] = useState(true);
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(0);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  function setWeight(sym: string, v: number) {
    setWeights((w) => {
      const next = { ...w };
      if (v <= 0) delete next[sym];
      else next[sym] = v;
      return next;
    });
  }

  function addSymbol(sym: string) {
    if (!sym || weights[sym]) return;
    setWeights((w) => ({ ...w, [sym]: 10 }));
  }

  async function run() {
    setBusy(true);
    const res = await fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weights, initial, monthly, years, rebalance, compare: ["60/40", "S&P 500"] }),
    });
    const json = await res.json();
    setResults(json.results ?? []);
    setDays(json.days ?? 0);
    setBusy(false);
  }

  const chartSeries = (results ?? []).map((r) => ({ name: r.name, points: r.series }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Allocation</h2>
          <p className="mt-0.5 text-xs text-slate-500">Weights are normalised before the run.</p>
          <div className="mt-3 space-y-2">
            {Object.entries(weights).map(([sym, w]) => (
              <div key={sym} className="flex items-center gap-2">
                <span className="w-20 text-sm text-slate-200">{sym}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={w}
                  onChange={(e) => setWeight(sym, Number(e.target.value))}
                  className="h-1 flex-1 accent-indigo-500"
                />
                <span className="w-10 text-right text-xs tabular-nums text-slate-400">{w}%</span>
              </div>
            ))}
          </div>
          <select
            value=""
            onChange={(e) => addSymbol(e.target.value)}
            className="mt-3 w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500/60"
          >
            <option value="">+ add instrument…</option>
            {tradable
              .filter((t) => !weights[t.symbol])
              .map((t) => (
                <option key={t.symbol} value={t.symbol}>
                  {t.symbol} — {t.name}
                </option>
              ))}
          </select>
          <p className={`mt-2 text-xs tabular-nums ${Math.abs(total - 100) < 0.01 ? "text-emerald-400" : "text-amber-400"}`}>
            Total {total}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Parameters</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <NumField label="Initial" value={initial} onChange={setInitial} />
            <NumField label="Monthly" value={monthly} onChange={setMonthly} />
            <NumField label="Years" value={years} onChange={setYears} max={40} />
            <label className="flex items-center gap-2 text-slate-400">
              <input type="checkbox" checked={rebalance} onChange={(e) => setRebalance(e.target.checked)} className="accent-indigo-500" />
              Annual rebalance
            </label>
          </div>
          <button
            onClick={run}
            disabled={busy}
            className="mt-3 w-full rounded-md bg-indigo-500/90 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? "Running…" : "Run backtest"}
          </button>
          {days > 0 && <p className="mt-2 text-[11px] text-slate-500">{days} trading days of archive used.</p>}
        </div>
      </div>

      <div className="space-y-4 xl:col-span-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50">
          <header className="border-b border-slate-800/70 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-200">Simulated equity curves</h2>
            <p className="mt-0.5 text-xs text-slate-500">Same contributions, different allocations.</p>
          </header>
          <div className="p-4">
            {results && results.length ? (
              <MultiSeries series={chartSeries} />
            ) : (
              <Empty>Configure a mix and press “Run backtest”.</Empty>
            )}
          </div>
        </div>

        {results && results.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    <Th>Strategy</Th>
                    <Th className="text-right">Contributed</Th>
                    <Th className="text-right">Final</Th>
                    <Th className="text-right">Gain</Th>
                    <Th className="text-right">CAGR</Th>
                    <Th className="text-right">Vol</Th>
                    <Th className="text-right">Sharpe</Th>
                    <Th className="text-right">Max DD</Th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const gain = r.final - r.contributed;
                    return (
                      <tr key={r.name} className="border-b border-slate-900/60 last:border-0">
                        <Td className="font-medium text-slate-100">{r.name}</Td>
                        <Td className="text-right tabular-nums text-slate-400">{fmtCurrency(r.contributed, "USD", 0)}</Td>
                        <Td className="text-right font-medium tabular-nums text-slate-100">{fmtCurrency(r.final, "USD", 0)}</Td>
                        <Td className={`text-right tabular-nums ${gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {fmtCurrency(gain, "USD", 0)}
                        </Td>
                        <Td className="text-right tabular-nums">{fmtPct(r.cagr * 100)}</Td>
                        <Td className="text-right tabular-nums">{fmtPct(r.vol * 100, 1)}</Td>
                        <Td className="text-right tabular-nums">{r.sharpe.toFixed(2)}</Td>
                        <Td className="text-right">
                          <Badge tone={r.maxDrawdown < -0.35 ? "rose" : r.maxDrawdown < -0.2 ? "amber" : "emerald"}>
                            {fmtPct(r.maxDrawdown * 100, 1)}
                          </Badge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-[11px] text-slate-500">
              Simulated on archived daily closes from {results[0].series[0] ? fmtDate(results[0].series[0].day) : "—"} onward. Past returns do not
              imply future results — this is a research sandbox, not advice.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, max }: { label: string; value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
      <input
        type="number"
        value={value}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm tabular-nums text-slate-200 outline-none focus:border-indigo-500/60"
      />
    </label>
  );
}

function MultiSeries({ series }: { series: { name: string; points: { day: string; value: number }[] }[] }) {
  return (
    <MultiLineChart
      series={series}
      colors={COLORS}
      height={300}
      formatValue={(n) => new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD" }).format(n)}
    />
  );
}
