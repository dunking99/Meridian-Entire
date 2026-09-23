export type UniverseRow = {
  symbol: string;
  yahooSymbol: string;
  name: string;
  assetClass: string;
  sector?: string;
  region: string;
  currency: string;
  exchange?: string;
  board?: string;
};

/** Market rail shown on the Markets page. */
export const UNIVERSE: UniverseRow[] = [
  // Indices
  { symbol: "SPX", yahooSymbol: "^GSPC", name: "S&P 500", assetClass: "index", region: "US", currency: "USD", board: "indices" },
  { symbol: "NDX", yahooSymbol: "^NDX", name: "Nasdaq 100", assetClass: "index", region: "US", currency: "USD", board: "indices" },
  { symbol: "DJI", yahooSymbol: "^DJI", name: "Dow Jones Industrial Average", assetClass: "index", region: "US", currency: "USD", board: "indices" },
  { symbol: "RUT", yahooSymbol: "^RUT", name: "Russell 2000", assetClass: "index", region: "US", currency: "USD", board: "indices" },
  { symbol: "VIX", yahooSymbol: "^VIX", name: "CBOE Volatility Index", assetClass: "index", region: "US", currency: "USD", board: "indices" },
  { symbol: "SX5E", yahooSymbol: "^STOXX50E", name: "EURO STOXX 50", assetClass: "index", region: "EU", currency: "EUR", board: "indices" },
  { symbol: "FTSE", yahooSymbol: "^FTSE", name: "FTSE 100", assetClass: "index", region: "UK", currency: "GBP", board: "indices" },
  { symbol: "N225", yahooSymbol: "^N225", name: "Nikkei 225", assetClass: "index", region: "JP", currency: "JPY", board: "indices" },
  { symbol: "HSI", yahooSymbol: "^HSI", name: "Hang Seng", assetClass: "index", region: "HK", currency: "HKD", board: "indices" },

  // Commodities
  { symbol: "XAU", yahooSymbol: "GC=F", name: "Gold (COMEX)", assetClass: "commodity", region: "GLOBAL", currency: "USD", board: "commodities" },
  { symbol: "XAG", yahooSymbol: "SI=F", name: "Silver (COMEX)", assetClass: "commodity", region: "GLOBAL", currency: "USD", board: "commodities" },
  { symbol: "WTI", yahooSymbol: "CL=F", name: "Crude Oil WTI", assetClass: "commodity", region: "GLOBAL", currency: "USD", board: "commodities" },
  { symbol: "BRENT", yahooSymbol: "BZ=F", name: "Brent Crude", assetClass: "commodity", region: "GLOBAL", currency: "USD", board: "commodities" },
  { symbol: "NG", yahooSymbol: "NG=F", name: "Natural Gas", assetClass: "commodity", region: "GLOBAL", currency: "USD", board: "commodities" },
  { symbol: "HG", yahooSymbol: "HG=F", name: "Copper", assetClass: "commodity", region: "GLOBAL", currency: "USD", board: "commodities" },
  { symbol: "WHEAT", yahooSymbol: "ZW=F", name: "Wheat", assetClass: "commodity", region: "GLOBAL", currency: "USD", board: "commodities" },

  // FX
  { symbol: "EURUSD", yahooSymbol: "EURUSD=X", name: "Euro / US Dollar", assetClass: "fx", region: "EU", currency: "USD", board: "fx" },
  { symbol: "GBPUSD", yahooSymbol: "GBPUSD=X", name: "Pound / US Dollar", assetClass: "fx", region: "UK", currency: "USD", board: "fx" },
  { symbol: "USDJPY", yahooSymbol: "USDJPY=X", name: "US Dollar / Yen", assetClass: "fx", region: "JP", currency: "JPY", board: "fx" },
  { symbol: "USDCHF", yahooSymbol: "USDCHF=X", name: "US Dollar / Franc", assetClass: "fx", region: "EU", currency: "CHF", board: "fx" },
  { symbol: "DXY", yahooSymbol: "DX-Y.NYB", name: "US Dollar Index", assetClass: "fx", region: "US", currency: "USD", board: "fx" },
  { symbol: "USDCNY", yahooSymbol: "USDCNY=X", name: "US Dollar / Yuan", assetClass: "fx", region: "CN", currency: "CNY", board: "fx" },

  // Sector ETFs (S&P 500 sector SPDRs)
  { symbol: "XLK", yahooSymbol: "XLK", name: "Technology Select Sector", assetClass: "etf", sector: "Technology", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLF", yahooSymbol: "XLF", name: "Financial Select Sector", assetClass: "etf", sector: "Financials", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLV", yahooSymbol: "XLV", name: "Health Care Select Sector", assetClass: "etf", sector: "Health Care", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLY", yahooSymbol: "XLY", name: "Consumer Discretionary", assetClass: "etf", sector: "Consumer Discretionary", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLP", yahooSymbol: "XLP", name: "Consumer Staples", assetClass: "etf", sector: "Consumer Staples", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLE", yahooSymbol: "XLE", name: "Energy Select Sector", assetClass: "etf", sector: "Energy", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLI", yahooSymbol: "XLI", name: "Industrial Select Sector", assetClass: "etf", sector: "Industrials", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLB", yahooSymbol: "XLB", name: "Materials Select Sector", assetClass: "etf", sector: "Materials", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLU", yahooSymbol: "XLU", name: "Utilities Select Sector", assetClass: "etf", sector: "Utilities", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLRE", yahooSymbol: "XLRE", name: "Real Estate Select Sector", assetClass: "etf", sector: "Real Estate", region: "US", currency: "USD", board: "sectors" },
  { symbol: "XLC", yahooSymbol: "XLC", name: "Communication Services", assetClass: "etf", sector: "Communication", region: "US", currency: "USD", board: "sectors" },

  // Macro / rates
  { symbol: "TLT", yahooSymbol: "TLT", name: "iShares 20+ Year Treasury", assetClass: "bond", sector: "Government", region: "US", currency: "USD", board: "macro" },
  { symbol: "IEF", yahooSymbol: "IEF", name: "iShares 7-10 Year Treasury", assetClass: "bond", sector: "Government", region: "US", currency: "USD", board: "macro" },
  { symbol: "LQD", yahooSymbol: "LQD", name: "iShares IG Corporate Bonds", assetClass: "bond", sector: "Corporate Credit", region: "US", currency: "USD", board: "macro" },
  { symbol: "HYG", yahooSymbol: "HYG", name: "iShares High Yield Credit", assetClass: "bond", sector: "High Yield", region: "US", currency: "USD", board: "macro" },
  { symbol: "TNX", yahooSymbol: "^TNX", name: "US 10-Year Yield", assetClass: "index", region: "US", currency: "USD", board: "macro" },
  { symbol: "BTC", yahooSymbol: "BTC-USD", name: "Bitcoin", assetClass: "crypto", region: "GLOBAL", currency: "USD", board: "macro" },
  { symbol: "ETH", yahooSymbol: "ETH-USD", name: "Ethereum", assetClass: "crypto", region: "GLOBAL", currency: "USD", board: "macro" },

  // Core holdings available to the portfolio
  { symbol: "VOO", yahooSymbol: "VOO", name: "Vanguard S&P 500 ETF", assetClass: "etf", sector: "Broad Market", region: "US", currency: "USD", exchange: "NYSE" },
  { symbol: "QQQ", yahooSymbol: "QQQ", name: "Invesco QQQ Trust", assetClass: "etf", sector: "Technology", region: "US", currency: "USD", exchange: "NASDAQ" },
  { symbol: "VXUS", yahooSymbol: "VXUS", name: "Vanguard Total Intl Stock", assetClass: "etf", sector: "Broad Market", region: "GLOBAL", currency: "USD", exchange: "NASDAQ" },
  { symbol: "SCHD", yahooSymbol: "SCHD", name: "Schwab US Dividend Equity", assetClass: "etf", sector: "Dividend", region: "US", currency: "USD", exchange: "NYSE" },
  { symbol: "BND", yahooSymbol: "BND", name: "Vanguard Total Bond Market", assetClass: "bond", sector: "Aggregate", region: "US", currency: "USD", exchange: "NYSE" },
  { symbol: "VNQ", yahooSymbol: "VNQ", name: "Vanguard Real Estate ETF", assetClass: "etf", sector: "Real Estate", region: "US", currency: "USD", exchange: "NYSE" },
  { symbol: "GLD", yahooSymbol: "GLD", name: "SPDR Gold Shares", assetClass: "commodity", sector: "Precious Metals", region: "GLOBAL", currency: "USD", exchange: "NYSE" },
  { symbol: "AAPL", yahooSymbol: "AAPL", name: "Apple Inc.", assetClass: "equity", sector: "Technology", region: "US", currency: "USD", exchange: "NASDAQ" },
  { symbol: "MSFT", yahooSymbol: "MSFT", name: "Microsoft Corp.", assetClass: "equity", sector: "Technology", region: "US", currency: "USD", exchange: "NASDAQ" },
  { symbol: "NVDA", yahooSymbol: "NVDA", name: "NVIDIA Corp.", assetClass: "equity", sector: "Technology", region: "US", currency: "USD", exchange: "NASDAQ" },
  { symbol: "JPM", yahooSymbol: "JPM", name: "JPMorgan Chase & Co.", assetClass: "equity", sector: "Financials", region: "US", currency: "USD", exchange: "NYSE" },
  { symbol: "UNH", yahooSymbol: "UNH", name: "UnitedHealth Group", assetClass: "equity", sector: "Health Care", region: "US", currency: "USD", exchange: "NYSE" },
  { symbol: "XOM", yahooSymbol: "XOM", name: "Exxon Mobil Corp.", assetClass: "equity", sector: "Energy", region: "US", currency: "USD", exchange: "NYSE" },
  { symbol: "NESN.SW", yahooSymbol: "NESN.SW", name: "Nestlé S.A.", assetClass: "equity", sector: "Consumer Staples", region: "EU", currency: "CHF", exchange: "SIX" },
  { symbol: "ASML", yahooSymbol: "ASML", name: "ASML Holding N.V.", assetClass: "equity", sector: "Technology", region: "EU", currency: "USD", exchange: "NASDAQ" },
  { symbol: "7203.T", yahooSymbol: "7203.T", name: "Toyota Motor Corp.", assetClass: "equity", sector: "Consumer Discretionary", region: "JP", currency: "JPY", exchange: "TSE" },
  { symbol: "SPY", yahooSymbol: "SPY", name: "SPDR S&P 500 (benchmark)", assetClass: "etf", sector: "Broad Market", region: "US", currency: "USD", exchange: "NYSE" },
];

export const UNIVERSE_BY_SYMBOL = new Map(UNIVERSE.map((u) => [u.symbol, u]));

export const BOARDS: { key: string; label: string; blurb: string }[] = [
  { key: "indices", label: "Indices", blurb: "Global equity benchmarks" },
  { key: "commodities", label: "Commodities", blurb: "Energy, metals, agriculture" },
  { key: "fx", label: "FX", blurb: "Majors and the dollar index" },
  { key: "sectors", label: "Sector ETFs", blurb: "S&P 500 sector SPDRs" },
  { key: "macro", label: "Rates & Crypto", blurb: "Duration, credit, digital assets" },
];

export const SECTOR_COLORS: Record<string, string> = {
  Technology: "#6366f1",
  Financials: "#0ea5e9",
  "Health Care": "#10b981",
  "Consumer Discretionary": "#f59e0b",
  "Consumer Staples": "#84cc16",
  Energy: "#ef4444",
  Industrials: "#14b8a6",
  Materials: "#a855f7",
  Utilities: "#eab308",
  "Real Estate": "#f472b6",
  Communication: "#38bdf8",
  "Broad Market": "#94a3b8",
  Dividend: "#22c55e",
  Aggregate: "#64748b",
  Government: "#60a5fa",
  "Corporate Credit": "#818cf8",
  "High Yield": "#fb7185",
  "Precious Metals": "#fbbf24",
  Cash: "#475569",
};

export const ASSET_CLASS_COLORS: Record<string, string> = {
  equity: "#6366f1",
  etf: "#0ea5e9",
  bond: "#10b981",
  commodity: "#f59e0b",
  crypto: "#a855f7",
  fx: "#94a3b8",
  index: "#38bdf8",
  cash: "#475569",
};
