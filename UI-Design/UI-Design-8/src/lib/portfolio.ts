export type HoldingType = "Equity" | "ETF" | "Fund" | "ETC";

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  type: HoldingType;
  qty: number;
  avgCost: number;
  avgCcy: "GBP" | "USD";
  price: number;
  priceCcy: "GBP" | "USD";
  valueGbp: number;
  costGbp: number;
  gainGbp: number;
  gainPct: number;
  dayPct: number;
  dayGbp: number;
  weight: number;
  color: string;
  sector: string;
  region: string;
  note?: string;
}

export const FX_GBPUSD = 1.3393;
export const USD_TO_GBP = 1 / FX_GBPUSD;

export const PORTFOLIO = {
  totalValue: 37271,
  contributions: 23764,
  totalGain: 13507,
  totalGainPct: 56.8,
  annualised: 7.5,
  years: 6.2,
  dayGain: 269,
  dayPct: 0.72,
  invested: 37271,
  cash: 0,
  holdingsCount: 7,
  updatedSeconds: 67,
};

export const HOLDINGS: Holding[] = [
  {
    id: "voo",
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    exchange: "NYSE Arca",
    type: "ETF",
    qty: 15,
    avgCost: 455.0,
    avgCcy: "USD",
    price: 701.78,
    priceCcy: "USD",
    valueGbp: 7860,
    costGbp: 5096,
    gainGbp: 2764,
    gainPct: 54.2,
    dayPct: 0.11,
    dayGbp: 9,
    weight: 21.1,
    color: "#2f5af6",
    sector: "US Large Cap",
    region: "United States",
    note: "Core US equity building block. 503 stocks, 0.03% fee.",
  },
  {
    id: "bgfd",
    ticker: "BGFD",
    name: "Baillie Gifford Global Discovery",
    exchange: "LSE · B Inc",
    type: "Fund",
    qty: 500,
    avgCost: 10.0,
    avgCcy: "GBP",
    price: 13.23,
    priceCcy: "GBP",
    valueGbp: 6615,
    costGbp: 5000,
    gainGbp: 1615,
    gainPct: 32.3,
    dayPct: 1.3,
    dayGbp: 85,
    weight: 17.8,
    color: "#7c3aed",
    sector: "Global Growth",
    region: "Global",
    note: "Active small/mid-cap growth. Highest volatility in the book.",
  },
  {
    id: "asml",
    ticker: "ASML",
    name: "ASML Holding N.V.",
    exchange: "NASDAQ",
    type: "Equity",
    qty: 5,
    avgCost: 720.0,
    avgCcy: "USD",
    price: 1679.92,
    priceCcy: "USD",
    valueGbp: 6272,
    costGbp: 2688,
    gainGbp: 3584,
    gainPct: 133.3,
    dayPct: 3.08,
    dayGbp: 187,
    weight: 16.8,
    color: "#0ea5e9",
    sector: "Semiconductors",
    region: "Netherlands",
    note: "Largest single-stock bet. Lithography monopoly, cyclical.",
  },
  {
    id: "msft",
    ticker: "MSFT",
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    type: "Equity",
    qty: 14,
    avgCost: 310.2,
    avgCcy: "USD",
    price: 465.05,
    priceCcy: "USD",
    valueGbp: 4860,
    costGbp: 3242,
    gainGbp: 1618,
    gainPct: 49.9,
    dayPct: 0.84,
    dayGbp: 40,
    weight: 13.0,
    color: "#0f766e",
    sector: "Software",
    region: "United States",
    note: "Held directly plus ~6% of VOO. True weight is higher — see X-Ray.",
  },
  {
    id: "relx",
    ticker: "REL",
    name: "RELX PLC",
    exchange: "LSE",
    type: "Equity",
    qty: 110,
    avgCost: 28.4,
    avgCcy: "GBP",
    price: 38.5,
    priceCcy: "GBP",
    valueGbp: 4235,
    costGbp: 3124,
    gainGbp: 1111,
    gainPct: 35.6,
    dayPct: -0.42,
    dayGbp: -18,
    weight: 11.4,
    color: "#dc2626",
    sector: "Industrials",
    region: "United Kingdom",
    note: "Defensive compounder. Data & analytics, GBP earner.",
  },
  {
    id: "sgln",
    ticker: "SGLN",
    name: "iShares Physical Gold",
    exchange: "LSE",
    type: "ETC",
    qty: 62,
    avgCost: 52.1,
    avgCcy: "GBP",
    price: 63.71,
    priceCcy: "GBP",
    valueGbp: 3950,
    costGbp: 3230,
    gainGbp: 720,
    gainPct: 22.3,
    dayPct: -0.25,
    dayGbp: -10,
    weight: 10.6,
    color: "#b45309",
    sector: "Gold",
    region: "Global",
    note: "Portfolio ballast. Tends to zig when equities zag.",
  },
  {
    id: "ulvr",
    ticker: "ULVR",
    name: "Unilever PLC",
    exchange: "LSE",
    type: "Equity",
    qty: 78,
    avgCost: 40.2,
    avgCcy: "GBP",
    price: 44.6,
    priceCcy: "GBP",
    valueGbp: 3479,
    costGbp: 3136,
    gainGbp: 343,
    gainPct: 10.9,
    dayPct: 0.35,
    dayGbp: 12,
    weight: 9.3,
    color: "#16a34a",
    sector: "Consumer Staples",
    region: "United Kingdom",
    note: "Income anchor. 3.4% yield, low beta.",
  },
];

export interface TapeItem {
  label: string;
  value: string;
  change: number;
}

export const TAPE: TapeItem[] = [
  { label: "S&P 500", value: "7,650.50", change: 0.17 },
  { label: "Nasdaq", value: "26,522.55", change: 0.39 },
  { label: "FTSE 100", value: "10,659.13", change: -0.27 },
  { label: "Euro Stoxx 50", value: "6,236.20", change: -1.37 },
  { label: "Asia Pac ex-JP", value: "43.12", change: -1.61 },
  { label: "Emerging Mkts", value: "67.03", change: 0.18 },
  { label: "VIX", value: "14.81", change: -4.08 },
  { label: "Gold", value: "4,424.90", change: 0.57 },
  { label: "WTI Crude", value: "96.08", change: -1.18 },
  { label: "Brent", value: "99.29", change: -0.64 },
  { label: "GBP/USD", value: "1.3393", change: 0.26 },
  { label: "EUR/USD", value: "1.1490", change: 0.09 },
];

export interface HistoryPoint {
  t: string;
  label: string;
  value: number;
  benchmark: number;
}

// Deterministic pseudo-random for stable history
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function buildHistory(range: string): HistoryPoint[] {
  // End at 19 Sep 2026 to match screenshots
  const end = new Date(2026, 8, 19);
  let days = 66;
  if (range === "1M") days = 22;
  if (range === "3M") days = 66;
  if (range === "6M") days = 132;
  if (range === "YTD") days = 175;
  if (range === "1Y") days = 260;
  if (range === "3Y") days = 780;
  if (range === "MAX") days = 1610;

  const step = range === "3Y" || range === "MAX" ? 22 : range === "1Y" || range === "YTD" ? 4 : 1;
  const pts: HistoryPoint[] = [];
  // Anchor levels so chart resembles screenshot for 3M but coherent long-term
  // Start levels per range (reconciled to £37,271 end)
  const startMap: Record<string, number> = {
    "1M": 36680,
    "3M": 37040,
    "6M": 35200,
    YTD: 33800,
    "1Y": 31400,
    "3Y": 26200,
    MAX: 23764,
  };
  const start = startMap[range] ?? 37040;
  const n = Math.floor(days / step);
  // Shape: use a blend of drift + waves + noise that mimics screenshot dips for 3M
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const d = new Date(end.getTime() - (n - i) * step * 86400000);
    // wave components
    const w1 = Math.sin(f * 9.2 + 1.3) * (range === "3M" ? 620 : 480);
    const w2 = Math.sin(f * 23.7) * 160;
    const noise = (rand(i * 3.7 + n) - 0.5) * 220;
    // dip in middle for 3M to echo screenshot drawdown early Aug
    let dip = 0;
    if (range === "3M") {
      dip = -Math.exp(-Math.pow((f - 0.58) * 6, 2)) * 1250;
    }
    const drift = start + (PORTFOLIO.totalValue - start) * Math.pow(f, 1.15);
    const value = Math.round(drift + w1 * (0.35 + 0.65 * (1 - f * 0.5)) + w2 + noise + dip);
    // benchmark: slightly below portfolio, smoother
    const bDrift = start * 0.985 + (PORTFOLIO.totalValue * 0.94 - start * 0.985) * f;
    const bValue = Math.round(bDrift + Math.sin(f * 6.1 + 0.5) * 320 + (rand(i * 1.3) - 0.5) * 90);
    pts.push({ t: isoDate(d), label: fmtDate(d), value, benchmark: bValue });
  }
  // force last point exact
  pts[pts.length - 1].value = PORTFOLIO.totalValue;
  return pts;
}

export const REGIONS = [
  { label: "United States", pct: 52.6, value: 19605, color: "#2f5af6" },
  { label: "United Kingdom", pct: 24.7, value: 9207, color: "#0f766e" },
  { label: "Europe ex-UK", pct: 14.2, value: 5292, color: "#7c3aed" },
  { label: "Gold / Other", pct: 8.5, value: 3167, color: "#b45309" },
];

export const SECTORS = [
  { label: "Technology", pct: 33.6, color: "#2f5af6" },
  { label: "Healthcare & Growth", pct: 14.8, color: "#7c3aed" },
  { label: "Financials", pct: 11.8, color: "#0ea5e9" },
  { label: "Industrials", pct: 10.2, color: "#dc2626" },
  { label: "Consumer Staples", pct: 9.3, color: "#16a34a" },
  { label: "Gold", pct: 10.6, color: "#b45309" },
  { label: "Other", pct: 9.7, color: "#94a3b8" },
];

export const LOOKTHROUGH = [
  { label: "Microsoft", pct: 6.9, detail: "4.1% direct · 2.8% via VOO", color: "#0f766e" },
  { label: "Apple", pct: 4.6, detail: "via VOO", color: "#111827" },
  { label: "ASML", pct: 17.1, detail: "16.8% direct · 0.3% via VOO", color: "#0ea5e9" },
  { label: "Nvidia", pct: 3.9, detail: "via VOO + BG Discovery", color: "#16a34a" },
  { label: "Amazon", pct: 2.6, detail: "via VOO", color: "#f59e0b" },
  { label: "RELX", pct: 11.4, detail: "direct", color: "#dc2626" },
  { label: "Unilever", pct: 9.3, detail: "direct", color: "#16a34a" },
  { label: "Gold bullion", pct: 10.6, detail: "via SGLN", color: "#b45309" },
];

export const MONTHLY: { m: string; v: number | null }[][] = [
  [
    { m: "2024", v: null },
    { m: "Jan", v: 1.8 },
    { m: "Feb", v: 2.4 },
    { m: "Mar", v: 1.1 },
    { m: "Apr", v: -1.6 },
    { m: "May", v: 2.2 },
    { m: "Jun", v: 1.4 },
    { m: "Jul", v: 0.8 },
    { m: "Aug", v: -0.9 },
    { m: "Sep", v: 1.9 },
    { m: "Oct", v: 0.6 },
    { m: "Nov", v: 2.8 },
    { m: "Dec", v: 1.2 },
  ],
  [
    { m: "2025", v: null },
    { m: "Jan", v: 2.1 },
    { m: "Feb", v: -0.4 },
    { m: "Mar", v: 1.6 },
    { m: "Apr", v: 1.1 },
    { m: "May", v: 2.9 },
    { m: "Jun", v: -1.2 },
    { m: "Jul", v: 1.7 },
    { m: "Aug", v: 2.3 },
    { m: "Sep", v: -0.8 },
    { m: "Oct", v: 1.4 },
    { m: "Nov", v: 2.0 },
    { m: "Dec", v: 0.9 },
  ],
  [
    { m: "2026", v: null },
    { m: "Jan", v: 1.5 },
    { m: "Feb", v: 2.2 },
    { m: "Mar", v: -0.6 },
    { m: "Apr", v: 1.9 },
    { m: "May", v: 1.3 },
    { m: "Jun", v: 0.4 },
    { m: "Jul", v: -1.1 },
    { m: "Aug", v: 0.9 },
    { m: "Sep", v: 0.7 },
    { m: "Oct", v: null },
    { m: "Nov", v: null },
    { m: "Dec", v: null },
  ],
];

export const TARGETS = [
  { label: "Global core (VOO + world)", target: 45, actual: 21.1, color: "#2f5af6" },
  { label: "Quality compounders", target: 25, actual: 33.7, color: "#0f766e" },
  { label: "Growth satellite", target: 15, actual: 17.8, color: "#7c3aed" },
  { label: "Defensive & gold", target: 10, actual: 10.6, color: "#b45309" },
  { label: "Cash buffer", target: 5, actual: 0, color: "#94a3b8" },
];

export const PROPOSED_TRADES = [
  {
    action: "Trim",
    holding: "ASML",
    detail: "Sell 1 share · ≈ £1,254",
    why: "Cuts single-stock risk 16.8% → 13.4% and locks in part of the +133% gain.",
    impact: "-3.4pp concentration",
  },
  {
    action: "Add",
    holding: "Vanguard FTSE All-World",
    detail: "Buy ≈ £2,400",
    why: "Closes the global-core gap and dilutes US mega-cap overlap with VOO.",
    impact: "+6.4pp diversification",
  },
  {
    action: "Hold",
    holding: "Cash reserve",
    detail: "Keep ≈ £1,850 in cash",
    why: "Restores your 5% buffer so the next contribution isn't forced selling.",
    impact: "0% → 5% cash",
  },
];

export function gbp(v: number, opts?: { digits?: number; sign?: boolean; compact?: boolean }) {
  const digits = opts?.digits ?? 0;
  const sign = opts?.sign ? (v > 0 ? "+" : v < 0 ? "−" : "") : "";
  const abs = Math.abs(v);
  const str = abs.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  // use proper minus
  const body = `£${str}`;
  if (opts?.sign) return `${v < 0 ? "−" : sign}${body.replace("£", "£")}`.replace("−£", "−£").replace("++", "+");
  return v < 0 ? `−£${str}` : `£${str}`;
}

export function num(v: number, digits = 2) {
  return v.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function pct(v: number, digits = 2, sign = true) {
  const s = v > 0 && sign ? "+" : v < 0 ? "−" : "";
  return `${s}${Math.abs(v).toFixed(digits)}%`;
}

export function ccy(v: number, c: "GBP" | "USD") {
  if (c === "GBP") return `£${num(v)}`;
  return `$${num(v)}`;
}
