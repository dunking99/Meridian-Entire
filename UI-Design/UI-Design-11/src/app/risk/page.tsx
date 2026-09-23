import { LineChart, CorrelationMatrix, BarChart } from "@/components/charts";
import { Badge, Card, Empty, PageHeader, Stat, Td, Th } from "@/components/ui";
import { buildPortfolioHistory, computePortfolio, getPriceSeries, getSetting } from "@/lib/portfolio";
import {
  betaAlpha,
  correlation,
  maxDrawdown,
  sharpe,
  sortino,
  toReturns,
  varCvar,
  volatility,
  type Point,
} from "@/lib/stats";
import { fmtCurrency, fmtPct, signClass } from "@/lib/format";

export const dynamic = "force-dynamic";

const SCENARIOS = [
  { name: "2008-style equity crash", shock: { equity: -0.45, etf: -0.42, bond: 0.05, commodity: -0.2, crypto: -0.7 } },
  { name: "Covid-style 30-day shock", shock: { equity: -0.32, etf: -0.3, bond: 0.03, commodity: -0.28, crypto: -0.5 } },
  { name: "Rates spike +200bps", shock: { equity: -0.12, etf: -0.11, bond: -0.14, commodity: -0.05, crypto: -0.2 } },
  { name: "Stagflation grind", shock: { equity: -0.18, etf: -0.16, bond: -0.08, commodity: 0.22, crypto: -0.25 } },
  { name: "Melt-up", shock: { equity: 0.22, etf: 0.2, bond: -0.03, commodity: 0.08, crypto: 0.45 } },
];

export default async function RiskPage() {
  const [summary, history, rf] = await Promise.all([
    computePortfolio(),
    buildPortfolioHistory(),
    getSetting<number>("riskFreeRate", 0.04),
  ]);

  const ret = toReturns(history.total);
  const benchRet = toReturns(history.benchmark);
  const { beta, alpha, r2 } = betaAlpha(ret, benchRet);
  const vol = volatility(ret);
  const { varPct, cvarPct } = varCvar(ret, 0.95);
  const dd = maxDrawdown(history.total);

  const symbols = summary.positions.slice(0, 8).map((p) => p.symbol);
  const series = await getPriceSeries([...symbols, "SPY"]);
  const daySet = new Set<string>();
  for (const map of series.values()) for (const d of map.keys()) daySet.add(d);
  const days = [...daySet].sort();

  const retFor = (sym: string, dayList: string[]): number[] => {
    const map = series.get(sym);
    if (!map) return [];
    const out: number[] = [];
    let last: number | null = null;
    for (const d of dayList) {
      const v = map.get(d);
      if (v == null) continue;
      if (last != null && last > 0) out.push(v / last - 1);
      last = v;
    }
    return out;
  };

  const labels = [...symbols];
  const retMatrices = labels.map((s) => retFor(s, days));
  const matrix = labels.map((_, i) =>
    labels.map((__, j) => (i === j ? 1 : correlation(retMatrices[i], retMatrices[j]))),
  );

  const betaRows = summary.positions.slice(0, 8).map((p, i) => {
    const spy = retFor("SPY", days);
    const b = betaAlpha(retMatrices[i] ?? [], spy);
    const r = toReturns(
      (() => {
        const map = series.get(p.symbol);
        if (!map) return [] as Point[];
        return [...map.entries()].sort().map(([day, value]) => ({ day, value }));
      })(),
    );
    return {
      symbol: p.symbol,
      beta: b.beta,
      vol: volatility(r),
      var95: varCvar(r, 0.95).varPct,
      weight: p.weight,
      contribution: Math.abs(b.beta) * p.weight,
    };
  }).sort((a, b) => b.contribution - a.contribution);

  const scenarioRows = SCENARIOS.map((s) => {
    let impact = 0;
    for (const p of summary.positions) {
      const shock = (s.shock as Record<string, number>)[p.assetClass] ?? -0.2;
      impact += p.marketValue * shock;
    }
    return {
      name: s.name,
      impact,
      impactPct: summary.totalValue ? (impact / summary.totalValue) * 100 : 0,
      resulting: summary.totalValue + impact,
    };
  });

  const rollingVol = (() => {
    const out: Point[] = [];
    const win = 21;
    for (let i = win; i < ret.length; i++) {
      const slice = ret.slice(i - win, i);
      out.push({ day: history.total[i + 1]?.day ?? history.total[history.total.length - 1].day, value: volatility(slice) * 100 });
    }
    return out;
  })();

  const spyReturns = retFor("SPY", days);

  return (
    <div>
      <PageHeader
        eyebrow="Page 07 · Exposure"
        title="Risk"
        blurb="Volatility, tail risk, factor sensitivity and correlation — plus what historical stress scenarios would do to today's book."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Annualised volatility" value={fmtPct(vol * 100)} sub={`${ret.length} daily observations`} />
        <Stat label="Beta vs S&P 500" value={beta.toFixed(2)} sub={`R² ${r2.toFixed(2)} · α ${fmtPct(alpha * 100)}`} />
        <Stat label="1-day VaR (95%)" value={fmtPct(varPct)} sub={`CVaR ${fmtPct(cvarPct)}`} tone="neg" />
        <Stat label="Max drawdown" value={fmtPct(dd.value * 100)} sub={`Sharpe ${sharpe(ret, rf).toFixed(2)} · Sortino ${sortino(ret, rf).toFixed(2)}`} tone="neg" />
      </div>

      <Card title="Rolling 21-day volatility" subtitle="How the book's risk profile has changed over time" className="mt-4">
        {rollingVol.length > 5 ? (
          <LineChart series={rollingVol} height={200} color="#f59e0b" formatValue={(n) => `${n.toFixed(0)}%`} />
        ) : (
          <Empty>Need at least a month of history.</Empty>
        )}
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Stress scenarios" subtitle="Instantaneous shock applied to today's weights" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <Th>Scenario</Th>
                  <Th className="text-right">P/L impact</Th>
                  <Th className="text-right">% of book</Th>
                  <Th className="text-right">Resulting value</Th>
                </tr>
              </thead>
              <tbody>
                {scenarioRows.map((s) => (
                  <tr key={s.name} className="border-b border-slate-900/60 last:border-0">
                    <Td className="text-slate-200">{s.name}</Td>
                    <Td className={`text-right tabular-nums ${signClass(s.impact)}`}>{fmtCurrency(s.impact, "USD", 0)}</Td>
                    <Td className={`text-right tabular-nums ${signClass(s.impactPct)}`}>{fmtPct(s.impactPct)}</Td>
                    <Td className="text-right tabular-nums text-slate-300">{fmtCurrency(s.resulting, "USD", 0)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Shocks are applied per asset class: cash is untouched, bonds get their own path. This is a what-if, not a forecast.
          </p>
        </Card>

        <Card title="Risk contribution" subtitle="Weight × |beta| — who actually moves the book">
          <BarChart
            data={betaRows.slice(0, 7).map((b) => ({ label: b.symbol, value: b.contribution }))}
            height={210}
            color="#a855f7"
            formatValue={(n) => n.toFixed(1)}
          />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Correlation matrix" subtitle="Daily returns across your top holdings">
          {labels.length > 1 ? <CorrelationMatrix labels={labels} matrix={matrix} /> : <Empty>Add more holdings to compute correlations.</Empty>}
        </Card>

        <Card title="Per-position risk" subtitle="Beta, volatility and tail risk by holding">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <Th>Symbol</Th>
                  <Th className="text-right">Weight</Th>
                  <Th className="text-right">Beta</Th>
                  <Th className="text-right">Vol</Th>
                  <Th className="text-right">VaR 95%</Th>
                  <Th className="text-right">Risk</Th>
                </tr>
              </thead>
              <tbody>
                {betaRows.map((b) => (
                  <tr key={b.symbol} className="border-b border-slate-900/60 last:border-0">
                    <Td className="font-medium text-slate-100">{b.symbol}</Td>
                    <Td className="text-right tabular-nums">{b.weight.toFixed(1)}%</Td>
                    <Td className="text-right tabular-nums">{b.beta.toFixed(2)}</Td>
                    <Td className="text-right tabular-nums">{fmtPct(b.vol * 100, 1)}</Td>
                    <Td className="text-right tabular-nums text-rose-400">{b.var95.toFixed(2)}%</Td>
                    <Td className="text-right">
                      <Badge tone={b.contribution > 12 ? "rose" : b.contribution > 6 ? "amber" : "emerald"}>
                        {b.contribution.toFixed(1)}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Benchmark proxy: SPY ({spyReturns.length} observations in the shared window).
          </p>
        </Card>
      </div>
    </div>
  );
}
