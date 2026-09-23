import { BarChart, LineChart, MonthlyHeatmap, MultiLineChart } from "@/components/charts";
import { Card, PageHeader, Stat } from "@/components/ui";
import { buildPortfolioHistory, computePortfolio, getAllTransactions } from "@/lib/portfolio";
import {
  betaAlpha,
  cagr,
  correlation,
  irr,
  maxDrawdown,
  monthlyReturnGrid,
  sortino,
  sharpe,
  toReturns,
  volatility,
  type Point,
} from "@/lib/stats";
import { fmtCurrency, fmtDate, fmtPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const [summary, history, txns] = await Promise.all([computePortfolio(), buildPortfolioHistory(), getAllTransactions()]);
  const ret = toReturns(history.total);
  const benchRet = toReturns(history.benchmark);
  const { beta, alpha, r2 } = betaAlpha(ret, benchRet);
  const dd = maxDrawdown(history.total);
  const ddSeries = history.drawdown;
  const grid = monthlyReturnGrid(history.total);

  const flows = txns
    .filter((t) => t.kind === "deposit" || t.kind === "withdrawal")
    .map((t) => ({ day: t.day, amount: t.kind === "deposit" ? t.price : -t.price }));
  const moneyWeighted = irr(flows, summary.totalValue);

  const indexed = (pts: Point[]): Point[] => {
    const base = pts[0]?.value || 1;
    return pts.map((p) => ({ day: p.day, value: (p.value / base) * 100 }));
  };

  const yearlyBars = grid.map((g) => ({
    label: String(g.year).slice(2),
    value: (g.months.filter((m): m is number => m != null).reduce((a, b) => (a / 100 + 1) * (b / 100 + 1), 1) - 1) * 100,
  }));

  const stats = {
    best: ret.length ? Math.max(...ret) * 100 : 0,
    worst: ret.length ? Math.min(...ret) * 100 : 0,
    win: ret.length ? (ret.filter((r) => r > 0).length / ret.length) * 100 : 0,
    avgUp: ret.filter((r) => r > 0).length ? (ret.filter((r) => r > 0).reduce((a, b) => a + b, 0) / ret.filter((r) => r > 0).length) * 100 : 0,
    avgDown: ret.filter((r) => r < 0).length ? (ret.filter((r) => r < 0).reduce((a, b) => a + b, 0) / ret.filter((r) => r < 0).length) * 100 : 0,
  };

  const benchCagr = cagr(history.benchmark);

  return (
    <div>
      <PageHeader
        eyebrow="Page 03 · Returns"
        title="Performance"
        blurb="Time-weighted growth of the whole book against an S&P 500 benchmark bought with the same contribution schedule."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="CAGR" value={fmtPct(cagr(history.total) * 100)} sub={`Benchmark ${fmtPct(benchCagr * 100)}`} tone={cagr(history.total) >= 0 ? "pos" : "neg"} />
        <Stat label="Total return" value={fmtPct(summary.totalReturnPct)} sub={`Money-weighted ${fmtPct(moneyWeighted * 100)}`} tone={summary.totalReturnPct >= 0 ? "pos" : "neg"} />
        <Stat label="Max drawdown" value={fmtPct(dd.value * 100)} sub={`${dd.peakDay ? fmtDate(dd.peakDay) : "—"} → ${dd.troughDay ? fmtDate(dd.troughDay) : "—"}`} tone="neg" />
        <Stat label="Tracking" value={`β ${beta.toFixed(2)}`} sub={`α ${fmtPct(alpha * 100)} · R² ${r2.toFixed(2)}`} />
      </div>

      <Card title="Indexed growth" subtitle="Portfolio vs S&P 500 benchmark, rebased to 100" className="mt-4">
        <MultiLineChart
          series={[
            { name: "Portfolio", points: indexed(history.total) },
            { name: "Invested capital", points: indexed(history.invested) },
            { name: "S&P 500 benchmark", points: indexed(history.benchmark) },
          ]}
          colors={["#818cf8", "#64748b", "#f59e0b"]}
          height={300}
          formatValue={(n) => n.toFixed(0)}
        />
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Underwater curve" subtitle="Drawdown from peak, %" className="xl:col-span-2">
          <LineChart
            series={ddSeries}
            height={220}
            color="#fb7185"
            zeroLine
            formatValue={(n) => `${n.toFixed(0)}%`}
          />
        </Card>

        <Card title="Calendar years" subtitle="Compounded yearly return">
          <BarChart data={yearlyBars} height={200} color="#6366f1" formatValue={(n) => `${n.toFixed(1)}%`} />
        </Card>
      </div>

      <Card title="Monthly return grid" subtitle="Percentage change per month, with yearly compound in the last column" className="mt-4">
        <MonthlyHeatmap grid={grid} />
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Return statistics" subtitle="Daily return distribution over the reconstructed history">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Metric label="Annualised vol" value={fmtPct(volatility(ret) * 100)} />
            <Metric label="Sharpe (4% rf)" value={sharpe(ret).toFixed(2)} />
            <Metric label="Sortino" value={sortino(ret).toFixed(2)} />
            <Metric label="Best day" value={fmtPct(stats.best)} />
            <Metric label="Worst day" value={fmtPct(stats.worst)} />
            <Metric label="Win rate" value={`${stats.win.toFixed(1)}%`} />
            <Metric label="Avg up day" value={fmtPct(stats.avgUp)} />
            <Metric label="Avg down day" value={fmtPct(stats.avgDown)} />
            <Metric label="Correlation to SPY" value={correlation(ret, benchRet).toFixed(2)} />
          </dl>
        </Card>

        <Card title="Value vs contributions" subtitle="How much of today's balance is market growth rather than deposits">
          <LineChart
            series={history.total}
            height={170}
            color="#818cf8"
            formatValue={(n) => fmtCurrency(n, "USD", 0)}
          />
          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-800/70 pt-3 text-sm">
            <Metric label="Contributed" value={fmtCurrency(summary.netInvested, "USD", 0)} />
            <Metric label="Current" value={fmtCurrency(summary.totalValue, "USD", 0)} />
            <Metric label="Market gain" value={fmtCurrency(summary.totalValue - summary.netInvested, "USD", 0)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums text-slate-200">{value}</dd>
    </div>
  );
}
