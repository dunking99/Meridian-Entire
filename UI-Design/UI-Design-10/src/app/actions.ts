"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
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
  positions,
  priceBars,
  screens,
  theses,
  trades,
  watchlistItems,
} from "@/db/schema";
import { generateBars, round } from "@/lib/market-sim";
import { INSTRUMENTS } from "@/lib/seed-data";
import { rebuildNewsLinks } from "@/lib/enrich";
import { ensureSeeded, SEED_VERSION } from "@/lib/seed";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function num(fd: FormData, key: string) {
  const v = str(fd, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function touchAll() {
  for (const p of ["/", "/portfolio", "/portfolio/trades", "/news", "/research", "/journal", "/watchlists", "/alerts", "/markets", "/settings"]) {
    revalidatePath(p);
  }
}

async function instrumentIdFor(symbolOrId: string) {
  const asNumber = Number(symbolOrId);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    const [row] = await db.select({ id: instruments.id }).from(instruments).where(eq(instruments.id, asNumber)).limit(1);
    if (row) return row.id;
  }
  const [row] = await db.select({ id: instruments.id }).from(instruments).where(eq(instruments.symbol, symbolOrId.toUpperCase())).limit(1);
  return row?.id ?? null;
}

export async function addTrade(fd: FormData) {
  const symbol = str(fd, "symbol");
  const side = str(fd, "side") === "sell" ? "sell" : "buy";
  const quantity = num(fd, "quantity");
  const price = num(fd, "price");
  const accountId = num(fd, "accountId");
  const thesisId = num(fd, "thesisId");
  if (!symbol || !quantity || !price || !accountId) return;
  const instrumentId = await instrumentIdFor(symbol);
  if (!instrumentId) return;

  await db.insert(trades).values({
    accountId,
    instrumentId,
    side,
    quantity,
    price,
    fees: round(quantity * price * 0.0002, 2),
    executedAt: new Date(),
    thesisId,
    rationale: str(fd, "rationale") || null,
    tags: str(fd, "tags"),
  });

  const [existing] = await db
    .select()
    .from(positions)
    .where(and(eq(positions.accountId, accountId), eq(positions.instrumentId, instrumentId)))
    .limit(1);

  if (side === "buy") {
    if (existing) {
      const newQty = existing.quantity + quantity;
      const newAvg = (existing.quantity * existing.avgCost + quantity * price) / newQty;
      await db.update(positions).set({ quantity: newQty, avgCost: newAvg, updatedAt: new Date() }).where(eq(positions.id, existing.id));
    } else {
      await db.insert(positions).values({ accountId, instrumentId, quantity, avgCost: price });
    }
  } else if (existing) {
    const newQty = existing.quantity - quantity;
    if (newQty <= 0.000001) {
      await db.delete(positions).where(eq(positions.id, existing.id));
    } else {
      await db.update(positions).set({ quantity: newQty, updatedAt: new Date() }).where(eq(positions.id, existing.id));
    }
  }

  await db.insert(journalEntries).values({
    kind: "decision",
    title: `${side === "buy" ? "Bought" : "Sold"} ${quantity} ${symbol} @ ${price}`,
    body: str(fd, "rationale") || "Logged from the trade blotter.",
    decision: side,
    instrumentId,
    thesisId,
    tradeId: undefined,
    decidedAt: new Date(),
    reviewAt: new Date(Date.now() + 90 * 86_400_000),
  });

  touchAll();
}

export async function upsertThesis(fd: FormData) {
  const title = str(fd, "title");
  const symbol = str(fd, "symbol");
  if (!title) return;
  const instrumentId = symbol ? await instrumentIdFor(symbol) : null;
  const [created] = await db
    .insert(theses)
    .values({
      instrumentId,
      title,
      stance: str(fd, "stance") || "long",
      conviction: num(fd, "conviction") ?? 3,
      status: str(fd, "status") || "idea",
      horizon: str(fd, "horizon") || "12m",
      targetPrice: num(fd, "targetPrice"),
      invalidation: str(fd, "invalidation") || null,
      body: str(fd, "body"),
      tags: str(fd, "tags"),
      reviewAt: new Date(Date.now() + 30 * 86_400_000),
    })
    .returning({ id: theses.id });
  if (created && instrumentId) {
    await db.insert(links).values({ fromKind: "thesis", fromId: created.id, toKind: "instrument", toId: instrumentId, relation: "impacts", weight: 3 });
  }
  touchAll();
}

export async function addJournalEntry(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const symbol = str(fd, "symbol");
  await db.insert(journalEntries).values({
    kind: str(fd, "kind") || "observation",
    title,
    body: str(fd, "body"),
    decision: str(fd, "decision") || null,
    instrumentId: symbol ? await instrumentIdFor(symbol) : null,
    thesisId: num(fd, "thesisId"),
    decidedAt: new Date(),
    reviewAt: num(fd, "reviewInDays") ? new Date(Date.now() + (num(fd, "reviewInDays") ?? 30) * 86_400_000) : null,
  });
  touchAll();
}

export async function updateThesis(fd: FormData) {
  const id = num(fd, "thesisId");
  if (!id) return;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const status = str(fd, "status");
  const conviction = num(fd, "conviction");
  const targetPrice = num(fd, "targetPrice");
  const reviewInDays = num(fd, "reviewInDays");
  if (status) updates.status = status;
  if (conviction) updates.conviction = conviction;
  if (targetPrice) updates.targetPrice = targetPrice;
  if (reviewInDays) updates.reviewAt = new Date(Date.now() + reviewInDays * 86_400_000);
  await db.update(theses).set(updates).where(eq(theses.id, id));

  const note = str(fd, "update");
  const [thesis] = await db.select().from(theses).where(eq(theses.id, id)).limit(1);
  if (note) {
    await db.insert(journalEntries).values({
      kind: "review",
      title: `Thesis update: ${thesis?.title ?? ""}`.slice(0, 140),
      body: note,
      decision: "hold",
      instrumentId: thesis?.instrumentId ?? null,
      thesisId: id,
      decidedAt: new Date(),
    });
  }
  touchAll();
}

export async function addNote(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const symbol = str(fd, "symbol");
  await db.insert(notes).values({
    instrumentId: symbol ? await instrumentIdFor(symbol) : null,
    kind: str(fd, "kind") || "memo",
    title,
    body: str(fd, "body"),
    sourceUrl: str(fd, "sourceUrl") || null,
    tags: str(fd, "tags"),
  });
  touchAll();
}

export async function toggleWatchlist(fd: FormData) {
  const symbol = str(fd, "symbol");
  const listName = str(fd, "listName") || "AI Infrastructure";
  const instrumentId = await instrumentIdFor(symbol);
  if (!instrumentId) return;
  const [existing] = await db
    .select()
    .from(watchlistItems)
    .where(and(eq(watchlistItems.listName, listName), eq(watchlistItems.instrumentId, instrumentId)))
    .limit(1);
  if (existing) {
    await db.delete(watchlistItems).where(eq(watchlistItems.id, existing.id));
  } else {
    await db.insert(watchlistItems).values({
      listName,
      instrumentId,
      rank: 99,
      note: str(fd, "note") || "Added from the terminal",
      triggerPrice: num(fd, "triggerPrice"),
    });
  }
  touchAll();
}

export async function createAlert(fd: FormData) {
  const kind = str(fd, "kind");
  if (!kind) return;
  const symbol = str(fd, "symbol");
  await db.insert(alerts).values({
    kind,
    instrumentId: symbol ? await instrumentIdFor(symbol) : null,
    keyword: str(fd, "keyword") || null,
    threshold: num(fd, "threshold"),
    note: str(fd, "note"),
    active: true,
  });
  touchAll();
}

export async function toggleAlert(fd: FormData) {
  const id = num(fd, "alertId");
  if (!id) return;
  const [row] = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
  if (!row) return;
  await db.update(alerts).set({ active: !row.active }).where(eq(alerts.id, id));
  touchAll();
}

/** Evaluate every armed rule against current data and append fired events. */
export async function evaluateAlerts() {
  const rows = await db.select().from(alerts).where(eq(alerts.active, true));
  const book = await db
    .select({ instrumentId: priceBars.instrumentId, d: priceBars.d, close: priceBars.close })
    .from(priceBars)
    .orderBy(priceBars.instrumentId, priceBars.d);
  const latest = new Map<number, { price: number; prev: number; symbol: string; d: string }>();
  const symbolById = new Map((await db.select({ id: instruments.id, symbol: instruments.symbol }).from(instruments)).map((i) => [i.id, i.symbol]));
  const grouped = new Map<number, { d: string; close: number }[]>();
  for (const b of book) {
    const arr = grouped.get(b.instrumentId) ?? [];
    arr.push({ d: b.d, close: b.close });
    grouped.set(b.instrumentId, arr);
  }
  for (const [id, series] of grouped) {
    latest.set(id, {
      price: series[series.length - 1].close,
      prev: series[series.length - 2]?.close ?? series[series.length - 1].close,
      symbol: symbolById.get(id) ?? "?",
      d: series[series.length - 1].d,
    });
  }

  const news = await db.select().from(newsItems).orderBy(newsItems.publishedAt);
  const fired: (typeof alertEvents.$inferInsert)[] = [];

  for (const a of rows) {
    const q = a.instrumentId ? latest.get(a.instrumentId) : undefined;
    let message: string | null = null;
    let value: number | null = null;
    if (a.kind === "price_below" && q && a.threshold && q.price <= a.threshold) {
      message = `${q.symbol} traded below ${a.threshold.toFixed(2)} — ${a.note}`;
      value = q.price;
    } else if (a.kind === "price_above" && q && a.threshold && q.price >= a.threshold) {
      message = `${q.symbol} crossed above ${a.threshold.toFixed(2)} — ${a.note}`;
      value = q.price;
    } else if (a.kind === "pct_move" && q && a.threshold) {
      const move = q.prev ? q.price / q.prev - 1 : 0;
      if (Math.abs(move) >= a.threshold) {
        message = `${q.symbol} moved ${(move * 100).toFixed(1)}% in a session — ${a.note}`;
        value = move;
      }
    } else if (a.kind === "news_keyword" && a.keyword) {
      const hit = news.find((n) => `${n.headline} ${n.summary}`.toLowerCase().includes(a.keyword!.toLowerCase()));
      if (hit) {
        message = `Keyword "${a.keyword}" matched: ${hit.headline}`;
        value = 0;
      }
    } else if (a.kind === "thesis_review") {
      const overdue = await db.select({ id: theses.id }).from(theses).where(eq(theses.status, "active"));
      value = overdue.length;
      message = `${overdue.length} active theses in the review queue`;
    }
    if (message) fired.push({ alertId: a.id, instrumentId: a.instrumentId ?? null, message, value: value ?? 0 });
  }

  if (fired.length) {
    await db.insert(alertEvents).values(fired);
    await db
      .update(alerts)
      .set({ lastFiredAt: new Date() })
      .where(inArray(alerts.id, fired.map((f) => f.alertId)));
  }
  await db
    .insert(appMeta)
    .values({ key: "last_alert_check", value: new Date().toISOString() })
    .onConflictDoUpdate({ target: appMeta.key, set: { value: new Date().toISOString(), updatedAt: new Date() } });
  touchAll();
  console.log(`[alerts] evaluated ${rows.length} rules, ${fired.length} fired`);
}

export async function toggleNewsFlags(fd: FormData) {
  const id = num(fd, "newsId");
  if (!id) return;
  const [row] = await db.select().from(newsItems).where(eq(newsItems.id, id)).limit(1);
  if (!row) return;
  const field = str(fd, "field");
  if (field === "read") await db.update(newsItems).set({ read: !row.read }).where(eq(newsItems.id, id));
  else await db.update(newsItems).set({ saved: !row.saved }).where(eq(newsItems.id, id));
  revalidatePath("/news");
  revalidatePath(`/news/${id}`);
  revalidatePath("/");
}

export async function linkNewsToInstrument(fd: FormData) {
  const id = num(fd, "newsId");
  const symbol = str(fd, "symbol");
  if (!id || !symbol) return;
  const instrumentId = await instrumentIdFor(symbol);
  if (!instrumentId) return;
  const [existing] = await db
    .select()
    .from(links)
    .where(and(eq(links.fromKind, "news"), eq(links.fromId, id), eq(links.toKind, "instrument"), eq(links.toId, instrumentId)))
    .limit(1);
  if (!existing) {
    await db.insert(links).values({ fromKind: "news", fromId: id, toKind: "instrument", toId: instrumentId, relation: "mentions", weight: 5 });
  }
  revalidatePath(`/news/${id}`);
  revalidatePath("/news");
}

export async function saveScreen(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  await db.insert(screens).values({ name, criteria: str(fd, "criteria") || "{}" });
  revalidatePath("/markets/screener");
}

export async function rerunEnrichment() {
  const count = await rebuildNewsLinks();
  await db
    .insert(appMeta)
    .values({ key: "news_link_count", value: String(count) })
    .onConflictDoUpdate({ target: appMeta.key, set: { value: String(count), updatedAt: new Date() } });
  await db
    .insert(appMeta)
    .values({ key: "last_enrichment_at", value: new Date().toISOString() })
    .onConflictDoUpdate({ target: appMeta.key, set: { value: new Date().toISOString(), updatedAt: new Date() } });
  touchAll();
}

/** Re-generates synthetic bars for the whole universe (stand-in for a vendor refresh). */
export async function refreshMarketData() {
  const universe = await db.select().from(instruments);
  const specBySymbol = new Map(INSTRUMENTS.map((i) => [i.symbol, i]));
  for (const inst of universe) {
    const spec = specBySymbol.get(inst.symbol);
    if (!spec) continue;
    const drift = spec.drift + (Math.random() - 0.5) * 0.0004;
    const bars = generateBars(
      {
        symbol: `${spec.symbol}-${Date.now()}`,
        start: spec.price,
        vol: spec.vol,
        drift,
        shock: spec.shock,
        decimals: spec.decimals ?? 2,
        baseVolume: spec.baseVolume,
      },
      300,
    );
    await db.delete(priceBars).where(eq(priceBars.instrumentId, inst.id));
    for (let i = 0; i < bars.length; i += 500) {
      await db.insert(priceBars).values(
        bars.slice(i, i + 500).map((b) => ({
          instrumentId: inst.id,
          d: b.d,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume,
        })),
      );
    }
  }
  await db
    .insert(appMeta)
    .values({ key: "last_ingest_at", value: new Date().toISOString() })
    .onConflictDoUpdate({ target: appMeta.key, set: { value: new Date().toISOString(), updatedAt: new Date() } });
  touchAll();
}

export async function resetWorkspace() {
  await db.delete(appMeta).where(eq(appMeta.key, "seed_state"));
  await db.insert(appMeta).values({ key: "seed_state", value: `ready:${SEED_VERSION}-stale` }).onConflictDoUpdate({ target: appMeta.key, set: { value: "stale" } });
  await ensureSeeded();
  touchAll();
}

export async function addCatalyst(fd: FormData) {
  const title = str(fd, "title");
  const eventDate = str(fd, "eventDate");
  if (!title || !eventDate) return;
  const symbol = str(fd, "symbol");
  await db.insert(catalysts).values({
    instrumentId: symbol ? await instrumentIdFor(symbol) : null,
    kind: str(fd, "kind") || "earnings",
    title,
    eventDate,
    note: str(fd, "note"),
    importance: num(fd, "importance") ?? 2,
  });
  revalidatePath("/markets/calendar");
  revalidatePath("/");
}

export async function addAccount(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  await db.insert(accounts).values({ name, broker: str(fd, "broker") || "Manual", kind: str(fd, "kind") || "taxable", cash: num(fd, "cash") ?? 0 });
  revalidatePath("/settings");
  revalidatePath("/portfolio");
}
