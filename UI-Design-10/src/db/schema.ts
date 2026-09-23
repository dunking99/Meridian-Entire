import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Domain 1 — Market universe.
 * Every other domain points back at these rows. Instruments are the spine.
 */
export const instruments = pgTable(
  "instruments",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    assetClass: text("asset_class").notNull(), // equity | etf | crypto | fx | commodity | bond | index
    exchange: text("exchange").notNull().default("NASDAQ"),
    sector: text("sector"),
    industry: text("industry"),
    country: text("country").notNull().default("US"),
    currency: text("currency").notNull().default("USD"),
    themes: text("themes").notNull().default(""), // comma separated
    aliases: text("aliases").notNull().default(""), // comma separated, used by the link engine
    marketCap: doublePrecision("market_cap"),
    description: text("description"),
  },
  (t) => [uniqueIndex("instruments_symbol_idx").on(t.symbol)],
);

export const priceBars = pgTable(
  "price_bars",
  {
    id: serial("id").primaryKey(),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    d: date("d", { mode: "string" }).notNull(),
    open: doublePrecision("open").notNull(),
    high: doublePrecision("high").notNull(),
    low: doublePrecision("low").notNull(),
    close: doublePrecision("close").notNull(),
    volume: integer("volume").notNull().default(0),
  },
  (t) => [uniqueIndex("price_bars_instrument_day_idx").on(t.instrumentId, t.d)],
);

/**
 * Domain 2 — Portfolio: accounts, positions, trades.
 */
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  broker: text("broker").notNull().default("Manual"),
  kind: text("kind").notNull().default("taxable"), // taxable | ira | roth | crypto | taxable-intl
  cash: doublePrecision("cash").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const positions = pgTable(
  "positions",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    quantity: doublePrecision("quantity").notNull(),
    avgCost: doublePrecision("avg_cost").notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("positions_account_instrument_idx").on(t.accountId, t.instrumentId)],
);

export const trades = pgTable(
  "trades",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    side: text("side").notNull(), // buy | sell
    quantity: doublePrecision("quantity").notNull(),
    price: doublePrecision("price").notNull(),
    fees: doublePrecision("fees").notNull().default(0),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
    thesisId: integer("thesis_id"),
    rationale: text("rationale"),
    tags: text("tags").notNull().default(""),
  },
  (t) => [index("trades_instrument_idx").on(t.instrumentId)],
);

/**
 * Domain 3 — Research: theses, notes, journal, screens.
 */
export const theses = pgTable(
  "theses",
  {
    id: serial("id").primaryKey(),
    instrumentId: integer("instrument_id").references(() => instruments.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    stance: text("stance").notNull().default("long"), // long | short | avoid | macro
    conviction: integer("conviction").notNull().default(3), // 1..5
    status: text("status").notNull().default("active"), // idea | active | trimmed | closed | invalidated
    horizon: text("horizon").notNull().default("12m"),
    targetPrice: doublePrecision("target_price"),
    invalidation: text("invalidation"),
    body: text("body").notNull().default(""),
    tags: text("tags").notNull().default(""),
    reviewAt: timestamp("review_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("theses_instrument_idx").on(t.instrumentId)],
);

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    instrumentId: integer("instrument_id").references(() => instruments.id, { onDelete: "set null" }),
    kind: text("kind").notNull().default("memo"), // memo | earnings | model | source | screen | call
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    sourceUrl: text("source_url"),
    tags: text("tags").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_instrument_idx").on(t.instrumentId)],
);

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull().default("decision"), // decision | review | observation | mistake
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  decision: text("decision"), // buy | sell | hold | trim | pass | size-up | size-down
  instrumentId: integer("instrument_id").references(() => instruments.id, { onDelete: "set null" }),
  thesisId: integer("thesis_id").references(() => theses.id, { onDelete: "set null" }),
  tradeId: integer("trade_id"),
  decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  reviewAt: timestamp("review_at", { withTimezone: true }),
  outcome: text("outcome"),
});

export const screens = pgTable("screens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  criteria: text("criteria").notNull().default("{}"), // JSON of the filter set
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
});

/**
 * Domain 4 — News / filings / macro tape.
 */
export const newsItems = pgTable(
  "news_items",
  {
    id: serial("id").primaryKey(),
    headline: text("headline").notNull(),
    source: text("source").notNull().default("Wire"),
    url: text("url"),
    kind: text("kind").notNull().default("news"), // news | filing | macro | transcript | rumor
    summary: text("summary").notNull().default(""),
    sentiment: doublePrecision("sentiment").notNull().default(0), // -1..1
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    saved: boolean("saved").notNull().default(false),
    read: boolean("read").notNull().default(false),
  },
  (t) => [index("news_published_idx").on(t.publishedAt)],
);

/**
 * Domain 6 — Watchlists, alerts, catalysts.
 */
export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: serial("id").primaryKey(),
    listName: text("list_name").notNull().default("Radar"),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull().default(0),
    note: text("note").notNull().default(""),
    triggerPrice: doublePrecision("trigger_price"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlist_unique_idx").on(t.listName, t.instrumentId)],
);

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // price_below | price_above | pct_move | news_keyword | thesis_review | earnings
  instrumentId: integer("instrument_id").references(() => instruments.id, { onDelete: "cascade" }),
  keyword: text("keyword"),
  threshold: doublePrecision("threshold"),
  note: text("note").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastFiredAt: timestamp("last_fired_at", { withTimezone: true }),
});

export const alertEvents = pgTable("alert_events", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id")
    .notNull()
    .references(() => alerts.id, { onDelete: "cascade" }),
  instrumentId: integer("instrument_id").references(() => instruments.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  value: doublePrecision("value"),
  firedAt: timestamp("fired_at", { withTimezone: true }).notNull().defaultNow(),
});

export const catalysts = pgTable("catalysts", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id").references(() => instruments.id, { onDelete: "set null" }),
  kind: text("kind").notNull().default("earnings"), // earnings | macro | investor-day | ex-div | lockup | conference
  title: text("title").notNull(),
  eventDate: date("event_date", { mode: "string" }).notNull(),
  note: text("note").notNull().default(""),
  importance: integer("importance").notNull().default(2), // 1..3
});

export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: serial("id").primaryKey(),
    d: date("d", { mode: "string" }).notNull(),
    marketValue: doublePrecision("market_value").notNull(),
    cash: doublePrecision("cash").notNull(),
    totalValue: doublePrecision("total_value").notNull(),
    benchmark: doublePrecision("benchmark").notNull().default(0),
  },
  (t) => [uniqueIndex("snapshots_day_idx").on(t.d)],
);

/**
 * Domain 5 — The glue: a generic typed edge table.
 * Any entity (instrument, news, note, thesis, trade, journal, catalyst) can link to any other.
 * This is what makes "news × portfolio" and "research × exposure" possible without new tables.
 */
export const links = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),
    fromKind: text("from_kind").notNull(), // instrument | news | note | thesis | trade | journal | catalyst | screen
    fromId: integer("from_id").notNull(),
    toKind: text("to_kind").notNull(),
    toId: integer("to_id").notNull(),
    relation: text("relation").notNull().default("mentions"), // mentions | impacts | supports | contradicts | cites | hedges | related
    weight: doublePrecision("weight").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("links_from_idx").on(t.fromKind, t.fromId),
    index("links_to_idx").on(t.toKind, t.toId),
  ],
);

/** Single-user app settings + run metadata (last ingest, enrichment version, base currency). */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Instrument = typeof instruments.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Thesis = typeof theses.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewsItem = typeof newsItems.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type AlertEvent = typeof alertEvents.$inferSelect;
export type Catalyst = typeof catalysts.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Screen = typeof screens.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type PriceBar = typeof priceBars.$inferSelect;
