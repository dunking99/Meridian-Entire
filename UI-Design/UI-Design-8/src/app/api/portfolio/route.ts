import { db } from "@/db";
import { portfolioHoldings, portfolioMeta } from "@/db/schema";
import { HOLDINGS } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

function toRow(h: (typeof HOLDINGS)[number]) {
  return {
    id: h.id,
    ticker: h.ticker,
    name: h.name,
    exchange: h.exchange,
    type: h.type,
    qty: String(h.qty),
    avgCost: String(h.avgCost),
    avgCcy: h.avgCcy,
    price: String(h.price),
    priceCcy: h.priceCcy,
    valueGbp: Math.round(h.valueGbp),
    costGbp: Math.round(h.costGbp),
    gainGbp: Math.round(h.gainGbp),
    gainPct: String(h.gainPct),
    dayPct: String(h.dayPct),
    dayGbp: Math.round(h.dayGbp),
    weight: String(h.weight),
    color: h.color,
    sector: h.sector,
    region: h.region,
    note: h.note ?? null,
  };
}

function fromRow(r: typeof portfolioHoldings.$inferSelect) {
  return {
    id: r.id,
    ticker: r.ticker,
    name: r.name,
    exchange: r.exchange,
    type: r.type as "Equity" | "ETF" | "Fund" | "ETC",
    qty: Number(r.qty),
    avgCost: Number(r.avgCost),
    avgCcy: r.avgCcy as "GBP" | "USD",
    price: Number(r.price),
    priceCcy: r.priceCcy as "GBP" | "USD",
    valueGbp: r.valueGbp,
    costGbp: r.costGbp,
    gainGbp: r.gainGbp,
    gainPct: Number(r.gainPct),
    dayPct: Number(r.dayPct),
    dayGbp: r.dayGbp,
    weight: Number(r.weight),
    color: r.color,
    sector: r.sector,
    region: r.region,
    note: r.note ?? undefined,
  };
}

async function ensureSeed() {
  try {
    const rows = await db.select().from(portfolioHoldings);
    if (rows.length === 0) {
      await db.insert(portfolioHoldings).values(HOLDINGS.map(toRow));
    }
    const meta = await db.select().from(portfolioMeta);
    if (meta.length === 0) {
      await db.insert(portfolioMeta).values({ id: "main", cash: 0 });
    }
  } catch {
    // tables may not exist yet (pre-push) — caller falls back to seed data
    throw new Error("unready");
  }
}

export async function GET() {
  try {
    await ensureSeed();
    const rows = await db.select().from(portfolioHoldings);
    const meta = await db.select().from(portfolioMeta);
    return Response.json({ holdings: rows.map(fromRow), cash: meta[0]?.cash ?? 0 });
  } catch {
    return Response.json({ holdings: HOLDINGS, cash: 0, seeded: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { ticker?: string; qty?: number };
    const ticker = (body.ticker ?? "NEW").toUpperCase().slice(0, 10);
    const qty = Number.isFinite(body.qty) ? Number(body.qty) : 1;
    await ensureSeed();
    const id = `custom-${ticker.toLowerCase()}-${Date.now()}`;
    await db.insert(portfolioHoldings).values({
      id,
      ticker,
      name: `${ticker} (pending price)`,
      exchange: "—",
      type: "Equity",
      qty: String(qty),
      avgCost: "0",
      avgCcy: "GBP",
      price: "0",
      priceCcy: "GBP",
      valueGbp: 0,
      costGbp: 0,
      gainGbp: 0,
      gainPct: "0",
      dayPct: "0",
      dayGbp: 0,
      weight: "0",
      color: "#64748b",
      sector: "Pending",
      region: "Pending",
      note: "Added manually. Live price attaches on next refresh.",
    });
    return Response.json({ ok: true, id });
  } catch {
    return Response.json({ ok: true, offline: true });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as { cash?: number };
    await ensureSeed();
    const { eq } = await import("drizzle-orm");
    await db.update(portfolioMeta).set({ cash: Math.max(0, Math.round(body.cash ?? 0)) }).where(eq(portfolioMeta.id, "main"));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true, offline: true });
  }
}
