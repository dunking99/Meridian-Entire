import { db } from "@/db";
import { instruments, priceHistory } from "@/db/schema";
import { n } from "@/lib/format";
import { eq } from "drizzle-orm";

/**
 * MARKET DATA PROVIDER ADAPTER
 * ----------------------------
 * Everything that needs prices goes through `refreshQuotes()`. Today it
 * uses a simulated random-walk provider so the app is fully functional
 * offline. Swap `SimulatedProvider` for a real one (Polygon, Finnhub,
 * Alpha Vantage, Yahoo…) that implements `QuoteProvider` and nothing
 * else in the app changes.
 */
export type Quote = { symbol: string; price: number; prevClose: number };

export interface QuoteProvider {
  name: string;
  getQuotes(symbols: string[]): Promise<Quote[]>;
}

class SimulatedProvider implements QuoteProvider {
  name = "simulated";
  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const rows = await db.select().from(instruments);
    const bySym = new Map(rows.map((r) => [r.symbol, r]));
    return symbols.flatMap((s) => {
      const r = bySym.get(s);
      if (!r) return [];
      const last = n(r.lastPrice);
      const vol = r.assetClass === "crypto" ? 0.03 : r.assetClass === "bond" ? 0.003 : 0.012;
      const move = (Math.random() - 0.5) * 2 * vol;
      return [{ symbol: s, price: +(last * (1 + move)).toFixed(4), prevClose: last }];
    });
  }
}

export function getProvider(): QuoteProvider {
  // e.g. if (process.env.POLYGON_API_KEY) return new PolygonProvider(process.env.POLYGON_API_KEY);
  return new SimulatedProvider();
}

export async function refreshQuotes() {
  const provider = getProvider();
  const rows = await db.select({ id: instruments.id, symbol: instruments.symbol }).from(instruments);
  const quotes = await provider.getQuotes(rows.map((r) => r.symbol));
  const idOf = new Map(rows.map((r) => [r.symbol, r.id]));
  const today = new Date().toISOString().slice(0, 10);
  for (const q of quotes) {
    const id = idOf.get(q.symbol);
    if (!id) continue;
    await db
      .update(instruments)
      .set({ lastPrice: String(q.price), prevClose: String(q.prevClose), priceUpdatedAt: new Date() })
      .where(eq(instruments.id, id));
    await db
      .insert(priceHistory)
      .values({ instrumentId: id, day: today, close: String(q.price) })
      .onConflictDoUpdate({ target: [priceHistory.instrumentId, priceHistory.day], set: { close: String(q.price) } });
  }
  return { provider: provider.name, updated: quotes.length };
}
