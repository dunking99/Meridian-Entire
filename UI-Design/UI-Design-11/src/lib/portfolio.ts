import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { instruments, portfolioSnapshots, prices, settings, transactions } from "@/db/schema";
import { UNIVERSE_BY_SYMBOL } from "@/lib/universe";
import { hhi, type Point } from "@/lib/stats";

export type Txn = typeof transactions.$inferSelect;

export const BASE_CURRENCY = "USD";

/* ------------------------------------------------------------------ */
/* reads                                                               */
/* ------------------------------------------------------------------ */

export async function getAllTransactions(): Promise<Txn[]> {
  return db.select().from(transactions).orderBy(asc(transactions.day), asc(transactions.id));
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows.length ? (rows[0].value as T) : fallback;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value: value as unknown as object })
    .onConflictDoUpdate({ target: settings.key, set: { value: value as unknown as object, updatedAt: new Date() } });
}

/** day -> close for each requested symbol. */
export async function getPriceSeries(symbols: string[]): Promise<Map<string, Map<string, number>>> {
  const out = new Map<string, Map<string, number>>();
  if (!symbols.length) return out;
  const rows = await db
    .select({ symbol: prices.symbol, day: prices.day, close: prices.close })
    .from(prices)
    .where(inArray(prices.symbol, symbols))
    .orderBy(asc(prices.day));
  for (const r of rows) {
    if (!out.has(r.symbol)) out.set(r.symbol, new Map());
    out.get(r.symbol)!.set(r.day, r.close);
  }
  return out;
}

export async function getLatestPrices(symbols: string[]): Promise<Map<string, { close: number; prev: number; day: string }>> {
  const out = new Map<string, { close: number; prev: number; day: string }>();
  if (!symbols.length) return out;
  const rows = await db
    .select({ symbol: prices.symbol, day: prices.day, close: prices.close })
    .from(prices)
    .where(inArray(prices.symbol, symbols))
    .orderBy(asc(prices.day));
  for (const r of rows) {
    const cur = out.get(r.symbol);
    if (cur) {
      cur.prev = cur.close;
      cur.close = r.close;
      cur.day = r.day;
    } else {
      out.set(r.symbol, { close: r.close, prev: r.close, day: r.day });
    }
  }
  return out;
}

/** Last N closes for sparklines. */
export async function getSparklines(symbols: string[], limit = 60): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>();
  if (!symbols.length) return out;
  const rows = await db
    .execute(sql`
      SELECT symbol, close, day FROM (
        SELECT symbol, close, day, ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY day DESC) AS rn
        FROM prices WHERE symbol IN (${sql.join(symbols.map((s) => sql`${s}`), sql`, `)})
      ) t WHERE t.rn <= ${limit} ORDER BY symbol, day ASC
    `)
    .then((r) => r.rows as unknown as { symbol: string; close: number; day: string }[]);
  for (const r of rows) {
    if (!out.has(r.symbol)) out.set(r.symbol, []);
    out.get(r.symbol)!.push(Number(r.close));
  }
  return out;
}

export async function getInstrumentMap(): Promise<Map<string, typeof instruments.$inferSelect>> {
  const rows = await db.select().from(instruments);
  return new Map(rows.map((r) => [r.symbol, r]));
}

export async function getCoverage(): Promise<{ symbol: string; days: number; first: string; last: string }[]> {
  const rows = await db
    .execute(sql`SELECT symbol, COUNT(*)::int AS days, MIN(day)::text AS first, MAX(day)::text AS last FROM prices GROUP BY symbol ORDER BY symbol`)
    .then((r) => r.rows as unknown as { symbol: string; days: number; first: string; last: string }[]);
  return rows;
}

/* ------------------------------------------------------------------ */
/* cash + positions                                                    */
/* ------------------------------------------------------------------ */

export function cashDelta(t: Txn): number {
  switch (t.kind) {
    case "deposit":
      return t.price;
    case "withdrawal":
      return -t.price;
    case "buy":
      return -(t.quantity * t.price + t.fee);
    case "sell":
      return t.quantity * t.price - t.fee;
    case "dividend":
      return t.quantity * t.price - t.fee;
    case "fee":
      return -t.price;
    default:
      return 0;
  }
}

export type Position = {
  symbol: string;
  name: string;
  assetClass: string;
  sector: string;
  region: string;
  currency: string;
  quantity: number;
  avgCost: number;
  costBasis: number;
  price: number;
  prevClose: number;
  marketValue: number;
  dayChange: number;
  dayChangePct: number;
  unrealizedPL: number;
  unrealizedPct: number;
  weight: number;
  realizedPL: number;
  dividends: number;
  firstBuy: string;
  valueBase: number;
};

export type PortfolioSummary = {
  positions: Position[];
  marketValue: number;
  cash: number;
  totalValue: number;
  netInvested: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPct: number;
  realizedPL: number;
  totalDividends: number;
  dayChange: number;
  dayChangePct: number;
  totalReturnPct: number;
  concentration: number;
  asOf: string | null;
};

const FX_TO_USD: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27, CHF: 1.12, JPY: 0.0064, HKD: 0.128, CNY: 0.138 };

export function fxRate(currency: string): number {
  return FX_TO_USD[currency] ?? 1;
}

export async function computePortfolio(): Promise<PortfolioSummary> {
  const txns = await getAllTransactions();
  const instrumentMap = await getInstrumentMap();
  const symbols = [...new Set(txns.map((t) => t.symbol).filter((s) => s !== "CASH"))];
  const latest = await getLatestPrices(symbols);

  const acc = new Map<
    string,
    { qty: number; cost: number; realized: number; divs: number; firstBuy: string }
  >();

  let cash = 0;
  let deposited = 0;
  let withdrawn = 0;

  for (const t of txns) {
    cash += cashDelta(t);
    if (t.kind === "deposit") deposited += t.price;
    if (t.kind === "withdrawal") withdrawn += t.price;
    if (t.symbol === "CASH") continue;
    const a = acc.get(t.symbol) ?? { qty: 0, cost: 0, realized: 0, divs: 0, firstBuy: t.day };
    if (t.kind === "buy") {
      a.qty += t.quantity;
      a.cost += t.quantity * t.price + t.fee;
      if (t.day < a.firstBuy) a.firstBuy = t.day;
    } else if (t.kind === "sell") {
      const avg = a.qty > 0 ? a.cost / a.qty : 0;
      const soldCost = avg * t.quantity;
      a.qty -= t.quantity;
      a.cost -= soldCost;
      a.realized += t.quantity * t.price - t.fee - soldCost;
    } else if (t.kind === "dividend") {
      a.divs += t.quantity * t.price - t.fee;
    }
    acc.set(t.symbol, a);
  }

  const positions: Position[] = [];
  let marketValue = 0;
  let costBasis = 0;
  let dayChange = 0;
  let realizedPL = 0;
  let totalDividends = 0;
  let asOf: string | null = null;

  for (const [symbol, a] of acc.entries()) {
    if (Math.abs(a.qty) < 1e-9) continue;
    const meta = instrumentMap.get(symbol) ?? UNIVERSE_BY_SYMBOL.get(symbol);
    const px = latest.get(symbol);
    const price = px?.close ?? lastTradePrice(txns, symbol);
    const prev = px?.prev ?? price;
    if (px?.day && (!asOf || px.day > asOf)) asOf = px.day;
    const valueBase = a.qty * price * fxRate(meta?.currency ?? "USD");
    const avgCost = a.qty > 0 ? a.cost / a.qty : 0;
    marketValue += valueBase;
    costBasis += a.cost;
    dayChange += a.qty * (price - prev) * fxRate(meta?.currency ?? "USD");
    realizedPL += a.realized;
    totalDividends += a.divs;
    positions.push({
      symbol,
      name: meta?.name ?? symbol,
      assetClass: meta?.assetClass ?? "equity",
      sector: meta?.sector ?? "Unclassified",
      region: meta?.region ?? "Unknown",
      currency: meta?.currency ?? "USD",
      quantity: a.qty,
      avgCost,
      costBasis: a.cost,
      price,
      prevClose: prev,
      marketValue: valueBase,
      dayChange: a.qty * (price - prev) * fxRate(meta?.currency ?? "USD"),
      dayChangePct: prev ? (price / prev - 1) * 100 : 0,
      unrealizedPL: valueBase - a.cost,
      unrealizedPct: a.cost > 0 ? (valueBase / a.cost - 1) * 100 : 0,
      weight: 0,
      realizedPL: a.realized,
      dividends: a.divs,
      firstBuy: a.firstBuy,
      valueBase,
    });
  }

  const totalValue = marketValue + cash;
  for (const p of positions) p.weight = totalValue > 0 ? (p.marketValue / totalValue) * 100 : 0;
  positions.sort((a, b) => b.marketValue - a.marketValue);

  const netInvested = deposited - withdrawn;
  const investedNow = costBasis;
  const unrealizedPL = marketValue - investedNow;
  const prevTotal = totalValue - dayChange;

  return {
    positions,
    marketValue,
    cash,
    totalValue,
    netInvested,
    costBasis: investedNow,
    unrealizedPL,
    unrealizedPct: investedNow > 0 ? (unrealizedPL / investedNow) * 100 : 0,
    realizedPL,
    totalDividends,
    dayChange,
    dayChangePct: prevTotal > 0 ? (dayChange / prevTotal) * 100 : 0,
    totalReturnPct: netInvested > 0 ? ((totalValue - netInvested) / netInvested) * 100 : 0,
    concentration: hhi(positions.map((p) => p.marketValue)),
    asOf,
  };
}

function lastTradePrice(txns: Txn[], symbol: string): number {
  for (let i = txns.length - 1; i >= 0; i--) {
    if (txns[i].symbol === symbol && txns[i].price > 0) return txns[i].price;
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* history reconstruction                                              */
/* ------------------------------------------------------------------ */

export type HistoryBundle = {
  total: Point[];
  invested: Point[];
  benchmark: Point[];
  drawdown: Point[];
  cashFlows: { day: string; amount: number }[];
  symbols: string[];
};

/** Rebuild the portfolio value curve from the ledger + price archive. */
export async function buildPortfolioHistory(): Promise<HistoryBundle> {
  const txns = await getAllTransactions();
  const instrumentMap = await getInstrumentMap();
  const symbols = [...new Set(txns.map((t) => t.symbol).filter((s) => s !== "CASH"))];
  const series = await getPriceSeries([...symbols, "SPY"]);

  if (!txns.length) {
    return { total: [], invested: [], benchmark: [], drawdown: [], cashFlows: [], symbols: [] };
  }

  const start = new Date(txns[0].day + "T00:00:00Z");
  const end = new Date();
  const days: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const cursorQty = new Map<string, number>();
  let cash = 0;
  let txIdx = 0;
  const lastKnown = new Map<string, number>();
  const cashFlows: { day: string; amount: number }[] = [];
  const total: Point[] = [];
  const invested: Point[] = [];
  let cumFlow = 0;

  for (const day of days) {
    while (txIdx < txns.length && txns[txIdx].day <= day) {
      const t = txns[txIdx];
      cash += cashDelta(t);
      if (t.kind === "deposit" || t.kind === "withdrawal") {
        cumFlow += cashDelta(t);
        cashFlows.push({ day: t.day, amount: cashDelta(t) });
      }
      if (t.symbol !== "CASH") {
        const signed = t.kind === "buy" ? t.quantity : t.kind === "sell" ? -t.quantity : 0;
        cursorQty.set(t.symbol, (cursorQty.get(t.symbol) ?? 0) + signed);
        // seed a price so early days aren't zero
        if (!lastKnown.has(t.symbol) && t.price > 0) lastKnown.set(t.symbol, t.price);
      }
      txIdx++;
    }

    let mv = 0;
    for (const [sym, qty] of cursorQty.entries()) {
      if (Math.abs(qty) < 1e-9) continue;
      const map = series.get(sym);
      let px = map?.get(day);
      if (px == null) px = lastKnown.get(sym) ?? 0;
      else lastKnown.set(sym, px);
      mv += qty * px * fxRate(instrumentMap.get(sym)?.currency ?? UNIVERSE_BY_SYMBOL.get(sym)?.currency ?? "USD");
    }
    total.push({ day, value: mv + cash });
    invested.push({ day, value: cumFlow });
  }

  // Benchmark: SPY bought with the same cash-flow schedule.
  const spy = series.get("SPY");
  const benchmark: Point[] = [];
  if (spy && spy.size) {
    const spyDays = [...spy.keys()];
    let units = 0;
    let flowIdx = 0;
    let benchCash = 0;
    for (const day of days) {
      const pxDay = closestDay(spyDays, day);
      const px = spy.get(pxDay)!;
      while (flowIdx < cashFlows.length && cashFlows[flowIdx].day <= day) {
        benchCash += cashFlows[flowIdx].amount;
        units += cashFlows[flowIdx].amount / px;
        flowIdx++;
      }
      benchmark.push({ day, value: units * px + benchCash });
    }
  }

  let peak = -Infinity;
  const drawdown = total.map((p) => {
    peak = Math.max(peak, p.value);
    return { day: p.day, value: peak > 0 ? (p.value / peak - 1) * 100 : 0 };
  });

  return { total, invested, benchmark, drawdown, cashFlows, symbols };
}

function closestDay(sortedDays: string[], target: string): string {
  let lo = 0;
  let hi = sortedDays.length - 1;
  let best = sortedDays[0];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sortedDays[mid] <= target) {
      best = sortedDays[mid];
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* snapshots                                                           */
/* ------------------------------------------------------------------ */

export async function getSnapshots(limit = 2000) {
  return db.select().from(portfolioSnapshots).orderBy(desc(portfolioSnapshots.day)).limit(limit);
}

export async function writeSnapshot(note = "auto") {
  const p = await computePortfolio();
  const today = new Date().toISOString().slice(0, 10);
  const prev = await db.select().from(portfolioSnapshots).where(and(eq(portfolioSnapshots.day, today))).limit(1);
  const prevDay = prev[0]?.totalValue ?? p.totalValue - p.dayChange;
  await db
    .insert(portfolioSnapshots)
    .values({
      day: today,
      marketValue: p.marketValue,
      cash: p.cash,
      totalValue: p.totalValue,
      invested: p.netInvested,
      dayChangePct: prevDay > 0 ? ((p.totalValue - prevDay) / prevDay) * 100 : 0,
      note,
    })
    .onConflictDoUpdate({
      target: portfolioSnapshots.day,
      set: {
        marketValue: p.marketValue,
        cash: p.cash,
        totalValue: p.totalValue,
        invested: p.netInvested,
        note,
      },
    });
  return p;
}

export const DEFAULT_TARGETS: Record<string, number> = {
  "US Equity": 40,
  "Intl Equity": 18,
  "Tech Equity": 12,
  Bonds: 15,
  "Real Estate": 5,
  Gold: 5,
  Cash: 5,
};
