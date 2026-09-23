import { HOLDINGS, TOTAL_VALUE, CASH_WEIGHT, CASH_TOTAL, DRIFT, TOP5_WEIGHT, holdingByTicker } from "./portfolio";

/* ------------------------------------------------------------------- news */
export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  at: string;
  tickers: string[];
  sentiment: number; // -1 .. 1
  category: "Earnings" | "Macro" | "Regulatory" | "Product" | "Analyst" | "Deal" | "Crypto";
  summary: string;
}

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    headline: "Hyperscaler capex guidance lifted again for 2026, accelerator orders extended into 2027",
    source: "Reuters",
    at: "2026-02-13T14:05:00Z",
    tickers: ["NVDA", "TSM", "ASML", "MSFT"],
    sentiment: 0.72,
    category: "Macro",
    summary:
      "Combined 2026 capex commitments from the four largest cloud buyers now imply a 31% year-on-year increase, with order books extending six months further than the prior cycle.",
  },
  {
    id: "n2",
    headline: "Bitcoin slides 2.7% as spot ETF flows turn negative for a fourth session",
    source: "Bloomberg",
    at: "2026-02-13T12:20:00Z",
    tickers: ["BTC"],
    sentiment: -0.55,
    category: "Crypto",
    summary:
      "Net outflows of $412m over four sessions, the longest negative streak since August. Funding rates have normalised, suggesting positioning rather than a thesis break.",
  },
  {
    id: "n3",
    headline: "CMS proposes tighter risk-adjustment audits on Medicare Advantage plans",
    source: "Wall Street Journal",
    at: "2026-02-13T11:10:00Z",
    tickers: ["UNH"],
    sentiment: -0.68,
    category: "Regulatory",
    summary:
      "The proposal would extend extrapolated audits back to plan year 2020. Sell-side estimates a 40–90bp headwind to MA margins if adopted without modification.",
  },
  {
    id: "n4",
    headline: "Shopify reports Q4 tomorrow: payments penetration the swing factor",
    source: "Meridian Research",
    at: "2026-02-13T09:00:00Z",
    tickers: ["SHOP"],
    sentiment: 0.1,
    category: "Earnings",
    summary:
      "Consensus GMV $118bn, take rate 3.14%. Options market implies a ±11.4% move — your position is 3.9% of book, so roughly 45bp of portfolio risk.",
  },
  {
    id: "n5",
    headline: "ASML books first High-NA repeat order from a logic customer",
    source: "Financial Times",
    at: "2026-02-12T16:40:00Z",
    tickers: ["ASML", "TSM"],
    sentiment: 0.64,
    category: "Product",
    summary:
      "Second-system order validates the High-NA roadmap ahead of schedule and de-risks 2027 revenue guidance that the market had discounted heavily.",
  },
  {
    id: "n6",
    headline: "Ten-year yield retreats to 3.94% after soft services print",
    source: "Bloomberg",
    at: "2026-02-12T15:15:00Z",
    tickers: ["IEF", "JPM", "VTI"],
    sentiment: 0.3,
    category: "Macro",
    summary:
      "Services ISM missed at 50.8. Two cuts are now priced for 2026. Duration exposure in the book is 6.3% — the largest single beneficiary is IEF.",
  },
  {
    id: "n7",
    headline: "Novo Nordisk cuts US list price on oral semaglutide by 18%",
    source: "Reuters",
    at: "2026-02-12T08:30:00Z",
    tickers: ["NVO"],
    sentiment: -0.61,
    category: "Product",
    summary:
      "Third price action in twelve months. Gross-to-net compression now looks structural rather than promotional — directly relevant to your written thesis trigger.",
  },
  {
    id: "n8",
    headline: "Costco January comparable sales +6.1%, traffic up 4.2%",
    source: "CNBC",
    at: "2026-02-11T21:05:00Z",
    tickers: ["COST"],
    sentiment: 0.48,
    category: "Earnings",
    summary: "Membership renewal rate held at 93.1% in the US and Canada. Executive mix continues to climb.",
  },
  {
    id: "n9",
    headline: "JPMorgan raises buyback authorisation by $30bn",
    source: "Dow Jones",
    at: "2026-02-11T13:45:00Z",
    tickers: ["JPM", "BRK.B"],
    sentiment: 0.52,
    category: "Deal",
    summary: "Roughly 4.8% of market cap at current prices, funded from excess CET1 following the latest stress cycle.",
  },
  {
    id: "n10",
    headline: "Morgan Stanley lifts Apple to Overweight, $300 target on services re-rating",
    source: "Barron's",
    at: "2026-02-10T18:20:00Z",
    tickers: ["AAPL"],
    sentiment: 0.44,
    category: "Analyst",
    summary: "Argues the installed-base annuity deserves a software multiple. Street high target is now $312.",
  },
  {
    id: "n11",
    headline: "Exxon signs 12-year LNG offtake with two Japanese utilities",
    source: "Reuters",
    at: "2026-02-10T07:55:00Z",
    tickers: ["XOM", "LIN"],
    sentiment: 0.37,
    category: "Deal",
    summary: "Locks in volume through 2038 and supports the distribution coverage that underwrites your income sleeve.",
  },
  {
    id: "n12",
    headline: "EU opens consultation on cloud interoperability remedies",
    source: "Politico",
    at: "2026-02-09T10:00:00Z",
    tickers: ["MSFT", "AMZN"],
    sentiment: -0.3,
    category: "Regulatory",
    summary: "Egress-fee and licensing remedies are the focus. Revenue at risk is estimated below 2% for both names.",
  },
];

export function newsExposure(item: NewsItem) {
  const held = item.tickers.map(holdingByTicker).filter(Boolean) as (typeof HOLDINGS)[number][];
  const weight = held.reduce((a, h) => a + h.weight, 0);
  const value = held.reduce((a, h) => a + h.marketValue, 0);
  const dayPL = held.reduce((a, h) => a + h.dayPL, 0);
  return { held, weight, value, dayPL };
}

/* ---------------------------------------------------------------- signals */
export type SignalSeverity = "critical" | "warning" | "info" | "good";
export interface Signal {
  id: string;
  severity: SignalSeverity;
  domain: "Risk" | "News" | "Allocation" | "Income" | "Tax" | "Thesis" | "Cash";
  title: string;
  detail: string;
  tickers?: string[];
  metric?: string;
  action?: string;
}

const driftBreaches = DRIFT.filter((d) => Math.abs(d.drift) >= 1.5);

export const SIGNALS: Signal[] = [
  {
    id: "s1",
    severity: "critical",
    domain: "Thesis",
    title: "NVO price action matches your written exit trigger",
    detail:
      "Your thesis note states \"exit if gross-to-net compression becomes structural\". Today's third list-price cut in twelve months satisfies that condition.",
    tickers: ["NVO"],
    metric: `${(holdingByTicker("NVO")!.weight).toFixed(1)}% of book · ${holdingByTicker("NVO")!.unrealizedPct.toFixed(1)}% unrealised`,
    action: "Review position",
  },
  {
    id: "s2",
    severity: "warning",
    domain: "News",
    title: "Regulatory headline touches 2 positions",
    detail:
      "CMS risk-adjustment audit proposal maps to UNH directly. Combined exposure is modest but the name is already on watch.",
    tickers: ["UNH"],
    metric: `${holdingByTicker("UNH")!.weight.toFixed(1)}% exposure`,
    action: "Open news",
  },
  {
    id: "s3",
    severity: "warning",
    domain: "Allocation",
    title: `${driftBreaches.length} positions outside their rebalance band`,
    detail: `Largest drift is ${DRIFT[0].ticker} at ${DRIFT[0].drift > 0 ? "+" : ""}${DRIFT[0].drift.toFixed(1)}pp versus a ${DRIFT[0].target}% target.`,
    tickers: driftBreaches.slice(0, 4).map((d) => d.ticker),
    metric: `${driftBreaches.length} of ${DRIFT.length} names`,
    action: "Open rebalancer",
  },
  {
    id: "s4",
    severity: "info",
    domain: "Cash",
    title: "Cash weight above your 5% policy ceiling",
    detail: `$${Math.round(CASH_TOTAL).toLocaleString()} is uninvested, earning 4.3% blended. Deploying the excess at target weights would add roughly $${Math.round((CASH_TOTAL - TOTAL_VALUE * 0.05) * 0.07).toLocaleString()} of expected annual return.`,
    metric: `${CASH_WEIGHT.toFixed(1)}% vs 5.0% ceiling`,
    action: "Plan deployment",
  },
  {
    id: "s5",
    severity: "warning",
    domain: "Risk",
    title: "Concentration: top five names are a third of the book",
    detail: `Top 5 weight is ${TOP5_WEIGHT.toFixed(1)}%, and the information-technology sleeve carries the majority of the tracking error.`,
    metric: `Top 5 = ${TOP5_WEIGHT.toFixed(1)}%`,
    action: "View allocation",
  },
  {
    id: "s6",
    severity: "info",
    domain: "Tax",
    title: "Harvestable losses available before April",
    detail:
      "UNH and NVO carry unrealised losses that could offset realised gains booked earlier this year, subject to the 30-day wash-sale window.",
    tickers: ["UNH", "NVO"],
    metric: `$${Math.abs(Math.round(HOLDINGS.filter((h) => h.unrealized < 0).reduce((a, h) => a + h.unrealized, 0))).toLocaleString()} of losses`,
    action: "Open tax lots",
  },
  {
    id: "s7",
    severity: "good",
    domain: "Income",
    title: "Forward income covers 3.1 months of stated expenses",
    detail: "Projected dividends plus cash interest have grown 26% year on year, driven by XOM, VXUS and the money-market sleeve.",
    metric: "+26% YoY",
    action: "Open income",
  },
  {
    id: "s8",
    severity: "info",
    domain: "Risk",
    title: "Two earnings events inside the next ten sessions",
    detail: "SHOP reports tomorrow and NVDA on 25 Feb. Combined weight at risk is meaningful given implied moves.",
    tickers: ["SHOP", "NVDA"],
    metric: `${(holdingByTicker("SHOP")!.weight + holdingByTicker("NVDA")!.weight).toFixed(1)}% weight at risk`,
    action: "See calendar",
  },
];

/* -------------------------------------------------------------- earnings */
export const EARNINGS = HOLDINGS.filter((h) => h.nextEarnings)
  .map((h) => ({
    ticker: h.ticker,
    name: h.name,
    date: h.nextEarnings!,
    weight: h.weight,
    implied: Math.round((h.volatility / 4) * 10) / 10,
    value: h.marketValue,
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

/* ------------------------------------------------------------- watchlist */
export interface WatchItem {
  ticker: string;
  name: string;
  price: number;
  chg: number;
  target: number;
  note: string;
  status: "Researching" | "Waiting on price" | "Queued";
}

export const WATCHLIST: WatchItem[] = [
  { ticker: "V", name: "Visa Inc", price: 372.4, chg: 0.42, target: 340, note: "Network toll with 65% margins; want a better entry.", status: "Waiting on price" },
  { ticker: "ISRG", name: "Intuitive Surgical", price: 618.9, chg: -1.12, target: 560, note: "Razor/blade in robotics. Modelling installed-base growth.", status: "Researching" },
  { ticker: "ADYEN", name: "Adyen NV", price: 1640.0, chg: 2.3, target: 1500, note: "European payments compounder; FX exposure to size.", status: "Researching" },
  { ticker: "FERG", name: "Ferguson plc", price: 228.15, chg: 0.86, target: 210, note: "Industrial distribution; funded from the UNH exit if it happens.", status: "Queued" },
  { ticker: "TLT", name: "iShares 20+Y Treasury", price: 92.6, chg: 0.74, target: 88, note: "Longer duration if the curve steepens further.", status: "Waiting on price" },
];

/* ------------------------------------------------------------ note ledger */
export interface JournalEntry {
  id: string;
  date: string;
  ticker?: string;
  kind: "Decision" | "Observation" | "Review";
  title: string;
  body: string;
}

export const JOURNAL: JournalEntry[] = [
  {
    id: "j1",
    date: "2026-02-05",
    ticker: "NVO",
    kind: "Decision",
    title: "Halved Novo Nordisk",
    body: "Pricing power was the load-bearing assumption and it broke. Kept half as an option on oral scale-up; full exit if the next print shows volume without price.",
  },
  {
    id: "j2",
    date: "2026-01-21",
    ticker: "TSM",
    kind: "Decision",
    title: "Added to TSM on the pullback",
    body: "Bought 40 shares at $205.60. Strait risk is why this stays below ASML in size, not a valuation view.",
  },
  {
    id: "j3",
    date: "2026-01-16",
    ticker: "UNH",
    kind: "Review",
    title: "UNH on formal watch",
    body: "MLR at 89.4% for a second quarter. Trimmed 25 shares. Two more quarters above 89% and the position goes to zero.",
  },
  {
    id: "j4",
    date: "2025-12-15",
    ticker: "BTC",
    kind: "Decision",
    title: "Rebalanced BTC back into band",
    body: "Band breach at 8.1% weight after the run. Mechanical, no discretion. This rule has saved me twice.",
  },
  {
    id: "j5",
    date: "2025-11-02",
    kind: "Observation",
    title: "Cash is doing real work again",
    body: "At 4.4% the money-market sleeve is a legitimate asset, not a drag. Reviewing the 5% policy ceiling at the next quarterly.",
  },
];
