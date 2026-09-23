import { globalSearch } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await globalSearch(q);
  return Response.json({
    instruments: results.instruments.map((i) => ({ symbol: i.symbol, name: i.name, sector: i.sector })),
    news: results.news.map((n) => ({ id: n.id, headline: n.headline, source: n.source })),
    notes: results.notes.map((n) => ({ id: n.id, title: n.title, kind: n.kind })),
    theses: results.theses.map((t) => ({ id: t.id, title: t.title, status: t.status })),
    trades: results.trades.map((t) => ({
      trade: { id: t.trade.id, side: t.trade.side, quantity: t.trade.quantity, price: t.trade.price },
      symbol: t.symbol,
    })),
    journal: results.journal.map((j) => ({ id: j.id, title: j.title, kind: j.kind })),
  });
}
