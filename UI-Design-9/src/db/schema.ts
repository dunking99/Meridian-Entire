import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * ARCHITECTURE NOTE
 * -----------------
 * `instruments` is the spine of the whole app. Every other domain
 * (portfolio, news, research, alerts, watchlists) links to it, which is
 * what makes cross-domain enrichment ("does this news story touch my
 * holdings?") a simple join instead of a separate subsystem.
 *
 * Positions are NOT stored; they are derived from `transactions`.
 */

// ---------- Reference layer ----------
export const instruments = pgTable(
  "instruments",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    assetClass: text("asset_class").notNull(), // equity | etf | crypto | bond | commodity | cash | index
    sector: text("sector"),
    exchange: text("exchange"),
    currency: text("currency").notNull().default("USD"),
    lastPrice: numeric("last_price", { precision: 18, scale: 6 }).notNull().default("0"),
    prevClose: numeric("prev_close", { precision: 18, scale: 6 }).notNull().default("0"),
    priceUpdatedAt: timestamp("price_updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("instruments_symbol_idx").on(t.symbol)],
);

export const priceHistory = pgTable(
  "price_history",
  {
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    close: numeric("close", { precision: 18, scale: 6 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.instrumentId, t.day] })],
);

// ---------- Portfolio domain ----------
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    portfolioId: integer("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    instrumentId: integer("instrument_id").references(() => instruments.id, { onDelete: "set null" }),
    type: text("type").notNull(), // buy | sell | dividend | deposit | withdrawal | fee
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("0"),
    price: numeric("price", { precision: 18, scale: 6 }).notNull().default("0"),
    fees: numeric("fees", { precision: 18, scale: 6 }).notNull().default("0"),
    tradedAt: timestamp("traded_at", { withTimezone: true }).notNull(),
    note: text("note"),
  },
  (t) => [index("transactions_portfolio_idx").on(t.portfolioId), index("transactions_instrument_idx").on(t.instrumentId)],
);

// ---------- Watchlists ----------
export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    watchlistId: integer("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
    note: text("note"),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.watchlistId, t.instrumentId] })],
);

// ---------- News domain ----------
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  url: text("url"),
  summary: text("summary").notNull(),
  sentiment: text("sentiment").notNull().default("neutral"), // positive | negative | neutral
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  saved: boolean("saved").notNull().default(false),
});

export const newsArticleInstruments = pgTable(
  "news_article_instruments",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.instrumentId] })],
);

// ---------- Research domain ----------
export const researchNotes = pgTable("research_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("memo"), // thesis | memo | earnings | journal
  stance: text("stance").notNull().default("neutral"), // bullish | bearish | neutral
  status: text("status").notNull().default("open"), // open | closed
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const researchNoteInstruments = pgTable(
  "research_note_instruments",
  {
    noteId: integer("note_id")
      .notNull()
      .references(() => researchNotes.id, { onDelete: "cascade" }),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instruments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.instrumentId] })],
);

// ---------- Alerts ----------
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instruments.id, { onDelete: "cascade" }),
  condition: text("condition").notNull(), // price_above | price_below | pct_move
  threshold: numeric("threshold", { precision: 18, scale: 6 }).notNull(),
  note: text("note"),
  active: boolean("active").notNull().default(true),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Instrument = typeof instruments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type ResearchNote = typeof researchNotes.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Watchlist = typeof watchlists.$inferSelect;
