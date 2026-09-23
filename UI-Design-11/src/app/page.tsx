import { PortfolioLineChart } from "@/components/portfolio-line-chart";
import Link from "next/link";

import { LineChart, Donut, Sparkline } from "@/components/charts";
import TickerRail from "@/components/TickerRail";
import { Card, Delta, Empty, PageHeader, Stat, Td, Th } from "@/components/ui";
import { buildPortfolioHistory, computePortfolio, getSnapshots } from "@/lib/portfolio";
import { headlineQuotes } from "@/lib/market-data";
import { countRows } from "@/lib/bootstrap";
import { recentSyncs } from "@/lib/sync";
import { cagr, maxDrawdown, toReturns, volatility } from "@/lib/stats";
import { ASSET_CLASS_COLORS } from "@/lib/universe";
import { fmtCompact, fmtCurrency, fmtDate, fmtNumber, fmtPct, fmtShortDate, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [summary, history, quotes, snapshots, syncs, priceRows] = await Promise.all([
    computePortfolio(),
    buildPortfolioHistory(),
    headlineQuotes(),
    getSnapshots(400),
    recentSyncs(3),
    countRows("prices"),
  ]);

  const returns = toReturns(history.total);
  const dd = maxDrawdown(history.total);
  const top = summary.positions.slice(0, 6);
  const movers = [...summary.positions].sort((a, b) => b.dayChangePct - a.dayChangePct);
  const classes = Object.entries(
    summary.positions.reduce<Record<string, number>>((acc, p) => {
      acc[p.assetClass] = (acc[p.assetClass] ?? 0) + p.marketValue;
      return acc;
    }, {}),
  )
    .map(([label, value]) => ({ label, value, color: ASSET_CLASS_COLORS[label] ?? "#64748b" }))
    .concat(summary.cash > 0 ? [{ label: "cash", value: summary.cash, color: "#475569" }] : [])
    .sort((a, b) => b.value - a.value);

  const snapshotSeries = [...snapshots].reverse().map((s) => ({ day: s.day, value: s.totalValue }));

  return (
    <div>
      <PageHeader
        eyebrow="Page 01 · Command centre"
        title="Overview"
        blurb="Everything that matters on one screen: what you own, what it did today, and what the market is doing around it."
        right={
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Archive</p>
            <p className="text-sm tabular-nums text-slate-200">{fmtNumber(priceRows, 0)} price rows</p>
          </div>
        }
      />

      <TickerRail quotes={quotes} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total net worth"
          value={fmtCurrency(summary.totalValue)}
          sub={`${fmtCurrency(summary.marketValue)} invested · ${fmtCurrency(summary.cash)} cash`}
        />
        <Stat
          label="Today"
          value={<Delta value={summary.dayChangePct} />}
          sub={`${fmtCurrency(summary.dayChange)} · as of ${summary.asOf ? fmtDate(summary.asOf) : "—"}`}
          tone={summary.dayChange >= 0 ? "pos" : "neg"}
        />
        <Stat
          label="Total return"
          value={<Delta value={summary.totalReturnPct} />}
          sub={`Net invested ${fmtCurrency(summary.netInvested)}`}
          tone={summary.totalReturnPct >= 0 ? "pos" : "neg"}
          hint="Total value vs net cash contributed"
        />
        <Stat
          label="Unrealised P/L"
          value={fmtCurrency(summary.unrealizedPL)}
          sub={`${fmtPct(summary.unrealizedPct)} on ${fmtCompact(summary.costBasis)} basis`}
          tone={summary.unrealizedPL >= 0 ? "pos" : "neg"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card
          title="Portfolio value"
          subtitle="Market value + cash, rebuilt daily from the ledger"
          className="xl:col-span-2"
          right={<Link href="/performance" className="text-xs text-indigo-400 hover:text-indigo-300">Performance →</Link>}
        >
          <PortfolioLineChart
            series={history.total.length ? history.total : snapshotSeries}
            height={250}
            color="#818cf8"
          />
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-800/70 pt-3 sm:grid-cols-4">
            <MiniStat label="CAGR" value={fmtPct(cagr(history.total) * 100)} />
            <MiniStat label="Volatility" value={fmtPct(volatility(returns) * 100)} />
            <MiniStat label="Max drawdown" value={fmtPct(dd.value * 100)} />
            <MiniStat label="Positions" value={String(summary.positions.length)} />
          </div>
        </Card>

        <Card title="Asset mix" subtitle="Share of total net worth" right={<Link href="/allocation" className="text-xs text-indigo-400 hover:text-indigo-300">Allocation →</Link>}>
          <div className="flex flex-col items-center gap-4">
            <Donut data={classes} centerLabel={fmtCompact(summary.totalValue)} centerSub="total" size={168} />
            <ul className="w-full space-y-1.5">
              {classes.map((c) => (
                <li key={c.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <span className="capitalize">{c.label}</span>
                  </span>
                  <span className="tabular-nums text-slate-300">
                    {((c.value / (summary.totalValue || 1)) * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Largest positions" className="xl:col-span-2" right={<Link href="/portfolio" className="text-xs text-indigo-400 hover:text-indigo-300">Portfolio →</Link>}>
          {top.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/70">
                    <Th>Symbol</Th>
                    <Th>Weight</Th>
                    <Th className="text-right">Value</Th>
                    <Th className="text-right">Day</Th>
                    <Th className="text-right">P/L</Th>
                    <Th className="text-right">Trend</Th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((p) => (
                    <tr key={p.symbol} className="border-b border-slate-900/60 last:border-0">
                      <Td>
                        <span className="font-medium text-slate-100">{p.symbol}</span>
                        <span className="ml-2 hidden text-xs text-slate-500 sm:inline">{p.name}</span>
                      </Td>
                      <Td className="tabular-nums">{p.weight.toFixed(1)}%</Td>
                      <Td className="text-right tabular-nums">{fmtCurrency(p.marketValue)}</Td>
                      <Td className="text-right">
                        <Delta value={p.dayChangePct} digits={2} showArrow={false} />
                      </Td>
                      <Td className="text-right">
                        <Delta value={p.unrealizedPct} digits={1} showArrow={false} />
                      </Td>
                      <Td className="text-right">
                        <div className="inline-block align-middle">
                          <Sparkline data={[p.prevClose * 0.98, p.prevClose, p.price]} width={56} height={20} color={p.price >= p.prevClose ? "#34d399" : "#fb7185"} />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No positions yet — add a trade on the Ledger page.</Empty>
          )}
        </Card>

        <div className="space-y-4">
          <Card title={`Today's movers`} subtitle="Best and worst by daily change">
            {movers.length ? (
              <ul className="space-y-2">
                {[movers[0], ...movers.slice(-2)].filter(Boolean).map((p) => (
                  <li key={p.symbol} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{p.symbol}</span>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums text-slate-500">{fmtCurrency(p.price)}</span>
                      <Delta value={p.dayChangePct} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No holdings.</Empty>
            )}
          </Card>

          <Card title="Data pipeline" subtitle="Last ingest runs" right={<Link href="/data" className="text-xs text-indigo-400 hover:text-indigo-300">Manage →</Link>}>
            {syncs.length ? (
              <ul className="space-y-2 text-xs">
                {syncs.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 border-b border-slate-900/70 pb-1.5 last:border-0">
                    <span className="text-slate-400">{relativeTime(s.finishedAt ?? s.startedAt)}</span>
                    <span className="tabular-nums text-slate-500">
                      {s.symbolsUpdated}/{s.symbolsRequested} symbols
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${s.status === "ok" ? "bg-emerald-500/15 text-emerald-300" : s.status === "error" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"}`}>
                      {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No sync runs recorded.</Empty>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-sm font-medium tabular-nums text-slate-200">{value}</p>
    </div>
  );
}
