/** Static universe + content used to bootstrap the app. */

export type InstrumentSeed = {
  symbol: string;
  name: string;
  assetClass: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  country?: string;
  themes?: string;
  aliases?: string;
  marketCap?: number;
  description?: string;
  price: number;
  vol: number;
  drift: number;
  shock?: number[];
  decimals?: number;
  baseVolume?: number;
};

export const INSTRUMENTS: InstrumentSeed[] = [
  // --- Semis / AI infrastructure ---
  { symbol: "NVDA", name: "NVIDIA Corp", assetClass: "equity", sector: "Technology", industry: "Semiconductors", themes: "ai-infra,accelerated-compute", aliases: "nvidia", marketCap: 3_050_000_000_000, price: 118, vol: 0.031, drift: 0.0016, shock: [0.012, -0.021, 0.034, 0.008, 0.019], baseVolume: 280_000_000 },
  { symbol: "AMD", name: "Advanced Micro Devices", assetClass: "equity", sector: "Technology", industry: "Semiconductors", themes: "ai-infra", aliases: "amd", marketCap: 268_000_000_000, price: 158, vol: 0.032, drift: 0.0004, shock: [-0.008, 0.014, -0.027, 0.011, 0.006], baseVolume: 52_000_000 },
  { symbol: "TSM", name: "Taiwan Semiconductor", assetClass: "equity", exchange: "NYSE", sector: "Technology", industry: "Semiconductors", country: "TW", themes: "ai-infra,foundry", aliases: "tsmc,taiwan semi", marketCap: 880_000_000_000, price: 186, vol: 0.021, drift: 0.0012, shock: [0.006, 0.009, -0.014, 0.017, 0.005], baseVolume: 14_000_000 },
  { symbol: "AVGO", name: "Broadcom Inc", assetClass: "equity", sector: "Technology", industry: "Semiconductors", themes: "ai-infra,custom-silicon", aliases: "broadcom", marketCap: 740_000_000_000, price: 168, vol: 0.026, drift: 0.0014, shock: [0.019, 0.004, -0.011, 0.023, 0.007], baseVolume: 26_000_000 },
  { symbol: "ASML", name: "ASML Holding NV", assetClass: "equity", sector: "Technology", industry: "Semi Equipment", country: "NL", themes: "ai-infra,lithography", aliases: "asml", marketCap: 320_000_000_000, price: 735, vol: 0.024, drift: 0.0006, shock: [-0.019, -0.004, 0.008, 0.012, -0.006], baseVolume: 2_100_000 },
  { symbol: "MU", name: "Micron Technology", assetClass: "equity", sector: "Technology", industry: "Memory", themes: "ai-infra,memory-cycle", aliases: "micron", marketCap: 118_000_000_000, price: 104, vol: 0.033, drift: 0.0009, shock: [0.024, 0.011, -0.017, 0.029, 0.012], baseVolume: 21_000_000 },
  { symbol: "VRT", name: "Vertiv Holdings", assetClass: "equity", exchange: "NYSE", sector: "Industrials", industry: "Electrical Equipment", themes: "ai-infra,data-center-power", aliases: "vertiv", marketCap: 42_000_000_000, price: 96, vol: 0.036, drift: 0.0018, shock: [0.031, 0.008, -0.022, 0.026, 0.014], baseVolume: 8_400_000 },
  { symbol: "ETN", name: "Eaton Corp", assetClass: "equity", exchange: "NYSE", sector: "Industrials", industry: "Electrical Equipment", themes: "electrification", aliases: "eaton", marketCap: 132_000_000_000, price: 322, vol: 0.018, drift: 0.0008, shock: [0.009, 0.006, -0.007, 0.011, 0.004], baseVolume: 2_400_000 },
  // --- Mega-cap platforms ---
  { symbol: "AAPL", name: "Apple Inc", assetClass: "equity", sector: "Technology", industry: "Consumer Electronics", themes: "mega-cap,services-mix", aliases: "apple", marketCap: 3_340_000_000_000, price: 224, vol: 0.016, drift: 0.0005, shock: [0.004, -0.006, 0.012, 0.003, -0.002], baseVolume: 48_000_000 },
  { symbol: "MSFT", name: "Microsoft Corp", assetClass: "equity", sector: "Technology", industry: "Software", themes: "mega-cap,cloud,ai-infra", aliases: "microsoft", marketCap: 3_120_000_000_000, price: 412, vol: 0.015, drift: 0.0007, shock: [0.008, 0.011, -0.005, 0.014, 0.006], baseVolume: 22_000_000 },
  { symbol: "GOOGL", name: "Alphabet Inc", assetClass: "equity", sector: "Communication Services", industry: "Interactive Media", themes: "mega-cap,search,cloud", aliases: "alphabet,google", marketCap: 2_050_000_000_000, price: 168, vol: 0.018, drift: 0.0006, shock: [0.013, -0.009, 0.007, 0.017, 0.004], baseVolume: 28_000_000 },
  { symbol: "META", name: "Meta Platforms", assetClass: "equity", sector: "Communication Services", industry: "Interactive Media", themes: "mega-cap,ad-cycle", aliases: "meta,facebook", marketCap: 1_320_000_000_000, price: 566, vol: 0.022, drift: 0.0009, shock: [0.017, 0.005, -0.013, 0.021, 0.009], baseVolume: 15_000_000 },
  { symbol: "AMZN", name: "Amazon.com Inc", assetClass: "equity", sector: "Consumer Discretionary", industry: "E-commerce", themes: "mega-cap,cloud,margins", aliases: "amazon,aws", marketCap: 1_960_000_000_000, price: 186, vol: 0.019, drift: 0.0007, shock: [0.006, 0.012, 0.004, -0.008, 0.011], baseVolume: 41_000_000 },
  { symbol: "NFLX", name: "Netflix Inc", assetClass: "equity", sector: "Communication Services", industry: "Streaming", themes: "content,ad-tier", aliases: "netflix", marketCap: 296_000_000_000, price: 682, vol: 0.024, drift: 0.0006, shock: [-0.014, 0.006, 0.019, -0.007, 0.003], baseVolume: 3_100_000 },
  { symbol: "SPOT", name: "Spotify Technology", assetClass: "equity", exchange: "NYSE", sector: "Communication Services", industry: "Streaming", country: "SE", themes: "content,margins", aliases: "spotify", marketCap: 78_000_000_000, price: 372, vol: 0.027, drift: 0.0011, shock: [0.022, -0.006, 0.009, 0.014, -0.004], baseVolume: 1_900_000 },
  { symbol: "ORCL", name: "Oracle Corp", assetClass: "equity", exchange: "NYSE", sector: "Technology", industry: "Software", themes: "cloud,ai-infra", aliases: "oracle", marketCap: 402_000_000_000, price: 148, vol: 0.021, drift: 0.0013, shock: [0.028, 0.009, -0.012, 0.016, 0.007], baseVolume: 12_000_000 },
  { symbol: "CRM", name: "Salesforce Inc", assetClass: "equity", exchange: "NYSE", sector: "Technology", industry: "Software", themes: "saas,margins", aliases: "salesforce", marketCap: 268_000_000_000, price: 268, vol: 0.022, drift: -0.0002, shock: [-0.012, 0.004, -0.018, 0.006, -0.009], baseVolume: 6_200_000 },
  { symbol: "PLTR", name: "Palantir Technologies", assetClass: "equity", exchange: "NYSE", sector: "Technology", industry: "Data & AI Software", themes: "ai-infra,government", aliases: "palantir", marketCap: 84_000_000_000, price: 36, vol: 0.041, drift: 0.0019, shock: [0.036, -0.014, 0.019, 0.028, -0.011], baseVolume: 62_000_000 },
  // --- Financials / quality compounders ---
  { symbol: "JPM", name: "JPMorgan Chase", assetClass: "equity", exchange: "NYSE", sector: "Financials", industry: "Banks", themes: "rates,credit", aliases: "jpmorgan,jp morgan", marketCap: 618_000_000_000, price: 214, vol: 0.015, drift: 0.0006, shock: [0.007, 0.011, -0.004, 0.009, 0.005], baseVolume: 9_000_000 },
  { symbol: "GS", name: "Goldman Sachs", assetClass: "equity", exchange: "NYSE", sector: "Financials", industry: "Capital Markets", themes: "capital-markets,rates", aliases: "goldman", marketCap: 156_000_000_000, price: 496, vol: 0.019, drift: 0.0008, shock: [0.012, -0.005, 0.014, 0.008, -0.003], baseVolume: 2_400_000 },
  { symbol: "V", name: "Visa Inc", assetClass: "equity", exchange: "NYSE", sector: "Financials", industry: "Payment Networks", themes: "quality-compounder,payments", aliases: "visa", marketCap: 552_000_000_000, price: 278, vol: 0.012, drift: 0.0006, shock: [0.004, 0.003, -0.003, 0.007, 0.002], baseVolume: 6_100_000 },
  { symbol: "MA", name: "Mastercard Inc", assetClass: "equity", exchange: "NYSE", sector: "Financials", industry: "Payment Networks", themes: "quality-compounder,payments", aliases: "mastercard", marketCap: 448_000_000_000, price: 482, vol: 0.013, drift: 0.0006, shock: [0.005, 0.002, -0.004, 0.006, 0.003], baseVolume: 2_800_000 },
  { symbol: "BRK.B", name: "Berkshire Hathaway", assetClass: "equity", exchange: "NYSE", sector: "Financials", industry: "Conglomerate", themes: "quality-compounder,insurance", aliases: "berkshire", marketCap: 962_000_000_000, price: 452, vol: 0.011, drift: 0.0005, shock: [0.003, 0.006, 0.002, 0.004, 0.001], baseVolume: 3_400_000 },
  { symbol: "COST", name: "Costco Wholesale", assetClass: "equity", sector: "Consumer Staples", industry: "Retail", themes: "quality-compounder,membership", aliases: "costco", marketCap: 392_000_000_000, price: 884, vol: 0.014, drift: 0.0008, shock: [-0.006, 0.009, 0.013, -0.002, 0.005], baseVolume: 2_100_000 },
  { symbol: "NKE", name: "Nike Inc", assetClass: "equity", exchange: "NYSE", sector: "Consumer Discretionary", industry: "Apparel", themes: "turnaround", aliases: "nike", marketCap: 112_000_000_000, price: 76, vol: 0.021, drift: -0.0007, shock: [-0.019, -0.008, 0.011, -0.014, -0.006], baseVolume: 11_000_000 },
  { symbol: "SBUX", name: "Starbucks Corp", assetClass: "equity", sector: "Consumer Discretionary", industry: "Restaurants", themes: "turnaround", aliases: "starbucks", marketCap: 104_000_000_000, price: 92, vol: 0.02, drift: -0.0004, shock: [-0.011, 0.014, -0.007, 0.009, -0.004], baseVolume: 9_800_000 },
  // --- Healthcare / energy ---
  { symbol: "LLY", name: "Eli Lilly & Co", assetClass: "equity", exchange: "NYSE", sector: "Health Care", industry: "Pharmaceuticals", themes: "glp1,quality-compounder", aliases: "eli lilly,lilly", marketCap: 742_000_000_000, price: 782, vol: 0.023, drift: 0.0014, shock: [0.016, 0.007, -0.009, 0.019, 0.008], baseVolume: 3_200_000 },
  { symbol: "UNH", name: "UnitedHealth Group", assetClass: "equity", exchange: "NYSE", sector: "Health Care", industry: "Managed Care", themes: "quality-compounder,policy-risk", aliases: "unitedhealth", marketCap: 512_000_000_000, price: 552, vol: 0.02, drift: 0.0003, shock: [-0.014, -0.021, 0.006, -0.009, -0.005], baseVolume: 4_600_000 },
  { symbol: "ISRG", name: "Intuitive Surgical", assetClass: "equity", sector: "Health Care", industry: "Medical Devices", themes: "med-tech", aliases: "intuitive surgical", marketCap: 172_000_000_000, price: 486, vol: 0.018, drift: 0.0009, shock: [0.008, 0.005, 0.011, -0.003, 0.004], baseVolume: 1_400_000 },
  { symbol: "XOM", name: "Exxon Mobil Corp", assetClass: "equity", exchange: "NYSE", sector: "Energy", industry: "Integrated Oil", themes: "energy,cash-return", aliases: "exxon", marketCap: 468_000_000_000, price: 112, vol: 0.017, drift: 0.0002, shock: [-0.008, 0.012, 0.004, -0.011, 0.006], baseVolume: 16_000_000 },
  { symbol: "CVX", name: "Chevron Corp", assetClass: "equity", exchange: "NYSE", sector: "Energy", industry: "Integrated Oil", themes: "energy,cash-return", aliases: "chevron", marketCap: 262_000_000_000, price: 142, vol: 0.016, drift: 0.0001, shock: [-0.006, 0.009, 0.002, -0.008, 0.004], baseVolume: 8_800_000 },
  { symbol: "CAT", name: "Caterpillar Inc", assetClass: "equity", exchange: "NYSE", sector: "Industrials", industry: "Machinery", themes: "industrial-cycle,electrification", aliases: "caterpillar", marketCap: 168_000_000_000, price: 342, vol: 0.018, drift: 0.0004, shock: [0.005, -0.007, 0.009, 0.003, -0.002], baseVolume: 3_100_000 },
  // --- ETFs, rates, commodities, crypto ---
  { symbol: "SPY", name: "SPDR S&P 500 ETF", assetClass: "etf", exchange: "NYSE", sector: "Broad Index", themes: "benchmark,core", aliases: "s&p 500,sp500,spdr", marketCap: 0, price: 556, vol: 0.009, drift: 0.0004, shock: [0.003, -0.002, 0.005, 0.002, 0.004], baseVolume: 62_000_000 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", assetClass: "etf", sector: "Broad Index", themes: "benchmark,tech", aliases: "nasdaq 100,nasdaq", price: 472, vol: 0.011, drift: 0.0005, shock: [0.005, -0.003, 0.007, 0.004, 0.006], baseVolume: 41_000_000 },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", assetClass: "etf", exchange: "NYSE", sector: "Broad Index", themes: "small-cap,rates", aliases: "russell 2000,small caps", price: 208, vol: 0.014, drift: 0.0001, shock: [-0.006, 0.004, -0.008, 0.005, -0.003], baseVolume: 28_000_000 },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", assetClass: "etf", exchange: "NYSE", sector: "Semiconductors", themes: "ai-infra,basket", aliases: "semiconductor etf,semis", price: 248, vol: 0.021, drift: 0.0011, shock: [0.012, -0.007, 0.018, 0.009, 0.011], baseVolume: 9_200_000 },
  { symbol: "XLE", name: "Energy Select Sector SPDR", assetClass: "etf", exchange: "NYSE", sector: "Energy", themes: "energy,basket", aliases: "energy etf", price: 92, vol: 0.015, drift: 0.0001, shock: [-0.004, 0.007, 0.002, -0.006, 0.004], baseVolume: 14_000_000 },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", assetClass: "etf", sector: "Rates", themes: "duration,rates", aliases: "long bonds,treasuries", price: 94, vol: 0.011, drift: 0.0001, shock: [-0.009, -0.005, 0.007, -0.011, 0.004], baseVolume: 34_000_000 },
  { symbol: "GLD", name: "SPDR Gold Shares", assetClass: "commodity", exchange: "NYSE", sector: "Metals", themes: "real-assets,hedge", aliases: "gold", price: 242, vol: 0.010, drift: 0.0009, shock: [0.008, 0.004, 0.011, -0.003, 0.006], baseVolume: 7_400_000 },
  { symbol: "IBIT", name: "iShares Bitcoin Trust", assetClass: "crypto", sector: "Digital Assets", themes: "bitcoin,hedge", aliases: "bitcoin etf", price: 38, vol: 0.033, drift: 0.0016, shock: [0.019, -0.024, 0.031, 0.012, -0.009], baseVolume: 24_000_000 },
  { symbol: "BTC", name: "Bitcoin", assetClass: "crypto", sector: "Digital Assets", themes: "bitcoin,hedge", aliases: "bitcoin,btc", price: 63_500, vol: 0.031, drift: 0.0015, shock: [0.021, -0.026, 0.028, 0.014, -0.011], decimals: 0, baseVolume: 420_000 },
  { symbol: "ETH", name: "Ethereum", assetClass: "crypto", sector: "Digital Assets", themes: "smart-contracts", aliases: "ethereum,ether", price: 2_640, vol: 0.036, drift: 0.0011, shock: [0.014, -0.031, 0.024, 0.019, -0.017], decimals: 0, baseVolume: 1_200_000 },
  { symbol: "WTI", name: "WTI Crude Oil", assetClass: "commodity", sector: "Energy", themes: "energy,macro", aliases: "crude oil,west texas", price: 71.4, vol: 0.021, drift: -0.0004, shock: [-0.013, 0.019, 0.006, -0.017, 0.008], baseVolume: 380_000 },
  { symbol: "XAU", name: "Gold Spot", assetClass: "commodity", sector: "Metals", themes: "real-assets,macro", aliases: "gold spot,ounce", price: 2_486, vol: 0.009, drift: 0.0007, shock: [0.005, 0.003, 0.008, -0.002, 0.004], decimals: 2, baseVolume: 210_000 },
  { symbol: "DXY", name: "US Dollar Index", assetClass: "fx", sector: "Currencies", themes: "macro,dollar", aliases: "dollar index,usd", price: 101.4, vol: 0.005, drift: -0.0001, shock: [-0.003, 0.004, -0.002, 0.005, -0.001], baseVolume: 90_000 },
  { symbol: "US10Y", name: "US 10Y Treasury Yield", assetClass: "macro", sector: "Rates", themes: "macro,rates", aliases: "10-year yield,ten year,10y", price: 4.18, vol: 0.011, drift: 0.0002, shock: [0.008, 0.013, -0.004, 0.009, -0.006], decimals: 3, baseVolume: 0 },
  { symbol: "VIX", name: "CBOE Volatility Index", assetClass: "macro", sector: "Volatility", themes: "macro,risk", aliases: "volatility index,fear index", price: 15.8, vol: 0.062, drift: -0.0006, shock: [-0.012, 0.034, -0.019, 0.008, -0.022], decimals: 2, baseVolume: 0 },
];

export const ACCOUNTS = [
  { name: "Core Taxable", broker: "Fidelity", kind: "taxable", cash: 41_820 },
  { name: "Roth IRA", broker: "Schwab", kind: "roth", cash: 6_240 },
  { name: "Crypto Cold", broker: "Kraken", kind: "crypto", cash: 2_100 },
];

export const POSITIONS: { symbol: string; account: number; quantity: number; avgCost: number }[] = [
  { symbol: "AAPL", account: 0, quantity: 240, avgCost: 178.4 },
  { symbol: "MSFT", account: 0, quantity: 96, avgCost: 356.2 },
  { symbol: "NVDA", account: 0, quantity: 420, avgCost: 92.15 },
  { symbol: "AVGO", account: 0, quantity: 110, avgCost: 142.6 },
  { symbol: "TSM", account: 0, quantity: 180, avgCost: 128.9 },
  { symbol: "VRT", account: 0, quantity: 260, avgCost: 71.3 },
  { symbol: "GOOGL", account: 0, quantity: 300, avgCost: 141.8 },
  { symbol: "META", account: 0, quantity: 46, avgCost: 412.5 },
  { symbol: "AMZN", account: 0, quantity: 210, avgCost: 152.4 },
  { symbol: "LLY", account: 0, quantity: 34, avgCost: 612.0 },
  { symbol: "COST", account: 0, quantity: 22, avgCost: 682.5 },
  { symbol: "SPY", account: 0, quantity: 60, avgCost: 492.0 },
  { symbol: "GLD", account: 0, quantity: 420, avgCost: 214.8 },
  { symbol: "JPM", account: 1, quantity: 90, avgCost: 172.6 },
  { symbol: "V", account: 1, quantity: 120, avgCost: 243.1 },
  { symbol: "ISRG", account: 1, quantity: 44, avgCost: 398.5 },
  { symbol: "TLT", account: 1, quantity: 700, avgCost: 97.2 },
  { symbol: "BTC", account: 2, quantity: 1.35, avgCost: 41_200 },
  { symbol: "ETH", account: 2, quantity: 8.6, avgCost: 2_180 },
];

export const TRADES: { symbol: string; account: number; side: "buy" | "sell"; quantity: number; price: number; daysAgo: number; thesis?: string; rationale: string; tags: string }[] = [
  { symbol: "NVDA", account: 0, side: "buy", quantity: 120, price: 104.2, daysAgo: 96, thesis: "nvda-infra", rationale: "Added on the post-print drawdown; AI capex revisions stayed positive.", tags: "core,ai-infra" },
  { symbol: "VRT", account: 0, side: "buy", quantity: 160, price: 61.4, daysAgo: 88, thesis: "vrt-power", rationale: "Power/cooling bottleneck is the scarce input for AI clusters.", tags: "core,ai-infra" },
  { symbol: "MU", account: 0, side: "buy", quantity: 180, price: 88.9, daysAgo: 74, rationale: "HBM pricing re-acceleration; starter position into earnings.", tags: "tactical,memory" },
  { symbol: "MU", account: 0, side: "sell", quantity: 180, price: 103.6, daysAgo: 61, rationale: "Closed after 16% move; thesis depended on data we can't readily verify.", tags: "tactical,exit" },
  { symbol: "AAPL", account: 0, side: "sell", quantity: 60, price: 221.8, daysAgo: 58, thesis: "aapl-services", rationale: "Trimmed into strength, weight was 12% and China mix still unclear.", tags: "trim,risk" },
  { symbol: "TSM", account: 0, side: "buy", quantity: 90, price: 141.2, daysAgo: 52, thesis: "nvda-infra", rationale: "Foundry toll-taker on the same AI capex; add to basket.", tags: "core,ai-infra" },
  { symbol: "TLT", account: 1, side: "buy", quantity: 400, price: 95.4, daysAgo: 47, thesis: "tlt-duration", rationale: "Restarted duration ladder after the yield back-up.", tags: "macro,duration" },
  { symbol: "PLTR", account: 0, side: "buy", quantity: 300, price: 28.4, daysAgo: 41, rationale: "Small starter on government pipeline; flagged as high-vol watch item.", tags: "satellite,ai-infra" },
  { symbol: "PLTR", account: 0, side: "sell", quantity: 300, price: 35.1, daysAgo: 12, rationale: "Valuation outran the earnings path; recycled into VRT.", tags: "satellite,exit" },
  { symbol: "VRT", account: 0, side: "buy", quantity: 100, price: 84.6, daysAgo: 11, thesis: "vrt-power", rationale: "Recycled PLTR proceeds; sizing still under thesis target.", tags: "core,ai-infra" },
  { symbol: "UNH", account: 0, side: "sell", quantity: 40, price: 588.0, daysAgo: 9, rationale: "Exited entirely: policy review plus utilisation trend was a two-front risk.", tags: "exit,policy" },
  { symbol: "COST", account: 0, side: "buy", quantity: 12, price: 861.0, daysAgo: 6, thesis: "cost-quality", rationale: "Routine add on the membership fee-hike comp set-up.", tags: "quality" },
  { symbol: "BTC", account: 2, side: "buy", quantity: 0.35, price: 58_400, daysAgo: 4, thesis: "btc-hedge", rationale: "Rebalanced cold storage toward 10% of NAV.", tags: "crypto,hedge" },
  { symbol: "CAT", account: 0, side: "buy", quantity: 45, price: 338.5, daysAgo: 3, rationale: "Started a position on the power-generation/dealer backlog angle.", tags: "industrial" },
];

export type ThesisSeed = {
  key: string;
  symbol: string | null;
  title: string;
  stance: string;
  conviction: number;
  status: string;
  horizon: string;
  targetPrice: number | null;
  invalidation: string;
  body: string;
  tags: string;
  daysAgo: number;
  reviewInDays: number;
};

export const THESES: ThesisSeed[] = [
  { key: "nvda-infra", symbol: "NVDA", title: "AI compute is still supply-constrained, not demand-constrained", stance: "long", conviction: 4, status: "active", horizon: "18m", targetPrice: 148, invalidation: "Two consecutive hyperscaler capex guides cut, or gross margin < 70%.", body: "Own the accelerated-compute chain, not one name: NVDA as the compute standard, TSM as the foundry toll-taker, VRT/ETN as the power bottleneck. Thesis breaks on capex digestion, so track hyperscaler capex guides and lead times weekly.", tags: "ai-infra,core", daysAgo: 112, reviewInDays: 6 },
  { key: "vrt-power", symbol: "VRT", title: "Power + cooling is the real constraint on AI clusters", stance: "long", conviction: 4, status: "active", horizon: "24m", targetPrice: 125, invalidation: "Order backlog declines QoQ or liquid-cooling share loss to a major OEM.", body: "Grid interconnect queues run 3-5 years; the physical build-out needs switchgear, busway and liquid cooling faster than the grid can deliver. VRT has the installed base and service attach.", tags: "ai-infra,industrials", daysAgo: 88, reviewInDays: 14 },
  { key: "aapl-services", symbol: "AAPL", title: "Services mix carries the multiple while hardware stalls", stance: "long", conviction: 3, status: "trimmed", horizon: "12m", targetPrice: 242, invalidation: "Services growth < 8% yoy or regulatory action on default-payment economics.", body: "Hardware is a mature cash machine; the re-rating depends on Services gross margin and the installed base monetisation. Position weight drifted above target, so trimmed rather than exited.", tags: "mega-cap,quality", daysAgo: 140, reviewInDays: 21 },
  { key: "cost-quality", symbol: "COST", title: "Membership economics compound through the cycle", stance: "long", conviction: 3, status: "active", horizon: "36m", targetPrice: 950, invalidation: "Renewal rate below 90% or traffic declines two quarters running.", body: "Renewal rate plus fee-hike cadence gives a predictable earnings slope. Valuation is the risk, not the business — add on multiple compression, not momentum.", tags: "quality-compounder,staples", daysAgo: 64, reviewInDays: 30 },
  { key: "tlt-duration", symbol: "TLT", title: "Duration is the hedge that pays when growth cracks", stance: "long", conviction: 3, status: "active", horizon: "12m", targetPrice: 108, invalidation: "Core PCE re-accelerates above 3.5% or term premium blows out past 100bp.", body: "Held as portfolio insurance with a term-premium cap on size. Rolling ladder, no leverage, reviewed against every CPI/FOMC print.", tags: "macro,duration", daysAgo: 47, reviewInDays: 4 },
  { key: "btc-hedge", symbol: "BTC", title: "Small, capped allocation to a non-sovereign asset", stance: "long", conviction: 2, status: "active", horizon: "36m", targetPrice: null, invalidation: "Sustained correlation > 0.8 to QQQ for two quarters, or custody risk event.", body: "Sized at ~5-8% of NAV purely as a debasement hedge, with cold-storage custody and an explicit cap. No leverage, no yield chasing.", tags: "hedge,crypto", daysAgo: 210, reviewInDays: 45 },
  { key: "nvda-memory", symbol: "MU", title: "HBM tightness was tradable but not ownable", stance: "long", conviction: 2, status: "closed", horizon: "3m", targetPrice: 110, invalidation: "Contract pricing flattens for two months.", body: "Worked as a tactical trade. Closed because the edge depended on channel data I couldn't source reliably — the lesson is to stay out of positions I can't verify weekly.", tags: "tactical,lesson", daysAgo: 74, reviewInDays: 0 },
  { key: "unh-policy", symbol: "UNH", title: "Policy and utilisation risk made UNH un-ownable for now", stance: "avoid", conviction: 3, status: "invalidated", horizon: "n/a", targetPrice: null, invalidation: "n/a", body: "Exited the full position. Cost trend plus a policy review meant two independent risks that both needed to resolve; that is not a diversified bet, that is two bets.", tags: "policy,exit", daysAgo: 9, reviewInDays: 60 },
  { key: "asml-cycle", symbol: "ASML", title: "Watching for the lithography order inflection", stance: "long", conviction: 3, status: "idea", horizon: "24m", targetPrice: 880, invalidation: "EUV bookings stay flat through two print cycles.", body: "No position yet. Trigger: EUV bookings turn up in a quarterly print with high-NA commentary improving. Watchlist entry with a trigger price.", tags: "semis,watch", daysAgo: 33, reviewInDays: 10 },
  { key: "small-cap-rates", symbol: "IWM", title: "Small caps need the front end to break, not just the long end", stance: "macro", conviction: 2, status: "idea", horizon: "9m", targetPrice: null, invalidation: "2y yield makes new cycle highs.", body: "IWM is a rates trade in disguise: refinancing wall plus floating-rate debt means the front end matters more than the 10y. No position until the 2y breaks the range.", tags: "macro,rates", daysAgo: 21, reviewInDays: 14 },
];

export const NOTES: { kind: string; symbol: string | null; title: string; body: string; tags: string; daysAgo: number; sourceUrl?: string }[] = [
  { kind: "earnings", symbol: "NVDA", title: "NVDA FQ2 read-through: backlog, lead times, and the 2026 supply question", body: "Revenue beat driven by data-centre; management flagged supply, not demand, as the binding constraint. Key items to track: (1) Blackwell ramp cost commentary, (2) networking attach rate, (3) any change to the China regulatory carve-out. Guide implies ~$4bn of upside vs. consensus Q3.", tags: "ai-infra,earnings", daysAgo: 5, sourceUrl: "https://investor.nvidia.com" },
  { kind: "memo", symbol: "VRT", title: "Vertiv: sizing the liquid-cooling attach rate", body: "Estimating attach: each GW of AI capacity needs ~$3-4bn of power/cooling content across the chain. VRT's exposure is roughly 25-30% of that wallet today. Thesis target implies ~2.4x forward sales, which is rich — hold size, add only on 20%+ drawdown.", tags: "ai-infra,model", daysAgo: 12 },
  { kind: "model", symbol: "AAPL", title: "AAPL model rebuild: services margin scenario grid", body: "Three scenarios on Services growth (6/9/12%) crossed with a 3-point hardware gross-margin band. Base case $232 fair value. Upside case requires the AI device cycle to pull forward an upgrade cohort that hasn't refreshed since 2021.", tags: "mega-cap,model", daysAgo: 19 },
  { kind: "source", symbol: "TLT", title: "Term premium note: why 100bp is the size limit", body: "Primary research summary from the quarterly Treasury refunding statement plus TIPS breakevens. Term premium expansion is the risk to a long-duration position — cap exposure by premium, not by duration.", tags: "macro,rates", daysAgo: 26, sourceUrl: "https://home.treasury.gov" },
  { kind: "screen", symbol: null, title: "Screen: profitable compounders with falling share count", body: "Filtered for 5-year share count CAGR < -1.5%, ROIC > 15%, net cash-positive. Result set is the same nine names every quarter; used as a watchlist refresh rather than a discovery tool.", tags: "screen,quality", daysAgo: 31 },
  { kind: "call", symbol: "JPM", title: "Bank call notes: NII guide, credit normalisation, capital return", body: "NII guide nudged up on deposit repricing; card delinquencies normalising from a low base rather than deteriorating. Capital return cadence intact. Nothing here changes the position.", tags: "financials,call", daysAgo: 8 },
  { kind: "memo", symbol: "NKE", title: "NKE turnaround watch: what has to be true by summer", body: "Two things must hold: direct-to-consumer mix stops bleeding gross margin, and inventory days fall below 90. If neither happens in the next two prints, remove from the watchlist entirely.", tags: "turnaround,watch", daysAgo: 15 },
  { kind: "earnings", symbol: "MU", title: "Micron post-mortem: what I got right and wrong", body: "Right on the direction of contract pricing; wrong on the durability, and wrong to size it from channel checks I couldn't refresh weekly. Rule added to the journal: no position where the key input has a >1 week data lag.", tags: "lesson,memory", daysAgo: 58 },
  { kind: "memo", symbol: null, title: "Portfolio construction: concentration budget by theme", body: "Single-name cap 12%, single-theme cap 35%, single-account cap by liquidity. Currently AI-infra cluster sits at ~29% of NAV, which is inside budget but only just — any add must come from a trim elsewhere.", tags: "risk,construction", daysAgo: 7 },
  { kind: "source", symbol: "UNH", title: "Managed care: policy watch file and cost-trend data", body: "Pulled together the policy review timeline and medical cost-trend disclosures. Both point the same direction; recorded as the primary reason the position was closed.", tags: "policy,health", daysAgo: 10 },
  { kind: "model", symbol: "LLY", title: "LLY supply ramp: capacity math vs. demand estimates", body: "Capacity build-out supports the consensus demand curve only if fill/finish yields hold. The position is a capacity-ramp bet more than a demand bet.", tags: "health,model", daysAgo: 22 },
  { kind: "memo", symbol: null, title: "Q3 review checklist: the four questions I have to answer", body: "1) Is the AI-infra cluster earning its weight? 2) Is duration still the right hedge? 3) Did any satellite trade beat holding the core? 4) What did I learn from the two closed losers?", tags: "review,process", daysAgo: 2 },
];

export const NEWS: { headline: string; source: string; kind: string; summary: string; sentiment: number; hoursAgo: number; url?: string }[] = [
  { headline: "Broadcom lifts AI networking outlook as custom accelerator orders surge", source: "Reuters", kind: "news", summary: "AVGO raised its AI revenue outlook for the fiscal year, citing hyperscaler demand for custom accelerators and Tomahawk switching. Management said lead times remain extended and that networking attach per rack is rising faster than compute content. The commentary was read as supportive for the wider AI infrastructure chain including TSM and VRT, while the company flagged continued supply tightness for advanced packaging.", sentiment: 0.62, hoursAgo: 3 },
  { headline: "TSMC says advanced packaging capacity sold out through next year", source: "Bloomberg", kind: "news", summary: "TSMC told suppliers that CoWoS advanced packaging capacity is fully allocated into next year, with expansion on track at two sites. The foundry reiterated that ramp costs will pressure gross margin near term. Analysts framed the comments as confirming that AI compute demand is supply-constrained rather than demand-limited, a key plank of the NVDA and AVGO theses.", sentiment: 0.48, hoursAgo: 6 },
  { headline: "Vertiv order backlog hits record on data-centre liquid cooling demand", source: "Barron's", kind: "news", summary: "VRT reported a record backlog with order growth led by liquid cooling and busway products for AI training clusters. Management described grid interconnect delays as the primary execution risk and said it is expanding service capacity to protect attach rates. The print was the largest single-day move in the shares this year.", sentiment: 0.66, hoursAgo: 11 },
  { headline: "Apple delays mixed-reality software features; services growth stays on track", source: "WSJ", kind: "news", summary: "Apple is pushing several spatial-computing software features to next year while reiterating that services revenue growth remains in the high single to low double digits. Supply chain sources describe hardware order cuts in the mid-single digits. The services trajectory is the swing factor for the multiple, according to sell-side notes.", sentiment: -0.12, hoursAgo: 14 },
  { headline: "UnitedHealth faces expanded policy review of prior-authorisation practices", source: "Reuters", kind: "news", summary: "A US regulator widened its review of UnitedHealth's prior-authorisation and claims-denial practices, adding a second workstream to an existing inquiry. Managed care peers traded lower on sympathy. The development follows the position exit and keeps the sector on the avoid list.", sentiment: -0.58, hoursAgo: 20 },
  { headline: "Fed officials split on timing of first cut as core inflation cools slowly", source: "Financial Times", kind: "macro", summary: "Minutes showed a split committee, with several participants wanting more evidence on disinflation before cutting. Rate futures trimmed odds of an imminent move and the 10-year yield drifted higher, pressuring long-duration exposure. Small caps closed lower as the front end repriced.", sentiment: -0.22, hoursAgo: 26 },
  { headline: "Micron guides higher on HBM pricing; memory peers rally", source: "Bloomberg", kind: "news", summary: "Micron guided well above consensus citing high-bandwidth memory pricing and tight supply. Samsung and SK Hynix traded higher in sympathy, while Nvidia's supply commentary stayed unchanged. Note the prior tactical position in Micron was already closed.", sentiment: 0.55, hoursAgo: 30 },
  { headline: "Costco posts steady traffic growth but membership fee-hike timing still unclear", source: "CNBC", kind: "earnings", summary: "Costco reported mid-single-digit comparable traffic growth with stable renewal rates. Management declined to signal the timing of the next membership fee increase, which the buy side has been underwriting as a 2026 earnings driver. Gross margin was flattered by fuel.", sentiment: 0.18, hoursAgo: 34 },
  { headline: "Amazon cloud capex plan raises questions on AI returns timeline", source: "The Information", kind: "news", summary: "Amazon outlined a larger capital budget for data-centre build-out, with management saying returns will build through the decade. Some investors pressed on depreciation timing versus revenue contribution. For the AI-infra cluster, guidance direction matters more than timing debates.", sentiment: 0.24, hoursAgo: 41 },
  { headline: "Eli Lilly expands manufacturing capacity for obesity franchise", source: "Reuters", kind: "news", summary: "Eli Lilly announced an additional fill/finish facility, targeting a meaningful step up in supply through next year. Management has repeatedly pointed to supply rather than demand as the constraint. Capacity-ramp execution remains the main risk to the position.", sentiment: 0.42, hoursAgo: 47 },
  { headline: "10-year Treasury yield backs up to 4.2% after strong auction tail", source: "Bloomberg", kind: "macro", summary: "A soft auction tail pushed the 10-year yield back toward the top of its range, with dealers absorbing more supply than expected. Duration-heavy portfolios gave back part of the month's gains, and TLT underperformed.", sentiment: -0.31, hoursAgo: 52 },
  { headline: "Bitcoin ETFs see largest weekly inflow since spring", source: "CoinDesk", kind: "news", summary: "Spot Bitcoin ETFs recorded their largest weekly net inflow in months, with IBIT leading. Correlation to the Nasdaq 100 also rose, which cuts against the diversification rationale for the position. Position sizing remains capped.", sentiment: 0.44, hoursAgo: 58 },
  { headline: "Meta ad checks point to stable pricing into the holiday quarter", source: "Business Insider", kind: "news", summary: "Agency checks suggest Meta ad pricing is broadly stable with improving conversion from AI-driven ranking. Spending from smaller direct-response advertisers is holding up better than brand budgets.", sentiment: 0.35, hoursAgo: 63 },
  { headline: "Nvidia files new supply agreement language in 8-K on foundry allocation", source: "SEC Filing", kind: "filing", summary: "The filing updates language on foundry capacity allocation and prepayment obligations. No change to guidance. Filings of this type matter for mapping the chain: allocation terms are the closest public proxy for how tight advanced foundry supply is.", sentiment: 0.2, hoursAgo: 68 },
  { headline: "Nike inventory days improve but wholesale channel still soft", source: "WSJ", kind: "news", summary: "Inventory days improved sequentially while wholesale orders remain cautious. The direct-to-consumer mix continued to pressure gross margin. Watch item only — no position, and the watchlist criteria require two more clean prints.", sentiment: 0.05, hoursAgo: 72 },
  { headline: "Palantir wins expanded government data contract", source: "Reuters", kind: "news", summary: "Palantir secured an expanded federal data-integration contract. The shares had already de-rated from their highs after the earlier exit, and valuation remains the reason it sits on the watchlist rather than in the book.", sentiment: 0.4, hoursAgo: 79 },
  { headline: "Caterpillar warns on dealer inventory as power-generation demand offsets", source: "Bloomberg", kind: "news", summary: "Caterpillar flagged elevated dealer inventory in construction while power-generation orders for data-centre backup capacity continued to grow. The power angle is the reason the position was started; the inventory commentary is the risk to watch.", sentiment: -0.16, hoursAgo: 86 },
  { headline: "Credit spreads tighten to cycle lows, small-cap refinancing wall eases slightly", source: "Financial Times", kind: "macro", summary: "Investment-grade spreads reached cycle tights while high-yield issuance reopened for lower-rated small caps, modestly reducing near-term refinancing pressure. Still not enough to change the IWM thesis, which needs a front-end move.", sentiment: 0.28, hoursAgo: 94 },
  { headline: "Google Cloud wins multi-year AI infrastructure contract", source: "Reuters", kind: "news", summary: "Alphabet's cloud unit signed a multi-year agreement for AI training capacity with a large enterprise buyer. Analysts noted the deal is more evidence that compute demand is being contracted forward, a positive for TSM and ASML order pipeline.", sentiment: 0.38, hoursAgo: 102 },
  { headline: "ASML bookings miss as memory customers delay lithography orders", source: "Bloomberg", kind: "earnings", summary: "ASML bookings came in below consensus as memory customers pushed out EUV orders, though logic demand held up. The company reiterated its long-term revenue target. The watchlist trigger for the lithography inflection thesis is explicitly a bookings turn, so this print does not unlock it.", sentiment: -0.36, hoursAgo: 118 },
];

export const CATALYSTS: { symbol: string | null; kind: string; title: string; daysAhead: number; note: string; importance: number }[] = [
  { symbol: "AVGO", kind: "earnings", title: "Broadcom Q3 earnings", daysAhead: 2, note: "AI revenue guide and custom-accelerator backlog are the two numbers that matter.", importance: 3 },
  { symbol: null, kind: "macro", title: "Core PCE inflation print", daysAhead: 3, note: "Direct input to the duration thesis; watch the 3-month annualised run rate.", importance: 3 },
  { symbol: "VRT", kind: "conference", title: "Vertiv investor day", daysAhead: 5, note: "Liquid-cooling attach rate and 2026 capacity commentary.", importance: 3 },
  { symbol: "NVDA", kind: "earnings", title: "NVIDIA FQ3 earnings", daysAhead: 8, note: "Supply commentary and networking attach; the cluster's single biggest event.", importance: 3 },
  { symbol: "TSM", kind: "earnings", title: "TSMC monthly revenue (Oct)", daysAhead: 9, note: "Advanced packaging utilisation read.", importance: 2 },
  { symbol: null, kind: "macro", title: "FOMC decision", daysAhead: 11, note: "Dot plot versus market pricing; term premium reaction matters more than the cut itself.", importance: 3 },
  { symbol: "COST", kind: "earnings", title: "Costco Q1 earnings", daysAhead: 12, note: "Renewal rate and any membership fee-hike signal.", importance: 2 },
  { symbol: "AAPL", kind: "earnings", title: "Apple Q4 earnings", daysAhead: 14, note: "Services growth versus hardware order cuts; the multiple hinges on services.", importance: 3 },
  { symbol: "LLY", kind: "earnings", title: "Eli Lilly Q3 earnings", daysAhead: 16, note: "Supply ramp and capacity commentary.", importance: 2 },
  { symbol: "SPY", kind: "ex-div", title: "SPY quarterly distribution", daysAhead: 18, note: "Cash drag timing for the taxable account.", importance: 1 },
  { symbol: "META", kind: "earnings", title: "Meta Q3 earnings", daysAhead: 19, note: "Ad pricing plus capex guide; capex matters for the AI-infra chain too.", importance: 3 },
  { symbol: "TLT", kind: "ex-div", title: "TLT monthly distribution", daysAhead: 21, note: "Reinvest ladder rung.", importance: 1 },
  { symbol: null, kind: "macro", title: "Nonfarm payrolls", daysAhead: 6, note: "Front-end repricing check for the small-cap thesis.", importance: 2 },
  { symbol: "CAT", kind: "earnings", title: "Caterpillar Q3 earnings", daysAhead: 23, note: "Dealer inventory versus power-generation orders.", importance: 2 },
];

export const WATCHLISTS: { listName: string; note: string; items: { symbol: string; triggerPrice?: number; note: string; rank: number }[] }[] = [
  {
    listName: "AI Infrastructure",
    note: "The only theme with a live trigger-price discipline attached.",
    items: [
      { symbol: "NVDA", triggerPrice: 104, note: "Add only on a capex-digestion drawdown.", rank: 1 },
      { symbol: "AVGO", triggerPrice: 148, note: "Networking attach is the free option.", rank: 2 },
      { symbol: "VRT", triggerPrice: 82, note: "Add the final 60 shares toward thesis size.", rank: 3 },
      { symbol: "ASML", triggerPrice: 640, note: "Trigger is bookings, not price.", rank: 4 },
      { symbol: "ETN", triggerPrice: 296, note: "Electrification side of the same wallet.", rank: 5 },
      { symbol: "SMH", note: "Basket proxy if single-name risk gets too concentrated.", rank: 6 },
    ],
  },
  {
    listName: "Quality Compounders",
    note: "Add-on-compression names, bought on multiples not momentum.",
    items: [
      { symbol: "COST", triggerPrice: 820, note: "Add on compression, never on momentum.", rank: 1 },
      { symbol: "V", triggerPrice: 258, note: "Payments duopoly at the low end of the range.", rank: 2 },
      { symbol: "MA", triggerPrice: 448, note: "Pairs with V; only one gets funded at a time.", rank: 3 },
      { symbol: "LLY", triggerPrice: 700, note: "Capacity-ramp news matters more than price.", rank: 4 },
      { symbol: "ISRG", triggerPrice: 452, note: "Procedure growth versus capital budgets.", rank: 5 },
    ],
  },
  {
    listName: "Rates & Macro Probes",
    note: "Signals that would change the duration and small-cap theses.",
    items: [
      { symbol: "US10Y", triggerPrice: 4.35, note: "Above 4.35% stops all duration adds.", rank: 1 },
      { symbol: "IWM", triggerPrice: 196, note: "Only worth engaging once the 2y breaks.", rank: 2 },
      { symbol: "DXY", triggerPrice: 104, note: "Dollar strength = margin pressure offshore.", rank: 3 },
      { symbol: "VIX", triggerPrice: 22, note: "Vol spike = position-sizing reset, not a buy signal.", rank: 4 },
    ],
  },
];

export const ALERTS: { kind: string; symbol: string | null; threshold: number | null; keyword?: string; note: string; active: boolean }[] = [
  { kind: "price_below", symbol: "NVDA", threshold: 104, note: "Cluster add zone for the final tranche.", active: true },
  { kind: "price_below", symbol: "VRT", threshold: 82, note: "Thesis add trigger.", active: true },
  { kind: "price_above", symbol: "US10Y", threshold: 4.35, note: "Duration add freeze level.", active: true },
  { kind: "price_above", symbol: "GLD", threshold: 255, note: "Hedge is getting crowded — review size.", active: true },
  { kind: "pct_move", symbol: "BTC", threshold: 0.07, note: "Any 7% day: check the cap.", active: true },
  { kind: "pct_move", symbol: "TLT", threshold: 0.02, note: "Duration shock check.", active: true },
  { kind: "news_keyword", symbol: null, threshold: null, keyword: "guidance cut", note: "Any holding or thesis name cutting guidance.", active: true },
  { kind: "news_keyword", symbol: null, threshold: null, keyword: "export restrictions", note: "Supply-chain policy risk across the cluster.", active: true },
  { kind: "thesis_review", symbol: null, threshold: null, note: "Flag theses past their review date.", active: true },
  { kind: "price_above", symbol: "AAPL", threshold: 242, note: "Trim decision level per the thesis.", active: false },
];

export const ALERT_EVENTS: { alertIdx: number; symbol: string; message: string; value: number; hoursAgo: number }[] = [
  { alertIdx: 1, symbol: "VRT", message: "VRT traded below 82.00 (thesis add trigger)", value: 81.86, hoursAgo: 4 },
  { alertIdx: 5, symbol: "TLT", message: "TLT moved -2.1% in a session (duration shock check)", value: -0.021, hoursAgo: 9 },
  { alertIdx: 2, symbol: "US10Y", message: "US10Y yield crossed 4.35% — duration adds frozen", value: 4.37, hoursAgo: 15 },
  { alertIdx: 0, symbol: "NVDA", message: "NVDA traded below 104.00 (cluster add zone)", value: 103.65, hoursAgo: 38 },
  { alertIdx: 3, symbol: "GLD", message: "GLD crossed 255.00 — hedge size review", value: 256.4, hoursAgo: 62 },
  { alertIdx: 6, symbol: "CAT", message: "News keyword 'guidance cut' matched a CAT story", value: 0, hoursAgo: 84 },
];

export const JOURNAL: { kind: string; title: string; body: string; decision: string; symbol: string | null; thesis?: string; daysAgo: number; reviewInDays?: number; outcome?: string }[] = [
  { kind: "decision", title: "Recycled PLTR into VRT", body: "Satellite trade hit its valuation ceiling faster than the earnings path could catch up. Moved the proceeds into the core power/cooling name, which has a thesis I can verify quarterly rather than weekly.", decision: "buy", symbol: "VRT", thesis: "vrt-power", daysAgo: 11, reviewInDays: 90 },
  { kind: "decision", title: "Exited UNH on two-front risk", body: "A policy review and an adverse utilisation trend are two independent risks, both unresolved. Two unresolved risks is not one bet, it is two; that does not belong in the book at any size.", decision: "sell", symbol: "UNH", thesis: "unh-policy", daysAgo: 9, reviewInDays: 120 },
  { kind: "review", title: "Trim discipline worked on AAPL", body: "Weight had drifted to 12% on appreciation alone. Trimming into strength rather than on a signal is the rule I keep having to relearn.", decision: "trim", symbol: "AAPL", thesis: "aapl-services", daysAgo: 58, outcome: "Good: the subsequent drawdown cost 40bp less than holding the full weight." },
  { kind: "mistake", title: "Sized MU from channel data I could not refresh", body: "The trade worked, the process failed. The input driving it had a multi-week data lag, so the position could not be updated honestly. New rule: no position where the key input is older than a week.", decision: "hold", symbol: "MU", thesis: "nvda-memory", daysAgo: 61, outcome: "Worked out, process did not. Rule added." },
  { kind: "observation", title: "The AI cluster is now a single factor bet", body: "NVDA, TSM, AVGO and VRT are all levered to the same capex line. At ~29% of NAV, the cluster is really one position with four tickers. Any add must come from a trim inside the cluster or from elsewhere.", decision: "hold", symbol: "NVDA", thesis: "nvda-infra", daysAgo: 7, reviewInDays: 30 },
  { kind: "decision", title: "Started CAT for the power-generation angle", body: "Data-centre backup power demand sits inside the same constraint as the rest of the AI-infra build-out, with a much lower multiple. Starter size only, thesis is dealer backlog.", decision: "buy", symbol: "CAT", daysAgo: 3, reviewInDays: 60 },
  { kind: "review", title: "Q3 checklist answers", body: "Cluster is earning its weight on order data; duration hedge is doing its job but not paying; both closed trades were process errors rather than thesis errors.", decision: "hold", symbol: null, daysAgo: 2, reviewInDays: 30 },
  { kind: "decision", title: "Held duration size flat through the auction tail", body: "Term-premium expansion is inside the cap I set for the position, so no action. Writing it down because inaction needs a reason too.", decision: "hold", symbol: "TLT", thesis: "tlt-duration", daysAgo: 2, reviewInDays: 14 },
];
