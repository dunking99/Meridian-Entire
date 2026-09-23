import { db } from "@/db";
import { accounts, instruments, portfolioSnapshots, positions, trades, theses, type Instrument } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { getQuoteBook, type Quote, type QuoteBook } from "./market";

export type EnrichedPosition = {
  positionId: number;
  accountId: number;
  accountName: string;
  accountKind: string;
  instrument: Instrument;
  quote: Quote | undefined;
  quantity: number;
  avgCost: number;
  costBasis: number;
  price: number;
  marketValue: number;
  dayChange: number;
  dayContribution: number;
  unrealized: number;
  unrealizedPct: number;
  weight: number;
  thesisId: number | null;
  thesisTitle: string | null;
};

export type PortfolioTotals = {
  nav: number;
  marketValue: number;
  cash: number;
  costBasis: number;
  unrealized: number;
  unrealizedPct: number;
  dayChange: number;
  dayPct: number;
  positions: number;
  largestWeight: number;
  topSectorWeight: number;
};

export type PortfolioView = {
  book: QuoteBook;
  positions: EnrichedPosition[];
  totals: PortfolioTotals;
  accounts: { id: number; name: string; broker: string; kind: string; cash: number; marketValue: number; nav: number }[];
  bySector: { label: string; value: number; weight: number; dayChange: number; r1m: number }[];
  byAssetClass: { label: string; value: number; weight: number; dayChange: number; r1m: number }[];
  navSeries: { d: string; total: number; benchmark: number }[];
  history: { r1m: number; r3m: number; r6m: number };
};

export async function getPortfolio(): Promise<PortfolioView> {
  const book = await getQuoteBook();
  const [acctRows, posRows, thesisRows, snapRows] = await Promise.all([
    db.select().from(accounts).orderBy(asc(accounts.id)),
    db.select().from(positions),
    db.select({ id: theses.id, instrumentId: theses.instrumentId, title: theses.title }).from(theses),
    db.select().from(portfolioSnapshots).orderBy(asc(portfolioSnapshots.d)),
  ]);

  const tByInstrument = new Map<number, { id: number; title: string }>();
  for (const t of thesisRows) if (t.instrumentId) tByInstrument.set(t.instrumentId, { id: t.id, title: t.title });

  const raw = posRows.map((p) => {
    const instrument = book.byId.get(p.instrumentId)?.instrument ?? {
      id: p.instrumentId,
      symbol: "?",
      name: "Unknown",
    } as Instrument;
    const quote = book.byId.get(p.instrumentId);
    const price = quote?.price ?? p.avgCost;
    const marketValue = p.quantity * price;
    const costBasis = p.quantity * p.avgCost;
    const dayContribution = p.quantity * (quote?.change ?? 0);
    const thesis = tByInstrument.get(p.instrumentId) ?? null;
    return {
      positionId: p.id,
      accountId: p.accountId,
      accountName: acctRows.find((a) => a.id === p.accountId)?.name ?? "—",
      accountKind: acctRows.find((a) => a.id === p.accountId)?.kind ?? "taxable",
      instrument,
      quote,
      quantity: p.quantity,
      avgCost: p.avgCost,
      costBasis,
      price,
      marketValue,
      dayChange: quote?.change ?? 0,
      dayContribution,
      unrealized: marketValue - costBasis,
      unrealizedPct: costBasis ? marketValue / costBasis - 1 : 0,
      weight: 0,
      thesisId: thesis?.id ?? null,
      thesisTitle: thesis?.title ?? null,
      sector: instrument.sector,
      assetClass: instrument.assetClass,
    } satisfies EnrichedPosition & { sector?: string | null; assetClass?: string };
  });

  const marketValue = raw.reduce((a, p) => a + p.marketValue, 0);
  const cash = acctRows.reduce((a, x) => a + x.cash, 0);
  const nav = marketValue + cash;

  const enriched: EnrichedPosition[] = raw.map((p) => ({ ...p, weight: nav ? p.marketValue / nav : 0 }));
  enriched.sort((a, b) => b.marketValue - a.marketValue);

  const costBasis = enriched.reduce((a, p) => a + p.costBasis, 0);
  const dayChange = enriched.reduce((a, p) => a + p.dayContribution, 0);
  const unrealized = marketValue - costBasis;

  const bucket = (key: "sector" | "assetClass") => {
    const map = new Map<string, { label: string; value: number; dayChange: number; r1m: number; n: number }>();
    for (const p of enriched) {
      const label = ((key === "sector" ? p.instrument.sector : p.instrument.assetClass) ?? "Other") as string;
      const b = map.get(label) ?? { label, value: 0, dayChange: 0, r1m: 0, n: 0 };
      b.value += p.marketValue;
      b.dayChange += p.dayContribution;
      b.r1m += p.quote?.r1m ?? 0;
      b.n += 1;
      map.set(label, b);
    }
    return [...map.values()]
      .map((b) => ({ label: b.label, value: b.value, dayChange: b.dayChange, r1m: b.r1m / b.n, weight: nav ? b.value / nav : 0 }))
      .sort((a, b) => b.value - a.value);
  };

  const acctSummaries = acctRows.map((a) => {
    const mv = enriched.filter((p) => p.accountId === a.id).reduce((s, p) => s + p.marketValue, 0);
    return { id: a.id, name: a.name, broker: a.broker, kind: a.kind, cash: a.cash, marketValue: mv, nav: mv + a.cash };
  });

  const series = snapRows.map((s) => ({ d: s.d, total: s.totalValue, benchmark: s.benchmark }));
  const fromSeries = (back: number) => {
    if (series.length < 2) return 0;
    const cur = series[series.length - 1].total;
    const idx = Math.max(0, series.length - 1 - back);
    const prev = series[idx].total;
    return prev ? cur / prev - 1 : 0;
  };

  return {
    book,
    positions: enriched,
    totals: {
      nav,
      marketValue,
      cash,
      costBasis,
      unrealized,
      unrealizedPct: costBasis ? unrealized / costBasis : 0,
      dayChange,
      dayPct: nav - dayChange ? dayChange / (nav - dayChange) : 0,
      positions: enriched.length,
      largestWeight: enriched[0]?.weight ?? 0,
      topSectorWeight: bucket("sector")[0]?.weight ?? 0,
    },
    accounts: acctSummaries,
    bySector: bucket("sector"),
    byAssetClass: bucket("assetClass"),
    navSeries: series.slice(-180),
    history: { r1m: fromSeries(21), r3m: fromSeries(63), r6m: fromSeries(126) },
  };
}

export type TradeRow = {
  id: number;
  side: string;
  quantity: number;
  price: number;
  fees: number;
  executedAt: Date;
  rationale: string | null;
  tags: string;
  symbol: string;
  name: string;
  instrumentId: number;
  accountName: string;
  thesisId: number | null;
  notional: number;
};

export async function getTrades(limit = 200): Promise<TradeRow[]> {
  const rows = await db
    .select({
      id: trades.id,
      side: trades.side,
      quantity: trades.quantity,
      price: trades.price,
      fees: trades.fees,
      executedAt: trades.executedAt,
      rationale: trades.rationale,
      tags: trades.tags,
      instrumentId: trades.instrumentId,
      symbol: instruments.symbol,
      name: instruments.name,
      accountName: accounts.name,
      thesisId: trades.thesisId,
    })
    .from(trades)
    .innerJoin(instruments, eq(instruments.id, trades.instrumentId))
    .innerJoin(accounts, eq(accounts.id, trades.accountId))
    .orderBy(desc(trades.executedAt))
    .limit(limit);

  return rows.map((r) => ({ ...r, notional: r.quantity * r.price }));
}
