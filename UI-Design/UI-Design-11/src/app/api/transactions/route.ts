import { eq } from "drizzle-orm";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { computePortfolio } from "@/lib/portfolio";
import { ensureInstruments } from "@/lib/sync";
import { UNIVERSE_BY_SYMBOL } from "@/lib/universe";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(transactions).orderBy(transactions.day, transactions.id);
  return Response.json({ rows });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    day?: string;
    symbol?: string;
    kind?: string;
    quantity?: number;
    price?: number;
    fee?: number;
    note?: string;
  };
  await ensureInstruments();

  const symbol = (body.symbol ?? "").toUpperCase().trim();
  const kind = (body.kind ?? "buy").toLowerCase();
  if (!symbol || !body.day) return Response.json({ ok: false, error: "symbol and day are required" }, { status: 400 });

  const isCash = symbol === "CASH";
  const meta = UNIVERSE_BY_SYMBOL.get(symbol);
  if (!isCash && !meta) {
    return Response.json(
      { ok: false, error: `${symbol} is not in the instrument universe. Add it on the Data & Settings page first.` },
      { status: 400 },
    );
  }

  const inserted = await db
    .insert(transactions)
    .values({
      day: body.day,
      symbol,
      kind: ["buy", "sell", "dividend", "fee", "deposit", "withdrawal"].includes(kind) ? kind : "buy",
      quantity: Number(body.quantity ?? 0) || 0,
      price: Number(body.price ?? 0) || 0,
      fee: Number(body.fee ?? 0) || 0,
      currency: meta?.currency ?? "USD",
      note: body.note ?? null,
    })
    .returning();

  const summary = await computePortfolio();
  return Response.json({ ok: true, row: inserted[0], totalValue: summary.totalValue });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return Response.json({ ok: false, error: "id required" }, { status: 400 });
  await db.delete(transactions).where(eq(transactions.id, id));
  const summary = await computePortfolio();
  return Response.json({ ok: true, totalValue: summary.totalValue });
}
