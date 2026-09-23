import { eq } from "drizzle-orm";

import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { getSparklines } from "@/lib/portfolio";
import { fetchQuotes } from "@/lib/yahoo";
import { UNIVERSE_BY_SYMBOL } from "@/lib/universe";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const rows = await db.select().from(watchlist).orderBy(watchlist.addedAt);
  if (!rows.length) return Response.json({ rows: [], quotes: [], sparks: {} });
  const targets = rows.map((r) => {
    const meta = UNIVERSE_BY_SYMBOL.get(r.symbol);
    return { symbol: r.symbol, yahooSymbol: meta?.yahooSymbol ?? r.symbol, assetClass: meta?.assetClass ?? "equity", name: meta?.name ?? r.symbol };
  });
  const [quotes, sparks] = await Promise.all([fetchQuotes(targets), getSparklines(rows.map((r) => r.symbol), 45)]);
  return Response.json({ rows, quotes, sparks: Object.fromEntries(sparks.entries()) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { symbol?: string; note?: string; targetHigh?: number; targetLow?: number };
  const symbol = (body.symbol ?? "").toUpperCase().trim();
  if (!symbol) return Response.json({ ok: false, error: "symbol required" }, { status: 400 });
  await db
    .insert(watchlist)
    .values({
      symbol,
      note: body.note ?? null,
      targetHigh: body.targetHigh ? Number(body.targetHigh) : null,
      targetLow: body.targetLow ? Number(body.targetLow) : null,
    })
    .onConflictDoUpdate({
      target: watchlist.symbol,
      set: { note: body.note ?? null, targetHigh: body.targetHigh ? Number(body.targetHigh) : null, targetLow: body.targetLow ? Number(body.targetLow) : null },
    });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  if (!symbol) return Response.json({ ok: false, error: "symbol required" }, { status: 400 });
  await db.delete(watchlist).where(eq(watchlist.symbol, symbol));
  return Response.json({ ok: true });
}
