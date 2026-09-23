import { getQuoteBook } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbols = (url.searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const book = await getQuoteBook(symbols.length ? symbols : undefined);
  return Response.json({
    asOf: book.list[0]?.asOf ?? null,
    quotes: book.list.map((q) => ({
      symbol: q.instrument.symbol,
      name: q.instrument.name,
      assetClass: q.instrument.assetClass,
      sector: q.instrument.sector,
      price: Number(q.price.toFixed(4)),
      change: Number(q.change.toFixed(4)),
      changePct: Number(q.changePct.toFixed(5)),
      r1m: Number(q.r1m.toFixed(5)),
      r3m: Number(q.r3m.toFixed(5)),
      ytd: Number(q.ytd.toFixed(5)),
      high52: q.high52,
      low52: q.low52,
      volume: q.volume,
    })),
  });
}
