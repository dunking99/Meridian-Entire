import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { instruments } from "@/db/schema";
import { fetchQuotes, type Quote } from "@/lib/yahoo";
import { getSparklines } from "@/lib/portfolio";

const HEADLINE = ["SPX", "NDX", "DJI", "RUT", "VIX", "XAU", "XAG", "WTI", "BRENT", "NG", "HG", "EURUSD", "GBPUSD", "USDJPY", "DXY", "BTC", "ETH", "TNX", "TLT", "HYG"];

export type QuoteRow = Quote & { name: string; assetClass: string; region: string; currency: string; spark: number[] };

export async function headlineQuotes(): Promise<QuoteRow[]> {
  const rows = await db.select().from(instruments).where(eq(instruments.active, true));
  const map = new Map(rows.map((r) => [r.symbol, r]));
  const targets = HEADLINE.map((s) => map.get(s)).filter(Boolean).map((f) => ({
    symbol: f!.symbol,
    yahooSymbol: f!.yahooSymbol,
    assetClass: f!.assetClass,
    name: f!.name,
  }));
  if (!targets.length) return [];
  const [quotes, sparks] = await Promise.all([fetchQuotes(targets), getSparklines(targets.map((t) => t.symbol), 45)]);
  return quotes.map((q) => {
    const meta = map.get(q.symbol);
    return {
      ...q,
      name: meta?.name ?? q.name ?? q.symbol,
      assetClass: meta?.assetClass ?? "index",
      region: meta?.region ?? "US",
      currency: meta?.currency ?? "USD",
      spark: sparks.get(q.symbol) ?? [],
    };
  });
}

export async function boardQuotes(): Promise<{ board: string; quotes: QuoteRow[] }[]> {
  const rows = await db
    .select()
    .from(instruments)
    .where(and(eq(instruments.active, true)))
    .orderBy(instruments.symbol);
  const boarded = rows.filter((r) => r.board);
  const targets = boarded.map((f) => ({ symbol: f.symbol, yahooSymbol: f.yahooSymbol, assetClass: f.assetClass, name: f.name }));
  if (!targets.length) return [];
  const [quotes, sparks] = await Promise.all([fetchQuotes(targets), getSparklines(targets.map((t) => t.symbol), 60)]);
  const byBoard = new Map<string, QuoteRow[]>();
  const metaMap = new Map(boarded.map((b) => [b.symbol, b]));
  for (const q of quotes) {
    const meta = metaMap.get(q.symbol);
    const board = meta?.board;
    if (!meta || !board) continue;
    const row: QuoteRow = {
      ...q,
      name: meta.name,
      assetClass: meta.assetClass,
      region: meta.region ?? "Unknown",
      currency: meta.currency,
      spark: sparks.get(q.symbol) ?? [],
    };
    if (!byBoard.has(board)) byBoard.set(board, []);
    byBoard.get(board)!.push(row);
  }
  return [...byBoard.entries()].map(([board, quotes]) => ({ board, quotes }));
}

export async function quotesForSymbols(symbols: string[]): Promise<QuoteRow[]> {
  if (!symbols.length) return [];
  const rows = await db.select().from(instruments);
  const map = new Map(rows.map((r) => [r.symbol, r]));
  const targets = symbols.map((s) => {
    const f = map.get(s);
    return { symbol: s, yahooSymbol: f?.yahooSymbol ?? s, assetClass: f?.assetClass ?? "equity", name: f?.name ?? s };
  });
  const [quotes, sparks] = await Promise.all([fetchQuotes(targets), getSparklines(symbols, 60)]);
  return quotes.map((q) => {
    const meta = map.get(q.symbol);
    return {
      ...q,
      name: meta?.name ?? q.name ?? q.symbol,
      assetClass: meta?.assetClass ?? "equity",
      region: meta?.region ?? "US",
      currency: meta?.currency ?? "USD",
      spark: sparks.get(q.symbol) ?? [],
    };
  });
}
