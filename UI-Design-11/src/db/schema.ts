import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Meridian — single-user financial dashboard.
 * Every table accumulates over time; nothing resets per session.
 */

/** The universe of tradable / trackable things: stocks, ETFs, indices, FX, commodities. */
export const instruments = pgTable(
  "instruments",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(), // Meridian symbol, e.g. "VWRA.L"
    yahooSymbol: text("yahoo_symbol").notNull(), // Yahoo ticker, e.g. "VWRA.L"
    name: text("name").notNull(),
    assetClass: text("asset_class").notNull(), // equity | etf | bond | commodity | fx | index | crypto | cash
    sector: text("sector"), // for equities/ETFs
    region: text("region"), // US | EU | UK | JP | EM | GLOBAL
    currency: text("currency").notNull().default("USD"),
    exchange: text("exchange"),
    /** Bookmark grouping for the Markets page rail. */
    board: text("board"), // indices | commodities | fx | sectors | macro
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("instruments_symbol_uq").on(t.symbol)],
);

/** Daily OHLCV history — the app's long-lived price archive. */
export const prices = pgTable(
  "prices",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    day: date("day").notNull(),
    open: doublePrecision("open"),
    high: doublePrecision("high"),
    low: doublePrecision("low"),
    close: doublePrecision("close").notNull(),
    volume: doublePrecision("volume"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("prices_symbol_day_uq").on(t.symbol, t.day), index("prices_day_idx").on(t.day)],
);

/** The ledger. Holdings are derived from this — never stored redundantly. */
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    day: date("day").notNull(),
    symbol: text("symbol").notNull(), // "CASH" for cash movements
    kind: text("kind").notNull(), // buy | sell | dividend | fee | deposit | withdrawal
    quantity: doublePrecision("quantity").notNull().default(0),
    price: doublePrecision("price").notNull().default(0),
    fee: doublePrecision("fee").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("txn_symbol_idx").on(t.symbol), index("txn_day_idx").on(t.day)],
);

/** End-of-day net-worth record, written by the snapshot job. */
export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: serial("id").primaryKey(),
    day: date("day").notNull(),
    marketValue: doublePrecision("market_value").notNull(),
    cash: doublePrecision("cash").notNull(),
    totalValue: doublePrecision("total_value").notNull(),
    invested: doublePrecision("invested").notNull(),
    dayChangePct: doublePrecision("day_change_pct"),
    benchmarkValue: doublePrecision("benchmark_value"), // SPY-equivalent indexed
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("snap_day_uq").on(t.day)],
);

/** Watchlist with optional alert thresholds. */
export const watchlist = pgTable(
  "watchlist",
  {
    id: serial("id").primaryKey(),
    symbol: text("symbol").notNull(),
    note: text("note"),
    targetHigh: doublePrecision("target_high"),
    targetLow: doublePrecision("target_low"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlist_symbol_uq").on(t.symbol)],
);

/** Key/value app configuration: base currency, target allocation, risk-free rate... */
export const settings = pgTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/** Data-pipeline audit trail. */
export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().default("running"), // running | ok | partial | error
  source: text("source").notNull().default("yahoo"),
  symbolsRequested: integer("symbols_requested").notNull().default(0),
  symbolsUpdated: integer("symbols_updated").notNull().default(0),
  rowsWritten: integer("rows_written").notNull().default(0),
  message: text("message"),
});

/** Saved scenario runs from the Strategy Lab. */
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  payload: jsonb("payload").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Instrument = typeof instruments.$inferSelect;
export type PriceRow = typeof prices.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type WatchRow = typeof watchlist.$inferSelect;
