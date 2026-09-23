import { useMemo, useState } from "react";
import {
  DATES, PORT_TWR, BENCH_TWR, DRAWDOWN, RETURNS, RISK, MONTHLY, CONTRIBUTIONS,
  RANGES, rangeStart, type Range, N, VALUE_SERIES,
} from "@/data/portfolio";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Segmented, Pill } from "@/components/ui/Primitives";
import { PageHeader } from "@/components/ui/PageHeader";
import { LineChart } from "@/components/charts/LineChart";
import { DivergingBar } from "@/components/charts/Micro";
import { fmtUSD0, fmtPct, clsTone, MONTHS, fmtCompact } from "@/lib/format";
import { cn } from "@/utils/cn";

function MetricCard({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-ink-800 bg-ink-880 px-3 py-2.5">
      <Label>{k}</Label>
      <div className={cn("tnum mt-1 text-[15px] font-semibold text-mist-100", tone)}>{v}</div>
      {sub && <div className="mt-0.5 text-[10px] text-mist-500">{sub}</div>}
    </div>
  );
}

function heatColor(r: number) {
  const t = Math.max(-1, Math.min(1, r / 8));
  if (t >= 0) return `color-mix(in oklab, #3ddc97 ${8 + t * 68}%, #0f1319)`;
  return `color-mix(in oklab, #ff6b81 ${8 + -t * 68}%, #0f1319)`;
}

export function Performance() {
  const { setFocus } = useApp();
  const [range, setRange] = useState<Range>("1Y");
  const [basis, setBasis] = useState<"Growth" | "Drawdown">("Growth");

  const start = rangeStart(range);
  const labels = DATES.slice(start);

  const series = useMemo(() => {
    const p = PORT_TWR.slice(start);
    const b = BENCH_TWR.slice(start);
    return [
      { id: "pp", label: "Portfolio", values: p.map((v) => (v / p[0]) * 10000), color: "#63e6d2", area: true, width: 1.8 },
      { id: "bb", label: "S&P 500", values: b.map((v) => (v / b[0]) * 10000), color: "#a894fa", width: 1.4 },
    ];
  }, [start]);

  const ddSeries = useMemo(
    () => [{ id: "dd", label: "Drawdown", values: DRAWDOWN.slice(start).map((d) => d.dd), color: "#ff6b81", area: true, width: 1.4 }],
    [start],
  );

  const pRet = (PORT_TWR[N - 1] / PORT_TWR[start] - 1) * 100;
  const bRet = (BENCH_TWR[N - 1] / BENCH_TWR[start] - 1) * 100;

  const years = useMemo(() => {
    const map = new Map<number, (number | null)[]>();
    MONTHLY.forEach((m) => {
      if (!map.has(m.year)) map.set(m.year, Array(12).fill(null));
      map.get(m.year)![m.month] = m.ret;
    });
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, []);

  const maxAbsMonthly = Math.max(...MONTHLY.map((m) => Math.abs(m.ret)));
  const maxContrib = Math.max(...CONTRIBUTIONS.map((c) => Math.abs(c.contribution)));
  const leaders = CONTRIBUTIONS.slice(0, 6);
  const laggards = [...CONTRIBUTIONS].reverse().slice(0, 5);
  const curDD = DRAWDOWN[N - 1].dd;

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader
        title="Performance"
        sub="Time-weighted returns, risk statistics and attribution. Benchmark is the S&P 500 total return index."
        right={
          <>
            <Segmented options={["Growth", "Drawdown"] as const} value={basis} onChange={setBasis} />
            <Segmented options={RANGES} value={range} onChange={setRange} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Label>{basis === "Growth" ? "Growth of $10,000" : "Drawdown from peak"}</Label>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="tnum text-[28px] font-semibold leading-none text-mist-100">
                  {basis === "Growth" ? fmtUSD0(10000 * (1 + pRet / 100)) : `${curDD.toFixed(2)}%`}
                </span>
                <span className={cn("tnum text-[13px] font-medium", clsTone(pRet))}>{fmtPct(pRet, 1)}</span>
                <span className="text-[11px] text-mist-500">over {range}</span>
              </div>
            </div>
            <div className="flex gap-5 text-right">
              <div>
                <Label>Benchmark</Label>
                <div className={cn("tnum text-[15px] font-semibold", clsTone(bRet))}>{fmtPct(bRet, 1)}</div>
              </div>
              <div>
                <Label>Excess</Label>
                <div className={cn("tnum text-[15px] font-semibold", clsTone(pRet - bRet))}>
                  {fmtPct(pRet - bRet, 1)}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {basis === "Growth" ? (
              <LineChart labels={labels} series={series} height={280} yFmt={(v) => fmtCompact(v)} tipFmt={(v) => fmtUSD0(v)} />
            ) : (
              <LineChart
                labels={labels}
                series={ddSeries}
                height={280}
                zeroLine
                yFmt={(v) => `${v.toFixed(0)}%`}
                tipFmt={(v) => `${v.toFixed(2)}%`}
              />
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-800 pt-3 text-[10.5px] text-mist-500">
            <span className="flex items-center gap-1.5">
              <i className="h-0.5 w-3 rounded bg-acc" /> Portfolio
            </span>
            {basis === "Growth" && (
              <span className="flex items-center gap-1.5">
                <i className="h-0.5 w-3 rounded bg-violet" /> S&P 500
              </span>
            )}
            <span className="ml-auto">
              Max drawdown <span className="tnum text-down">{RISK.maxDD.toFixed(1)}%</span> · index{" "}
              <span className="tnum text-mist-300">{RISK.benchMaxDD.toFixed(1)}%</span>
            </span>
          </div>
        </Panel>

        {/* returns table */}
        <Panel className="xl:col-span-4">
          <PanelHead title="Trailing returns" sub="Portfolio versus benchmark, net of fees" />
          <div className="mt-3 space-y-1">
            <div className="grid grid-cols-[42px_1fr_58px_58px] gap-2 px-1 text-[9.5px] uppercase tracking-wider text-mist-500">
              <span>Period</span>
              <span>Excess</span>
              <span className="text-right">Port</span>
              <span className="text-right">Index</span>
            </div>
            {RETURNS.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[42px_1fr_58px_58px] items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-ink-850"
              >
                <span className="text-[11.5px] font-medium text-mist-200">{r.key}</span>
                <DivergingBar value={r.port - r.bench} max={Math.max(...RETURNS.map((x) => Math.abs(x.port - x.bench)))} />
                <span className={cn("tnum text-right text-[11.5px] font-medium", clsTone(r.port))}>
                  {r.port >= 0 ? "+" : "−"}
                  {Math.abs(r.port).toFixed(1)}%
                </span>
                <span className="tnum text-right text-[11.5px] text-mist-400">
                  {r.bench >= 0 ? "+" : "−"}
                  {Math.abs(r.bench).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-800 pt-3">
            <MetricCard k="Annualised" v={`${RISK.annRet.toFixed(1)}%`} sub={`index ${RISK.benchAnnRet.toFixed(1)}%`} />
            <MetricCard
              k="Value added"
              v={fmtUSD0(VALUE_SERIES[N - 1].value - VALUE_SERIES[0].value)}
              sub="3-year change in book"
            />
          </div>
        </Panel>

        {/* monthly heatmap */}
        <Panel className="xl:col-span-8">
          <PanelHead
            title="Monthly returns"
            sub="Time-weighted, compounded within each month"
            right={
              <span className="flex items-center gap-2 text-[10px] text-mist-500">
                −{maxAbsMonthly.toFixed(0)}%
                <span className="h-2 w-24 rounded-full bg-gradient-to-r from-down via-ink-750 to-up" />+
                {maxAbsMonthly.toFixed(0)}%
              </span>
            }
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-[3px]">
              <thead>
                <tr>
                  <th className="w-10" />
                  {MONTHS.map((m) => (
                    <th key={m} className="pb-1 text-[9.5px] font-medium text-mist-500">
                      {m[0]}
                      {m[1]}
                    </th>
                  ))}
                  <th className="pb-1 text-[9.5px] font-medium text-mist-400">Year</th>
                </tr>
              </thead>
              <tbody>
                {years.map(([y, cells]) => {
                  const yr = cells.filter((c): c is number => c !== null).reduce((a, c) => a * (1 + c / 100), 1);
                  return (
                    <tr key={y}>
                      <td className="tnum pr-1 text-right text-[10.5px] text-mist-400">{y}</td>
                      {cells.map((c, i) => (
                        <td key={i}>
                          <div
                            className="group relative grid h-8 place-items-center rounded-[4px] text-[10px] font-medium text-white/90 transition-transform hover:scale-[1.06]"
                            style={{ background: c === null ? "#0f1319" : heatColor(c) }}
                          >
                            {c === null ? <span className="text-mist-500">·</span> : c.toFixed(1)}
                          </div>
                        </td>
                      ))}
                      <td>
                        <div
                          className={cn(
                            "tnum grid h-8 place-items-center rounded-[4px] border text-[10.5px] font-semibold",
                            (yr - 1) >= 0 ? "border-up/30 text-up" : "border-down/30 text-down",
                          )}
                        >
                          {((yr - 1) * 100).toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* risk metrics */}
        <Panel className="xl:col-span-4">
          <PanelHead title="Risk statistics" sub="Three years of daily observations" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MetricCard k="Volatility" v={`${RISK.vol.toFixed(1)}%`} sub={`index ${RISK.benchVol.toFixed(1)}%`} />
            <MetricCard k="Sharpe" v={RISK.sharpe.toFixed(2)} sub={`index ${RISK.benchSharpe.toFixed(2)}`} />
            <MetricCard k="Sortino" v={RISK.sortino.toFixed(2)} />
            <MetricCard k="Beta" v={RISK.beta.toFixed(2)} />
            <MetricCard k="Alpha" v={`${RISK.alpha.toFixed(1)}%`} tone={clsTone(RISK.alpha)} sub="annualised" />
            <MetricCard k="Tracking error" v={`${RISK.trackingError.toFixed(1)}%`} />
            <MetricCard k="Information ratio" v={RISK.infoRatio.toFixed(2)} />
            <MetricCard k="Correlation" v={RISK.corr.toFixed(2)} sub="to index" />
          </div>
          <div className="mt-3 space-y-2 border-t border-ink-800 pt-3">
            {[
              { k: "Upside capture", v: RISK.upCapture, good: RISK.upCapture > 100 },
              { k: "Downside capture", v: RISK.downCapture, good: RISK.downCapture < 100 },
              { k: "Positive days", v: RISK.hitRate, good: RISK.hitRate > 52 },
            ].map((r) => (
              <div key={r.k}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-mist-400">{r.k}</span>
                  <span className={cn("tnum text-[12px] font-medium", r.good ? "text-up" : "text-mist-200")}>
                    {r.v.toFixed(0)}%
                  </span>
                </div>
                <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-ink-750">
                  <div
                    className={cn("h-full rounded-full", r.good ? "bg-up/70" : "bg-mist-400/60")}
                    style={{ width: `${Math.min(100, (r.v / 140) * 100)}%` }}
                  />
                  <div className="absolute inset-y-0 left-[71.4%] w-px bg-ink-500" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-2.5 text-[10.5px] text-mist-500">
            <span>
              Best day <span className="tnum text-up">+{RISK.bestDay.toFixed(1)}%</span>
            </span>
            <span>
              Worst day <span className="tnum text-down">{RISK.worstDay.toFixed(1)}%</span>
            </span>
          </div>
        </Panel>

        {/* attribution */}
        <Panel className="xl:col-span-12">
          <PanelHead
            title="Contribution to return"
            sub="Last twelve months · position weight multiplied by position return"
            right={<Pill tone="acc">Sum {CONTRIBUTIONS.reduce((a, c) => a + c.contribution, 0).toFixed(1)}pp</Pill>}
          />
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 lg:grid-cols-2">
            <div>
              <Label className="text-[9px]">Contributors</Label>
              <div className="mt-2 space-y-1">
                {leaders.map((c) => (
                  <button
                    key={c.ticker}
                    onClick={() => setFocus(c.ticker)}
                    className="grid w-full grid-cols-[52px_1fr_54px_62px] items-center gap-3 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-ink-850"
                  >
                    <span className="tnum text-[11.5px] font-semibold text-mist-100">{c.ticker}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-up/70"
                        style={{ width: `${(Math.abs(c.contribution) / maxContrib) * 100}%` }}
                      />
                    </div>
                    <span className="tnum text-right text-[11px] text-mist-500">{c.weight.toFixed(1)}%</span>
                    <span className="tnum text-right text-[11.5px] font-medium text-up">
                      +{c.contribution.toFixed(2)}pp
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[9px]">Detractors</Label>
              <div className="mt-2 space-y-1">
                {laggards.map((c) => (
                  <button
                    key={c.ticker}
                    onClick={() => setFocus(c.ticker)}
                    className="grid w-full grid-cols-[52px_1fr_54px_62px] items-center gap-3 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-ink-850"
                  >
                    <span className="tnum text-[11.5px] font-semibold text-mist-100">{c.ticker}</span>
                    <div className="flex h-2 justify-end overflow-hidden rounded-full bg-ink-800">
                      <div
                        className={cn("h-full rounded-full", c.contribution < 0 ? "bg-down/70" : "bg-mist-500/50")}
                        style={{ width: `${(Math.abs(c.contribution) / maxContrib) * 100}%` }}
                      />
                    </div>
                    <span className="tnum text-right text-[11px] text-mist-500">{c.weight.toFixed(1)}%</span>
                    <span className={cn("tnum text-right text-[11.5px] font-medium", clsTone(c.contribution))}>
                      {c.contribution >= 0 ? "+" : "−"}
                      {Math.abs(c.contribution).toFixed(2)}pp
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
