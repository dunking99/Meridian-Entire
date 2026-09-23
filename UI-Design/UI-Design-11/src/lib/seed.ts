import { sql } from "drizzle-orm";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getPriceSeries } from "@/lib/portfolio";

type Plan = { symbol: string; weight: number };

/** A boring, believable accumulator portfolio: monthly contributions, quarterly dividends. */
const CORE: Plan[] = [
  { symbol: "VOO", weight: 0.34 },
  { symbol: "VXUS", weight: 0.16 },
  { symbol: "QQQ", weight: 0.12 },
  { symbol: "SCHD", weight: 0.1 },
  { symbol: "BND", weight: 0.14 },
  { symbol: "VNQ", weight: 0.04 },
  { symbol: "GLD", weight: 0.04 },
  { symbol: "AAPL", weight: 0.02 },
  { symbol: "MSFT", weight: 0.02 },
  { symbol: "NVDA", weight: 0.02 },
];

const SATELLITE: Record<number, string> = {
  0: "AAPL",
  1: "JPM",
  2: "UNH",
  3: "XOM",
  4: "ASML",
  5: "MSFT",
  6: "NESN.SW",
  7: "7203.T",
};

const YIELDS: Record<string, number> = {
  VOO: 0.0033,
  VXUS: 0.0075,
  QQQ: 0.0017,
  SCHD: 0.0087,
  BND: 0.0075,
  VNQ: 0.0092,
  GLD: 0,
  AAPL: 0.0011,
  MSFT: 0.0018,
  NVDA: 0.0006,
  JPM: 0.0055,
  UNH: 0.0038,
  XOM: 0.0078,
  ASML: 0.0022,
  "NESN.SW": 0.0075,
  "7203.T": 0.0062,
};

export async function seedDemoPortfolio(months = 42): Promise<{ inserted: number; message: string }> {
  const existing = await db.execute(sql`SELECT COUNT(*)::int AS c FROM transactions`).then((r) => Number((r.rows[0] as { c: number }).c ?? 0));
  if (existing > 0) return { inserted: 0, message: "ledger already populated" };

  const symbols = [...new Set([...CORE.map((c) => c.symbol), ...Object.values(SATELLITE)])];
  const series = await getPriceSeries(symbols);

  const priceOn = (symbol: string, day: string): number => {
    const map = series.get(symbol);
    if (!map || !map.size) return 0;
    const keys = [...map.keys()];
    let lo = 0;
    let hi = keys.length - 1;
    let best = keys[0];
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (keys[mid] <= day) {
        best = keys[mid];
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return map.get(best) ?? 0;
  };

  const rows: (typeof transactions.$inferInsert)[] = [];
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - months, 1));

  rows.push({ day: start.toISOString().slice(0, 10), symbol: "CASH", kind: "deposit", quantity: 1, price: 120000, note: "Opening transfer" });

  const holdings = new Map<string, number>();
  let monthIndex = 0;

  for (let m = 0; m <= months; m++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, 5));
    if (d > today) break;
    const day = d.toISOString().slice(0, 10);

    const contribution = 3200 + monthIndex * 12;
    rows.push({ day, symbol: "CASH", kind: "deposit", quantity: 1, price: contribution, note: "Monthly contribution" });

    const sat = SATELLITE[monthIndex % 8];
    const satAmount = 900;
    const coreAmount = contribution - satAmount;

    for (const p of CORE) {
      const px = priceOn(p.symbol, day);
      if (!px) continue;
      const amount = coreAmount * p.weight;
      const qty = Math.max(0.0001, +(amount / px).toFixed(6));
      rows.push({ day, symbol: p.symbol, kind: "buy", quantity: qty, price: +px.toFixed(4), fee: 0.49, note: "Scheduled buy" });
      holdings.set(p.symbol, (holdings.get(p.symbol) ?? 0) + qty);
    }

    const px = priceOn(sat, day);
    if (px) {
      const qty = Math.max(0.0001, +(satAmount / px).toFixed(6));
      rows.push({ day, symbol: sat, kind: "buy", quantity: qty, price: +px.toFixed(4), fee: 0.49, note: "Satellite buy" });
      holdings.set(sat, (holdings.get(sat) ?? 0) + qty);
    }

    // Quarterly dividend sweep
    if (m % 3 === 2) {
      for (const [sym, qty] of holdings.entries()) {
        const y = YIELDS[sym] ?? 0;
        if (!y) continue;
        const p = priceOn(sym, day);
        if (!p) continue;
        rows.push({ day, symbol: sym, kind: "dividend", quantity: qty, price: +((p * y) / 4).toFixed(6), note: "Quarterly distribution" });
      }
    }

    // Occasional trim
    if (m > 6 && monthIndex % 11 === 10) {
      const trim = "GLD";
      const held = holdings.get(trim) ?? 0;
      if (held > 0) {
        const sellQty = +(held * 0.25).toFixed(6);
        const p = priceOn(trim, day);
        if (p) {
          rows.push({ day, symbol: trim, kind: "sell", quantity: sellQty, price: +p.toFixed(4), fee: 0.49, note: "Rebalance trim" });
          holdings.set(trim, held - sellQty);
        }
      }
    }
    monthIndex++;
  }

  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(transactions).values(rows.slice(i, i + 200));
  }

  return { inserted: rows.length, message: `seeded ${rows.length} ledger rows` };
}
