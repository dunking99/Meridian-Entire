import AddTrade from "@/components/AddTrade";
import LedgerTable from "@/components/LedgerTable";
import { BarChart } from "@/components/charts";
import { Card, Empty, PageHeader, Stat } from "@/components/ui";
import { computePortfolio, getAllTransactions } from "@/lib/portfolio";
import { fmtCurrency, fmtNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const [txns, summary] = await Promise.all([getAllTransactions(), computePortfolio()]);

  const totals = txns.reduce(
    (acc, t) => {
      const gross = t.quantity * t.price;
      if (t.kind === "buy") {
        acc.bought += gross + t.fee;
        acc.trades += 1;
      } else if (t.kind === "sell") {
        acc.sold += gross - t.fee;
        acc.trades += 1;
      } else if (t.kind === "dividend") acc.dividends += gross - t.fee;
      else if (t.kind === "deposit") acc.deposits += t.price;
      else if (t.kind === "withdrawal") acc.withdrawals += t.price;
      acc.fees += t.fee;
      return acc;
    },
    { bought: 0, sold: 0, dividends: 0, deposits: 0, withdrawals: 0, fees: 0, trades: 0 },
  );

  const byYear = Object.entries(
    txns
      .filter((t) => t.kind === "deposit")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.day.slice(0, 4)] = (acc[t.day.slice(0, 4)] ?? 0) + t.price;
        return acc;
      }, {}),
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const first = txns[0]?.day ?? null;
  const last = txns[txns.length - 1]?.day ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Page 09 · Source of truth"
        title="Ledger"
        blurb="Every cash event, in order. Positions, cost basis, realised P/L and portfolio value are all derived from these rows — nothing is stored twice."
        right={
          first && last ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Coverage</p>
              <p className="text-sm tabular-nums text-slate-200">
                {first} → {last}
              </p>
            </div>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Transactions" value={fmtNumber(txns.length, 0)} sub={`${totals.trades} trades executed`} />
        <Stat label="Capital deployed" value={fmtCurrency(totals.bought, "USD", 0)} sub={`Proceeds ${fmtCurrency(totals.sold, "USD", 0)}`} />
        <Stat label="Realised P/L" value={fmtCurrency(summary.realizedPL)} sub="Closed positions only" tone={summary.realizedPL >= 0 ? "pos" : "neg"} />
        <Stat label="Fees paid" value={fmtCurrency(totals.fees)} sub={`${((totals.fees / (totals.bought || 1)) * 100).toFixed(3)}% of deployed`} tone="neg" />
      </div>

      <Card title="Record a transaction" className="mt-4">
        <AddTrade />
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-4">
        <Card title="Contributions by year" className="xl:col-span-3">
          {byYear.length ? (
            <BarChart
              data={byYear.map(([y, v]) => ({ label: y, value: v }))}
              height={180}
              color="#0ea5e9"
              formatValue={(n) => fmtCurrency(n, "USD", 0)}
            />
          ) : (
            <Empty>No deposits recorded.</Empty>
          )}
        </Card>
        <Card title="Flow summary">
          <dl className="space-y-2 text-sm">
            <Row label="Deposits" value={fmtCurrency(totals.deposits, "USD", 0)} tone="pos" />
            <Row label="Withdrawals" value={fmtCurrency(totals.withdrawals, "USD", 0)} tone="neg" />
            <Row label="Net contributed" value={fmtCurrency(totals.deposits - totals.withdrawals, "USD", 0)} />
            <Row label="Dividends" value={fmtCurrency(totals.dividends, "USD", 0)} tone="pos" />
            <Row label="Cash today" value={fmtCurrency(summary.cash, "USD", 0)} />
          </dl>
        </Card>
      </div>

      <Card title="All transactions" subtitle="Filter, search, delete — edits recompute the whole book" className="mt-4">
        <LedgerTable
          rows={txns.map((t) => ({
            id: t.id,
            day: t.day,
            symbol: t.symbol,
            kind: t.kind,
            quantity: t.quantity,
            price: t.price,
            fee: t.fee,
            currency: t.currency,
            note: t.note,
          }))}
        />
      </Card>
    </div>
  );
}

function Row({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "pos" | "neg" }) {
  const cls = tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-slate-200";
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums ${cls}`}>{value}</dd>
    </div>
  );
}
