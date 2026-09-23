import { useMemo, useState } from "react";
import {
  HOLDINGS, VALUE_SERIES, DATES, PORT_TWR, BENCH_TWR, TOTAL_VALUE, INVESTED, CASH, CASH_TOTAL,
  CASH_WEIGHT, TOTAL_UNREALIZED, TOTAL_COST, DAY_PL, DAY_PL_PCT, NET_CONTRIBUTED, LIFETIME_GAIN,
  RANGES, rangeStart, type Range, MOVERS, groupBy, ANNUAL_INCOME, CASH_INCOME, PORT_YIELD, RISK,
  TRANSACTIONS, DIV_CALENDAR, TOP5_WEIGHT, EFFECTIVE_N, N,
} from "@/data/portfolio";
import { SIGNALS } from "@/data/signals";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Pill, Bar, KV } from "@/components/ui/Primitives";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { LineChart } from "@/components/charts/LineChart";
import { Donut, Sparkline, Columns } from "@/components/charts/Micro";
import { HoldingsTable } from "@/components/HoldingsTable";
import { CLASS_COLORS } from "@/lib/palette";
import { fmtUSD0, fmtUSD, fmtPct, fmtCompact, clsTone, fmtDateShort, MONTHS } from "@/lib/format";
import { cn } from "@/utils/cn";
import { IconArrow, IconDownload, IconSpark, IconScale } from "@/components/ui/icons";
import { exportPositions } from "@/lib/csv";

function HeroStat({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: string }) {
  return (
    <div className="px-4 py-3 first:pl-0">
      <Label>{k}</Label>
      <div className={cn("tnum mt-1 text-[15px] font-semibold text-mist-100", tone)}>{v}</div>
      {sub && <div className="mt-0.5 text-[10.5px] text-mist-500">{sub}</div>}
    </div>
  );
}

export function Overview() {
  const { setFocus, setTab } = useApp();
  const [range, setRange] = useState<Range>("1Y");
  const [mode, setMode] = useState<"Value" | "Benchmark">("Value");

  const start = rangeStart(range);
  const labels = DATES.slice(start);
  const values = VALUE_SERIES.slice(start);

  const chart = useMemo(() => {
    if (mode === "Value") {
      return [
        { id: "val", label: "Portfolio", values: values.map((v) => v.value), color: "#63e6d2", area: true, width: 1.8 },
        { id: "con", label: "Net invested", values: values.map((v) => v.contributed), color: "#5b6575", dashed: true, width: 1.2 },
      ];
    }
    const p = PORT_TWR.slice(start);
    const b = BENCH_TWR.slice(start);
    return [
      { id: "p", label: "Portfolio", values: p.map((v) => (v / p[0]) * 100), color: "#63e6d2", area: true, width: 1.8 },
      { id: "b", label: "S&P 500", values: b.map((v) => (v / b[0]) * 100), color: "#a894fa", width: 1.4 },
    ];
  }, [mode, start, values]);

  const periodPL = values[values.length - 1].value - values[0].value;
  const periodRet = (PORT_TWR[N - 1] / PORT_TWR[start] - 1) * 100;
  const benchRet = (BENCH_TWR[N - 1] / BENCH_TWR[start] - 1) * 100;
  const netFlow = values[values.length - 1].contributed - values[0].contributed;

  const classSlices = useMemo(() => {
    const g = groupBy("assetClass").map((x) => ({
      label: x.label,
      value: x.value,
      color: CLASS_COLORS[x.label] ?? "#626c7c",
      sub: fmtCompact(x.value),
    }));
    g.push({ label: "Cash", value: CASH_TOTAL, color: CLASS_COLORS.Cash, sub: fmtCompact(CASH_TOTAL) });
    return g.sort((a, b) => b.value - a.value);
  }, []);

  const gainers = MOVERS.slice(0, 3);
  const losers = [...MOVERS].reverse().slice(0, 3);
  const blendedApy = CASH.reduce((a, c) => a + c.balance * c.apy, 0) / CASH_TOTAL;

  const next6 = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    const m0 = 1;
    for (let k = 0; k < 6; k++) {
      const m = (m0 + k) % 12;
      const amt = DIV_CALENDAR.filter((d) => d.month === m).reduce((a, d) => a + d.amount, 0);
      out.push({ label: MONTHS[m].slice(0, 1), value: amt });
    }
    return out;
  }, []);

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader
        title="Portfolio overview"
        sub="One book, three accounts. Everything below is computed from live positions, cash and your own notes."
        right={
          <>
            <Button onClick={() => setTab("allocation")}>
              <IconScale size={13} /> Rebalance
            </Button>
            <Button onClick={() => setTab("signals")} tone="primary">
              <IconSpark size={13} /> {SIGNALS.filter((s) => s.severity !== "info").length} signals
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* ----------------------------------------------------------- hero */}
        <Panel className="xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Label>Total portfolio value</Label>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <span className="tnum text-[34px] font-semibold leading-none tracking-tight text-mist-100">
                  {fmtUSD0(TOTAL_VALUE)}
                </span>
                <span
                  className={cn(
                    "tnum inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium",
                    DAY_PL >= 0 ? "bg-up/10 text-up" : "bg-down/10 text-down",
                  )}
                >
                  {DAY_PL >= 0 ? "▲" : "▼"} {fmtUSD0(Math.abs(DAY_PL))} ({fmtPct(DAY_PL_PCT)})
                  <span className="font-normal text-mist-500">today</span>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist-500">
                <span>
                  All-time gain{" "}
                  <span className={cn("tnum font-medium", clsTone(LIFETIME_GAIN))}>
                    {LIFETIME_GAIN >= 0 ? "+" : "−"}
                    {fmtUSD0(Math.abs(LIFETIME_GAIN))}
                  </span>
                </span>
                <span>
                  Money-weighted{" "}
                  <span className="tnum font-medium text-mist-300">
                    {fmtPct((LIFETIME_GAIN / NET_CONTRIBUTED) * 100, 1)}
                  </span>
                </span>
                <span>
                  Annualised TWR <span className="tnum font-medium text-mist-300">{RISK.annRet.toFixed(1)}%</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="inline-flex rounded-lg border border-ink-750 bg-ink-900 p-0.5">
                {(["Value", "Benchmark"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors",
                      m === mode ? "bg-ink-700 text-mist-100" : "text-mist-500 hover:text-mist-200",
                    )}
                  >
                    {m === "Value" ? "Value" : "vs Index"}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-lg border border-ink-750 bg-ink-900 p-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded-[6px] px-2 py-1 text-[11px] font-medium transition-colors",
                      r === range ? "bg-ink-700 text-mist-100" : "text-mist-500 hover:text-mist-200",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <LineChart
              labels={labels}
              height={252}
              series={chart}
              yFmt={mode === "Value" ? (v) => fmtCompact(v) : (v) => v.toFixed(0)}
              tipFmt={mode === "Value" ? (v) => fmtUSD0(v) : (v) => `${(v - 100).toFixed(1)}%`}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-800 pt-3 text-[10.5px] text-mist-500">
            {mode === "Value" ? (
              <>
                <span className="flex items-center gap-1.5">
                  <i className="h-0.5 w-3 rounded bg-acc" /> Market value
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-0.5 w-3 rounded bg-mist-500" style={{ backgroundImage: "repeating-linear-gradient(90deg,#5b6575 0 3px,transparent 3px 6px)" }} /> Net invested
                </span>
                <span className="ml-auto">
                  {range} change{" "}
                  <span className={cn("tnum font-medium", clsTone(periodPL))}>
                    {periodPL >= 0 ? "+" : "−"}
                    {fmtUSD0(Math.abs(periodPL))}
                  </span>{" "}
                  · net flows <span className="tnum text-mist-300">{fmtUSD0(netFlow)}</span>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <i className="h-0.5 w-3 rounded bg-acc" /> Portfolio {fmtPct(periodRet, 1)}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="h-0.5 w-3 rounded bg-violet" /> S&P 500 {fmtPct(benchRet, 1)}
                </span>
                <span className="ml-auto">
                  Excess{" "}
                  <span className={cn("tnum font-medium", clsTone(periodRet - benchRet))}>
                    {fmtPct(periodRet - benchRet, 1)}
                  </span>
                </span>
              </>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 divide-ink-800 border-t border-ink-800 pt-1 sm:grid-cols-4 sm:divide-x">
            <HeroStat k="Invested" v={fmtUSD0(INVESTED)} sub={`${HOLDINGS.length} positions`} />
            <HeroStat k="Cash & equivalents" v={fmtUSD0(CASH_TOTAL)} sub={`${CASH_WEIGHT.toFixed(1)}% of book`} />
            <HeroStat
              k="Unrealised P&L"
              v={`${TOTAL_UNREALIZED >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(TOTAL_UNREALIZED))}`}
              sub={`on ${fmtCompact(TOTAL_COST)} cost basis`}
              tone={clsTone(TOTAL_UNREALIZED)}
            />
            <HeroStat k="Net contributed" v={fmtUSD0(NET_CONTRIBUTED)} sub="since Feb 2023" />
          </div>
        </Panel>

        {/* ---------------------------------------------------- composition */}
        <Panel className="xl:col-span-4">
          <PanelHead title="Composition" sub="By asset class, cash included" />
          <div className="mt-3 flex items-center gap-4">
            <Donut
              data={classSlices}
              size={158}
              thickness={17}
              center={
                <>
                  <span className="text-[10px] uppercase tracking-wider text-mist-500">Positions</span>
                  <span className="tnum text-[17px] font-semibold text-mist-100">{HOLDINGS.length}</span>
                  <span className="tnum text-[10px] text-mist-500">{fmtCompact(TOTAL_VALUE)}</span>
                </>
              }
            />
            <div className="min-w-0 flex-1 space-y-2">
              {classSlices.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <i className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-mist-300">{s.label}</span>
                  <span className="tnum text-[11.5px] font-medium text-mist-100">
                    {((s.value / TOTAL_VALUE) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-ink-800 bg-ink-850/60 p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <Label>Cash balance</Label>
                <div className="tnum mt-1 text-[20px] font-semibold text-mist-100">{fmtUSD0(CASH_TOTAL)}</div>
              </div>
              <Pill tone={CASH_WEIGHT > 5 ? "gold" : "up"}>{CASH_WEIGHT.toFixed(1)}% of book</Pill>
            </div>
            <div className="mt-3 space-y-1.5">
              {CASH.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-[11px]">
                  <span className="flex-1 truncate text-mist-400">
                    {c.label} <span className="text-mist-500">· {c.account}</span>
                  </span>
                  <span className="tnum text-mist-500">{c.apy.toFixed(2)}%</span>
                  <span className="tnum w-20 text-right font-medium text-mist-200">{fmtUSD0(c.balance)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-2.5 text-[10.5px]">
              <span className="text-mist-500">
                Blended yield <span className="tnum text-acc">{blendedApy.toFixed(2)}%</span> ·{" "}
                <span className="tnum text-mist-300">{fmtUSD0(CASH_INCOME / 12)}</span>/mo
              </span>
              <button onClick={() => setTab("allocation")} className="flex items-center gap-1 text-acc hover:underline">
                Deploy <IconArrow size={11} />
              </button>
            </div>
          </div>
        </Panel>

        {/* -------------------------------------------------------- movers */}
        <Panel className="xl:col-span-4">
          <PanelHead
            title="Today's movers"
            sub={`Session P&L ${DAY_PL >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(DAY_PL))}`}
            right={
              <button onClick={() => setTab("holdings")} className="text-[11px] text-mist-500 hover:text-acc">
                All holdings
              </button>
            }
          />
          <div className="mt-3 space-y-3">
            {[
              { title: "Leaders", rows: gainers },
              { title: "Laggards", rows: losers },
            ].map((grp) => (
              <div key={grp.title}>
                <Label className="text-[9px]">{grp.title}</Label>
                <div className="mt-1.5 space-y-0.5">
                  {grp.rows.map((h) => (
                    <button
                      key={h.ticker}
                      onClick={() => setFocus(h.ticker)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-850"
                    >
                      <span className="tnum w-11 text-[11.5px] font-semibold text-mist-100">{h.ticker}</span>
                      <span className="hidden min-w-0 flex-1 truncate text-[11px] text-mist-500 sm:block">{h.name}</span>
                      <Sparkline values={h.series.slice(-30)} width={54} height={20} fill={false} />
                      <span className={cn("tnum w-14 text-right text-[11.5px] font-medium", clsTone(h.dayChangePct))}>
                        {fmtPct(h.dayChangePct)}
                      </span>
                      <span className={cn("tnum w-16 text-right text-[10.5px]", clsTone(h.dayPL))}>
                        {h.dayPL >= 0 ? "+" : "−"}
                        {fmtCompact(Math.abs(h.dayPL))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* -------------------------------------------------------- signals */}
        <Panel className="xl:col-span-4">
          <PanelHead
            title="Signals"
            sub="Cross-checks against news, research and your own rules"
            right={
              <button onClick={() => setTab("signals")} className="text-[11px] text-mist-500 hover:text-acc">
                View all
              </button>
            }
          />
          <div className="mt-3 space-y-1.5">
            {SIGNALS.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => setTab("signals")}
                className="flex w-full gap-2.5 rounded-lg border border-ink-800 bg-ink-850/50 p-2.5 text-left transition-colors hover:border-ink-700"
              >
                <span
                  className={cn(
                    "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                    s.severity === "critical" ? "bg-down" : s.severity === "warning" ? "bg-gold" : s.severity === "good" ? "bg-up" : "bg-azure",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11.5px] font-medium text-mist-200">{s.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-mist-500">
                    <span className="rounded bg-ink-800 px-1 py-px">{s.domain}</span>
                    {s.metric && <span className="tnum truncate">{s.metric}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        {/* --------------------------------------------------------- income */}
        <Panel className="xl:col-span-4">
          <PanelHead
            title="Income & yield"
            sub="Forward 12 months, dividends plus cash interest"
            right={
              <button onClick={() => setTab("income")} className="text-[11px] text-mist-500 hover:text-acc">
                Detail
              </button>
            }
          />
          <div className="mt-3 flex items-end justify-between">
            <div>
              <span className="tnum text-[24px] font-semibold text-mist-100">
                {fmtUSD0(ANNUAL_INCOME + CASH_INCOME)}
              </span>
              <div className="mt-0.5 text-[10.5px] text-mist-500">
                ≈ <span className="tnum text-mist-300">{fmtUSD0((ANNUAL_INCOME + CASH_INCOME) / 12)}</span> per month
              </div>
            </div>
            <div className="text-right">
              <Label>Portfolio yield</Label>
              <div className="tnum text-[17px] font-semibold text-acc">{PORT_YIELD.toFixed(2)}%</div>
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-[9px]">Next six months</Label>
            <div className="mt-2">
              <Columns data={next6} height={72} tone="gold" fmt={(v) => fmtUSD0(v)} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 border-t border-ink-800 pt-1">
            <KV k="From dividends" v={fmtUSD0(ANNUAL_INCOME)} />
            <KV k="From cash" v={fmtUSD0(CASH_INCOME)} />
          </div>
        </Panel>

        {/* ------------------------------------------------------- holdings */}
        <Panel className="xl:col-span-8" flush>
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <PanelHead title="Largest positions" sub={`Top 8 of ${HOLDINGS.length} · ${TOP5_WEIGHT.toFixed(0)}% in the top five`} />
            <button
              onClick={() => setTab("holdings")}
              className="flex items-center gap-1 text-[11px] text-mist-500 transition-colors hover:text-acc"
            >
              Full table <IconArrow size={12} />
            </button>
          </div>
          <div className="px-2 pb-2">
            <HoldingsTable
              rows={[...HOLDINGS].sort((a, b) => b.marketValue - a.marketValue).slice(0, 8)}
              compact
              onSelect={setFocus}
            />
          </div>
        </Panel>

        {/* ------------------------------------------------- risk + activity */}
        <div className="space-y-3 xl:col-span-4">
          <Panel>
            <PanelHead title="Risk profile" sub="Three-year, daily, versus S&P 500" />
            <div className="mt-3 space-y-2.5">
              {[
                { k: "Beta", v: RISK.portBeta.toFixed(2), pct: (RISK.portBeta / 1.6) * 100, tone: "azure" as const },
                { k: "Volatility", v: `${RISK.vol.toFixed(1)}%`, pct: (RISK.vol / 30) * 100, tone: "violet" as const },
                { k: "Sharpe", v: RISK.sharpe.toFixed(2), pct: (RISK.sharpe / 2.5) * 100, tone: "acc" as const },
                { k: "Max drawdown", v: `${RISK.maxDD.toFixed(1)}%`, pct: (Math.abs(RISK.maxDD) / 35) * 100, tone: "down" as const },
              ].map((r) => (
                <div key={r.k}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-mist-400">{r.k}</span>
                    <span className="tnum text-[12px] font-medium text-mist-100">{r.v}</span>
                  </div>
                  <Bar className="mt-1" pct={r.pct} tone={r.tone} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-2.5 text-[10.5px] text-mist-500">
              <span>
                Effective holdings <span className="tnum text-mist-300">{EFFECTIVE_N}</span>
              </span>
              <button onClick={() => setTab("performance")} className="text-acc hover:underline">
                Performance detail
              </button>
            </div>
          </Panel>

          <Panel>
            <PanelHead
              title="Recent activity"
              right={
                <button onClick={() => setTab("activity")} className="text-[11px] text-mist-500 hover:text-acc">
                  Ledger
                </button>
              }
            />
            <div className="mt-2 divide-y divide-ink-850">
              {TRANSACTIONS.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 py-2">
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[9px] font-semibold",
                      t.type === "Buy" ? "bg-up/10 text-up" : t.type === "Sell" ? "bg-down/10 text-down" : "bg-ink-800 text-mist-400",
                    )}
                  >
                    {t.type[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] text-mist-200">
                      {t.type} {t.ticker ?? ""}{" "}
                      {t.qty && <span className="tnum text-mist-500">× {t.qty}</span>}
                    </div>
                    <div className="text-[10px] text-mist-500">
                      {fmtDateShort(t.date)} · {t.account}
                    </div>
                  </div>
                  <span className={cn("tnum text-[11.5px] font-medium", clsTone(t.amount))}>
                    {t.amount >= 0 ? "+" : "−"}
                    {fmtUSD(Math.abs(t.amount), 0)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="flex items-center justify-between">
            <div>
              <Label>Export</Label>
              <div className="mt-0.5 text-[11px] text-mist-400">Positions, lots and ledger as CSV</div>
            </div>
            <Button onClick={exportPositions}>
              <IconDownload size={13} /> Download
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
