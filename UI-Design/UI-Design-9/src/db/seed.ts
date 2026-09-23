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
} from "@/db/schema";
import { count, sql } from "drizzle-orm";

const INSTRUMENTS = [
  { symbol: "AAPL", name: "Apple Inc.", assetClass: "equity", sector: "Technology", exchange: "NASDAQ", price: 228.4, prev: 225.1 },
  { symbol: "MSFT", name: "Microsoft Corp.", assetClass: "equity", sector: "Technology", exchange: "NASDAQ", price: 431.2, prev: 434.9 },
  { symbol: "NVDA", name: "NVIDIA Corp.", assetClass: "equity", sector: "Semiconductors", exchange: "NASDAQ", price: 138.7, prev: 132.5 },
  { symbol: "AMZN", name: "Amazon.com Inc.", assetClass: "equity", sector: "Consumer Discretionary", exchange: "NASDAQ", price: 201.3, prev: 203.8 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", assetClass: "equity", sector: "Financials", exchange: "NYSE", price: 246.9, prev: 244.2 },
  { symbol: "XOM", name: "Exxon Mobil Corp.", assetClass: "equity", sector: "Energy", exchange: "NYSE", price: 112.6, prev: 114.1 },
  { symbol: "ASML", name: "ASML Holding", assetClass: "equity", sector: "Semiconductors", exchange: "NASDAQ", price: 712.4, prev: 698.0 },
  { symbol: "UNH", name: "UnitedHealth Group", assetClass: "equity", sector: "Healthcare", exchange: "NYSE", price: 512.8, prev: 520.3 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", assetClass: "etf", sector: "Broad Market", exchange: "NYSE", price: 292.1, prev: 290.4 },
  { symbol: "VXUS", name: "Vanguard Total Intl Stock ETF", assetClass: "etf", sector: "International", exchange: "NASDAQ", price: 64.3, prev: 64.0 },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", assetClass: "bond", sector: "Fixed Income", exchange: "NASDAQ", price: 73.1, prev: 73.3 },
  { symbol: "GLD", name: "SPDR Gold Shares", assetClass: "commodity", sector: "Precious Metals", exchange: "NYSE", price: 242.7, prev: 240.1 },
  { symbol: "BTC", name: "Bitcoin", assetClass: "crypto", sector: "Crypto", exchange: "Spot", price: 97250, prev: 94800 },
  { symbol: "ETH", name: "Ethereum", assetClass: "crypto", sector: "Crypto", exchange: "Spot", price: 3420, prev: 3510 },
  { symbol: "TSLA", name: "Tesla Inc.", assetClass: "equity", sector: "Consumer Discretionary", exchange: "NASDAQ", price: 342.1, prev: 351.7 },
  { symbol: "COST", name: "Costco Wholesale", assetClass: "equity", sector: "Consumer Staples", exchange: "NASDAQ", price: 968.2, prev: 961.4 },
  { symbol: "SPX", name: "S&P 500", assetClass: "index", sector: "Index", exchange: "Index", price: 5982.3, prev: 5951.1 },
  { symbol: "NDX", name: "Nasdaq 100", assetClass: "index", sector: "Index", exchange: "Index", price: 21340.6, prev: 21180.2 },
  { symbol: "DJI", name: "Dow Jones Industrial", assetClass: "index", sector: "Index", exchange: "Index", price: 43870.4, prev: 43910.7 },
  { symbol: "VIX", name: "CBOE Volatility Index", assetClass: "index", sector: "Index", exchange: "Index", price: 14.8, prev: 15.6 },
  { symbol: "US10Y", name: "US 10Y Treasury Yield", assetClass: "index", sector: "Rates", exchange: "Index", price: 4.31, prev: 4.36 },
  { symbol: "USOIL", name: "WTI Crude Oil", assetClass: "commodity", sector: "Energy", exchange: "Spot", price: 71.4, prev: 72.9 },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

const g = globalThis as typeof globalThis & { __ledgerSeedPromise?: Promise<void>; __ledgerSeeded?: boolean };

/** Race-safe: in-process memo + Postgres advisory lock so parallel cold requests seed exactly once. */
export async function seedIfEmpty() {
  if (g.__ledgerSeeded) return;
  if (!g.__ledgerSeedPromise) {
    g.__ledgerSeedPromise = db
      .transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(727271)`);
        const [{ value }] = await tx.select({ value: count() }).from(instruments);
        if (value === 0) await runSeed(tx);
      })
      .then(() => {
        g.__ledgerSeeded = true;
      })
      .catch((e) => {
        g.__ledgerSeedPromise = undefined;
        throw e;
      });
  }
  return g.__ledgerSeedPromise;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runSeed(db: Tx) {
  const inserted = await db
    .insert(instruments)
    .values(
      INSTRUMENTS.map((i) => ({
        symbol: i.symbol,
        name: i.name,
        assetClass: i.assetClass,
        sector: i.sector,
        exchange: i.exchange,
        lastPrice: String(i.price),
        prevClose: String(i.prev),
      })),
    )
    .returning({ id: instruments.id, symbol: instruments.symbol });
  const idOf = Object.fromEntries(inserted.map((r) => [r.symbol, r.id])) as Record<string, number>;

  // 90 days of deterministic pseudo-random history ending at today's price
  const history: { instrumentId: number; day: string; close: string }[] = [];
  INSTRUMENTS.forEach((inst, idx) => {
    let p = inst.price;
    const series: number[] = [];
    let seed = idx * 7919 + 17;
    for (let d = 0; d < 90; d++) {
      series.push(p);
      seed = (seed * 9301 + 49297) % 233280;
      const r = seed / 233280 - 0.5;
      p = p / (1 + r * 0.035);
    }
    series.reverse();
    series.forEach((close, i) => {
      history.push({ instrumentId: idOf[inst.symbol], day: isoDay(daysAgo(89 - i)), close: close.toFixed(4) });
    });
  });
  await db.insert(priceHistory).values(history);

  const [core] = await db.insert(portfolios).values({ name: "Core Portfolio", baseCurrency: "USD" }).returning();

  const tx = (
    type: string,
    symbol: string | null,
    quantity: number,
    price: number,
    days: number,
    note?: string,
  ) => ({
    portfolioId: core.id,
    instrumentId: symbol ? idOf[symbol] : null,
    type,
    quantity: String(quantity),
    price: String(price),
    fees: "0",
    tradedAt: daysAgo(days),
    note,
  });

  await db.insert(transactions).values([
    tx("deposit", null, 1, 150000, 400, "Initial funding"),
    tx("buy", "VTI", 120, 241.5, 390, "Core index position"),
    tx("buy", "VXUS", 300, 57.2, 390),
    tx("buy", "BND", 200, 71.9, 388),
    tx("buy", "AAPL", 60, 182.3, 360),
    tx("buy", "MSFT", 40, 371.8, 350),
    tx("buy", "NVDA", 80, 48.6, 340, "Pre-split adjusted"),
    tx("buy", "AMZN", 50, 151.2, 300),
    tx("buy", "JPM", 45, 172.4, 280),
    tx("buy", "XOM", 70, 104.9, 260),
    tx("buy", "GLD", 40, 191.3, 240),
    tx("buy", "BTC", 0.45, 43200, 230, "Long-term allocation"),
    tx("dividend", "AAPL", 1, 15.0, 200),
    tx("dividend", "VTI", 1, 108.4, 190),
    tx("sell", "NVDA", 20, 121.4, 120, "Trimmed after run-up"),
    tx("buy", "ASML", 8, 688.0, 90),
    tx("dividend", "JPM", 1, 51.75, 60),
    tx("buy", "UNH", 12, 545.0, 45, "Bought weakness after guidance cut"),
    tx("deposit", null, 1, 10000, 30, "Monthly contribution"),
    tx("buy", "AAPL", 10, 221.1, 20),
  ]);

  const [wlCore] = await db.insert(watchlists).values({ name: "Candidates" }).returning();
  const [wlMacro] = await db.insert(watchlists).values({ name: "Macro Dashboard" }).returning();
  await db.insert(watchlistItems).values([
    { watchlistId: wlCore.id, instrumentId: idOf.TSLA, note: "Wait for FSD margin clarity" },
    { watchlistId: wlCore.id, instrumentId: idOf.COST, note: "Too expensive at 50x; buy < 800" },
    { watchlistId: wlCore.id, instrumentId: idOf.ETH, note: "Considering 2% allocation" },
    { watchlistId: wlMacro.id, instrumentId: idOf.SPX },
    { watchlistId: wlMacro.id, instrumentId: idOf.NDX },
    { watchlistId: wlMacro.id, instrumentId: idOf.VIX },
    { watchlistId: wlMacro.id, instrumentId: idOf.US10Y },
    { watchlistId: wlMacro.id, instrumentId: idOf.USOIL },
  ]);

  const news = await db
    .insert(newsArticles)
    .values([
      {
        title: "NVIDIA beats on data-center revenue, guides above consensus",
        source: "Reuters",
        summary:
          "NVIDIA reported quarterly revenue of $35.1B, driven by a 112% year-over-year rise in data-center sales. Management guided next quarter above Street estimates, citing continued Blackwell demand.",
        sentiment: "positive",
        publishedAt: daysAgo(0),
      },
      {
        title: "Apple to expand India manufacturing footprint amid tariff uncertainty",
        source: "Bloomberg",
        summary:
          "Apple plans to shift a larger share of iPhone assembly to India over the next 18 months, according to people familiar with the matter, as it hedges against potential tariffs on Chinese-made goods.",
        sentiment: "neutral",
        publishedAt: daysAgo(0),
      },
      {
        title: "UnitedHealth cuts full-year outlook on higher medical costs",
        source: "WSJ",
        summary:
          "UnitedHealth lowered its 2025 earnings forecast, citing elevated utilization in Medicare Advantage. Shares fell sharply in pre-market trading, dragging peers lower.",
        sentiment: "negative",
        publishedAt: daysAgo(1),
      },
      {
        title: "Fed holds rates steady, signals patience on further cuts",
        source: "Financial Times",
        summary:
          "The Federal Reserve left its benchmark rate unchanged and said it would wait for clearer evidence that inflation is returning to 2% before cutting again. Treasury yields dipped after the statement.",
        sentiment: "neutral",
        publishedAt: daysAgo(1),
      },
      {
        title: "Oil slides as OPEC+ signals output increase",
        source: "Reuters",
        summary:
          "Crude prices fell more than 2% after OPEC+ delegates indicated the group would proceed with a planned production increase next month, weighing on energy majors.",
        sentiment: "negative",
        publishedAt: daysAgo(2),
      },
      {
        title: "ASML orders top estimates as EUV demand stays strong",
        source: "Bloomberg",
        summary:
          "ASML reported bookings of €7.1B, well above analyst estimates, as chipmakers accelerated orders for high-NA EUV tools. The company reiterated 2025 guidance.",
        sentiment: "positive",
        publishedAt: daysAgo(3),
      },
      {
        title: "Bitcoin nears record as spot ETF inflows accelerate",
        source: "CoinDesk",
        summary:
          "Bitcoin climbed toward $98K as U.S. spot ETFs logged their strongest weekly inflows since launch. Ether lagged, with traders citing continued outflows from ETH products.",
        sentiment: "positive",
        publishedAt: daysAgo(3),
      },
      {
        title: "JPMorgan raises net interest income guidance",
        source: "CNBC",
        summary:
          "JPMorgan lifted its full-year NII guidance to roughly $92.5B, citing a steeper yield curve and stronger-than-expected loan growth in its commercial bank.",
        sentiment: "positive",
        publishedAt: daysAgo(4),
      },
      {
        title: "Tesla margins compress again as price cuts continue",
        source: "The Verge",
        summary:
          "Tesla's automotive gross margin fell to 16.4%, its lowest in five years, as the company continued to cut prices to defend share against Chinese EV makers.",
        sentiment: "negative",
        publishedAt: daysAgo(5),
      },
      {
        title: "Microsoft, Amazon ramp AI capex; investors question returns",
        source: "WSJ",
        summary:
          "Microsoft and Amazon each signaled capital expenditures above $80B this year. Analysts are increasingly asking when AI infrastructure spend translates into revenue.",
        sentiment: "neutral",
        publishedAt: daysAgo(6),
      },
    ])
    .returning({ id: newsArticles.id });

  const link = (i: number, ...syms: string[]) => syms.map((s) => ({ articleId: news[i].id, instrumentId: idOf[s] }));
  await db.insert(newsArticleInstruments).values([
    ...link(0, "NVDA", "NDX"),
    ...link(1, "AAPL"),
    ...link(2, "UNH"),
    ...link(3, "US10Y", "SPX", "BND"),
    ...link(4, "USOIL", "XOM"),
    ...link(5, "ASML", "NVDA"),
    ...link(6, "BTC", "ETH"),
    ...link(7, "JPM"),
    ...link(8, "TSLA"),
    ...link(9, "MSFT", "AMZN", "NVDA"),
  ]);

  const notes = await db
    .insert(researchNotes)
    .values([
      {
        title: "NVDA: AI capex cycle thesis",
        kind: "thesis",
        stance: "bullish",
        body: `## Thesis
Hyperscaler capex is still accelerating and NVDA captures ~80% of accelerator spend.

## What would change my mind
- Capex guidance cuts from MSFT/AMZN/GOOGL
- Custom silicon (TPU/Trainium) share gains above 25%
- Gross margin below 70%

## Position sizing
Trimmed 20 shares at $121 to keep position under 10% of portfolio.`,
        createdAt: daysAgo(130),
        updatedAt: daysAgo(10),
      },
      {
        title: "UNH: buying the guidance cut",
        kind: "memo",
        stance: "bullish",
        body: `Bought 12 shares at $545 after the MA utilization scare. Historically UNH has recovered within 2-3 quarters after repricing cycles. Key risk: political pressure on PBMs.`,
        createdAt: daysAgo(45),
        updatedAt: daysAgo(45),
      },
      {
        title: "Q3 earnings season debrief",
        kind: "earnings",
        stance: "neutral",
        body: `- AAPL: services growth solid, China weak. Hold.
- MSFT: Azure +33%, capex worry overdone. Hold.
- JPM: NII beat. Consider adding on a pullback.
- XOM: fine, but oil macro is the driver, not the company.`,
        createdAt: daysAgo(70),
        updatedAt: daysAgo(70),
      },
      {
        title: "Journal: portfolio review",
        kind: "journal",
        stance: "neutral",
        body: `Tech + semis are now ~45% of portfolio. That's above my 40% ceiling. Plan: direct next 3 monthly contributions to VXUS and BND rather than selling.`,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(15),
      },
      {
        title: "TSLA: why I'm still on the sidelines",
        kind: "thesis",
        stance: "bearish",
        body: `Auto margins keep compressing and the valuation assumes robotaxi optionality I can't underwrite. Revisit if FSD attach rate data improves.`,
        createdAt: daysAgo(25),
        updatedAt: daysAgo(5),
      },
    ])
    .returning({ id: researchNotes.id });

  const nl = (i: number, ...syms: string[]) => syms.map((s) => ({ noteId: notes[i].id, instrumentId: idOf[s] }));
  await db.insert(researchNoteInstruments).values([
    ...nl(0, "NVDA", "MSFT", "AMZN"),
    ...nl(1, "UNH"),
    ...nl(2, "AAPL", "MSFT", "JPM", "XOM"),
    ...nl(3, "VXUS", "BND"),
    ...nl(4, "TSLA"),
  ]);

  await db.insert(alerts).values([
    { instrumentId: idOf.NVDA, condition: "price_above", threshold: "150", note: "Trim another 10 shares" },
    { instrumentId: idOf.COST, condition: "price_below", threshold: "800", note: "Start position" },
    { instrumentId: idOf.UNH, condition: "price_below", threshold: "480", note: "Reassess thesis" },
    { instrumentId: idOf.BTC, condition: "price_above", threshold: "100000", note: "Rebalance crypto to 5%" },
    { instrumentId: idOf.VIX, condition: "price_above", threshold: "25", note: "Deploy cash" },
    { instrumentId: idOf.TSLA, condition: "pct_move", threshold: "5", note: "Check news" },
  ]);
}
