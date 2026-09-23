import AddTrade from "@/components/AddTrade";
import HoldingsTable from "@/components/HoldingsTable";
import { BarChart, Donut } from "@/components/charts";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { computePortfolio, getSparklines } from "@/lib/portfolio";
import { irr } from "@/lib/stats";
import { getAllTransactions } from "@/lib/portfolio";
import { SECTOR_COLORS } from "@/lib/universe";
import { fmtCompact, fmtCurrency, fmtPct, signClass } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const summary = await computePortfolio();
  const [sparks, txns] = await Promise.all([
    getSparklines(summary.positions.map((p) => p.symbol), 60),
    getAllTransactions(),
  ]);
  const sparkMap = Object.fromEntries(sparks.entries());

  const flows = txns
    .filter((t) => t.kind === "deposit" || t.kind === "withdrawal")
    .map((t) => ({ day: t.day, amount: t.kind === "deposit" ? t.price : -t.price }));
  const moneyWeighted = irr(flows, summary.totalValue);

  const bySector = Object.entries(
    summary.positions.reduce<Record<string, number>>((acc, p) => {
      acc[p.sector] = (acc[p.sector] ?? 0) + p.marketValue;
      return acc;
    }, {}),
  )
    .map(([label, value]) => ({ label, value, color: SECTOR_COLORS[label] ?? "#64748b" }))
    .sort((a, b) => b.value - a.value);

  const winners = [...summary.positions].sort((a, b) => b.unrealizedPct - a.unrealizedPct).slice(0, 5);
  const losers = [...summary.positions].sort((a, b) => a.unrealizedPct - b.unrealizedPct).slice(0, 5);

  return (
    <div>
      <PageHeader
        eyebrow="Page 02 · Holdings"
        title="Portfolio"
        blurb="Every open position with average cost, unrealised P/L and weight. Click any row for its full tax-lot summary."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Market value" value={fmtCurrency(summary.marketValue)} sub={`${summary.positions.length} open positions`} />
        <Stat label="Cash" value={fmtCurrency(summary.cash)} sub={`${((summary.cash / (summary.totalValue || 1)) * 100).toFixed(1)}% of total`} />
        <Stat label="Cost basis" value={fmtCurrency(summary.costBasis)} sub={`Booked realised ${fmtCurrency(summary.realizedPL)}`} />
        <Stat
          label="Unrealised P/L"
          value={fmtCurrency(summary.unrealizedPL)}
          sub={fmtPct(summary.unrealizedPct)}
          tone={summary.unrealizedPL >= 0 ? "pos" : "neg"}
        />
        <Stat label="Money-weighted return" value={fmtPct(moneyWeighted * 100)} sub="IRR incl. cash flows" tone={moneyWeighted >= 0 ? "pos" : "neg"} />
      </div>

      <Card title="Record a transaction" subtitle="Buys, sells, dividends, deposits and withdrawals all land in the same ledger" className="mt-4">
        <AddTrade />
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Holdings" className="xl:col-span-2" padded={false}>
          {summary.positions.length ? (
            <HoldingsTable positions={summary.positions} sparks={sparkMap} />
          ) : (
            <div className="p-4">
              <Empty>No open positions. Record a buy above to get started.</Empty>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Sector exposure">
            {bySector.length ? (
              <div className="flex flex-col items-center gap-4">
                <Donut data={bySector} size={160} centerLabel={`${bySector.length}`} centerSub="sectors" />
                <ul className="w-full space-y-1.5">
                  {bySector.slice(0, 8).map((s) => (
                    <li key={s.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                        {s.label}
                      </span>
                      <span className="tabular-nums text-slate-300">{((s.value / (summary.marketValue || 1)) * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Empty>No sector data.</Empty>
            )}
          </Card>

          <Card title="Best & worst" subtitle="By unrealised return">
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-emerald-500/80">Winners</p>
                <BarChart
                  data={winners.map((p) => ({ label: p.symbol, value: p.unrealizedPct }))}
                  height={130}
                  color="#10b981"
                  formatValue={(n) => `${n.toFixed(1)}%`}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-rose-500/80">Laggards</p>
                <BarChart
                  data={losers.map((p) => ({ label: p.symbol, value: p.unrealizedPct }))}
                  height={130}
                  color="#f43f5e"
                  formatValue={(n) => `${n.toFixed(1)}%`}
                />
              </div>
            </div>
          </Card>

          <Card title="Concentration" subtitle="Herfindahl index across positions">
            <p className={`text-2xl font-semibold tabular-nums ${summary.concentration > 0.25 ? "text-amber-400" : "text-emerald-400"}`}>
              {summary.concentration.toFixed(3)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {summary.concentration > 0.25
                ? "Concentrated — the top names dominate risk."
                : "Reasonably diversified across positions."}
              {" "}Largest weight {summary.positions[0]?.weight.toFixed(1) ?? 0}% ({summary.positions[0]?.symbol ?? "—"}).
            </p>
            {summary.positions[0] && (
              <p className="mt-2 text-xs text-slate-500">
                Top holding value <span className={signClass(summary.positions[0].unrealizedPL)}>{fmtCompact(summary.positions[0].marketValue)}</span>
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
