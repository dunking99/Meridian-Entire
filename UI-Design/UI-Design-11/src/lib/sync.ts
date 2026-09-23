import { asc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { instruments, prices, syncLog } from "@/db/schema";
import { fetchHistory } from "@/lib/yahoo";
import { UNIVERSE, type UniverseRow } from "@/lib/universe";

export type SyncTarget = { symbol: string; yahooSymbol: string; assetClass: string };

async function chunkedInsert(rows: (typeof prices.$inferInsert)[], chunkSize = 400) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(prices).values(chunk).onConflictDoNothing({ target: [prices.symbol, prices.day] });
  }
}

export async function syncSymbols(
  targets: SyncTarget[],
  range = "5y",
): Promise<{ updated: number; rows: number; synthetic: number; failed: string[] }> {
  const log = await db
    .insert(syncLog)
    .values({ status: "running", symbolsRequested: targets.length, startedAt: new Date() })
    .returning({ id: syncLog.id });
  const logId = log[0].id;

  let updated = 0;
  let rows = 0;
  let synthetic = 0;
  const failed: string[] = [];
  const CONCURRENCY = 6;

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (t) => {
        try {
          const { bars, synthetic: isSynth } = await fetchHistory(t.yahooSymbol, range, t.assetClass);
          if (!bars.length) return null;
          const mapped = bars.map((b) => ({
            symbol: t.symbol,
            day: b.day,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume,
          }));
          await chunkedInsert(mapped);
          return { count: mapped.length, isSynth };
        } catch {
          return null;
        }
      }),
    );
    results.forEach((r, idx) => {
      if (!r) failed.push(batch[idx].symbol);
      else {
        updated++;
        rows += r.count;
        if (r.isSynth) synthetic++;
      }
    });
  }

  await db
    .update(syncLog)
    .set({
      finishedAt: new Date(),
      status: failed.length === 0 ? "ok" : failed.length === targets.length ? "error" : "partial",
      symbolsUpdated: updated,
      rowsWritten: rows,
      message: synthetic ? `${synthetic} symbol(s) served from offline model` : failed.length ? failed.slice(0, 8).join(",") : null,
    })
    .where(eq(syncLog.id, logId));

  return { updated, rows, synthetic, failed };
}

export async function ensureInstruments(): Promise<void> {
  const existing = await db.select({ symbol: instruments.symbol }).from(instruments);
  const have = new Set(existing.map((e) => e.symbol));
  const missing: UniverseRow[] = UNIVERSE.filter((u) => !have.has(u.symbol));
  if (!missing.length) return;
  for (let i = 0; i < missing.length; i += 100) {
    await db
      .insert(instruments)
      .values(
        missing.slice(i, i + 100).map((u) => ({
          symbol: u.symbol,
          yahooSymbol: u.yahooSymbol,
          name: u.name,
          assetClass: u.assetClass,
          sector: u.sector ?? null,
          region: u.region,
          currency: u.currency,
          exchange: u.exchange ?? null,
          board: u.board ?? null,
        })),
      )
      .onConflictDoNothing({ target: instruments.symbol });
  }
}

export async function priceRowCount(): Promise<number> {
  const r = await db.execute(sql`SELECT COUNT(*)::int AS c FROM prices`);
  return Number((r.rows[0] as { c: number }).c ?? 0);
}

export async function isArchiveEmpty(): Promise<boolean> {
  return (await priceRowCount()) === 0;
}

/** Symbols to refresh on every sync: everything held, watched, or on a board. */
export async function trackedSymbols(): Promise<SyncTarget[]> {
  const rows = await db
    .select({ symbol: instruments.symbol, yahooSymbol: instruments.yahooSymbol, assetClass: instruments.assetClass })
    .from(instruments)
    .where(eq(instruments.active, true))
    .orderBy(asc(instruments.symbol));
  const extra: SyncTarget[] = [{ symbol: "SPY", yahooSymbol: "SPY", assetClass: "etf" }];
  const map = new Map(rows.map((r) => [r.symbol, r]));
  for (const e of extra) if (!map.has(e.symbol)) map.set(e.symbol, e);
  return [...map.values()];
}

export function universeTargets(onlyBoards = false): SyncTarget[] {
  return UNIVERSE.filter((u) => (onlyBoards ? Boolean(u.board) : true)).map((u) => ({
    symbol: u.symbol,
    yahooSymbol: u.yahooSymbol,
    assetClass: u.assetClass,
  }));
}

export async function recentSyncs(limit = 8) {
  return db.select().from(syncLog).orderBy(sql`${syncLog.startedAt} DESC`).limit(limit);
}

export async function instrumentsFor(symbols: string[]) {
  if (!symbols.length) return [];
  return db.select().from(instruments).where(inArray(instruments.symbol, symbols));
}
