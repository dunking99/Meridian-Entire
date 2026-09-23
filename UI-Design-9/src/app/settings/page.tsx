import { Card, PageHeader } from "@/components/ui";
import { getProvider } from "@/lib/market-data";
import { getAllInstruments, getDefaultPortfolio } from "@/lib/queries";
import { db } from "@/db";
import { alerts, newsArticles, researchNotes, transactions } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [portfolio, insts, [tx], [news], [notes], [al]] = await Promise.all([
    getDefaultPortfolio(),
    getAllInstruments(),
    db.select({ c: count() }).from(transactions),
    db.select({ c: count() }).from(newsArticles),
    db.select({ c: count() }).from(researchNotes),
    db.select({ c: count() }).from(alerts),
  ]);
  const provider = getProvider();
  return (
    <div>
      <PageHeader title="Settings" subtitle="Data sources, portfolio defaults and system status." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Market data provider">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Active provider</dt><dd className="font-mono">{provider.name}</dd>
            <dt className="text-slate-500">Adapter</dt><dd className="font-mono text-xs">src/lib/market-data.ts</dd>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Quotes are simulated so the app works offline. To go live, implement <code>QuoteProvider</code> for your vendor (Polygon, Finnhub, Alpha Vantage…) and return it from <code>getProvider()</code> when its API key env var is present. Nothing else changes.
          </p>
        </Card>
        <Card title="Portfolio">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Name</dt><dd>{portfolio.name}</dd>
            <dt className="text-slate-500">Base currency</dt><dd>{portfolio.baseCurrency}</dd>
            <dt className="text-slate-500">Cost basis method</dt><dd>Average cost</dd>
            <dt className="text-slate-500">Position source</dt><dd>Derived from ledger</dd>
          </dl>
        </Card>
        <Card title="Data">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Instruments</dt><dd className="tabular-nums">{insts.length}</dd>
            <dt className="text-slate-500">Transactions</dt><dd className="tabular-nums">{tx.c}</dd>
            <dt className="text-slate-500">News articles</dt><dd className="tabular-nums">{news.c}</dd>
            <dt className="text-slate-500">Research notes</dt><dd className="tabular-nums">{notes.c}</dd>
            <dt className="text-slate-500">Alerts</dt><dd className="tabular-nums">{al.c}</dd>
          </dl>
        </Card>
        <Card title="Roadmap hooks">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>News ingestion job → RSS/API into <code>news_articles</code> with automatic ticker tagging</li>
            <li>Daily EOD snapshot → time-weighted return & benchmark comparison</li>
            <li>Fundamentals table (P/E, margins, next earnings date) keyed to <code>instruments</code></li>
            <li>Multi-currency FX table for non-USD holdings</li>
            <li>Alert delivery (email/push) via a cron hitting <code>/api/alerts/evaluate</code></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
