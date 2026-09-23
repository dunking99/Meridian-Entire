import { analyseText } from "@/lib/enrich";
import { getPortfolio } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

/**
 * The cross-domain primitive exposed as an API: text in, referenced instruments +
 * current portfolio exposure out. Used by the research cockpit panel and any
 * future ingest pipeline that wants to tag incoming content at write time.
 */
export async function POST(request: Request) {
  let payload: { text?: string; headline?: string } = {};
  try {
    payload = (await request.json()) as { text?: string; headline?: string };
  } catch {
    payload = {};
  }
  const text = payload.text ?? "";
  const headline = payload.headline ?? "";
  if (!text && !headline) {
    return Response.json({ matches: [], totalExposure: 0, totalWeight: 0, nav: 0, error: "text or headline required" }, { status: 400 });
  }

  const [matches, portfolio] = await Promise.all([analyseText(text, headline), getPortfolio()]);
  const nav = portfolio.totals.nav || 1;
  const rows = matches.map((m) => {
    const position = portfolio.positions.find((p) => p.instrument.id === m.instrument.id);
    const quote = portfolio.book.byId.get(m.instrument.id);
    return {
      symbol: m.instrument.symbol,
      name: m.instrument.name,
      score: m.score,
      basis: m.basis,
      matchedText: m.matchedText,
      weight: position ? position.weight * 100 : 0,
      marketValue: position?.marketValue ?? 0,
      sector: m.instrument.sector,
      price: quote?.price ?? 0,
      changePct: quote?.changePct ?? 0,
    };
  });

  const totalExposure = rows.reduce((a, r) => a + r.marketValue, 0);
  return Response.json({
    matches: rows,
    totalExposure,
    totalWeight: (totalExposure / nav) * 100,
    nav,
  });
}
