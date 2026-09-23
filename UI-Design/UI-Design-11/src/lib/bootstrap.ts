import { db } from "@/db";
import { sql } from "drizzle-orm";

import { ensureInstruments, syncSymbols } from "@/lib/sync";
import { seedDemoPortfolio } from "@/lib/seed";
import { UNIVERSE } from "@/lib/universe";

const g = globalThis as typeof globalThis & { __meridianBoot?: Promise<BootResult> };

export type BootResult = {
  instruments: number;
  symbolsSynced: number;
  priceRows: number;
  ledgerRows: number;
  synthetic: boolean;
  ms: number;
};

/** Symbols needed to make the portfolio itself render with real history. */
const CORE_SYMBOLS = [
  "VOO", "VXUS", "QQQ", "SCHD", "BND", "VNQ", "GLD",
  "AAPL", "MSFT", "NVDA", "JPM", "UNH", "XOM", "ASML", "NESN.SW", "7203.T", "SPY",
];

export async function countRows(table: string): Promise<number> {
  const r = await db.execute(sql.raw(`SELECT COUNT(*)::int AS c FROM ${table}`));
  return Number((r.rows[0] as { c: number } | undefined)?.c ?? 0);
}

async function boot(): Promise<BootResult> {
  const t0 = Date.now();
  await ensureInstruments();
  const instruments = await countRows("instruments");

  const targets = UNIVERSE.filter((u) => CORE_SYMBOLS.includes(u.symbol)).map((u) => ({
    symbol: u.symbol,
    yahooSymbol: u.yahooSymbol,
    assetClass: u.assetClass,
  }));
  const sync = await syncSymbols(targets, "3y");
  const seeded = await seedDemoPortfolio();
  const priceRows = await countRows("prices");

  return {
    instruments,
    symbolsSynced: sync.updated,
    priceRows,
    ledgerRows: seeded.inserted,
    synthetic: sync.synthetic > 0,
    ms: Date.now() - t0,
  };
}

/** Idempotent, process-wide single-flight bootstrap. */
export function runBootstrap(): Promise<BootResult> {
  if (!g.__meridianBoot) {
    g.__meridianBoot = boot().catch((err) => {
      g.__meridianBoot = undefined;
      throw err;
    });
  }
  return g.__meridianBoot;
}

export async function archiveReady(): Promise<boolean> {
  return (await countRows("prices")) > 0 && (await countRows("instruments")) > 0;
}
