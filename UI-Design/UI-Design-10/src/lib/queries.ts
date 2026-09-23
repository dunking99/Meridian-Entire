import { and, asc, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  alertEvents,
  alerts,
  appMeta,
  catalysts,
  instruments,
  journalEntries,
  links,
  newsItems,
  notes,
  screens,
  theses,
  trades,
  watchlistItems,
  type NewsItem,
  type Note,
  type Thesis,
} from "@/db/schema";
import { getQuoteBook, type Quote, type QuoteBook } from "./market";
import { getPortfolio, type PortfolioView } from "./portfolio";
import { rankNews, tierFor, type NewsRelevance, type PortfolioContext } from "./enrich";

export type WatchView = {
  listName: string;
  note: string;
  rows: {
    itemId: number;
    instrumentId: number;
    symbol: string;
    name: string;
    quote: Quote;
    triggerPrice: number | null;
    triggerDistance: number | null;
    note: string;
    held: boolean;
    weight: number;
    thesis: { id: number; title: string; status: string; conviction: number } | null;
    latestNews: { id: number; headline: string; publishedAt: Date; source: string; tier: string } | null;
    openAlerts: number;
    catalysts: { title: string; eventDate: string; daysOut: number }[];
  }[];
};

export function portfolioContext(portfolio: PortfolioView): PortfolioContext {
  return new Map(
    portfolio.positions.map((p) => [p.instrument.id, { marketValue: p.marketValue, weight: p.weight, symbol: p.instrument.symbol }]),
  );
}

export async function getWatchViews(portfolio: PortfolioView): Promise<{ lists: WatchView[]; listMeta: Record<string, string> }> {
  const items = await db.select().from(watchlistItems).orderBy(asc(watchlistItems.listName), asc(watchlistItems.rank));
  const ids = items.map((i) => i.instrumentId);
  const ctx = portfolioContext(portfolio);

  const [thesisRows, alertRows, catRows] = await Promise.all([
    db.select().from(theses).where(inArray(theses.instrumentId, ids.length ? ids : [-1])),
    db.select().from(alerts).where(and(eq(alerts.active, true), inArray(alerts.instrumentId, ids.length ? ids : [-1]))),
    db.select().from(catalysts).where(inArray(catalysts.instrumentId, ids.length ? ids : [-1])).orderBy(asc(catalysts.eventDate)),
  ]);

  const newsByInstrument = await getNewsForInstruments(ids);

  const lists = new Map<string, WatchView>();
  for (const item of items) {
    const quote = portfolio.book.byId.get(item.instrumentId);
    if (!quote) continue;
    const list = lists.get(item.listName) ?? { listName: item.listName, note: "", rows: [] };
    const thesis = thesisRows.find((t) => t.instrumentId === item.instrumentId);
    const latest = newsByInstrument.get(item.instrumentId)?.[0];
    const cats = catRows
      .filter((c) => c.instrumentId === item.instrumentId)
      .map((c) => ({ title: c.title, eventDate: c.eventDate, daysOut: Math.round((new Date(`${c.eventDate}T12:00:00Z`).getTime() - Date.now()) / 86_400_000) }))
      .filter((c) => c.daysOut >= 0);
    list.rows.push({
      itemId: item.id,
      instrumentId: item.instrumentId,
      symbol: quote.instrument.symbol,
      name: quote.instrument.name,
      quote,
      triggerPrice: item.triggerPrice,
      triggerDistance: item.triggerPrice ? item.triggerPrice / quote.price - 1 : null,
      note: item.note,
      held: ctx.has(item.instrumentId),
      weight: ctx.get(item.instrumentId)?.weight ?? 0,
      thesis: thesis ? { id: thesis.id, title: thesis.title, status: thesis.status, conviction: thesis.conviction } : null,
      latestNews: latest
        ? {
            id: latest.news.id,
            headline: latest.news.headline,
            publishedAt: latest.news.publishedAt,
            source: latest.news.source,
            tier: tierFor(latest.weight * 10),
          }
        : null,
      openAlerts: alertRows.filter((a) => a.instrumentId === item.instrumentId).length,
      catalysts: cats,
    });
    lists.set(item.listName, list);
  }

  const notesByList = new Map<string, string>([
    ["AI Infrastructure", "Live trigger prices attached. An add only counts if it comes from a trim elsewhere or from cash."],
    ["Quality Compounders", "Add-on-compression names. Bought on multiple compression, never momentum."],
    ["Rates & Macro Probes", "Signals that would change the duration and small-cap theses."],
  ]);

  return {
    lists: [...lists.values()].map((l) => ({ ...l, note: notesByList.get(l.listName) ?? "" })),
    listMeta: Object.fromEntries(notesByList),
  };
}

export async function getNewsForInstruments(instrumentIds: number[]) {
  const out = new Map<number, { news: NewsItem; weight: number; relation: string }[]>();
  if (!instrumentIds.length) return out;
  const rows = await db
    .select({ news: newsItems, weight: links.weight, relation: links.relation, instrumentId: links.toId })
    .from(links)
    .innerJoin(newsItems, eq(newsItems.id, links.fromId))
    .where(and(eq(links.fromKind, "news"), eq(links.toKind, "instrument"), inArray(links.toId, instrumentIds)))
    .orderBy(desc(newsItems.publishedAt));
  for (const r of rows) {
    const arr = out.get(r.instrumentId) ?? [];
    arr.push({ news: r.news, weight: r.weight, relation: r.relation });
    out.set(r.instrumentId, arr);
  }
  return out;
}

export async function getNewsLinksFor(newsIds: number[]) {
  if (!newsIds.length) return new Map<number, { toKind: string; toId: number; relation: string; weight: number }[]>();
  const rows = await db.select().from(links).where(and(eq(links.fromKind, "news"), inArray(links.fromId, newsIds)));
  const map = new Map<number, { toKind: string; toId: number; relation: string; weight: number }[]>();
  for (const r of rows) {
    const arr = map.get(r.fromId) ?? [];
    arr.push({ toKind: r.toKind, toId: r.toId, relation: r.relation, weight: r.weight });
    map.set(r.fromId, arr);
  }
  return map;
}

export type NewsFeedFilters = {
  kind?: string;
  source?: string;
  scope?: "all" | "mine" | "watch" | "saved";
  q?: string;
};

export type NewsFeedResult = {
  items: (NewsRelevance & { linkCounts: { thesis: number; note: number }; saved: boolean; read: boolean })[];
  sources: string[];
  counts: { total: number; saved: number; impactful: number };
};

export async function getNewsFeed(portfolio: PortfolioView, filters: NewsFeedFilters): Promise<NewsFeedResult> {
  const ctx = portfolioContext(portfolio);
  const watchIds = new Set((await db.select({ id: watchlistItems.instrumentId }).from(watchlistItems)).map((w) => w.id));
  const universe = portfolio.book.list.map((q) => q.instrument);

  const where = [];
  if (filters.kind && filters.kind !== "all") where.push(eq(newsItems.kind, filters.kind));
  if (filters.source && filters.source !== "all") where.push(eq(newsItems.source, filters.source));
  if (filters.scope === "saved") where.push(eq(newsItems.saved, true));
  if (filters.q) where.push(or(like(newsItems.headline, `%${filters.q}%`), like(newsItems.summary, `%${filters.q}%`))!);

  const rows = await db
    .select()
    .from(newsItems)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(newsItems.publishedAt))
    .limit(120);

  const ranked = rows.map((n) => rankNews(n, universe, ctx, watchIds));
  const linkCounts = await getNewsLinksFor(rows.map((r) => r.id));

  let items = ranked.map((r) => {
    const l = linkCounts.get(r.news.id) ?? [];
    return {
      ...r,
      linkCounts: {
        thesis: l.filter((x) => x.toKind === "thesis").length,
        note: l.filter((x) => x.toKind === "note").length,
      },
      saved: r.news.saved,
      read: r.news.read,
    };
  });

  if (filters.scope === "mine") items = items.filter((i) => i.heldMentions > 0);
  if (filters.scope === "watch") items = items.filter((i) => i.watchMentions > 0 || i.heldMentions > 0);
  if (!filters.scope || filters.scope === "all" || filters.scope === "saved") {
    items.sort((a, b) => b.score - a.score || +b.news.publishedAt - +a.news.publishedAt);
  }

  const sources = [...new Set((await db.select({ source: newsItems.source }).from(newsItems)).map((s) => s.source))].sort();
  return {
    items,
    sources,
    counts: {
      total: rows.length,
      saved: rows.filter((r) => r.saved).length,
      impactful: ranked.filter((r) => r.heldMentions > 0 || r.watchMentions > 0).length,
    },
  };
}

export async function getNewsDetail(id: number, portfolio: PortfolioView) {
  const [item] = await db.select().from(newsItems).where(eq(newsItems.id, id)).limit(1);
  if (!item) return null;
  const ctx = portfolioContext(portfolio);
  const watchIds = new Set((await db.select({ id: watchlistItems.instrumentId }).from(watchlistItems)).map((w) => w.id));
  const relevance = rankNews(item, portfolio.book.list.map((q) => q.instrument), ctx, watchIds);

  const instrumentIds = relevance.mentions.map((m) => m.instrument.id);
  const [relatedTheses, relatedNotes] = await Promise.all([
    instrumentIds.length ? db.select().from(theses).where(inArray(theses.instrumentId, instrumentIds)) : Promise.resolve([]),
    instrumentIds.length ? db.select().from(notes).where(inArray(notes.instrumentId, instrumentIds)).orderBy(desc(notes.createdAt)).limit(8) : Promise.resolve([]),
  ]);

  const siblings = instrumentIds.length
    ? await db
        .select({ news: newsItems, instrumentId: links.toId, relation: links.relation })
        .from(links)
        .innerJoin(newsItems, eq(newsItems.id, links.fromId))
        .where(and(eq(links.fromKind, "news"), eq(links.toKind, "instrument"), inArray(links.toId, instrumentIds), sql`${links.fromId} <> ${id}`))
        .orderBy(desc(newsItems.publishedAt))
        .limit(20)
    : [];

  return {
    item,
    relevance,
    positions: portfolio.positions.filter((p) => instrumentIds.includes(p.instrument.id)),
    relatedTheses,
    relatedNotes,
    siblings: siblings.filter((s, i, arr) => arr.findIndex((x) => x.news.id === s.news.id) === i),
  };
}

export async function getResearchOverview(portfolio: PortfolioView) {
  const [thesisRows, noteRows, journalRows] = await Promise.all([
    db.select().from(theses).orderBy(asc(theses.status), desc(theses.updatedAt)),
    db.select().from(notes).orderBy(desc(notes.createdAt)),
    db.select().from(journalEntries).orderBy(desc(journalEntries.decidedAt)).limit(6),
  ]);

  const positionsByInstrument = new Map(portfolio.positions.map((p) => [p.instrument.id, p]));
  const newsByInstrument = await getNewsForInstruments(thesisRows.map((t) => t.instrumentId).filter((x): x is number => !!x));

  const enriched = thesisRows.map((t) => {
    const quote = t.instrumentId ? portfolio.book.byId.get(t.instrumentId) : undefined;
    const pos = t.instrumentId ? positionsByInstrument.get(t.instrumentId) : undefined;
    const news = t.instrumentId ? newsByInstrument.get(t.instrumentId) ?? [] : [];
    const upside = t.targetPrice && quote ? t.targetPrice / quote.price - 1 : null;
    const overdueDays = t.reviewAt ? Math.round((Date.now() - t.reviewAt.getTime()) / 86_400_000) : null;
    const closeHistory = quote?.history ?? [];
    const sinceIdea = closeHistory.length
      ? quote!.price / (closeHistory[Math.max(0, closeHistory.length - Math.min(closeHistory.length - 1, Math.round((Date.now() - t.createdAt.getTime()) / 86_400_000 * 0.7)))].close) - 1
      : null;
    return {
      thesis: t,
      quote,
      position: pos,
      thesisNews: news.slice(0, 3),
      upside,
      overdueDays,
      sinceIdea,
      statCount: news.length,
    };
  });

  const noteCounts = new Map<string, number>();
  for (const n of noteRows) noteCounts.set(n.kind, (noteCounts.get(n.kind) ?? 0) + 1);

  return { theses: enriched, notes: noteRows, journal: journalRows, noteCounts: Object.fromEntries(noteCounts) };
}

export async function getThesisDetail(id: number, portfolio: PortfolioView) {
  const [thesis] = await db.select().from(theses).where(eq(theses.id, id)).limit(1);
  if (!thesis) return null;
  const quote = thesis.instrumentId ? portfolio.book.byId.get(thesis.instrumentId) : undefined;
  const position = portfolio.positions.find((p) => p.instrument.id === thesis.instrumentId);

  const [noteRows, journalRows, newsRows, tradeRows] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(or(eq(notes.instrumentId, thesis.instrumentId ?? -1), sql`${notes.tags} like ${`%${(thesis.tags.split(",")[0] ?? "").trim()}%`}`))
      .orderBy(desc(notes.createdAt))
      .limit(10),
    db.select().from(journalEntries).where(eq(journalEntries.thesisId, id)).orderBy(desc(journalEntries.decidedAt)),
    thesis.instrumentId
      ? getNewsForInstruments([thesis.instrumentId])
      : Promise.resolve(new Map<number, { news: NewsItem; weight: number; relation: string }[]>()),
    thesis.instrumentId
      ? db
          .select({ trade: trades, accountName: accounts.name })
          .from(trades)
          .innerJoin(accounts, eq(accounts.id, trades.accountId))
          .where(eq(trades.instrumentId, thesis.instrumentId))
          .orderBy(desc(trades.executedAt))
          .limit(10)
      : Promise.resolve([]),
  ]);

  const news = thesis.instrumentId ? newsRows.get(thesis.instrumentId) ?? [] : [];
  const performers = quote?.history ?? [];
  const returnSince =
    performers.length && quote
      ? quote.price / performers[Math.max(0, performers.length - Math.min(performers.length - 1, Math.round((Date.now() - thesis.createdAt.getTime()) / 86_400_000 * 0.7)))].close - 1
      : null;

  return { thesis, quote, position, notes: noteRows, journal: journalRows, news, trades: tradeRows, returnSince };
}

export async function getNoteDetail(id: number) {
  const [note] = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  if (!note) return null;
  const book = await getQuoteBook();
  const quote = note.instrumentId ? book.byId.get(note.instrumentId) : undefined;
  const [linkedNotes, linkedTheses] = await Promise.all([
    note.instrumentId
      ? db.select().from(notes).where(and(eq(notes.instrumentId, note.instrumentId), sql`${notes.id} <> ${id}`)).orderBy(desc(notes.createdAt)).limit(6)
      : Promise.resolve([]),
    note.instrumentId ? db.select().from(theses).where(eq(theses.instrumentId, note.instrumentId)) : Promise.resolve([]),
  ]);
  return { note, quote, linkedNotes, linkedTheses, book };
}

export async function getAlertsView(portfolio: PortfolioView) {
  const [alertRows, eventRows, catRows, thesisRows] = await Promise.all([
    db.select().from(alerts).orderBy(desc(alerts.active), desc(alerts.createdAt)),
    db.select().from(alertEvents).orderBy(desc(alertEvents.firedAt)).limit(40),
    db.select().from(catalysts).orderBy(asc(catalysts.eventDate)),
    db.select().from(theses),
  ]);

  const events = eventRows.map((e) => {
    const alert = alertRows.find((a) => a.id === e.alertId);
    const symbol = e.instrumentId ? portfolio.book.byId.get(e.instrumentId)?.instrument.symbol : alert?.instrumentId ? portfolio.book.byId.get(alert.instrumentId)?.instrument.symbol : null;
    return { ...e, symbol: symbol ?? "—", kind: alert?.kind ?? "news", note: alert?.note ?? "" };
  });

  const evaluated = alertRows.map((a) => {
    const quote = a.instrumentId ? portfolio.book.byId.get(a.instrumentId) : undefined;
    let state: "armed" | "breached" | "paused" = a.active ? "armed" : "paused";
    let current: number | null = quote?.price ?? null;
    let distance: number | null = null;
    if (a.kind === "price_below" && quote && a.threshold) {
      distance = quote.price / a.threshold - 1;
      if (quote.price <= a.threshold) state = "breached";
    }
    if (a.kind === "price_above" && quote && a.threshold) {
      distance = a.threshold / quote.price - 1;
      if (quote.price >= a.threshold) state = "breached";
    }
    if (a.kind === "pct_move" && quote && a.threshold) {
      current = quote.changePct;
      distance = Math.abs(quote.changePct) / a.threshold - 1;
      if (Math.abs(quote.changePct) >= a.threshold) state = "breached";
    }
    if (a.kind === "thesis_review" && a.active) {
      const overdue = thesisRows.filter((t) => t.reviewAt && t.reviewAt.getTime() < Date.now());
      current = overdue.length;
      if (overdue.length > 0) state = "breached";
    }
    const quote2 = quote;
    return {
      alert: a,
      quote: quote2,
      symbol: quote2?.instrument.symbol ?? "—",
      name: quote2?.instrument.name ?? "Portfolio-wide rule",
      state,
      current,
      distance,
      lastEvent: eventRows.find((e) => e.alertId === a.id) ?? null,
      armedCatalysts: a.instrumentId ? catRows.filter((c) => c.instrumentId === a.instrumentId).length : 0,
    };
  });

  return { alerts: evaluated, events };
}

export async function getCalendarView(portfolio: PortfolioView) {
  const rows = await db
    .select({ catalyst: catalysts, instrument: instruments })
    .from(catalysts)
    .leftJoin(instruments, eq(instruments.id, catalysts.instrumentId))
    .orderBy(asc(catalysts.eventDate));

  const watchIds = new Set((await db.select({ id: watchlistItems.instrumentId }).from(watchlistItems)).map((w) => w.id));
  const heldIds = new Set(portfolio.positions.map((p) => p.instrument.id));

  return rows.map((r) => {
    const daysOut = Math.round((new Date(`${r.catalyst.eventDate}T12:00:00Z`).getTime() - Date.now()) / 86_400_000);
    const quote = r.catalyst.instrumentId ? portfolio.book.byId.get(r.catalyst.instrumentId) : undefined;
    const position = portfolio.positions.find((p) => p.instrument.id === r.catalyst.instrumentId);
    return {
      ...r.catalyst,
      symbol: r.instrument?.symbol ?? null,
      daysOut,
      quote,
      held: r.catalyst.instrumentId ? heldIds.has(r.catalyst.instrumentId) : false,
      watched: r.catalyst.instrumentId ? watchIds.has(r.catalyst.instrumentId) : false,
      exposure: position?.marketValue ?? 0,
      weight: position?.weight ?? 0,
    };
  });
}

export async function getJournalView() {
  const [rows, thesisRows] = await Promise.all([
    db
      .select({ entry: journalEntries, symbol: instruments.symbol, name: instruments.name, thesisTitle: theses.title })
      .from(journalEntries)
      .leftJoin(instruments, eq(instruments.id, journalEntries.instrumentId))
      .leftJoin(theses, eq(theses.id, journalEntries.thesisId))
      .orderBy(desc(journalEntries.decidedAt)),
    db.select({ id: theses.id, title: theses.title }).from(theses).orderBy(asc(theses.title)),
  ]);
  return { entries: rows, theses: thesisRows };
}

export async function getScreenerResults(
  portfolio: PortfolioView,
  f: { sector?: string; assetClass?: string; minCap?: number; minR3m?: number; maxR3m?: number; sort?: string; dir?: string; held?: string; watch?: string; theme?: string },
) {
  const heldIds = new Set(portfolio.positions.map((p) => p.instrument.id));
  const watchRowsData = await db.select().from(watchlistItems);
  const watchIds = new Set(watchRowsData.map((w) => w.instrumentId));
  const thesisRows = await db.select().from(theses);

  let rows = portfolio.book.list.map((q) => ({
    quote: q,
    held: heldIds.has(q.instrument.id),
    watched: watchIds.has(q.instrument.id),
    weight: portfolio.positions.find((p) => p.instrument.id === q.instrument.id)?.weight ?? 0,
    thesis: thesisRows.find((t) => t.instrumentId === q.instrument.id) ?? null,
  }));

  if (f.sector && f.sector !== "all") rows = rows.filter((r) => r.quote.instrument.sector === f.sector);
  if (f.assetClass && f.assetClass !== "all") rows = rows.filter((r) => r.quote.instrument.assetClass === f.assetClass);
  const theme = f.theme;
  if (theme && theme !== "all") rows = rows.filter((r) => (r.quote.instrument.themes ?? "").includes(theme));
  if (f.minCap) rows = rows.filter((r) => (r.quote.instrument.marketCap ?? 0) >= f.minCap! * 1_000_000_000);
  if (f.minR3m !== undefined) rows = rows.filter((r) => r.quote.r3m >= f.minR3m! / 100);
  if (f.maxR3m !== undefined) rows = rows.filter((r) => r.quote.r3m <= f.maxR3m! / 100);
  if (f.held === "yes") rows = rows.filter((r) => r.held);
  if (f.held === "no") rows = rows.filter((r) => !r.held);
  if (f.watch === "yes") rows = rows.filter((r) => r.watched);

  const key = f.sort ?? "r3m";
  const dirMult = (f.dir ?? "desc") === "desc" ? -1 : 1;
  const pick = (r: (typeof rows)[number]) => {
    switch (key) {
      case "marketCap":
        return r.quote.instrument.marketCap ?? 0;
      case "r1d":
        return r.quote.r1d;
      case "r1m":
        return r.quote.r1m;
      case "r3m":
        return r.quote.r3m;
      case "ytd":
        return r.quote.ytd;
      case "weight":
        return r.weight;
      default:
        return r.quote.instrument.symbol;
    }
  };
  rows.sort((a, b) => {
    const av = pick(a);
    const bv = pick(b);
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dirMult;
    return ((av as number) - (bv as number)) * dirMult;
  });

  const sectors = [...new Set(portfolio.book.list.map((q) => q.instrument.sector ?? "Other"))].sort();
  const themes = [...new Set(portfolio.book.list.flatMap((q) => (q.instrument.themes ?? "").split(",").filter(Boolean)))].sort();
  const savedScreens = await db.select().from(screens).orderBy(desc(screens.createdAt));
  return { rows, sectors, themes, savedScreens };
}

export async function getInstrumentHub(symbol: string, portfolio: PortfolioView) {
  const [instrument] = await db.select().from(instruments).where(eq(instruments.symbol, symbol)).limit(1);
  if (!instrument) return null;
  const quote = portfolio.book.byId.get(instrument.id);
  const [thesisRows, noteRows, tradeRows, journalRows, catRows, alertRows, eventRows, watchRows, linkRows] = await Promise.all([
    db.select().from(theses).where(eq(theses.instrumentId, instrument.id)).orderBy(desc(theses.updatedAt)),
    db.select().from(notes).where(eq(notes.instrumentId, instrument.id)).orderBy(desc(notes.createdAt)),
    db
      .select({ trade: trades, accountName: accounts.name })
      .from(trades)
      .innerJoin(accounts, eq(accounts.id, trades.accountId))
      .where(eq(trades.instrumentId, instrument.id))
      .orderBy(desc(trades.executedAt))
      .limit(12),
    db.select().from(journalEntries).where(eq(journalEntries.instrumentId, instrument.id)).orderBy(desc(journalEntries.decidedAt)),
    db.select().from(catalysts).where(eq(catalysts.instrumentId, instrument.id)).orderBy(asc(catalysts.eventDate)),
    db.select().from(alerts).where(eq(alerts.instrumentId, instrument.id)).orderBy(desc(alerts.active)),
    db.select().from(alertEvents).where(eq(alertEvents.instrumentId, instrument.id)).orderBy(desc(alertEvents.firedAt)).limit(10),
    db.select().from(watchlistItems).where(eq(watchlistItems.instrumentId, instrument.id)),
    db
      .select({ id: links.id })
      .from(links)
      .where(
        or(
          and(eq(links.toKind, "instrument"), eq(links.toId, instrument.id)),
          and(eq(links.fromKind, "instrument"), eq(links.fromId, instrument.id)),
        ),
      ),
  ]);

  const newsMap = await getNewsForInstruments([instrument.id]);
  const positionsHeld = portfolio.positions.filter((p) => p.instrument.id === instrument.id);
  const isHeld = positionsHeld.length > 0;

  const themeSet = new Set((instrument.themes ?? "").split(",").filter(Boolean));
  const related = portfolio.book.list
    .filter((q) => q.instrument.id !== instrument.id)
    .map((q) => ({
      quote: q,
      shared: (q.instrument.themes ?? "").split(",").filter((t) => themeSet.has(t)).length,
    }))
    .filter((r) => r.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 8);

  return {
    instrument,
    quote,
    theses: thesisRows,
    notes: noteRows,
    trades: tradeRows,
    journal: journalRows,
    catalysts: catRows,
    alerts: alertRows,
    alertEvents: eventRows,
    watchlist: watchRows,
    news: newsMap.get(instrument.id) ?? [],
    positions: positionsHeld,
    isHeld,
    related,
    linkCount: linkRows.length,
  };
}

export async function globalSearch(q: string) {
  const term = q.trim();
  if (term.length < 1) {
    return { instruments: [], news: [], notes: [], theses: [], trades: [], journal: [] };
  }
  const like$ = `%${term}%`;
  const [inst, news, noteRows, thesisRows, tradeRows, journalRows] = await Promise.all([
    db
      .select()
      .from(instruments)
      .where(or(like(instruments.symbol, like$), like(instruments.name, like$), like(instruments.aliases, like$), like(instruments.themes, like$)))
      .limit(10),
    db.select().from(newsItems).where(or(like(newsItems.headline, like$), like(newsItems.summary, like$))).limit(10),
    db.select().from(notes).where(or(like(notes.title, like$), like(notes.body, like$), like(notes.tags, like$))).limit(10),
    db.select().from(theses).where(or(like(theses.title, like$), like(theses.body, like$), like(theses.tags, like$))).limit(10),
    db
      .select({ trade: trades, symbol: instruments.symbol })
      .from(trades)
      .innerJoin(instruments, eq(instruments.id, trades.instrumentId))
      .where(or(like(trades.rationale, like$), like(instruments.symbol, like$), like(trades.tags, like$)))
      .limit(10),
    db.select().from(journalEntries).where(or(like(journalEntries.title, like$), like(journalEntries.body, like$))).limit(10),
  ]);
  return { instruments: inst, news, notes: noteRows, theses: thesisRows, trades: tradeRows, journal: journalRows };
}

export async function getTodayBrief() {
  const portfolio = await getPortfolio();
  const [feed, alertsView, calendar, research, journal, meta] = await Promise.all([
    getNewsFeed(portfolio, { scope: "watch" }),
    getAlertsView(portfolio),
    getCalendarView(portfolio),
    getResearchOverview(portfolio),
    getJournalView(),
    db.select().from(appMeta),
  ]);

  const heldIds = new Set(portfolio.positions.map((p) => p.instrument.id));
  const marketQuotes = portfolio.book.list.filter((q) => ["SPY", "QQQ", "IWM", "US10Y", "VIX", "GLD", "BTC", "WTI"].includes(q.instrument.symbol));

  const contributors = [...portfolio.positions].sort((a, b) => b.dayContribution - a.dayContribution);
  const reviewQueue = research.theses
    .filter((t) => t.thesis.status === "active" || t.thesis.status === "idea")
    .filter((t) => t.overdueDays !== null && t.overdueDays >= 0)
    .sort((a, b) => (b.overdueDays ?? 0) - (a.overdueDays ?? 0));

  return {
    portfolio,
    feed: feed.items.slice(0, 6),
    feedTotal: feed.items.length,
    alerts: alertsView.alerts.filter((a) => a.state === "breached").slice(0, 6),
    events: alertsView.events.slice(0, 5),
    calendar: calendar.filter((c) => c.daysOut >= 0 && c.daysOut <= 14),
    research,
    journal: journal.entries.slice(0, 4),
    marketQuotes,
    contributors,
    heldIds,
    meta,
  };
}

export type { NewsRelevance } from "./enrich";
export { getQuoteBook };
