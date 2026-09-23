export type AssetType = "Stock" | "ETF" | "Fund" | "Trust" | "Bond" | "Commodity";
export type Wrapper = "ISA" | "SIPP" | "GIA" | "LISA";

export interface Asset {
  symbol: string;
  name: string;
  /** true when the stored name is still just the raw ticker and needs resolving */
  unresolved?: boolean;
  type: AssetType;
  sector: string;
  region: string;
  currency: "GBP" | "USD" | "EUR" | "DKK";
  exchange: string;
  /** current price, already expressed in the reporting currency (GBP) */
  price: number;
  mcap?: number;
  beta: number;
  expense?: number;
  yieldPct?: number;
  /** stored daily bars of price history */
  bars: number;
  drift: number;
  vol: number;
  mktBeta: number;
  investable?: boolean;
}

const A = (a: Asset) => a;

export const UNIVERSE: Asset[] = [
  // ---- held: direct equity -------------------------------------------------
  A({ symbol: "NVDA", name: "NVIDIA Corp", type: "Stock", sector: "Technology", region: "North America", currency: "USD", exchange: "NASDAQ", price: 112.4, mcap: 2.74e12, beta: 1.72, yieldPct: 0.03, bars: 1260, drift: 0.44, vol: 0.44, mktBeta: 1.62 }),
  A({ symbol: "MSFT", name: "Microsoft Corp", type: "Stock", sector: "Technology", region: "North America", currency: "USD", exchange: "NASDAQ", price: 335.2, mcap: 2.49e12, beta: 1.08, yieldPct: 0.72, bars: 1260, drift: 0.19, vol: 0.24, mktBeta: 1.06 }),
  A({ symbol: "AAPL", name: "Apple Inc", type: "Stock", sector: "Technology", region: "North America", currency: "USD", exchange: "NASDAQ", price: 182.6, mcap: 2.81e12, beta: 1.14, yieldPct: 0.51, bars: 1260, drift: 0.13, vol: 0.25, mktBeta: 1.11 }),
  A({ symbol: "ASML", name: "ASML Holding NV", type: "Stock", sector: "Technology", region: "Europe", currency: "EUR", exchange: "AEX", price: 612.0, mcap: 2.41e11, beta: 1.38, yieldPct: 0.94, bars: 1260, drift: 0.16, vol: 0.34, mktBeta: 1.29 }),
  A({ symbol: "AZN", name: "AstraZeneca plc", type: "Stock", sector: "Healthcare", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 108.5, mcap: 1.68e11, beta: 0.56, yieldPct: 2.21, bars: 1260, drift: 0.11, vol: 0.19, mktBeta: 0.52 }),
  A({ symbol: "SHEL", name: "Shell plc", type: "Stock", sector: "Energy", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 27.9, mcap: 1.66e11, beta: 0.79, yieldPct: 3.96, bars: 1260, drift: 0.09, vol: 0.23, mktBeta: 0.63 }),
  A({ symbol: "LSEG", name: "London Stock Exchange Group", type: "Stock", sector: "Financials", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 96.2, mcap: 5.1e10, beta: 0.74, yieldPct: 1.32, bars: 1260, drift: 0.1, vol: 0.2, mktBeta: 0.71 }),
  A({ symbol: "NOVOB", name: "Novo Nordisk A/S", type: "Stock", sector: "Healthcare", region: "Europe", currency: "DKK", exchange: "CPH", price: 68.4, mcap: 2.66e11, beta: 0.68, yieldPct: 1.74, bars: 1260, drift: 0.14, vol: 0.29, mktBeta: 0.61 }),
  A({ symbol: "TSM", name: "Taiwan Semiconductor Mfg", type: "Stock", sector: "Technology", region: "Asia Pacific", currency: "USD", exchange: "NYSE", price: 148.1, mcap: 6.9e11, beta: 1.31, yieldPct: 1.28, bars: 1260, drift: 0.24, vol: 0.33, mktBeta: 1.24 }),
  A({ symbol: "ARM", name: "Arm Holdings plc", type: "Stock", sector: "Technology", region: "United Kingdom", currency: "USD", exchange: "NASDAQ", price: 98.3, mcap: 1.02e11, beta: 1.64, bars: 96, drift: 0.2, vol: 0.51, mktBeta: 1.55 }),
  A({ symbol: "BRK.B", name: "BRK.B", unresolved: true, type: "Stock", sector: "Financials", region: "North America", currency: "USD", exchange: "NYSE", price: 355.1, mcap: 7.6e11, beta: 0.86, bars: 1260, drift: 0.12, vol: 0.17, mktBeta: 0.79 }),

  // ---- held: funds, trusts, bonds, commodity -------------------------------
  A({ symbol: "VWRP", name: "Vanguard FTSE All-World ETF (Acc)", type: "ETF", sector: "Diversified", region: "Global", currency: "GBP", exchange: "LSE", price: 118.3, beta: 1.0, expense: 0.22, bars: 1260, drift: 0.11, vol: 0.14, mktBeta: 0.99 }),
  A({ symbol: "CSP1", name: "iShares Core S&P 500 ETF (Acc)", type: "ETF", sector: "Diversified", region: "North America", currency: "GBP", exchange: "LSE", price: 468.9, beta: 1.04, expense: 0.07, bars: 1260, drift: 0.13, vol: 0.16, mktBeta: 1.03 }),
  A({ symbol: "EQQQ", name: "Invesco NASDAQ-100 ETF", type: "ETF", sector: "Diversified", region: "North America", currency: "GBP", exchange: "LSE", price: 385.4, beta: 1.22, expense: 0.3, bars: 1260, drift: 0.17, vol: 0.22, mktBeta: 1.19 }),
  A({ symbol: "SMT", name: "Scottish Mortgage Inv Trust", type: "Trust", sector: "Diversified", region: "Global", currency: "GBP", exchange: "LSE", price: 9.72, beta: 1.41, expense: 0.34, yieldPct: 0.48, bars: 1260, drift: 0.08, vol: 0.31, mktBeta: 1.33 }),
  A({ symbol: "IGLT", name: "iShares Core UK Gilts ETF", type: "Bond", sector: "Fixed Income", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 9.85, beta: 0.11, expense: 0.07, yieldPct: 4.12, bars: 1260, drift: 0.015, vol: 0.07, mktBeta: 0.06 }),
  A({ symbol: "SGLN", name: "iShares Physical Gold ETC", type: "Commodity", sector: "Commodity", region: "Global", currency: "GBP", exchange: "LSE", price: 44.2, beta: 0.09, expense: 0.12, bars: 1260, drift: 0.1, vol: 0.13, mktBeta: 0.04 }),
  A({ symbol: "FIDGLSP", name: "FIDGLSP", unresolved: true, type: "Fund", sector: "Diversified", region: "Global", currency: "GBP", exchange: "OEIC", price: 48.6, beta: 0.93, expense: 0.9, bars: 140, drift: 0.09, vol: 0.15, mktBeta: 0.9 }),

  // ---- watchlist -----------------------------------------------------------
  A({ symbol: "GOOGL", name: "Alphabet Inc Class A", type: "Stock", sector: "Technology", region: "North America", currency: "USD", exchange: "NASDAQ", price: 148.9, mcap: 1.84e12, beta: 1.05, bars: 1260, drift: 0.15, vol: 0.27, mktBeta: 1.04, investable: true }),
  A({ symbol: "AMZN", name: "Amazon.com Inc", type: "Stock", sector: "Consumer Discretionary", region: "North America", currency: "USD", exchange: "NASDAQ", price: 171.3, mcap: 1.79e12, beta: 1.19, bars: 1260, drift: 0.16, vol: 0.3, mktBeta: 1.16, investable: true }),
  A({ symbol: "LLY", name: "Eli Lilly & Co", type: "Stock", sector: "Healthcare", region: "North America", currency: "USD", exchange: "NYSE", price: 621.4, mcap: 5.9e11, beta: 0.62, yieldPct: 0.68, bars: 1260, drift: 0.28, vol: 0.28, mktBeta: 0.58, investable: true }),
  A({ symbol: "RR", name: "Rolls-Royce Holdings", type: "Stock", sector: "Industrials", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 5.62, mcap: 4.7e10, beta: 1.28, bars: 1260, drift: 0.33, vol: 0.38, mktBeta: 1.11, investable: true }),
  A({ symbol: "MC", name: "LVMH Moët Hennessy", type: "Stock", sector: "Consumer Discretionary", region: "Europe", currency: "EUR", exchange: "EPA", price: 545.0, mcap: 2.72e11, beta: 1.09, yieldPct: 2.31, bars: 1260, drift: 0.04, vol: 0.27, mktBeta: 1.02, investable: true }),
  A({ symbol: "VHYL", name: "Vanguard FTSE All-World High Div", type: "ETF", sector: "Diversified", region: "Global", currency: "GBP", exchange: "LSE", price: 58.4, beta: 0.83, expense: 0.29, yieldPct: 3.44, bars: 1260, drift: 0.07, vol: 0.12, mktBeta: 0.81, investable: true }),
  A({ symbol: "VUKE", name: "Vanguard FTSE 100 ETF", type: "ETF", sector: "Diversified", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 34.1, beta: 0.72, expense: 0.09, yieldPct: 3.78, bars: 1260, drift: 0.06, vol: 0.13, mktBeta: 0.68, investable: true }),
  A({ symbol: "PLTR", name: "Palantir Technologies", type: "Stock", sector: "Technology", region: "North America", currency: "USD", exchange: "NASDAQ", price: 62.8, mcap: 1.4e11, beta: 2.11, bars: 1260, drift: 0.41, vol: 0.58, mktBeta: 1.84, investable: true }),

  // ---- tracked universe (not held, not watched) ----------------------------
  A({ symbol: "META", name: "Meta Platforms Inc", type: "Stock", sector: "Technology", region: "North America", currency: "USD", exchange: "NASDAQ", price: 452.7, mcap: 1.15e12, beta: 1.24, bars: 1260, drift: 0.22, vol: 0.34, mktBeta: 1.21, investable: true }),
  A({ symbol: "AVGO", name: "Broadcom Inc", type: "Stock", sector: "Technology", region: "North America", currency: "USD", exchange: "NASDAQ", price: 138.6, mcap: 6.4e11, beta: 1.33, yieldPct: 1.21, bars: 1260, drift: 0.29, vol: 0.36, mktBeta: 1.28, investable: true }),
  A({ symbol: "JPM", name: "JPMorgan Chase & Co", type: "Stock", sector: "Financials", region: "North America", currency: "USD", exchange: "NYSE", price: 174.2, mcap: 5.0e11, beta: 1.02, yieldPct: 2.14, bars: 1260, drift: 0.14, vol: 0.22, mktBeta: 0.98, investable: true }),
  A({ symbol: "V", name: "Visa Inc Class A", type: "Stock", sector: "Financials", region: "North America", currency: "USD", exchange: "NYSE", price: 219.4, mcap: 4.3e11, beta: 0.94, yieldPct: 0.76, bars: 1260, drift: 0.12, vol: 0.19, mktBeta: 0.91, investable: true }),
  A({ symbol: "UNH", name: "UnitedHealth Group", type: "Stock", sector: "Healthcare", region: "North America", currency: "USD", exchange: "NYSE", price: 402.1, mcap: 3.7e11, beta: 0.66, yieldPct: 1.58, bars: 1260, drift: 0.03, vol: 0.25, mktBeta: 0.6, investable: true }),
  A({ symbol: "COST", name: "Costco Wholesale Corp", type: "Stock", sector: "Consumer Staples", region: "North America", currency: "USD", exchange: "NASDAQ", price: 688.9, mcap: 3.1e11, beta: 0.79, yieldPct: 0.54, bars: 1260, drift: 0.18, vol: 0.2, mktBeta: 0.76, investable: true }),
  A({ symbol: "BP", name: "BP plc", type: "Stock", sector: "Energy", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 4.31, mcap: 7.1e10, beta: 0.81, yieldPct: 5.12, bars: 1260, drift: 0.02, vol: 0.25, mktBeta: 0.66, investable: true }),
  A({ symbol: "ULVR", name: "Unilever plc", type: "Stock", sector: "Consumer Staples", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 45.3, mcap: 1.13e11, beta: 0.44, yieldPct: 3.28, bars: 1260, drift: 0.06, vol: 0.15, mktBeta: 0.41, investable: true }),
  A({ symbol: "RELX", name: "RELX plc", type: "Stock", sector: "Industrials", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 36.8, mcap: 6.9e10, beta: 0.63, yieldPct: 1.66, bars: 1260, drift: 0.15, vol: 0.16, mktBeta: 0.6, investable: true }),
  A({ symbol: "DGE", name: "Diageo plc", type: "Stock", sector: "Consumer Staples", region: "United Kingdom", currency: "GBP", exchange: "LSE", price: 23.4, mcap: 5.2e10, beta: 0.52, yieldPct: 3.41, bars: 1260, drift: -0.04, vol: 0.19, mktBeta: 0.48, investable: true }),
  A({ symbol: "EMIM", name: "iShares Core MSCI EM IMI ETF", type: "ETF", sector: "Diversified", region: "Emerging Markets", currency: "GBP", exchange: "LSE", price: 29.7, beta: 0.88, expense: 0.18, bars: 1260, drift: 0.05, vol: 0.16, mktBeta: 0.84, investable: true }),
  A({ symbol: "VAGP", name: "Vanguard Global Aggregate Bond", type: "Bond", sector: "Fixed Income", region: "Global", currency: "GBP", exchange: "LSE", price: 23.1, beta: 0.14, expense: 0.1, yieldPct: 3.86, bars: 1260, drift: 0.02, vol: 0.06, mktBeta: 0.09, investable: true }),
  A({ symbol: "INRG", name: "iShares Global Clean Energy", type: "ETF", sector: "Utilities", region: "Global", currency: "GBP", exchange: "LSE", price: 7.12, beta: 1.31, expense: 0.65, bars: 1260, drift: -0.12, vol: 0.32, mktBeta: 1.18, investable: true }),
  A({ symbol: "WSML", name: "iShares MSCI World Small Cap", type: "ETF", sector: "Diversified", region: "Global", currency: "GBP", exchange: "LSE", price: 6.94, beta: 1.11, expense: 0.35, bars: 1260, drift: 0.07, vol: 0.18, mktBeta: 1.07, investable: true }),
  A({ symbol: "SPACEX", name: "Space Exploration Technologies", type: "Stock", sector: "Industrials", region: "North America", currency: "USD", exchange: "Private", price: 0, beta: 0, bars: 0, drift: 0, vol: 0, mktBeta: 0 }),
  A({ symbol: "TSLA", name: "Tesla Inc", type: "Stock", sector: "Consumer Discretionary", region: "North America", currency: "USD", exchange: "NASDAQ", price: 198.4, mcap: 6.3e11, beta: 2.04, bars: 1260, drift: 0.06, vol: 0.52, mktBeta: 1.66, investable: true }),
  A({ symbol: "NFLX", name: "Netflix Inc", type: "Stock", sector: "Consumer Discretionary", region: "North America", currency: "USD", exchange: "NASDAQ", price: 512.6, mcap: 2.2e11, beta: 1.27, bars: 1260, drift: 0.21, vol: 0.33, mktBeta: 1.22, investable: true }),
  A({ symbol: "MELI", name: "MercadoLibre Inc", type: "Stock", sector: "Consumer Discretionary", region: "Latin America", currency: "USD", exchange: "NASDAQ", price: 1420.0, mcap: 7.2e10, beta: 1.48, bars: 1260, drift: 0.19, vol: 0.38, mktBeta: 1.34 }),
  A({ symbol: "PDD", name: "PDD Holdings Inc", type: "Stock", sector: "Consumer Discretionary", region: "Asia Pacific", currency: "USD", exchange: "NASDAQ", price: 98.2, mcap: 1.3e11, beta: 1.36, bars: 1260, drift: 0.11, vol: 0.44, mktBeta: 1.12 }),
  A({ symbol: "NU", name: "Nu Holdings Ltd", type: "Stock", sector: "Financials", region: "Latin America", currency: "USD", exchange: "NYSE", price: 10.4, mcap: 4.9e10, beta: 1.42, bars: 1260, drift: 0.24, vol: 0.42, mktBeta: 1.21 }),
  A({ symbol: "RACE", name: "Ferrari NV", type: "Stock", sector: "Consumer Discretionary", region: "Europe", currency: "EUR", exchange: "MIL", price: 348.0, mcap: 6.5e10, beta: 0.83, bars: 1260, drift: 0.2, vol: 0.23, mktBeta: 0.8 }),
  A({ symbol: "MRNA", name: "Moderna Inc", type: "Stock", sector: "Healthcare", region: "North America", currency: "USD", exchange: "NASDAQ", price: 31.7, mcap: 1.2e10, beta: 1.57, bars: 1260, drift: -0.31, vol: 0.55, mktBeta: 1.24 }),
];

export const BY_SYMBOL: Record<string, Asset> = Object.fromEntries(
  UNIVERSE.map((a) => [a.symbol, a]),
);

export const asset = (symbol: string): Asset =>
  BY_SYMBOL[symbol] ?? {
    symbol,
    name: symbol,
    type: "Stock",
    sector: "Unclassified",
    region: "Global",
    currency: "GBP",
    exchange: "—",
    price: 0,
    beta: 1,
    bars: 0,
    drift: 0,
    vol: 0.2,
    mktBeta: 1,
  };

/** Proper names resolved by the "Refresh names" lookup. */
export const NAME_LOOKUP: Record<string, string> = {
  "BRK.B": "Berkshire Hathaway Inc Class B",
  FIDGLSP: "Fidelity Global Special Situations W Acc",
};

export const SECTOR_COLORS: Record<string, string> = {
  Technology: "#60a5fa",
  Healthcare: "#34d399",
  Financials: "#c084fc",
  Energy: "#fbbf24",
  Industrials: "#f472b6",
  "Consumer Discretionary": "#22d3ee",
  "Consumer Staples": "#a3e635",
  Utilities: "#fb923c",
  "Fixed Income": "#94a3b8",
  Commodity: "#facc15",
  Diversified: "#818cf8",
  "Communication Services": "#2dd4bf",
  Materials: "#f87171",
  "Real Estate": "#e879f9",
  Unclassified: "#64748b",
};

export const CHART_PALETTE = [
  "#5eead4",
  "#818cf8",
  "#fbbf24",
  "#f472b6",
  "#60a5fa",
  "#a3e635",
  "#fb923c",
  "#c084fc",
  "#2dd4bf",
  "#f87171",
  "#94a3b8",
  "#e879f9",
];
