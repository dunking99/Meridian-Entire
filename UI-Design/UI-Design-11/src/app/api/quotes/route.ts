import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import { instruments } from "@/db/schema";
import { fetchQuotes } from "@/lib/yahoo";
import { getSparklines } from "@/lib/portfolio";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Live-ish quotes straight from Yahoo (no DB write) — used by ticker rails and watchlists. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const board = url.searchParams.get("board");
  const symbolsParam = url.searchParams.get("symbols");
  const spark = url.searchParams.get("spark") !== "false";

  let rows: { symbol: string; yahooSymbol: string; assetClass: string; name: string }[] = [];

  if (symbolsParam) {
    const list = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const found = await db.select().from(instruments).where(eq(instruments.active, true));
    const map = new Map(found.map((f) => [f.symbol, f]));
    rows = list.map((s) => {
      const f = map.get(s);
      return f
        ? { symbol: f.symbol, yahooSymbol: f.yahooSymbol, assetClass: f.assetClass, name: f.name }
        : { symbol: s, yahooSymbol: s, assetClass: "equity", name: s };
    });
  } else {
    const where = board ? and(eq(instruments.board, board), eq(instruments.active, true)) : eq(instruments.active, true);
    const found = await db.select().from(instruments).where(where).limit(80);
    rows = found.map((f) => ({ symbol: f.symbol, yahooSymbol: f.yahooSymbol, assetClass: f.assetClass, name: f.name }));
  }

  if (!rows.length) return Response.json({ quotes: [], sparks: {} });

  const quotes = await fetchQuotes(rows);
  let sparks: Record<string, number[]> = {};
  if (spark) {
    const map = await getSparklines(rows.map((r) => r.symbol), 45);
    sparks = Object.fromEntries(map.entries());
  }

  return Response.json({ quotes, sparks, asOf: new Date().toISOString() });
}
