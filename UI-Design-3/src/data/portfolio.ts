import { mulberry32, gaussian, stdev, mean, covariance } from "@/lib/rand";

export const TODAY = new Date("2026-02-13T21:00:00Z");
export const AS_OF = "Fri 13 Feb 2026 · 16:00 ET";

export type AssetClass = "Equity" | "ETF" | "Fixed Income" | "Digital Assets" | "Cash";
export type AccountName = "Taxable" | "Roth IRA" | "401(k)";

export interface Lot {
  id: string;
  date: string;
  qty: number;
  price: number;
}

interface Seed {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  region: string;
  account: AccountName;
  qty: number;
  avgCost: number;
  price: number;
  prevClose: number;
  divYield: number;
  divFreq: number;
  payMonths: number[];
  ret3y: number;
  vol: number;
  seed: number;
  targetWeight: number;
  conviction: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  thesis: string;
  firstBuy: string;
  nextEarnings?: string;
  analyst?: { buy: number; hold: number; sell: number; pt: number };
}

const SEEDS: Seed[] = [
  {
    ticker: "NVDA", name: "NVIDIA Corp", assetClass: "Equity", sector: "Information Technology",
    region: "United States", account: "Taxable", qty: 240, avgCost: 96.4, price: 187.32, prevClose: 183.1,
    divYield: 0.02, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: 1.82, vol: 0.46, seed: 101,
    targetWeight: 5, conviction: 5, tags: ["AI infrastructure", "Semis", "Core"],
    thesis: "Accelerated-compute standard. Owning the toolchain (CUDA) is the moat; watch hyperscaler capex cadence.",
    firstBuy: "2023-03-09", nextEarnings: "2026-02-25",
    analyst: { buy: 54, hold: 6, sell: 1, pt: 214 },
  },
  {
    ticker: "MSFT", name: "Microsoft Corp", assetClass: "Equity", sector: "Information Technology",
    region: "United States", account: "Roth IRA", qty: 210, avgCost: 318.75, price: 512.44, prevClose: 515.8,
    divYield: 0.68, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: 0.74, vol: 0.23, seed: 202,
    targetWeight: 11, conviction: 5, tags: ["Cloud", "Compounder", "Core"],
    thesis: "Azure + Copilot attach rate is the whole story. Margin resilience despite AI capex is the key metric.",
    firstBuy: "2023-02-21", nextEarnings: "2026-04-28",
    analyst: { buy: 48, hold: 5, sell: 0, pt: 585 },
  },
  {
    ticker: "AAPL", name: "Apple Inc", assetClass: "Equity", sector: "Information Technology",
    region: "United States", account: "Taxable", qty: 300, avgCost: 152.1, price: 268.91, prevClose: 266.2,
    divYield: 0.42, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: 0.79, vol: 0.24, seed: 303,
    targetWeight: 8, conviction: 4, tags: ["Hardware", "Buybacks"],
    thesis: "Installed base annuity. Services mix keeps re-rating the multiple; device cycle is optionality, not the case.",
    firstBuy: "2023-02-15", nextEarnings: "2026-04-30",
    analyst: { buy: 33, hold: 14, sell: 3, pt: 281 },
  },
  {
    ticker: "ASML", name: "ASML Holding NV", assetClass: "Equity", sector: "Information Technology",
    region: "Europe", account: "Taxable", qty: 45, avgCost: 612.0, price: 1042.7, prevClose: 1030.15,
    divYield: 0.75, divFreq: 4, payMonths: [1, 4, 7, 10], ret3y: 0.62, vol: 0.34, seed: 404,
    targetWeight: 5, conviction: 5, tags: ["Monopoly", "Semis", "Europe"],
    thesis: "Single-source EUV. Bookings are lumpy — judge on two-year backlog, never one quarter.",
    firstBuy: "2023-06-02", nextEarnings: "2026-04-15",
    analyst: { buy: 29, hold: 5, sell: 1, pt: 1180 },
  },
  {
    ticker: "TSM", name: "Taiwan Semiconductor ADR", assetClass: "Equity", sector: "Information Technology",
    region: "Asia Pacific", account: "Taxable", qty: 260, avgCost: 88.2, price: 214.66, prevClose: 217.9,
    divYield: 1.1, divFreq: 4, payMonths: [0, 3, 6, 9], ret3y: 1.25, vol: 0.33, seed: 505,
    targetWeight: 6, conviction: 4, tags: ["Foundry", "Geopolitical"],
    thesis: "Node leadership plus pricing power. Sized deliberately below conviction because of strait risk.",
    firstBuy: "2023-04-18", nextEarnings: "2026-04-16",
    analyst: { buy: 31, hold: 2, sell: 0, pt: 252 },
  },
  {
    ticker: "AMZN", name: "Amazon.com Inc", assetClass: "Equity", sector: "Consumer Discretionary",
    region: "United States", account: "Roth IRA", qty: 180, avgCost: 128.55, price: 243.18, prevClose: 240.02,
    divYield: 0, divFreq: 0, payMonths: [], ret3y: 1.08, vol: 0.28, seed: 606,
    targetWeight: 5, conviction: 4, tags: ["Cloud", "Retail", "Margin story"],
    thesis: "Retail margin expansion is the underwritten part; AWS re-acceleration is the free option.",
    firstBuy: "2023-03-01", nextEarnings: "2026-04-23",
    analyst: { buy: 52, hold: 3, sell: 0, pt: 289 },
  },
  {
    ticker: "COST", name: "Costco Wholesale", assetClass: "Equity", sector: "Consumer Staples",
    region: "United States", account: "Roth IRA", qty: 40, avgCost: 512.3, price: 928.4, prevClose: 934.1,
    divYield: 0.52, divFreq: 4, payMonths: [1, 4, 7, 10], ret3y: 0.71, vol: 0.19, seed: 707,
    targetWeight: 4, conviction: 4, tags: ["Membership", "Defensive"],
    thesis: "Membership fee income is the earnings engine. Expensive, and I keep paying for it.",
    firstBuy: "2023-08-11", nextEarnings: "2026-03-05",
    analyst: { buy: 21, hold: 11, sell: 1, pt: 1015 },
  },
  {
    ticker: "UNH", name: "UnitedHealth Group", assetClass: "Equity", sector: "Health Care",
    region: "United States", account: "Taxable", qty: 85, avgCost: 452.6, price: 361.25, prevClose: 358.4,
    divYield: 2.31, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: -0.24, vol: 0.27, seed: 808,
    targetWeight: 3, conviction: 2, tags: ["Under review", "Regulatory"],
    thesis: "Medical loss ratio still drifting. On watch — thesis violation if MLR > 89% for two more quarters.",
    firstBuy: "2024-01-22", nextEarnings: "2026-04-14",
    analyst: { buy: 18, hold: 9, sell: 3, pt: 402 },
  },
  {
    ticker: "NVO", name: "Novo Nordisk B ADR", assetClass: "Equity", sector: "Health Care",
    region: "Europe", account: "Taxable", qty: 210, avgCost: 112.4, price: 74.86, prevClose: 76.1,
    divYield: 2.05, divFreq: 2, payMonths: [2, 7], ret3y: -0.33, vol: 0.31, seed: 909,
    targetWeight: 2, conviction: 2, tags: ["GLP-1", "Loser", "Under review"],
    thesis: "Obesity TAM intact but pricing power broke. Halved the position; remainder is an option on oral scale-up.",
    firstBuy: "2023-11-07", nextEarnings: "2026-05-06",
    analyst: { buy: 14, hold: 12, sell: 4, pt: 88 },
  },
  {
    ticker: "JPM", name: "JPMorgan Chase", assetClass: "Equity", sector: "Financials",
    region: "United States", account: "Taxable", qty: 140, avgCost: 148.9, price: 312.55, prevClose: 309.7,
    divYield: 1.95, divFreq: 4, payMonths: [0, 3, 6, 9], ret3y: 1.12, vol: 0.22, seed: 111,
    targetWeight: 5, conviction: 4, tags: ["Fortress balance sheet", "Rates"],
    thesis: "Best-in-class deposit franchise; benefits from curve steepening and from everyone else's mistakes.",
    firstBuy: "2023-05-19", nextEarnings: "2026-04-10",
    analyst: { buy: 20, hold: 8, sell: 2, pt: 335 },
  },
  {
    ticker: "BRK.B", name: "Berkshire Hathaway B", assetClass: "Equity", sector: "Financials",
    region: "United States", account: "Taxable", qty: 60, avgCost: 362.1, price: 498.2, prevClose: 496.55,
    divYield: 0, divFreq: 0, payMonths: [], ret3y: 0.52, vol: 0.16, seed: 121,
    targetWeight: 4, conviction: 4, tags: ["Ballast", "Cash-rich"],
    thesis: "A hedged index fund with $300bn of optionality. This is my volatility dampener, not my alpha.",
    firstBuy: "2023-02-28", nextEarnings: "2026-02-28",
  },
  {
    ticker: "XOM", name: "Exxon Mobil Corp", assetClass: "Equity", sector: "Energy",
    region: "United States", account: "Taxable", qty: 150, avgCost: 98.4, price: 124.85, prevClose: 126.4,
    divYield: 3.12, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: 0.18, vol: 0.25, seed: 131,
    targetWeight: 3, conviction: 3, tags: ["Inflation hedge", "Income"],
    thesis: "Owned as an inflation and geopolitics hedge, funded by the dividend. Not a growth position.",
    firstBuy: "2023-09-14", nextEarnings: "2026-04-28",
    analyst: { buy: 16, hold: 11, sell: 2, pt: 138 },
  },
  {
    ticker: "LIN", name: "Linde plc", assetClass: "Equity", sector: "Materials",
    region: "Europe", account: "Roth IRA", qty: 35, avgCost: 398.2, price: 471.6, prevClose: 469.9,
    divYield: 1.25, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: 0.34, vol: 0.18, seed: 141,
    targetWeight: 2, conviction: 3, tags: ["Industrial gases", "Quality"],
    thesis: "Take-or-pay contracts with inflation pass-through. The most bond-like equity I own.",
    firstBuy: "2024-02-09", nextEarnings: "2026-05-01",
  },
  {
    ticker: "VTI", name: "Vanguard Total Stock Market", assetClass: "ETF", sector: "Broad Market",
    region: "United States", account: "401(k)", qty: 320, avgCost: 218.4, price: 331.72, prevClose: 330.05,
    divYield: 1.22, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: 0.51, vol: 0.15, seed: 151,
    targetWeight: 14, conviction: 5, tags: ["Core", "Index", "Auto-invest"],
    thesis: "The default. Every dollar I can't justify actively goes here on the first of the month.",
    firstBuy: "2023-02-13",
  },
  {
    ticker: "VXUS", name: "Vanguard Total Intl Stock", assetClass: "ETF", sector: "Broad Market",
    region: "Global ex-US", account: "401(k)", qty: 410, avgCost: 54.1, price: 72.38, prevClose: 72.85,
    divYield: 2.85, divFreq: 4, payMonths: [2, 5, 8, 11], ret3y: 0.31, vol: 0.14, seed: 161,
    targetWeight: 6, conviction: 4, tags: ["Core", "Index", "Diversifier"],
    thesis: "Valuation gap versus US is two standard deviations wide. Rebalancing into it mechanically.",
    firstBuy: "2023-02-13",
  },
  {
    ticker: "IEF", name: "iShares 7-10Y Treasury", assetClass: "Fixed Income", sector: "Government Bonds",
    region: "United States", account: "401(k)", qty: 300, avgCost: 96.2, price: 99.14, prevClose: 98.9,
    divYield: 3.65, divFreq: 12, payMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], ret3y: 0.06, vol: 0.07, seed: 171,
    targetWeight: 6, conviction: 3, tags: ["Duration", "Ballast"],
    thesis: "Duration back as a diversifier now that the correlation with equities has turned negative again.",
    firstBuy: "2023-10-03",
  },
  {
    ticker: "BTC", name: "Bitcoin", assetClass: "Digital Assets", sector: "Digital Assets",
    region: "Global", account: "Taxable", qty: 0.85, avgCost: 41200, price: 96480, prevClose: 99120,
    divYield: 0, divFreq: 0, payMonths: [], ret3y: 2.9, vol: 0.58, seed: 181,
    targetWeight: 5, conviction: 3, tags: ["Asymmetric", "Volatile"],
    thesis: "Sized so a total loss is survivable and a 5x is meaningful. Rebalance band is ±3pp, no exceptions.",
    firstBuy: "2023-07-25",
  },
  {
    ticker: "SHOP", name: "Shopify Inc", assetClass: "Equity", sector: "Information Technology",
    region: "North America", account: "Roth IRA", qty: 250, avgCost: 62.8, price: 148.3, prevClose: 145.1,
    divYield: 0, divFreq: 0, payMonths: [], ret3y: 1.55, vol: 0.42, seed: 191,
    targetWeight: 3, conviction: 3, tags: ["Commerce", "High beta"],
    thesis: "Take-rate expansion through payments and capital. A high-beta expression of consumer resilience.",
    firstBuy: "2023-12-05", nextEarnings: "2026-02-18",
    analyst: { buy: 26, hold: 13, sell: 2, pt: 171 },
  },
];

/* ---------------------------------------------------------------- calendar */
function tradingDays(years: number): Date[] {
  const out: Date[] = [];
  const start = new Date(TODAY);
  start.setUTCFullYear(start.getUTCFullYear() - years);
  const d = new Date(start);
  while (d <= TODAY) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export const DAYS = tradingDays(3);
export const N = DAYS.length;
export const DATES = DAYS.map((d) => d.toISOString().slice(0, 10));

/** Brownian bridge: random path with an exact terminal value. */
function bridgePath(endValue: number, totalReturn: number, vol: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const dt = 1 / 252;
  const sd = vol * Math.sqrt(dt);
  const start = endValue / (1 + totalReturn);
  const logs: number[] = [Math.log(start)];
  for (let i = 1; i < N; i++) {
    const shock = gaussian(rng) * sd;
    // occasional fat tail
    const jump = rng() < 0.012 ? gaussian(rng) * sd * 4 : 0;
    logs.push(logs[i - 1] + shock + jump);
  }
  const target = Math.log(endValue);
  const drift = (target - logs[N - 1]) / (N - 1);
  return logs.map((l, i) => Math.exp(l + drift * i));
}

/* --------------------------------------------------------------- holdings */
export interface Holding extends Seed {
  id: string;
  series: number[];
  marketValue: number;
  costBasis: number;
  unrealized: number;
  unrealizedPct: number;
  dayChange: number;
  dayChangePct: number;
  dayPL: number;
  weight: number;
  beta: number;
  volatility: number;
  lots: Lot[];
  annualIncome: number;
  yieldOnCost: number;
  r1w: number;
  r1m: number;
  r3m: number;
  rYtd: number;
  r1y: number;
  high52: number;
  low52: number;
}

const BENCH = bridgePath(6412.4, 0.446, 0.147, 7771);
export const BENCH_SERIES = BENCH;

function periodReturn(s: number[], daysBack: number) {
  const i = Math.max(0, s.length - 1 - daysBack);
  return (s[s.length - 1] / s[i] - 1) * 100;
}

const ytdIndex = DATES.findIndex((d) => d >= "2026-01-01");

function buildLots(s: Seed): Lot[] {
  const rng = mulberry32(s.seed + 55);
  const n = s.qty > 100 ? 3 : 2;
  const lots: Lot[] = [];
  let remaining = s.qty;
  const first = new Date(s.firstBuy).getTime();
  const span = TODAY.getTime() - first;
  for (let i = 0; i < n; i++) {
    const qty = i === n - 1 ? remaining : Math.round((s.qty * (0.25 + rng() * 0.3)) * 100) / 100;
    remaining = Math.round((remaining - qty) * 100) / 100;
    const at = new Date(first + span * (i / n) * (0.55 + rng() * 0.4));
    lots.push({ id: `${s.ticker}-L${i + 1}`, date: at.toISOString().slice(0, 10), qty, price: 0 });
  }
  // price lots around avg cost, then correct the last so the weighted avg is exact
  let acc = 0;
  lots.forEach((l, i) => {
    if (i < lots.length - 1) {
      l.price = Math.round(s.avgCost * (0.78 + rng() * 0.44) * 100) / 100;
      acc += l.price * l.qty;
    }
  });
  const last = lots[lots.length - 1];
  last.price = Math.round(((s.avgCost * s.qty - acc) / last.qty) * 100) / 100;
  return lots.sort((a, b) => a.date.localeCompare(b.date));
}

const benchRets: number[] = [];
for (let i = 1; i < N; i++) benchRets.push(BENCH[i] / BENCH[i - 1] - 1);

export const HOLDINGS: Holding[] = SEEDS.map((s) => {
  const series = bridgePath(s.price, s.ret3y, s.vol, s.seed);
  series[N - 2] = s.prevClose;
  series[N - 1] = s.price;
  const rets: number[] = [];
  for (let i = 1; i < N; i++) rets.push(series[i] / series[i - 1] - 1);
  const beta = covariance(rets, benchRets) / (stdev(benchRets) ** 2);
  const marketValue = s.qty * s.price;
  const costBasis = s.qty * s.avgCost;
  const last252 = series.slice(-252);
  return {
    ...s,
    id: s.ticker,
    series,
    marketValue,
    costBasis,
    unrealized: marketValue - costBasis,
    unrealizedPct: (marketValue / costBasis - 1) * 100,
    dayChange: s.price - s.prevClose,
    dayChangePct: (s.price / s.prevClose - 1) * 100,
    dayPL: s.qty * (s.price - s.prevClose),
    weight: 0,
    beta: Math.round(beta * 100) / 100,
    volatility: stdev(rets.slice(-252)) * Math.sqrt(252) * 100,
    lots: buildLots(s),
    annualIncome: (marketValue * s.divYield) / 100,
    yieldOnCost: costBasis > 0 ? ((marketValue * s.divYield) / 100 / costBasis) * 100 : 0,
    r1w: periodReturn(series, 5),
    r1m: periodReturn(series, 21),
    r3m: periodReturn(series, 63),
    rYtd: (series[N - 1] / series[ytdIndex] - 1) * 100,
    r1y: periodReturn(series, 252),
    high52: Math.max(...last252),
    low52: Math.min(...last252),
  };
});

/* ------------------------------------------------------------------- cash */
export interface CashAccount {
  id: string;
  label: string;
  account: AccountName;
  balance: number;
  apy: number;
  kind: "Settlement" | "Money market" | "Savings";
}

export const CASH: CashAccount[] = [
  { id: "c1", label: "Settlement cash", account: "Taxable", balance: 21480.55, apy: 4.18, kind: "Settlement" },
  { id: "c2", label: "VMFXX money market", account: "Taxable", balance: 34200.0, apy: 4.42, kind: "Money market" },
  { id: "c3", label: "Uninvested cash", account: "Roth IRA", balance: 9180.2, apy: 4.18, kind: "Settlement" },
  { id: "c4", label: "Capital reserve", account: "401(k)", balance: 7340.0, apy: 4.05, kind: "Savings" },
];

export const CASH_TOTAL = CASH.reduce((a, c) => a + c.balance, 0);
export const INVESTED = HOLDINGS.reduce((a, h) => a + h.marketValue, 0);
export const TOTAL_VALUE = INVESTED + CASH_TOTAL;
export const TOTAL_COST = HOLDINGS.reduce((a, h) => a + h.costBasis, 0);
export const TOTAL_UNREALIZED = INVESTED - TOTAL_COST;
export const DAY_PL = HOLDINGS.reduce((a, h) => a + h.dayPL, 0);
export const DAY_PL_PCT = (DAY_PL / (TOTAL_VALUE - DAY_PL)) * 100;
export const CASH_WEIGHT = (CASH_TOTAL / TOTAL_VALUE) * 100;

HOLDINGS.forEach((h) => {
  h.weight = (h.marketValue / TOTAL_VALUE) * 100;
});

/* --------------------------------------------- portfolio time-weighted path */
const CASH_DAILY = 0.0425 / 252;
const wSum = HOLDINGS.reduce((a, h) => a + h.marketValue, 0) + CASH_TOTAL;

export const PORT_TWR: number[] = [100];
for (let i = 1; i < N; i++) {
  let r = (CASH_TOTAL / wSum) * CASH_DAILY;
  for (const h of HOLDINGS) r += (h.marketValue / wSum) * (h.series[i] / h.series[i - 1] - 1);
  PORT_TWR.push(PORT_TWR[i - 1] * (1 + r));
}
export const BENCH_TWR = BENCH.map((v) => (v / BENCH[0]) * 100);

/* ------------------------------------------------- value & contributions */
export interface Flow {
  date: string;
  amount: number;
  label: string;
}

const FLOWS: Flow[] = [];
{
  // monthly auto-invest on the first trading day of each month
  let lastMonth = -1;
  DATES.forEach((d, i) => {
    if (i === 0) {
      lastMonth = new Date(d).getUTCMonth();
      return;
    }
    const m = new Date(d).getUTCMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      FLOWS.push({ date: d, amount: 3000, label: "Monthly auto-invest" });
    }
  });
  FLOWS.push({ date: DATES[Math.floor(N * 0.34)], amount: 26000, label: "Bonus deployment" });
  FLOWS.push({ date: DATES[Math.floor(N * 0.62)], amount: -18500, label: "Withdrawal — home deposit" });
  FLOWS.push({ date: DATES[Math.floor(N * 0.86)], amount: 12000, label: "Bonus deployment" });
}

const flowByDate = new Map<string, number>();
FLOWS.forEach((f) => flowByDate.set(f.date, (flowByDate.get(f.date) ?? 0) + f.amount));

// solve for the starting capital so today's value matches the real book
const growth: number[] = new Array(N).fill(1);
for (let i = 1; i < N; i++) growth[i] = growth[i - 1] * (PORT_TWR[i] / PORT_TWR[i - 1]);
let flowFV = 0;
DATES.forEach((d, i) => {
  const f = flowByDate.get(d);
  if (f) flowFV += f * (growth[N - 1] / growth[i]);
});
const V0 = (TOTAL_VALUE - flowFV) / growth[N - 1];

export interface ValuePoint {
  date: string;
  value: number;
  contributed: number;
}

export const VALUE_SERIES: ValuePoint[] = [];
{
  let v = V0;
  let c = V0;
  DATES.forEach((d, i) => {
    if (i > 0) v *= PORT_TWR[i] / PORT_TWR[i - 1];
    const f = flowByDate.get(d);
    if (f) {
      v += f;
      c += f;
    }
    VALUE_SERIES.push({ date: d, value: v, contributed: c });
  });
  VALUE_SERIES[N - 1].value = TOTAL_VALUE;
}

export const NET_CONTRIBUTED = VALUE_SERIES[N - 1].contributed;
export const LIFETIME_GAIN = TOTAL_VALUE - NET_CONTRIBUTED;

/* ------------------------------------------------------------ performance */
export const RANGES = ["1M", "3M", "6M", "YTD", "1Y", "3Y"] as const;
export type Range = (typeof RANGES)[number];

export function rangeStart(r: Range): number {
  switch (r) {
    case "1M": return Math.max(0, N - 22);
    case "3M": return Math.max(0, N - 64);
    case "6M": return Math.max(0, N - 127);
    case "YTD": return ytdIndex;
    case "1Y": return Math.max(0, N - 253);
    case "3Y": return 0;
  }
}

export const PERIODS: { key: string; label: string; back: number }[] = [
  { key: "1D", label: "1 day", back: 1 },
  { key: "1W", label: "1 week", back: 5 },
  { key: "1M", label: "1 month", back: 21 },
  { key: "3M", label: "3 months", back: 63 },
  { key: "YTD", label: "Year to date", back: N - 1 - ytdIndex },
  { key: "1Y", label: "1 year", back: 252 },
  { key: "3Y", label: "3 years", back: N - 1 },
];

export const RETURNS = PERIODS.map((p) => {
  const i = Math.max(0, N - 1 - p.back);
  return {
    ...p,
    port: (PORT_TWR[N - 1] / PORT_TWR[i] - 1) * 100,
    bench: (BENCH_TWR[N - 1] / BENCH_TWR[i] - 1) * 100,
    value: VALUE_SERIES[N - 1].value - VALUE_SERIES[i].value,
  };
});

const portRets: number[] = [];
for (let i = 1; i < N; i++) portRets.push(PORT_TWR[i] / PORT_TWR[i - 1] - 1);

export const DRAWDOWN = (() => {
  let peak = PORT_TWR[0];
  return PORT_TWR.map((v, i) => {
    peak = Math.max(peak, v);
    return { date: DATES[i], dd: (v / peak - 1) * 100 };
  });
})();

const benchDD = (() => {
  let peak = BENCH_TWR[0];
  return BENCH_TWR.map((v) => {
    peak = Math.max(peak, v);
    return (v / peak - 1) * 100;
  });
})();

const RF = 0.0425;
const annVol = stdev(portRets) * Math.sqrt(252);
const annRet = (PORT_TWR[N - 1] / PORT_TWR[0]) ** (252 / (N - 1)) - 1;
const benchAnnRet = (BENCH_TWR[N - 1] / BENCH_TWR[0]) ** (252 / (N - 1)) - 1;
const benchVol = stdev(benchRets) * Math.sqrt(252);
const downside = stdev(portRets.filter((r) => r < 0)) * Math.sqrt(252);
const beta = covariance(portRets, benchRets) / stdev(benchRets) ** 2;
const te = stdev(portRets.map((r, i) => r - benchRets[i])) * Math.sqrt(252);
const upDays = portRets.filter((_, i) => benchRets[i] > 0);
const upBench = benchRets.filter((r) => r > 0);
const downDays = portRets.filter((_, i) => benchRets[i] < 0);
const downBench = benchRets.filter((r) => r < 0);

export const RISK = {
  annRet: annRet * 100,
  benchAnnRet: benchAnnRet * 100,
  vol: annVol * 100,
  benchVol: benchVol * 100,
  sharpe: (annRet - RF) / annVol,
  benchSharpe: (benchAnnRet - RF) / benchVol,
  sortino: (annRet - RF) / downside,
  beta,
  alpha: (annRet - (RF + beta * (benchAnnRet - RF))) * 100,
  maxDD: Math.min(...DRAWDOWN.map((d) => d.dd)),
  benchMaxDD: Math.min(...benchDD),
  trackingError: te * 100,
  infoRatio: (annRet - benchAnnRet) / te,
  upCapture: (mean(upDays) / mean(upBench)) * 100,
  downCapture: (mean(downDays) / mean(downBench)) * 100,
  hitRate: (portRets.filter((r) => r > 0).length / portRets.length) * 100,
  bestDay: Math.max(...portRets) * 100,
  worstDay: Math.min(...portRets) * 100,
  corr: covariance(portRets, benchRets) / (stdev(portRets) * stdev(benchRets)),
  portBeta: HOLDINGS.reduce((a, h) => a + (h.weight / 100) * h.beta, 0),
};

/* monthly returns matrix */
export interface MonthCell {
  year: number;
  month: number;
  ret: number;
}
export const MONTHLY: MonthCell[] = (() => {
  const out: MonthCell[] = [];
  let curY = new Date(DATES[0]).getUTCFullYear();
  let curM = new Date(DATES[0]).getUTCMonth();
  let startVal = PORT_TWR[0];
  for (let i = 1; i < N; i++) {
    const d = new Date(DATES[i]);
    if (d.getUTCMonth() !== curM) {
      out.push({ year: curY, month: curM, ret: (PORT_TWR[i - 1] / startVal - 1) * 100 });
      curY = d.getUTCFullYear();
      curM = d.getUTCMonth();
      startVal = PORT_TWR[i - 1];
    }
  }
  out.push({ year: curY, month: curM, ret: (PORT_TWR[N - 1] / startVal - 1) * 100 });
  return out;
})();

/* contribution to return over the last year */
export const CONTRIBUTIONS = HOLDINGS.map((h) => ({
  ticker: h.ticker,
  name: h.name,
  contribution: (h.weight / 100) * h.r1y,
  ret: h.r1y,
  weight: h.weight,
  pl: h.unrealized,
})).sort((a, b) => b.contribution - a.contribution);

/* ------------------------------------------------------------- groupings */
export function groupBy<T extends keyof Holding>(key: T) {
  const map = new Map<string, { label: string; value: number; weight: number; holdings: Holding[] }>();
  for (const h of HOLDINGS) {
    const k = String(h[key]);
    const cur = map.get(k) ?? { label: k, value: 0, weight: 0, holdings: [] };
    cur.value += h.marketValue;
    cur.weight += h.weight;
    cur.holdings.push(h);
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

/* --------------------------------------------------------------- activity */
export type TxType = "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdrawal" | "Fee" | "Interest";
export interface Tx {
  id: string;
  date: string;
  type: TxType;
  ticker?: string;
  qty?: number;
  price?: number;
  amount: number;
  account: AccountName;
  note?: string;
  realized?: number;
}

export const TRANSACTIONS: Tx[] = (() => {
  const out: Tx[] = [];
  let n = 0;
  const id = () => `tx${(++n).toString().padStart(3, "0")}`;

  const manual: Omit<Tx, "id">[] = [
    { date: "2026-02-11", type: "Buy", ticker: "ASML", qty: 8, price: 1018.4, amount: -8147.2, account: "Taxable", note: "Adding on EUV order softness" },
    { date: "2026-02-05", type: "Sell", ticker: "NVO", qty: 90, price: 78.2, amount: 7038, account: "Taxable", note: "Halving — thesis impaired", realized: -3078 },
    { date: "2026-02-02", type: "Buy", ticker: "VTI", qty: 9, price: 328.1, amount: -2952.9, account: "401(k)", note: "Auto-invest" },
    { date: "2026-01-28", type: "Dividend", ticker: "JPM", amount: 176.4, account: "Taxable" },
    { date: "2026-01-21", type: "Buy", ticker: "TSM", qty: 40, price: 205.6, amount: -8224, account: "Taxable", note: "Rebalance into weakness" },
    { date: "2026-01-16", type: "Sell", ticker: "UNH", qty: 25, price: 372.1, amount: 9302.5, account: "Taxable", note: "Trimming — MLR watch", realized: -2012.5 },
    { date: "2026-01-02", type: "Buy", ticker: "VTI", qty: 9, price: 322.8, amount: -2905.2, account: "401(k)", note: "Auto-invest" },
    { date: "2025-12-19", type: "Dividend", ticker: "VTI", amount: 318.7, account: "401(k)" },
    { date: "2025-12-15", type: "Buy", ticker: "BTC", qty: 0.15, price: 88400, amount: -13260, account: "Taxable", note: "Rebalance band breach" },
    { date: "2025-12-09", type: "Fee", amount: -24, account: "Taxable", note: "ADR custody fee — TSM" },
    { date: "2025-12-01", type: "Buy", ticker: "VXUS", qty: 30, price: 70.15, amount: -2104.5, account: "401(k)", note: "Auto-invest" },
    { date: "2025-11-24", type: "Dividend", ticker: "MSFT", amount: 174.3, account: "Roth IRA" },
    { date: "2025-11-18", type: "Buy", ticker: "SHOP", qty: 60, price: 131.2, amount: -7872, account: "Roth IRA" },
    { date: "2025-11-10", type: "Sell", ticker: "XOM", qty: 40, price: 119.9, amount: 4796, account: "Taxable", note: "Trim to target", realized: 860 },
    { date: "2025-10-31", type: "Interest", amount: 241.18, account: "Taxable", note: "Money-market accrual" },
    { date: "2025-10-22", type: "Buy", ticker: "LIN", qty: 12, price: 452.3, amount: -5427.6, account: "Roth IRA" },
    { date: "2025-10-06", type: "Dividend", ticker: "XOM", amount: 148.2, account: "Taxable" },
    { date: "2025-09-29", type: "Buy", ticker: "NVDA", qty: 30, price: 164.5, amount: -4935, account: "Taxable", note: "Scaling core position" },
    { date: "2025-09-12", type: "Sell", ticker: "AAPL", qty: 30, price: 244.8, amount: 7344, account: "Taxable", note: "Concentration control", realized: 2781 },
    { date: "2025-08-28", type: "Dividend", ticker: "AAPL", amount: 79.5, account: "Taxable" },
    { date: "2025-08-14", type: "Buy", ticker: "IEF", qty: 100, price: 97.4, amount: -9740, account: "401(k)", note: "Adding duration" },
    { date: "2025-07-30", type: "Dividend", ticker: "NVO", amount: 214.9, account: "Taxable" },
    { date: "2025-07-15", type: "Buy", ticker: "COST", qty: 6, price: 872.4, amount: -5234.4, account: "Roth IRA" },
    { date: "2025-06-26", type: "Sell", ticker: "BTC", qty: 0.1, price: 102300, amount: 10230, account: "Taxable", note: "Band rebalance — trim", realized: 6110 },
  ];
  manual.forEach((m) => out.push({ id: id(), ...m }));

  FLOWS.filter((f) => f.date >= "2025-02-01").forEach((f) => {
    out.push({
      id: id(),
      date: f.date,
      type: f.amount > 0 ? "Deposit" : "Withdrawal",
      amount: f.amount,
      account: f.amount > 0 ? "Taxable" : "Taxable",
      note: f.label,
    });
  });

  return out.sort((a, b) => b.date.localeCompare(a.date));
})();

export const REALIZED_YTD = TRANSACTIONS.filter((t) => t.date >= "2026-01-01" && t.realized).reduce(
  (a, t) => a + (t.realized ?? 0),
  0,
);
export const REALIZED_LTM = TRANSACTIONS.filter((t) => t.realized).reduce((a, t) => a + (t.realized ?? 0), 0);

/* --------------------------------------------------------------- dividends */
export interface DivEvent {
  ticker: string;
  month: number;
  year: number;
  amount: number;
}

export const DIV_CALENDAR: DivEvent[] = (() => {
  const out: DivEvent[] = [];
  const startM = TODAY.getUTCMonth();
  const startY = TODAY.getUTCFullYear();
  for (let k = 0; k < 12; k++) {
    const m = (startM + k) % 12;
    const y = startY + Math.floor((startM + k) / 12);
    for (const h of HOLDINGS) {
      if (!h.divFreq || !h.payMonths.includes(m)) continue;
      out.push({ ticker: h.ticker, month: m, year: y, amount: h.annualIncome / h.divFreq });
    }
  }
  return out;
})();

export const ANNUAL_INCOME = HOLDINGS.reduce((a, h) => a + h.annualIncome, 0);
export const CASH_INCOME = CASH.reduce((a, c) => a + (c.balance * c.apy) / 100, 0);
export const PORT_YIELD = (ANNUAL_INCOME / INVESTED) * 100;

export const DIV_HISTORY = [
  { year: 2023, amount: 4120 },
  { year: 2024, amount: 5486 },
  { year: 2025, amount: 6902 },
  { year: 2026, amount: ANNUAL_INCOME },
];

/* ------------------------------------------------------------- rebalancing */
export interface DriftRow {
  ticker: string;
  name: string;
  weight: number;
  target: number;
  drift: number;
  deltaUSD: number;
  action: "Buy" | "Sell" | "Hold";
}

export const DRIFT: DriftRow[] = HOLDINGS.map((h) => {
  const drift = h.weight - h.targetWeight;
  const deltaUSD = (h.targetWeight / 100) * TOTAL_VALUE - h.marketValue;
  return {
    ticker: h.ticker,
    name: h.name,
    weight: h.weight,
    target: h.targetWeight,
    drift,
    deltaUSD,
    action: (Math.abs(drift) < 0.75 ? "Hold" : drift > 0 ? "Sell" : "Buy") as DriftRow["action"],
  };
}).sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

/* ------------------------------------------------------------ concentration */
const sorted = [...HOLDINGS].sort((a, b) => b.weight - a.weight);
export const TOP5_WEIGHT = sorted.slice(0, 5).reduce((a, h) => a + h.weight, 0);
export const HHI = Math.round(HOLDINGS.reduce((a, h) => a + h.weight ** 2, 0));
export const EFFECTIVE_N = Math.round(10000 / HHI);

export const MOVERS = [...HOLDINGS].sort((a, b) => b.dayChangePct - a.dayChangePct);

export function holdingByTicker(t: string) {
  return HOLDINGS.find((h) => h.ticker === t);
}
