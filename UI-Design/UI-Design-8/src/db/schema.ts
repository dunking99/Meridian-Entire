import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: text("id").primaryKey(),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  type: text("type").notNull(),
  qty: numeric("qty").notNull(),
  avgCost: numeric("avg_cost").notNull(),
  avgCcy: text("avg_ccy").notNull(),
  price: numeric("price").notNull(),
  priceCcy: text("price_ccy").notNull(),
  valueGbp: integer("value_gbp").notNull(),
  costGbp: integer("cost_gbp").notNull(),
  gainGbp: integer("gain_gbp").notNull(),
  gainPct: numeric("gain_pct").notNull(),
  dayPct: numeric("day_pct").notNull(),
  dayGbp: integer("day_gbp").notNull(),
  weight: numeric("weight").notNull(),
  color: text("color").notNull(),
  sector: text("sector").notNull(),
  region: text("region").notNull(),
  note: text("note"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const portfolioMeta = pgTable("portfolio_meta", {
  id: text("id").primaryKey(),
  cash: integer("cash").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
