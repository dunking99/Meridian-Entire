import WatchlistManager from "@/components/WatchlistManager";
import { Card, PageHeader, Stat } from "@/components/ui";
import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { quotesForSymbols } from "@/lib/market-data";
import { UNIVERSE } from "@/lib/universe";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const rows = await db.select().from(watchlist).orderBy(asc(watchlist.addedAt));
  const symbols = rows.map((r) => r.symbol);
  const quotes = await quotesForSymbols(symbols);

  const breaches = rows.filter((r) => {
    const q = quotes.find((x) => x.symbol === r.symbol);
    if (!q) return false;
    return (r.targetHigh != null && q.price >= r.targetHigh) || (r.targetLow != null && q.price <= r.targetLow);
  }).length;

  const avgMove = quotes.length ? quotes.reduce((a, b) => a + b.changePct, 0) / quotes.length : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Page 06 · Ideas"
        title="Watchlist"
        blurb="Instruments you are tracking but not holding, each with an optional price band. Breaches are flagged the moment you load the page."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Tracked" value={String(rows.length)} sub="instruments on the list" />
        <Stat label="Band breaches" value={String(breaches)} sub="outside your alert levels" tone={breaches > 0 ? "neg" : "neutral"} />
        <Stat label="Average move" value={`${avgMove >= 0 ? "+" : ""}${avgMove.toFixed(2)}%`} sub="today across the list" tone={avgMove >= 0 ? "pos" : "neg"} />
      </div>

      <div className="mt-4">
        <WatchlistManager
          items={rows.map((r) => ({ symbol: r.symbol, note: r.note, targetHigh: r.targetHigh, targetLow: r.targetLow }))}
          quotes={quotes.map((q) => ({
            symbol: q.symbol,
            name: q.name,
            price: q.price,
            previousClose: q.previousClose,
            changePct: q.changePct,
            currency: q.currency,
            synthetic: q.synthetic,
            spark: q.spark,
          }))}
          suggest={UNIVERSE.map((u) => u.symbol)}
        />
      </div>

      <Card title="How alerts work" className="mt-4">
        <p className="text-sm text-slate-400">
          Meridian stores your band in the database and evaluates it every time this page renders — no daemon, no push notifications.
          Because the price archive keeps growing, the same page can later be extended to show how long a symbol has been outside its band.
        </p>
      </Card>
    </div>
  );
}
