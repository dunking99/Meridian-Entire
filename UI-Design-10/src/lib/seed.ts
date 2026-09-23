import { sql } from "drizzle-orm";
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
  portfolioSnapshots,
  positions,
  priceBars,
  screens,
  theses,
  trades,
  watchlistItems,
} from "@/db/schema";
import { generateBars, round, tradingDaysBack } from "./market-sim";
import {
  ACCOUNTS,
  ALERTS,
  ALERT_EVENTS,
  CATALYSTS,
  INSTRUMENTS,
  JOURNAL,
  NEWS,
  NOTES,
  POSITIONS,
  THESES,
  TRADES,
  WATCHLISTS,
} from "./seed-data";
import { rebuildNewsLinks } from "./enrich";

const SEED_KEY = "seed_state";
export const SEED_VERSION = "2026-02-v1";

function daysAgoDate(days: number, hourOffset = 9) {
  const d = new Date(Date.now() - days * 86_400_000);
  d.setHours(hourOffset, 15, 0, 0);
  return d;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000);
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function insertBars(rows: (typeof priceBars.$inferInsert)[]) {
  for (const c of chunk(rows, 1000)) {
    await db.insert(priceBars).values(c);
  }
}

async function runSeed() {
  const instrumentRows = await db
    .insert(instruments)
    .values(
      INSTRUMENTS.map((i) => ({
        symbol: i.symbol,
        name: i.name,
        assetClass: i.assetClass,
        exchange: i.exchange ?? "NASDAQ",
        sector: i.sector ?? "Other",
        industry: i.industry ?? "Other",
        country: i.country ?? "US",
        themes: i.themes ?? "",
        aliases: i.aliases ?? "",
        marketCap: i.marketCap ?? null,
        description: i.description ?? null,
      })),
    )
    .returning({ id: instruments.id, symbol: instruments.symbol });

  const idBySymbol = new Map(instrumentRows.map((r) => [r.symbol, r.id]));

  // --- price history + in-memory close series for snapshot math ---
  const allBars: (typeof priceBars.$inferInsert)[] = [];
  const closesBySymbol = new Map<string, number[]>();
  for (const spec of INSTRUMENTS) {
    const id = idBySymbol.get(spec.symbol)!;
    const bars = generateBars(
      {
        symbol: spec.symbol,
        start: spec.price,
        vol: spec.vol,
        drift: spec.drift,
        shock: spec.shock,
        decimals: spec.decimals ?? 2,
        baseVolume: spec.baseVolume,
      },
      300,
    );
    for (const b of bars) {
      allBars.push({ instrumentId: id, d: b.d, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume });
    }
    closesBySymbol.set(spec.symbol, bars.map((b) => b.close));
  }
  await insertBars(allBars);

  // --- accounts / positions ---
  const accountRows = await db.insert(accounts).values(ACCOUNTS).returning({ id: accounts.id });
  await db.insert(positions).values(
    POSITIONS.map((p) => ({
      accountId: accountRows[p.account].id,
      instrumentId: idBySymbol.get(p.symbol)!,
      quantity: p.quantity,
      avgCost: p.avgCost,
      openedAt: daysAgoDate(120),
    })),
  );

  // --- theses ---
  const thesisRows = await db
    .insert(theses)
    .values(
      THESES.map((t) => ({
        instrumentId: t.symbol ? idBySymbol.get(t.symbol) ?? null : null,
        title: t.title,
        stance: t.stance,
        conviction: t.conviction,
        status: t.status,
        horizon: t.horizon,
        targetPrice: t.targetPrice,
        invalidation: t.invalidation,
        body: t.body,
        tags: t.tags,
        reviewAt: t.reviewInDays ? daysAgoDate(-t.reviewInDays, 12) : null,
        createdAt: daysAgoDate(t.daysAgo),
        updatedAt: daysAgoDate(Math.max(0, t.daysAgo - 5)),
      })),
    )
    .returning({ id: theses.id });
  const thesisIdByKey = new Map(THESES.map((t, i) => [t.key, thesisRows[i].id]));

  // --- trades ---
  await db.insert(trades).values(
    TRADES.map((t) => ({
      accountId: accountRows[t.account].id,
      instrumentId: idBySymbol.get(t.symbol)!,
      side: t.side,
      quantity: t.quantity,
      price: t.price,
      fees: round(t.quantity * t.price * 0.0002, 2),
      executedAt: daysAgoDate(t.daysAgo, 10),
      thesisId: t.thesis ? thesisIdByKey.get(t.thesis) ?? null : null,
      rationale: t.rationale,
      tags: t.tags,
    })),
  );

  // --- notes ---
  const noteRows = await db
    .insert(notes)
    .values(
      NOTES.map((n) => ({
        instrumentId: n.symbol ? idBySymbol.get(n.symbol) ?? null : null,
        kind: n.kind,
        title: n.title,
        body: n.body,
        sourceUrl: n.sourceUrl ?? null,
        tags: n.tags,
        createdAt: daysAgoDate(n.daysAgo, 14),
      })),
    )
    .returning({ id: notes.id });

  // --- news ---
  const newsRows = await db
    .insert(newsItems)
    .values(
      NEWS.map((n, i) => ({
        headline: n.headline,
        source: n.source,
        url: n.url ?? null,
        kind: n.kind,
        summary: n.summary,
        sentiment: n.sentiment,
        publishedAt: hoursAgo(n.hoursAgo),
        saved: i === 0 || i === 3,
        read: n.hoursAgo > 48,
      })),
    )
    .returning({ id: newsItems.id });

  // --- catalysts ---
  const days = tradingDaysBack(30);
  const futureTradingDay = (ahead: number) => {
    const cursor = new Date();
    let count = 0;
    while (count < ahead) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      const dow = cursor.getUTCDay();
      if (dow !== 0 && dow !== 6) count += 1;
    }
    return cursor.toISOString().slice(0, 10);
  };
  await db.insert(catalysts).values(
    CATALYSTS.map((c) => ({
      instrumentId: c.symbol ? idBySymbol.get(c.symbol) ?? null : null,
      kind: c.kind,
      title: c.title,
      eventDate: futureTradingDay(c.daysAhead),
      note: c.note,
      importance: c.importance,
    })),
  );

  // --- watchlists ---
  const watchRows: (typeof watchlistItems.$inferInsert)[] = [];
  for (const list of WATCHLISTS) {
    for (const item of list.items) {
      const id = idBySymbol.get(item.symbol);
      if (!id) continue;
      watchRows.push({
        listName: list.listName,
        instrumentId: id,
        rank: item.rank,
        note: item.note,
        triggerPrice: item.triggerPrice ?? null,
        addedAt: daysAgoDate(30 + item.rank * 2),
      });
    }
  }
  await db.insert(watchlistItems).values(watchRows);

  // --- alerts + fired events ---
  const alertRows = await db
    .insert(alerts)
    .values(
      ALERTS.map((a) => ({
        kind: a.kind,
        instrumentId: a.symbol ? idBySymbol.get(a.symbol) ?? null : null,
        keyword: a.keyword ?? null,
        threshold: a.threshold,
        note: a.note,
        active: a.active,
        createdAt: daysAgoDate(40),
      })),
    )
    .returning({ id: alerts.id });

  await db.insert(alertEvents).values(
    ALERT_EVENTS.map((e) => ({
      alertId: alertRows[e.alertIdx].id,
      instrumentId: idBySymbol.get(e.symbol) ?? null,
      message: e.message,
      value: e.value,
      firedAt: hoursAgo(e.hoursAgo),
    })),
  );

  // --- journal ---
  await db.insert(journalEntries).values(
    JOURNAL.map((j) => ({
      kind: j.kind,
      title: j.title,
      body: j.body,
      decision: j.decision,
      instrumentId: j.symbol ? idBySymbol.get(j.symbol) ?? null : null,
      thesisId: j.thesis ? thesisIdByKey.get(j.thesis) ?? null : null,
      decidedAt: daysAgoDate(j.daysAgo, 16),
      reviewAt: j.reviewInDays ? daysAgoDate(-j.reviewInDays, 12) : null,
      outcome: j.outcome ?? null,
    })),
  );

  // --- saved screens ---
  await db.insert(screens).values([
    { name: "AI-infra cluster at discount", criteria: JSON.stringify({ theme: "ai-infra", sort: "r3m", dir: "asc" }) },
    { name: "Compounder watch", criteria: JSON.stringify({ sector: "Financials", sort: "marketCap", dir: "desc" }) },
  ]);

  // --- NAV snapshot history, built from the generated closes so the chart ties out ---
  const navSeries: (typeof portfolioSnapshots.$inferInsert)[] = [];
  const depths = Math.min(180, days.length);
  const seriesStart = days.length - depths;
  const spyCloses = closesBySymbol.get("SPY")!;
  let startValue: number | null = null;
  for (let i = seriesStart; i < days.length; i++) {
    let mv = 0;
    for (const p of POSITIONS) {
      mv += p.quantity * (closesBySymbol.get(p.symbol)?.[i] ?? 0);
    }
    const cash = ACCOUNTS.reduce((a, x) => a + x.cash, 0);
    const total = mv + cash;
    if (startValue === null) startValue = total;
    const spyRatio = spyCloses[i] / spyCloses[seriesStart];
    navSeries.push({
      d: days[i],
      marketValue: round(mv, 2),
      cash: round(cash, 2),
      totalValue: round(total, 2),
      benchmark: round((startValue ?? total) * spyRatio * 0.985, 2),
    });
  }
  await db.insert(portfolioSnapshots).values(navSeries);

  // --- explicit research edges, then auto-derived news edges ---
  const explicit: (typeof links.$inferInsert)[] = [];
  NOTES.forEach((n, i) => {
    const noteId = noteRows[i].id;
    if (n.symbol) {
      const instId = idBySymbol.get(n.symbol);
      if (instId) explicit.push({ fromKind: "note", fromId: noteId, toKind: "instrument", toId: instId, relation: "cites", weight: 2 });
    }
    for (const key of n.tags.split(",")) {
      const t = THESES.find((x) => x.tags.split(",").includes(key.trim()));
      const thesisId = t ? thesisIdByKey.get(t.key) : null;
      if (thesisId) {
        explicit.push({ fromKind: "note", fromId: noteId, toKind: "thesis", toId: thesisId, relation: "supports", weight: 2 });
      }
    }
  });
  THESES.forEach((t) => {
    if (!t.symbol) return;
    const instId = idBySymbol.get(t.symbol);
    if (instId) {
      explicit.push({ fromKind: "thesis", fromId: thesisIdByKey.get(t.key)!, toKind: "instrument", toId: instId, relation: "impacts", weight: 3 });
    }
  });
  if (explicit.length) await db.insert(links).values(explicit);
  await rebuildNewsLinks();

  await db
    .insert(appMeta)
    .values([
      { key: SEED_KEY, value: `ready:${SEED_VERSION}` },
      { key: "last_ingest_at", value: new Date().toISOString() },
      { key: "base_currency", value: "USD" },
      { key: "owner", value: "Single-user book" },
      { key: "news_link_count", value: "0" },
    ])
    .onConflictDoUpdate({ target: appMeta.key, set: { value: `ready:${SEED_VERSION}`, updatedAt: new Date() } });

  return { instruments: instrumentRows.length, bars: allBars.length, news: newsRows.length };
}

let inflight: Promise<boolean> | null = null;

/**
 * Idempotent, concurrency-safe bootstrap. Called from the root layout so the
 * app self-heals on a fresh database (no manual seed step required).
 */
export async function ensureSeeded(): Promise<boolean> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const existing = await db.select().from(appMeta).where(sql`${appMeta.key} = ${SEED_KEY}`).limit(1);
      const state = existing[0]?.value ?? "";
      if (state === `ready:${SEED_VERSION}`) return true;

      if (state.startsWith("seeding")) {
        const startedAt = Number(state.split(":")[1] ?? 0);
        if (Date.now() - startedAt < 120_000) {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 500));
            const again = await db.select().from(appMeta).where(sql`${appMeta.key} = ${SEED_KEY}`).limit(1);
            if ((again[0]?.value ?? "").startsWith("ready")) return true;
          }
          return false;
        }
      }

      await db
        .insert(appMeta)
        .values({ key: SEED_KEY, value: `seeding:${Date.now()}` })
        .onConflictDoUpdate({ target: appMeta.key, set: { value: `seeding:${Date.now()}`, updatedAt: new Date() } });

      if (state) {
        // a different (older) version is present — wipe and rebuild
        await db.execute(sql`
          truncate table ${links}, ${alertEvents}, ${alerts}, ${journalEntries}, ${notes}, ${theses},
          ${catalysts}, ${watchlistItems}, ${newsItems}, ${screens}, ${portfolioSnapshots}, ${trades},
          ${positions}, ${accounts}, ${priceBars}, ${instruments} restart identity cascade
        `);
      }

      const summary = await runSeed();
      console.log("[seed] bootstrapped", summary);
      return true;
    } catch (error) {
      console.error("[seed] failed", error);
      inflight = null;
      return false;
    }
  })();
  return inflight;
}

export async function reseed() {
  await db
    .insert(appMeta)
    .values({ key: SEED_KEY, value: "stale" })
    .onConflictDoUpdate({ target: appMeta.key, set: { value: "stale", updatedAt: new Date() } });
  inflight = null;
  return ensureSeeded();
}
