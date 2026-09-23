import { BarChart, LineChart } from "@/components/charts";
import { Card, Empty, PageHeader, Stat, Td, Th } from "@/components/ui";
import { computePortfolio, getAllTransactions } from "@/lib/portfolio";
import { MONTH_LABELS, fmtCurrency, fmtPct } from "@/lib/format";
import type { Point } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const [summary, txns] = await Promise.all([computePortfolio(), getAllTransactions()]);
  const divs = txns.filter((t) => t.kind === "dividend");

  const bySymbol = new Map<string, { amount: number; count: number; last: string }>();
  const byMonth = new Map<string, number>();
  for (const d of divs) {
    const amt = d.quantity * d.price - d.fee;
    const s = bySymbol.get(d.symbol) ?? { amount: 0, count: 0, last: d.day };
    s.amount += amt;
    s.count += 1;
    if (d.day > s.last) s.last = d.day;
    bySymbol.set(d.symbol, s);
    const key = d.day.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + amt);
  }

  const now = new Date();
  const ttmStart = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const ttm = divs.filter((d) => d.day >= ttmStart).reduce((a, d) => a + d.quantity * d.price - d.fee, 0);

  const monthlyAvg = byMonth.size ? [...byMonth.values()].reduce((a, b) => a + b, 0) / byMonth.size : 0;
  const projectedAnnual = monthlyAvg * 12;

  // Trailing-4-quarter run rate per holding
  const quarters = new Map<string, number[]>();
  for (const d of divs) {
    const q = `${d.day.slice(0, 4)}-Q${Math.floor(Number(d.day.slice(5, 7)) / 3.01) + 1}`;
    if (!quarters.has(d.symbol)) quarters.set(d.symbol, []);
    quarters.get(d.symbol)!.push(d.quantity * d.price - d.fee);
  }
  const forwardBySymbol = [...quarters.entries()].map(([symbol, amounts]) => {
    const last4 = amounts.slice(-4);
    const runRate = last4.length ? (last4.reduce((a, b) => a + b, 0) / last4.length) * 4 : 0;
    const pos = summary.positions.find((p) => p.symbol === symbol);
    return {
      symbol,
      runRate,
      yieldOnValue: pos && pos.marketValue > 0 ? (runRate / pos.marketValue) * 100 : 0,
      yieldOnCost: pos && pos.costBasis > 0 ? (runRate / pos.costBasis) * 100 : 0,
      marketValue: pos?.marketValue ?? 0,
    };
  });
  const forwardTotal = forwardBySymbol.reduce((a, b) => a + b.runRate, 0);

  const cumulative: Point[] = (() => {
    let acc = 0;
    return divs.map((d) => {
      acc += d.quantity * d.price - d.fee;
      return { day: d.day, value: acc };
    });
  })();

  const monthlyBars = (() => {
    const keys = [...byMonth.keys()].sort().slice(-18);
    return keys.map((k) => ({
      label: `${MONTH_LABELS[Number(k.slice(5, 7)) - 1]} ${k.slice(2, 4)}`,
      value: byMonth.get(k) ?? 0,
    }));
  })();

  const portfolioYield = summary.marketValue > 0 ? (forwardTotal / summary.marketValue) * 100 : 0;
  const yieldOnCost = summary.costBasis > 0 ? (forwardTotal / summary.costBasis) * 100 : 0;

  const rows = [...bySymbol.entries()]
    .map(([symbol, v]) => {
      const f = forwardBySymbol.find((x) => x.symbol === symbol);
      return { symbol, ...v, runRate: f?.runRate ?? 0, yieldOnCost: f?.yieldOnCost ?? 0 };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <PageHeader
        eyebrow="Page 08 · Cash flow"
        title="Income"
        blurb="Every distribution the portfolio has ever thrown off, annualised into a forward income estimate and yield on cost."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Trailing 12 months" value={fmtCurrency(ttm)} sub={`${divs.length} distributions on record`} tone="pos" />
        <Stat label="Forward annual" value={fmtCurrency(forwardTotal)} sub="Latest four quarters annualised" tone="pos" />
        <Stat label="Portfolio yield" value={fmtPct(portfolioYield)} sub={`Forward income / ${fmtCurrency(summary.marketValue, "USD", 0)} invested`} />
        <Stat label="Yield on cost" value={fmtPct(yieldOnCost)} sub="Against original capital deployed" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Distributions received" subtitle="Monthly cash landed in the account" className="xl:col-span-2">
          {monthlyBars.length ? (
            <BarChart data={monthlyBars} height={220} color="#10b981" formatValue={(n) => fmtCurrency(n, "USD", 0)} />
          ) : (
            <Empty>No dividend transactions recorded yet.</Empty>
          )}
        </Card>

        <Card title="Cumulative income" subtitle="Running total of all distributions">
          {cumulative.length > 2 ? (
            <LineChart series={cumulative} height={200} color="#34d399" formatValue={(n) => fmtCurrency(n, "USD", 0)} />
          ) : (
            <Empty>Not enough distributions to chart.</Empty>
          )}
        </Card>
      </div>

      <Card title="Income by holding" className="mt-4">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <Th>Symbol</Th>
                  <Th className="text-right">Payments</Th>
                  <Th className="text-right">Total received</Th>
                  <Th className="text-right">Forward annual</Th>
                  <Th className="text-right">Yield on cost</Th>
                  <Th className="text-right">Per month</Th>
                  <Th className="text-right">Last paid</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.symbol} className="border-b border-slate-900/60 last:border-0">
                    <Td className="font-medium text-slate-100">{r.symbol}</Td>
                    <Td className="text-right tabular-nums">{r.count}</Td>
                    <Td className="text-right tabular-nums text-emerald-400">{fmtCurrency(r.amount)}</Td>
                    <Td className="text-right tabular-nums">{fmtCurrency(r.runRate)}</Td>
                    <Td className="text-right tabular-nums">{fmtPct(r.yieldOnCost)}</Td>
                    <Td className="text-right tabular-nums text-slate-400">{fmtCurrency(r.runRate / 12)}</Td>
                    <Td className="text-right tabular-nums text-slate-500">{r.last}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Record a dividend transaction on the Ledger page to start building an income history.</Empty>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card title="Reinvestment effect">
          <p className="text-sm text-slate-400">
            Distributions land as cash in the ledger. If you want compounding, record a matching buy — Meridian keeps both legs so
            the cost basis and yield-on-cost stay honest.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Reinvesting {fmtCurrency(forwardTotal)} a year at a 7% real return adds roughly{" "}
            <span className="text-emerald-400">{fmtCurrency(forwardTotal * 10, "USD", 0)}</span> over a decade.
          </p>
        </Card>
        <Card title="Concentration of income">
          <ul className="space-y-1.5">
            {rows.slice(0, 5).map((r) => (
              <li key={r.symbol} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{r.symbol}</span>
                <span className="tabular-nums text-slate-300">
                  {((r.runRate / (forwardTotal || 1)) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
            {!rows.length && <li className="text-xs text-slate-600">No income yet.</li>}
          </ul>
        </Card>
        <Card title="Payment cadence">
          <ul className="space-y-1.5">
            {rows.slice(0, 6).map((r) => (
              <li key={r.symbol} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{r.symbol}</span>
                <span className="text-slate-300">
                  {r.count >= 8 ? "Quarterly+" : r.count >= 4 ? "Quarterly" : r.count >= 2 ? "Semi-annual" : "Annual / irregular"}
                </span>
              </li>
            ))}
            {!rows.length && <li className="text-xs text-slate-600">No income yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
