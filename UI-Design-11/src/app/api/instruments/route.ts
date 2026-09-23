import { eq } from "drizzle-orm";

import { db } from "@/db";
import { instruments } from "@/db/schema";
import { syncSymbols } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const rows = await db.select().from(instruments).orderBy(instruments.symbol);
  return Response.json({ rows });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    symbol?: string;
    yahooSymbol?: string;
    name?: string;
    assetClass?: string;
    sector?: string;
    region?: string;
    currency?: string;
  };
  const symbol = (body.symbol ?? "").toUpperCase().trim();
  if (!symbol) return Response.json({ ok: false, error: "symbol required" }, { status: 400 });

  const yahooSymbol = (body.yahooSymbol ?? symbol).trim();
  const assetClass = body.assetClass ?? "equity";

  await db
    .insert(instruments)
    .values({
      symbol,
      yahooSymbol,
      name: body.name ?? symbol,
      assetClass,
      sector: body.sector ?? null,
      region: body.region ?? "Unknown",
      currency: body.currency ?? "USD",
    })
    .onConflictDoUpdate({
      target: instruments.symbol,
      set: { yahooSymbol, name: body.name ?? symbol, assetClass, sector: body.sector ?? null, region: body.region ?? "Unknown", currency: body.currency ?? "USD", active: true },
    });

  const sync = await syncSymbols([{ symbol, yahooSymbol, assetClass }], "5y");
  return Response.json({ ok: true, rows: sync.rows, symbol });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  if (!symbol) return Response.json({ ok: false, error: "symbol required" }, { status: 400 });
  await db.update(instruments).set({ active: false }).where(eq(instruments.symbol, symbol));
  return Response.json({ ok: true });
}
