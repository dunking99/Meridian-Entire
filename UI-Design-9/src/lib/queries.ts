import { db } from "@/db";
import {
  alerts,
  instruments,
  newsArticleInstruments,
  newsArticles,
  portfolios,
  priceHistory,
  researchNoteInstruments,
  researchNotes,
  transactions,
  watchlistItems,
  watchlists,
  type Alert,
  type Instrument,
  type NewsArticle,
  type ResearchNote,
  type Transaction,
} from "@/db/schema";
import { seedIfEmpty } from "@/db/seed";
import { n } from "@/lib/format";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";

/**
 * ENRICHMENT LAYER
 * ----------------
 * Every function here returns domain objects already joined with the
 * context other domains care about. Pages never join tables themselves.
 *
 *  - positions are derived from transactions (single source of truth)
 *  - `getInstrumentContext` is the "hub" view: everything about one ticker
 *  - `getNewsFeed` / `getNote` annotate items with portfolio exposure
 */

// ---------- Instruments ----------
export function dayChange(i: Pick<Instrument, "lastPrice" | "prevClose">) {
  const last = n(i.lastPrice);
  const prev = n(i.prevClose);
  const abs = last - prev;
  const pct = prev ? (abs / prev) * 100 : 0;
  return { abs, pct };
}

export async function getAllInstruments() {
  await seedIfEmpty();
  return db.select().from(instruments).orderBy(asc(instruments.symbol));
}

export async function getInstrumentBySymbol(symbol: string) {
  await seedIfEmpty();
  const [row] = await db.select().from(instruments).where(eq(instruments.symbol, symbol.toUpperCase()));
  return row ?? null;
}

export async function getPriceHistory(instrumentId: number, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db
    .select()
    .from(priceHistory)
    .where(and(eq(priceHistory.instrumentId, instrumentId), gte(priceHistory.day, since.toISOString().slice(0, 10))))
    .orderBy(asc(priceHistory.day));
}

// ---------- Portfolio (derived positions) ----------
export type Position = {
  instrument: Instrument;
  quantity: number;
  avgCost: number;
  costBasis: number;
  marketValue: number;
  unrealized: number;
  unrealizedPct: number;
  dayChange: number;
  dayChangePct: number;
  realized: number;
  dividends: number;
  weight: number; // % of total portfolio value
};

export type PortfolioSummary = {
  portfolio: typeof portfolios.$inferSelect;
  positions: Position[];
  cash: number;
  totalValue: number;
  investedValue: number;
  costBasis: number;
  unrealized: number;
  unrealizedPct: number;
  realized: number;
  dividends: number;
  dayChange: number;
  dayChangePct: number;
  netContributions: number;
  byAssetClass: { key: string; value: number; weight: number }[];
  bySector: { key: string; value: number; weight: number }[];
};

export async function getDefaultPortfolio() {
  await seedIfEmpty();
  const [p] = await db.select().from(portfolios).orderBy(asc(portfolios.id)).limit(1);
  return p;
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const portfolio = await getDefaultPortfolio();
  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.portfolioId, portfolio.id))
    .orderBy(asc(transactions.tradedAt), asc(transactions.id));
  const instIds = [...new Set(txs.map((t) => t.instrumentId).filter((x): x is number => x != null))];
  const insts = instIds.length ? await db.select().from(instruments).where(inArray(instruments.id, instIds)) : [];
  const instMap = new Map(insts.map((i) => [i.id, i]));

  type Acc = { qty: number; cost: number; realized: number; dividends: number };
  const acc = new Map<number, Acc>();
  let cash = 0;
  let netContributions = 0;

  for (const t of txs) {
    const q = n(t.quantity);
    const p = n(t.price);
    const f = n(t.fees);
    const a = t.instrumentId ? acc.get(t.instrumentId) ?? { qty: 0, cost: 0, realized: 0, dividends: 0 } : null;
    switch (t.type) {
      case "deposit":
        cash += q * p;
        netContributions += q * p;
        break;
      case "withdrawal":
        cash -= q * p;
        netContributions -= q * p;
        break;
      case "fee":
        cash -= q * p + f;
        break;
      case "buy":
        if (a) {
          a.qty += q;
          a.cost += q * p + f;
          cash -= q * p + f;
        }
        break;
      case "sell":
        if (a && a.qty > 0) {
          const avg = a.cost / a.qty;
          a.realized += (p - avg) * q - f;
          a.cost -= avg * q;
          a.qty -= q;
          cash += q * p - f;
        }
        break;
      case "dividend":
        if (a) a.dividends += q * p;
        cash += q * p;
        break;
    }
    if (a && t.instrumentId) acc.set(t.instrumentId, a);
  }

  const positions: Position[] = [];
  for (const [id, a] of acc) {
    const inst = instMap.get(id);
    if (!inst) continue;
    if (a.qty <= 1e-9) continue;
    const last = n(inst.lastPrice);
    const prev = n(inst.prevClose);
    const mv = a.qty * last;
    positions.push({
      instrument: inst,
      quantity: a.qty,
      avgCost: a.cost / a.qty,
      costBasis: a.cost,
      marketValue: mv,
      unrealized: mv - a.cost,
      unrealizedPct: a.cost ? ((mv - a.cost) / a.cost) * 100 : 0,
      dayChange: a.qty * (last - prev),
      dayChangePct: prev ? ((last - prev) / prev) * 100 : 0,
      realized: a.realized,
      dividends: a.dividends,
      weight: 0,
    });
  }

  const investedValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalValue = investedValue + cash;
  for (const p of positions) p.weight = totalValue ? (p.marketValue / totalValue) * 100 : 0;
  positions.sort((a, b) => b.marketValue - a.marketValue);

  const costBasis = positions.reduce((s, p) => s + p.costBasis, 0);
  const unrealized = investedValue - costBasis;
  const dayChange = positions.reduce((s, p) => s + p.dayChange, 0);
  const prevTotal = totalValue - dayChange;
  const realized = [...acc.values()].reduce((s, a) => s + a.realized, 0);
  const dividends = [...acc.values()].reduce((s, a) => s + a.dividends, 0);

  const group = (key: (p: Position) => string) => {
    const m = new Map<string, number>();
    for (const p of positions) m.set(key(p), (m.get(key(p)) ?? 0) + p.marketValue);
    if (cash > 0) m.set("Cash", (m.get("Cash") ?? 0) + cash);
    return [...m.entries()]
      .map(([k, v]) => ({ key: k, value: v, weight: totalValue ? (v / totalValue) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  };

  return {
    portfolio,
    positions,
    cash,
    totalValue,
    investedValue,
    costBasis,
    unrealized,
    unrealizedPct: costBasis ? (unrealized / costBasis) * 100 : 0,
    realized,
    dividends,
    dayChange,
    dayChangePct: prevTotal ? (dayChange / prevTotal) * 100 : 0,
    netContributions,
    byAssetClass: group((p) => p.instrument.assetClass),
    bySector: group((p) => p.instrument.sector ?? "Other"),
  };
}

export async function getTransactions(limit?: number) {
  const portfolio = await getDefaultPortfolio();
  const q = db
    .select({ tx: transactions, instrument: instruments })
    .from(transactions)
    .leftJoin(instruments, eq(transactions.instrumentId, instruments.id))
    .where(eq(transactions.portfolioId, portfolio.id))
    .orderBy(desc(transactions.tradedAt), desc(transactions.id));
  return limit ? q.limit(limit) : q;
}

// ---------- Exposure helpers (the cross-domain glue) ----------
export type Exposure = { held: Map<number, Position>; watched: Map<number, string[]> };

export async function getExposure(): Promise<Exposure> {
  const summary = await getPortfolioSummary();
  const held = new Map(summary.positions.map((p) => [p.instrument.id, p]));
  const wl = await db
    .select({ instrumentId: watchlistItems.instrumentId, name: watchlists.name })
    .from(watchlistItems)
    .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId));
  const watched = new Map<number, string[]>();
  for (const w of wl) watched.set(w.instrumentId, [...(watched.get(w.instrumentId) ?? []), w.name]);
  return { held, watched };
}

export type TaggedInstrument = Instrument & { position: Position | null; watchlists: string[] };

function tag(inst: Instrument, ex: Exposure): TaggedInstrument {
  return { ...inst, position: ex.held.get(inst.id) ?? null, watchlists: ex.watched.get(inst.id) ?? [] };
}

// ---------- News ----------
export type EnrichedArticle = NewsArticle & {
  instruments: TaggedInstrument[];
  portfolioExposure: number; // sum of weights of held instruments mentioned
  touchesHoldings: boolean;
  touchesWatchlist: boolean;
};

async function enrichArticles(rows: NewsArticle[], ex: Exposure): Promise<EnrichedArticle[]> {
  if (!rows.length) return [];
  const links = await db
    .select({ articleId: newsArticleInstruments.articleId, instrument: instruments })
    .from(newsArticleInstruments)
    .innerJoin(instruments, eq(instruments.id, newsArticleInstruments.instrumentId))
    .where(
      inArray(
        newsArticleInstruments.articleId,
        rows.map((r) => r.id),
      ),
    );
  const byArticle = new Map<number, TaggedInstrument[]>();
  for (const l of links) byArticle.set(l.articleId, [...(byArticle.get(l.articleId) ?? []), tag(l.instrument, ex)]);
  return rows.map((r) => {
    const ins = byArticle.get(r.id) ?? [];
    const exposure = ins.reduce((s, i) => s + (i.position?.weight ?? 0), 0);
    return {
      ...r,
      instruments: ins,
      portfolioExposure: exposure,
      touchesHoldings: ins.some((i) => i.position),
      touchesWatchlist: ins.some((i) => i.watchlists.length),
    };
  });
}

export async function getNewsFeed(filter: "all" | "holdings" | "watchlist" | "saved" = "all") {
  await seedIfEmpty();
  const ex = await getExposure();
  const rows = await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt)).limit(100);
  const enriched = await enrichArticles(rows, ex);
  if (filter === "holdings") return enriched.filter((a) => a.touchesHoldings);
  if (filter === "watchlist") return enriched.filter((a) => a.touchesWatchlist);
  if (filter === "saved") return enriched.filter((a) => a.saved);
  return enriched;
}

export async function getArticle(id: number) {
  await seedIfEmpty();
  const [row] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
  if (!row) return null;
  const ex = await getExposure();
  const [a] = await enrichArticles([row], ex);
  // related research: notes tagged with any of the article's instruments
  const ids = a.instruments.map((i) => i.id);
  const relatedNotes = ids.length
    ? await db
        .selectDistinct({ note: researchNotes })
        .from(researchNoteInstruments)
        .innerJoin(researchNotes, eq(researchNotes.id, researchNoteInstruments.noteId))
        .where(inArray(researchNoteInstruments.instrumentId, ids))
    : [];
  return { article: a, relatedNotes: relatedNotes.map((r) => r.note) };
}

export async function getNewsForInstruments(ids: number[], limit = 10) {
  if (!ids.length) return [];
  const ex = await getExposure();
  const rows = await db
    .selectDistinct({ a: newsArticles })
    .from(newsArticleInstruments)
    .innerJoin(newsArticles, eq(newsArticles.id, newsArticleInstruments.articleId))
    .where(inArray(newsArticleInstruments.instrumentId, ids))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(limit);
  return enrichArticles(
    rows.map((r) => r.a),
    ex,
  );
}

// ---------- Research ----------
export type EnrichedNote = ResearchNote & { instruments: TaggedInstrument[] };

async function enrichNotes(rows: ResearchNote[], ex: Exposure): Promise<EnrichedNote[]> {
  if (!rows.length) return [];
  const links = await db
    .select({ noteId: researchNoteInstruments.noteId, instrument: instruments })
    .from(researchNoteInstruments)
    .innerJoin(instruments, eq(instruments.id, researchNoteInstruments.instrumentId))
    .where(
      inArray(
        researchNoteInstruments.noteId,
        rows.map((r) => r.id),
      ),
    );
  const byNote = new Map<number, TaggedInstrument[]>();
  for (const l of links) byNote.set(l.noteId, [...(byNote.get(l.noteId) ?? []), tag(l.instrument, ex)]);
  return rows.map((r) => ({ ...r, instruments: byNote.get(r.id) ?? [] }));
}

export async function getNotes(kind?: string) {
  await seedIfEmpty();
  const ex = await getExposure();
  const rows = await db
    .select()
    .from(researchNotes)
    .where(kind ? eq(researchNotes.kind, kind) : undefined)
    .orderBy(desc(researchNotes.updatedAt));
  return enrichNotes(rows, ex);
}

export async function getNote(id: number) {
  await seedIfEmpty();
  const [row] = await db.select().from(researchNotes).where(eq(researchNotes.id, id));
  if (!row) return null;
  const ex = await getExposure();
  const [note] = await enrichNotes([row], ex);
  const news = await getNewsForInstruments(
    note.instruments.map((i) => i.id),
    6,
  );
  return { note, news };
}

export async function getNotesForInstruments(ids: number[]) {
  if (!ids.length) return [];
  const ex = await getExposure();
  const rows = await db
    .selectDistinct({ note: researchNotes })
    .from(researchNoteInstruments)
    .innerJoin(researchNotes, eq(researchNotes.id, researchNoteInstruments.noteId))
    .where(inArray(researchNoteInstruments.instrumentId, ids));
  return enrichNotes(
    rows.map((r) => r.note).sort((a, b) => +b.updatedAt - +a.updatedAt),
    ex,
  );
}

// ---------- Alerts ----------
export type EvaluatedAlert = Alert & { instrument: TaggedInstrument; firing: boolean; distancePct: number };

export function evaluateAlert(a: Alert, inst: Instrument): { firing: boolean; distancePct: number } {
  const last = n(inst.lastPrice);
  const th = n(a.threshold);
  const { pct } = dayChange(inst);
  switch (a.condition) {
    case "price_above":
      return { firing: last >= th, distancePct: th ? ((last - th) / th) * 100 : 0 };
    case "price_below":
      return { firing: last <= th, distancePct: th ? ((last - th) / th) * 100 : 0 };
    case "pct_move":
      return { firing: Math.abs(pct) >= th, distancePct: Math.abs(pct) - th };
    default:
      return { firing: false, distancePct: 0 };
  }
}

export async function getAlerts(): Promise<EvaluatedAlert[]> {
  await seedIfEmpty();
  const ex = await getExposure();
  const rows = await db
    .select({ alert: alerts, instrument: instruments })
    .from(alerts)
    .innerJoin(instruments, eq(instruments.id, alerts.instrumentId))
    .orderBy(desc(alerts.active), desc(alerts.createdAt));
  return rows.map((r) => ({ ...r.alert, instrument: tag(r.instrument, ex), ...evaluateAlert(r.alert, r.instrument) }));
}

// ---------- Watchlists ----------
export async function getWatchlists() {
  await seedIfEmpty();
  const ex = await getExposure();
  const lists = await db.select().from(watchlists).orderBy(asc(watchlists.id));
  const items = await db
    .select({ item: watchlistItems, instrument: instruments })
    .from(watchlistItems)
    .innerJoin(instruments, eq(instruments.id, watchlistItems.instrumentId))
    .orderBy(asc(watchlistItems.addedAt));
  return lists.map((l) => ({
    ...l,
    items: items.filter((i) => i.item.watchlistId === l.id).map((i) => ({ ...i.item, instrument: tag(i.instrument, ex) })),
  }));
}

// ---------- Instrument hub (everything about one ticker) ----------
export async function getInstrumentContext(symbol: string) {
  const inst = await getInstrumentBySymbol(symbol);
  if (!inst) return null;
  const ex = await getExposure();
  const tagged = tag(inst, ex);
  const [history, news, notes, allAlerts, txRows, lists] = await Promise.all([
    getPriceHistory(inst.id),
    getNewsForInstruments([inst.id], 8),
    getNotesForInstruments([inst.id]),
    getAlerts(),
    getTransactions(),
    db.select().from(watchlists).orderBy(asc(watchlists.id)),
  ]);
  return {
    instrument: tagged,
    history,
    news,
    notes,
    alerts: allAlerts.filter((a) => a.instrumentId === inst.id),
    transactions: txRows.filter((t) => t.tx.instrumentId === inst.id),
    allWatchlists: lists,
  };
}

// ---------- Markets overview ----------
export async function getMarketsOverview() {
  await seedIfEmpty();
  const ex = await getExposure();
  const all = await db.select().from(instruments).orderBy(asc(instruments.symbol));
  const tagged = all.map((i) => tag(i, ex));
  const indices = tagged.filter((i) => i.assetClass === "index" || ["USOIL", "GLD", "BTC"].includes(i.symbol));
  const tradeable = tagged.filter((i) => i.assetClass !== "index");
  const sorted = [...tradeable].sort((a, b) => dayChange(b).pct - dayChange(a).pct);
  const sectors = new Map<string, { sum: number; count: number }>();
  for (const i of tradeable) {
    const s = i.sector ?? "Other";
    const cur = sectors.get(s) ?? { sum: 0, count: 0 };
    cur.sum += dayChange(i).pct;
    cur.count += 1;
    sectors.set(s, cur);
  }
  return {
    indices,
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
    sectors: [...sectors.entries()].map(([k, v]) => ({ sector: k, avgPct: v.sum / v.count })).sort((a, b) => b.avgPct - a.avgPct),
    all: tagged,
  };
}

// ---------- Global search (used by command bar) ----------
export async function searchInstruments(q: string) {
  await seedIfEmpty();
  const like = `%${q.toUpperCase()}%`;
  return db
    .select()
    .from(instruments)
    .where(sql`upper(${instruments.symbol}) like ${like} or upper(${instruments.name}) like ${like}`)
    .limit(8);
}

export type TxRow = { tx: Transaction; instrument: Instrument | null };
