import { db } from "@/db";
import { instruments, priceBars, type Instrument } from "@/db/schema";
import { and, asc, gte, inArray } from "drizzle-orm";

export type Quote = {
  instrument: Instrument;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  r1d: number;
  r5d: number;
  r1m: number;
  r3m: number;
  ytd: number;
  high52: number;
  low52: number;
  volume: number;
  avgVolume: number;
  spark: number[];
  asOf: string;
  history: { d: string; close: number }[];
};

export type QuoteBook = {
  list: Quote[];
  byId: Map<number, Quote>;
  bySymbol: Map<string, Quote>;
};

function pct(cur: number, prev: number) {
  if (!prev) return 0;
  return cur / prev - 1;
}

export async function getQuoteBook(symbols?: string[]): Promise<QuoteBook> {
  const universe = symbols?.length
    ? await db.select().from(instruments).where(inArray(instruments.symbol, symbols))
    : await db.select().from(instruments).orderBy(asc(instruments.symbol));

  if (!universe.length) {
    return { list: [], byId: new Map(), bySymbol: new Map() };
  }

  const ids = universe.map((i) => i.id);
  const cutoff = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
  const bars = await db
    .select({
      instrumentId: priceBars.instrumentId,
      d: priceBars.d,
      close: priceBars.close,
      volume: priceBars.volume,
    })
    .from(priceBars)
    .where(and(inArray(priceBars.instrumentId, ids), gte(priceBars.d, cutoff)))
    .orderBy(asc(priceBars.instrumentId), asc(priceBars.d));

  const grouped = new Map<number, { d: string; close: number; volume: number }[]>();
  for (const b of bars) {
    const arr = grouped.get(b.instrumentId) ?? [];
    arr.push({ d: b.d, close: b.close, volume: b.volume });
    grouped.set(b.instrumentId, arr);
  }

  const list: Quote[] = universe.map((instrument) => {
    const series = grouped.get(instrument.id) ?? [];
    const closes = series.map((s) => s.close);
    const n = closes.length;
    const price = closes[n - 1] ?? 0;
    const prevClose = closes[n - 2] ?? price;
    const at = (back: number) => closes[Math.max(0, n - 1 - back)] ?? price;
    const yearStart = series.find((s) => s.d >= `${new Date().getUTCFullYear()}-01-01`);
    const window252 = series.slice(-252);
    const volumes = series.slice(-30).map((s) => s.volume);
    return {
      instrument,
      price,
      prevClose,
      change: price - prevClose,
      changePct: pct(price, prevClose),
      r1d: pct(price, prevClose),
      r5d: pct(price, at(5)),
      r1m: pct(price, at(21)),
      r3m: pct(price, at(63)),
      ytd: pct(price, yearStart?.close ?? closes[0] ?? price),
      high52: window252.length ? Math.max(...window252.map((s) => s.close)) : price,
      low52: window252.length ? Math.min(...window252.map((s) => s.close)) : price,
      volume: series[n - 1]?.volume ?? 0,
      avgVolume: volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0,
      spark: closes.slice(-40),
      asOf: series[n - 1]?.d ?? "",
      history: series.slice(-260),
    };
  });

  return {
    list,
    byId: new Map(list.map((q) => [q.instrument.id, q])),
    bySymbol: new Map(list.map((q) => [q.instrument.symbol, q])),
  };
}

export function breadth(quotes: Quote[]) {
  const adv = quotes.filter((q) => q.changePct > 0).length;
  const dec = quotes.filter((q) => q.changePct < 0).length;
  const avg = quotes.length ? quotes.reduce((a, q) => a + q.changePct, 0) / quotes.length : 0;
  return { adv, dec, flat: quotes.length - adv - dec, avg };
}

export function groupPerformance(quotes: Quote[], key: "sector" | "assetClass") {
  const buckets = new Map<string, { label: string; count: number; r1d: number; r1m: number; marketCap: number; members: Quote[] }>();
  for (const q of quotes) {
    const label = (key === "sector" ? q.instrument.sector : q.instrument.assetClass) ?? "Other";
    const b = buckets.get(label) ?? { label, count: 0, r1d: 0, r1m: 0, marketCap: 0, members: [] };
    b.count += 1;
    b.r1d += q.changePct;
    b.r1m += q.r1m;
    b.marketCap += q.instrument.marketCap ?? 0;
    b.members.push(q);
    buckets.set(label, b);
  }
  return [...buckets.values()]
    .map((b) => ({ ...b, r1d: b.r1d / b.count, r1m: b.r1m / b.count }))
    .sort((a, b) => b.marketCap - a.marketCap);
}

export function distanceTo(q: Quote, target: number | null | undefined) {
  if (!target) return null;
  return target / q.price - 1;
}
