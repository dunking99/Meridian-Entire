import { useMemo, useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Button, Card, CardHeader, Field, Info, inputCls } from "../components/ui";
import { AreaChart, DivergingBars } from "../components/charts";
import { fmtDate, fmtMoney, fmtPct } from "../lib/format";
import { cn } from "../utils/cn";
import type { FlowKind } from "../data/portfolio";

export function PerformanceTab() {
  const { performance: perf, portfolio: p, flows, addFlow, removeFlow, openHolding } = usePortfolio();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), kind: "Deposit" as FlowKind, amount: "", note: "" });

  const chart = useMemo(() => {
    const n = Math.min(perf.indexSeries.dates.length, 1300);
    return {
      dates: perf.indexSeries.dates.slice(-n),
      port: perf.indexSeries.port.slice(-n).map((v) => v * 100),
      bench: perf.indexSeries.bench.slice(-n).map((v) => v * 100),
    };
  }, [perf]);

  const submit = () => {
    const amt = parseFloat(form.amount);
    if (!amt || !form.date) return;
    const signed = form.kind === "Withdrawal" || form.kind === "Fee" ? -Math.abs(amt) : Math.abs(amt);
    addFlow({ date: form.date, kind: form.kind, amount: signed, note: form.note || `${form.kind} recorded manually` });
    setForm({ ...form, amount: "", note: "" });
  };

  const totalIn = flows.filter((f) => f.amount > 0).reduce((a, f) => a + f.amount, 0);
  const totalOut = flows.filter((f) => f.amount < 0).reduce((a, f) => a + f.amount, 0);

  return (
    <div className="space-y-4">
      {/* -------------------------------------------------- return cards */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-teal-400/[0.07] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">Money-weighted · your return</span>
              <Info text="Internal rate of return over every deposit and withdrawal you have made. This is what actually happened to your money — the size and timing of contributions is part of the answer." />
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className={cn("num text-[34px] leading-none font-semibold tracking-tight", (perf.mwr ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {perf.mwr != null ? fmtPct(perf.mwr, 2, true) : "—"}
              </span>
              <span className="pb-1 text-[11px] text-zinc-500">per year</span>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">
              Solved as an XIRR across {flows.length} external cash flows and a terminal value of {fmtMoney(p.totalValue, { dp: 0 })}. Includes the
              effect of when you put money in — the number a bank statement would agree with.
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-indigo-400/[0.07] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">Time-weighted · the strategy's return</span>
              <Info text="Chain-linked daily returns with the effect of deposits and withdrawals removed. This is the figure that is fair to compare against an index or a fund factsheet." />
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span className={cn("num text-[34px] leading-none font-semibold tracking-tight", perf.twrPct >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {fmtPct(perf.twrPct, 2, true)}
              </span>
              <span className="pb-1 text-[11px] text-zinc-500">per year</span>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">
              Every day's return chained together with flows stripped out at the point they land. Judge the selection decisions on this; judge
              yourself on the one to the left.
            </p>
          </div>
        </Card>
      </div>

      {/* --------------------------------------------------------- timing */}
      <Card
        className={cn(
          perf.verdict.tone === "good" ? "border-emerald-400/20" : perf.verdict.tone === "bad" ? "border-rose-400/20" : "border-white/[0.07]",
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-center">
              <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">Timing gap</div>
              <div
                className={cn(
                  "num mt-1 text-[30px] leading-none font-semibold tracking-tight",
                  perf.gap > 0.05 ? "text-emerald-400" : perf.gap < -0.05 ? "text-rose-400" : "text-zinc-300",
                )}
              >
                {perf.gap >= 0 ? "+" : "−"}
                {Math.abs(perf.gap).toFixed(2)}
                <span className="text-[15px] text-zinc-500">pp</span>
              </div>
            </div>
            <div className="hidden h-12 w-px bg-white/10 lg:block" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-zinc-100">{perf.verdict.title}</h3>
              <Badge tone={perf.verdict.tone === "good" ? "up" : perf.verdict.tone === "bad" ? "down" : "neutral"}>
                MWR − TWR
              </Badge>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-zinc-400">{perf.verdict.body}</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 lg:w-[220px]">
            <MiniStat label="Contributed" value={fmtMoney(totalIn, { compact: true })} />
            <MiniStat label="Withdrawn" value={fmtMoney(Math.abs(totalOut), { compact: true })} />
          </div>
        </div>
      </Card>

      {/* --------------------------------------------------- vs benchmark */}
      <Card>
        <CardHeader
          title="Versus benchmark"
          subtitle="Global equity blend, rebased to 100 at the portfolio's inception. Both lines are time-weighted so the comparison is fair."
          right={
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-1.5 w-4 rounded-full bg-teal-400" /> Portfolio
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-1.5 w-4 rounded-full bg-zinc-500" /> Benchmark
              </span>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_216px]">
          <AreaChart
            dates={chart.dates}
            series={[
              { values: chart.port, color: "#2dd4bf", label: "Portfolio" },
              { values: chart.bench, color: "#8b93a1", label: "Benchmark", fill: false, dashed: true },
            ]}
            height={216}
            format={(v) => v.toFixed(0)}
            baseline={100}
          />
          <div className="space-y-2.5">
            <BigStat label="Portfolio (TWR)" value={fmtPct(perf.twrPct, 2, true)} tone={perf.twrPct >= 0 ? "up" : "down"} sub="annualised" />
            <BigStat label="Benchmark" value={fmtPct(perf.benchReturn, 2, true)} tone="neutral" sub="annualised" />
            <div
              className={cn(
                "rounded-lg border p-3",
                perf.excess >= 0 ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-rose-400/25 bg-rose-400/[0.06]",
              )}
            >
              <div className="text-[9.5px] tracking-wider text-zinc-400 uppercase">Difference</div>
              <div className={cn("num mt-1 text-[22px] leading-none font-semibold", perf.excess >= 0 ? "text-emerald-300" : "text-rose-300")}>
                {perf.excess >= 0 ? "+" : "−"}
                {Math.abs(perf.excess).toFixed(2)}pp
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500">
                {perf.excess >= 0
                  ? "Ahead of the blend. Check the attribution below before crediting skill — concentration can produce this on its own."
                  : "Behind the blend. The question worth asking is whether the shortfall is coming from the sectors you chose or the names inside them."}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------- cash-flow ledger */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader title="Record a cash flow" subtitle="Deposits and withdrawals drive the money-weighted figure" />
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Date">
                <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Kind">
                <select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as FlowKind })}>
                  <option>Deposit</option>
                  <option>Withdrawal</option>
                  <option>Dividend</option>
                  <option>Fee</option>
                </select>
              </Field>
            </div>
            <Field label="Amount" hint="Withdrawals and fees are recorded as negative automatically">
              <input type="number" placeholder="0.00" className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Note">
              <input placeholder="e.g. ISA allowance 26/27" className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            <Button variant="primary" className="w-full" onClick={submit} disabled={!form.amount}>
              Record flow
            </Button>
            <p className="text-[10px] leading-relaxed text-zinc-600">
              Adding a flow immediately re-solves the XIRR, the time-weighted chain and the cash balance shown on Holdings.
            </p>
          </div>
        </Card>

        <Card pad={false}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <h3 className="text-[13px] font-semibold text-zinc-100">Cash-flow ledger</h3>
              <p className="mt-0.5 text-[11px] text-zinc-500">{flows.length} recorded movements · net {fmtMoney(p.netContributed, { dp: 0 })}</p>
            </div>
          </div>
          <div className="max-h-[330px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[#0c0f14]">
                <tr className="border-b border-white/[0.06]">
                  {["Date", "Kind", "Note", "Amount", ""].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "px-3 py-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase",
                        i >= 3 ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...flows]
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .map((f) => (
                    <tr key={f.id} className="group border-b border-white/[0.03] transition last:border-0 hover:bg-white/[0.025]">
                      <td className="num px-3 py-2 text-[11px] whitespace-nowrap text-zinc-400">{fmtDate(f.date)}</td>
                      <td className="px-3 py-2">
                        <Badge tone={f.amount >= 0 ? (f.kind === "Dividend" ? "info" : "up") : f.kind === "Fee" ? "ghost" : "down"}>{f.kind}</Badge>
                      </td>
                      <td className="max-w-[260px] truncate px-3 py-2 text-[11px] text-zinc-500">
                        {f.note}
                        {f.derived && <span className="ml-1.5 text-[9px] text-zinc-700">(reconciled)</span>}
                      </td>
                      <td className={cn("num px-3 py-2 text-right text-[11.5px] font-medium", f.amount >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {fmtMoney(f.amount, { dp: 0, sign: true })}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => removeFlow(f.id)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-zinc-700 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ----------------------------------------------------- attribution */}
      <Card>
        <CardHeader
          title="Attribution"
          subtitle={`Cariño-linked contribution over the last ${perf.periodLabel}. Contributions sum exactly to the reconciled total return of ${perf.linkedTotal.toFixed(2)}%.`}
          right={<Badge tone="ai">reconciled</Badge>}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">Contribution by holding</span>
              <span className="text-[10px] text-zinc-600">percentage points</span>
            </div>
            <DivergingBars
              items={perf.attribution.map((a) => ({
                key: a.symbol,
                label: a.symbol,
                value: a.contribution,
                sub: `${a.avgWeight.toFixed(1)}%`,
              }))}
              format={(v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`}
            />
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {perf.best && (
                <button
                  onClick={() => openHolding(perf.best!.symbol)}
                  className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] p-2.5 text-left transition hover:border-emerald-400/40"
                >
                  <div className="text-[9.5px] tracking-wider text-emerald-300/70 uppercase">Best contributor</div>
                  <div className="num mt-1 text-[13px] font-semibold text-zinc-100">{perf.best.symbol}</div>
                  <div className="num text-[11px] text-emerald-400">+{perf.best.contribution.toFixed(2)}pp</div>
                  <div className="mt-1 text-[10px] text-zinc-600">avg weight {perf.best.avgWeight.toFixed(1)}%</div>
                </button>
              )}
              {perf.worst && (
                <button
                  onClick={() => openHolding(perf.worst!.symbol)}
                  className="rounded-lg border border-rose-400/20 bg-rose-400/[0.05] p-2.5 text-left transition hover:border-rose-400/40"
                >
                  <div className="text-[9.5px] tracking-wider text-rose-300/70 uppercase">Worst contributor</div>
                  <div className="num mt-1 text-[13px] font-semibold text-zinc-100">{perf.worst.symbol}</div>
                  <div className="num text-[11px] text-rose-400">{perf.worst.contribution.toFixed(2)}pp</div>
                  <div className="mt-1 text-[10px] text-zinc-600">avg weight {perf.worst.avgWeight.toFixed(1)}%</div>
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">Allocation vs selection by sector</span>
              <Info text="Brinson decomposition. Allocation is the effect of over- or under-weighting a sector relative to the benchmark. Selection is the effect of the specific names chosen inside it." />
            </div>
            <div className="overflow-hidden rounded-lg border border-white/[0.06]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.015]">
                    {["Sector", "Wgt", "Bmk", "Alloc", "Selec", "Total"].map((h, i) => (
                      <th key={h} className={cn("px-2 py-1.5 text-[9.5px] font-semibold tracking-wider text-zinc-500 uppercase", i === 0 ? "text-left" : "text-right")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perf.sectorEffects.map((e) => (
                    <tr key={e.sector} className="border-b border-white/[0.03] last:border-0">
                      <td className="max-w-[110px] truncate px-2 py-1.5 text-[11px] text-zinc-300">{e.sector}</td>
                      <td className="num px-2 py-1.5 text-right text-[10.5px] text-zinc-400">{e.portWeight.toFixed(1)}</td>
                      <td className="num px-2 py-1.5 text-right text-[10.5px] text-zinc-600">{e.benchWeight.toFixed(1)}</td>
                      <td className={cn("num px-2 py-1.5 text-right text-[10.5px]", e.allocation >= 0 ? "text-emerald-400/80" : "text-rose-400/80")}>
                        {e.allocation >= 0 ? "+" : "−"}
                        {Math.abs(e.allocation).toFixed(2)}
                      </td>
                      <td className={cn("num px-2 py-1.5 text-right text-[10.5px]", e.selection >= 0 ? "text-emerald-400/80" : "text-rose-400/80")}>
                        {e.selection >= 0 ? "+" : "−"}
                        {Math.abs(e.selection).toFixed(2)}
                      </td>
                      <td className={cn("num px-2 py-1.5 text-right text-[11px] font-medium", e.total >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {e.total >= 0 ? "+" : "−"}
                        {Math.abs(e.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-white/[0.025]">
                    <td className="px-2 py-1.5 text-[10.5px] font-medium text-zinc-300">Total</td>
                    <td colSpan={2} />
                    <td className={cn("num px-2 py-1.5 text-right text-[10.5px] font-semibold", perf.allocationTotal >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {perf.allocationTotal >= 0 ? "+" : "−"}
                      {Math.abs(perf.allocationTotal).toFixed(2)}
                    </td>
                    <td className={cn("num px-2 py-1.5 text-right text-[10.5px] font-semibold", perf.selectionTotal >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {perf.selectionTotal >= 0 ? "+" : "−"}
                      {Math.abs(perf.selectionTotal).toFixed(2)}
                    </td>
                    <td className="num px-2 py-1.5 text-right text-[11px] font-semibold text-zinc-100">
                      {(perf.allocationTotal + perf.selectionTotal).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 rounded-lg border border-violet-400/15 bg-violet-400/[0.04] p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-violet-400/20 text-[9px] text-violet-300">✦</span>
                <span className="text-[10px] font-semibold tracking-wider text-violet-200/80 uppercase">Commentary on the reconciled figures</span>
              </div>
              <div className="space-y-1.5">
                {perf.commentary.map((c, i) => (
                  <p key={i} className="text-[11px] leading-relaxed text-zinc-400">
                    {c}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5">
      <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{label}</div>
      <div className="num mt-1 text-[14px] font-semibold text-zinc-100">{value}</div>
    </div>
  );
}

function BigStat({ label, value, tone, sub }: { label: string; value: string; tone: "up" | "down" | "neutral"; sub: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
      <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{label}</div>
      <div className={cn("num mt-1 text-[20px] leading-none font-semibold", tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-zinc-200")}>
        {value}
      </div>
      <div className="mt-1 text-[10px] text-zinc-600">{sub}</div>
    </div>
  );
}


