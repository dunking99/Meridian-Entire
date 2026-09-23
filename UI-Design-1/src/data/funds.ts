export interface FundLine {
  symbol: string; // underlying company ticker (may be outside the tracked universe)
  name: string;
  weight: number; // % of the fund
  sector: string;
  region: string;
}

export interface FundComposition {
  symbol: string;
  asOf: string;
  holdingsCount: number;
  /** % of the fund covered by the published lines below */
  disclosed: number;
  lines: FundLine[];
  sectors: Record<string, number>;
  regions: Record<string, number>;
}

const L = (symbol: string, name: string, weight: number, sector: string, region: string): FundLine => ({ symbol, name, weight, sector, region });

export const FUND_COMPOSITIONS: Record<string, FundComposition> = {
  VWRP: {
    symbol: "VWRP",
    asOf: "2026-01-31",
    holdingsCount: 3742,
    disclosed: 24.1,
    lines: [
      L("NVDA", "NVIDIA Corp", 4.42, "Technology", "North America"),
      L("AAPL", "Apple Inc", 4.11, "Technology", "North America"),
      L("MSFT", "Microsoft Corp", 3.86, "Technology", "North America"),
      L("AMZN", "Amazon.com Inc", 2.34, "Consumer Discretionary", "North America"),
      L("META", "Meta Platforms Inc", 1.64, "Technology", "North America"),
      L("GOOGL", "Alphabet Inc", 1.52, "Technology", "North America"),
      L("AVGO", "Broadcom Inc", 1.31, "Technology", "North America"),
      L("TSM", "Taiwan Semiconductor Mfg", 1.12, "Technology", "Asia Pacific"),
      L("LLY", "Eli Lilly & Co", 0.94, "Healthcare", "North America"),
      L("JPM", "JPMorgan Chase & Co", 0.86, "Financials", "North America"),
      L("TSLA", "Tesla Inc", 0.81, "Consumer Discretionary", "North America"),
      L("V", "Visa Inc", 0.72, "Financials", "North America"),
      L("UNH", "UnitedHealth Group", 0.64, "Healthcare", "North America"),
      L("ASML", "ASML Holding NV", 0.42, "Technology", "Europe"),
      L("NOVOB", "Novo Nordisk A/S", 0.38, "Healthcare", "Europe"),
      L("AZN", "AstraZeneca plc", 0.31, "Healthcare", "United Kingdom"),
      L("SHEL", "Shell plc", 0.29, "Energy", "United Kingdom"),
    ],
    sectors: { Technology: 26.4, Financials: 16.1, "Consumer Discretionary": 13.8, Healthcare: 10.9, Industrials: 10.6, "Communication Services": 7.4, "Consumer Staples": 5.6, Energy: 3.9, Materials: 3.4, Utilities: 2.6, "Real Estate": 2.1 },
    regions: { "North America": 64.2, Europe: 13.1, "Asia Pacific": 11.8, "United Kingdom": 3.6, "Emerging Markets": 7.3 },
  },
  CSP1: {
    symbol: "CSP1",
    asOf: "2026-02-02",
    holdingsCount: 503,
    disclosed: 34.8,
    lines: [
      L("NVDA", "NVIDIA Corp", 7.21, "Technology", "North America"),
      L("AAPL", "Apple Inc", 6.84, "Technology", "North America"),
      L("MSFT", "Microsoft Corp", 6.42, "Technology", "North America"),
      L("AMZN", "Amazon.com Inc", 3.91, "Consumer Discretionary", "North America"),
      L("META", "Meta Platforms Inc", 2.68, "Technology", "North America"),
      L("GOOGL", "Alphabet Inc", 2.44, "Technology", "North America"),
      L("AVGO", "Broadcom Inc", 2.12, "Technology", "North America"),
      L("LLY", "Eli Lilly & Co", 1.47, "Healthcare", "North America"),
      L("JPM", "JPMorgan Chase & Co", 1.38, "Financials", "North America"),
      L("TSLA", "Tesla Inc", 1.22, "Consumer Discretionary", "North America"),
      L("V", "Visa Inc", 1.04, "Financials", "North America"),
      L("UNH", "UnitedHealth Group", 0.94, "Healthcare", "North America"),
      L("COST", "Costco Wholesale Corp", 0.82, "Consumer Staples", "North America"),
      L("NFLX", "Netflix Inc", 0.71, "Consumer Discretionary", "North America"),
    ],
    sectors: { Technology: 33.8, Financials: 13.2, "Consumer Discretionary": 11.4, Healthcare: 10.1, "Communication Services": 9.2, Industrials: 8.1, "Consumer Staples": 5.7, Energy: 3.4, Utilities: 2.4, Materials: 1.9, "Real Estate": 0.8 },
    regions: { "North America": 100 },
  },
  EQQQ: {
    symbol: "EQQQ",
    asOf: "2026-02-02",
    holdingsCount: 101,
    disclosed: 51.4,
    lines: [
      L("NVDA", "NVIDIA Corp", 8.94, "Technology", "North America"),
      L("AAPL", "Apple Inc", 8.42, "Technology", "North America"),
      L("MSFT", "Microsoft Corp", 7.88, "Technology", "North America"),
      L("AMZN", "Amazon.com Inc", 5.31, "Consumer Discretionary", "North America"),
      L("AVGO", "Broadcom Inc", 4.72, "Technology", "North America"),
      L("META", "Meta Platforms Inc", 4.41, "Technology", "North America"),
      L("GOOGL", "Alphabet Inc", 4.08, "Technology", "North America"),
      L("TSLA", "Tesla Inc", 3.02, "Consumer Discretionary", "North America"),
      L("COST", "Costco Wholesale Corp", 2.61, "Consumer Staples", "North America"),
      L("NFLX", "Netflix Inc", 2.21, "Consumer Discretionary", "North America"),
    ],
    sectors: { Technology: 58.1, "Consumer Discretionary": 17.9, "Communication Services": 10.2, "Consumer Staples": 6.1, Healthcare: 4.8, Industrials: 2.4, Utilities: 0.5 },
    regions: { "North America": 96.4, Europe: 2.1, "Asia Pacific": 1.5 },
  },
  SMT: {
    symbol: "SMT",
    asOf: "2026-01-31",
    holdingsCount: 98,
    disclosed: 42.6,
    lines: [
      L("SPACEX", "Space Exploration Technologies", 7.34, "Industrials", "North America"),
      L("NVDA", "NVIDIA Corp", 6.12, "Technology", "North America"),
      L("ASML", "ASML Holding NV", 4.98, "Technology", "Europe"),
      L("AMZN", "Amazon.com Inc", 4.61, "Consumer Discretionary", "North America"),
      L("MELI", "MercadoLibre Inc", 4.22, "Consumer Discretionary", "Latin America"),
      L("TSM", "Taiwan Semiconductor Mfg", 3.41, "Technology", "Asia Pacific"),
      L("RACE", "Ferrari NV", 2.98, "Consumer Discretionary", "Europe"),
      L("PDD", "PDD Holdings Inc", 2.81, "Consumer Discretionary", "Asia Pacific"),
      L("MRNA", "Moderna Inc", 2.14, "Healthcare", "North America"),
      L("NU", "Nu Holdings Ltd", 2.02, "Financials", "Latin America"),
      L("TSLA", "Tesla Inc", 1.96, "Consumer Discretionary", "North America"),
    ],
    sectors: { Technology: 31.2, "Consumer Discretionary": 27.4, Healthcare: 14.1, Industrials: 12.8, Financials: 9.2, "Communication Services": 5.3 },
    regions: { "North America": 48.2, "Asia Pacific": 20.1, Europe: 18.4, "Latin America": 9.8, "United Kingdom": 3.5 },
  },
};

/** Why a position could not be looked through. */
export const LOOKTHROUGH_GAPS: Record<string, string> = {
  IGLT: "Fixed income — sovereign bonds have no underlying company exposure to attribute.",
  SGLN: "Physically-backed commodity — no corporate underlyings.",
  FIDGLSP: "No composition published by the provider on the connected feed. Last attempted sync returned an empty holdings array.",
};
