import type { Wrapper } from "./universe";
import { MAX_BARS, dateAt, priceAtIndex } from "./prices";
import { seeded } from "../lib/random";

export interface HoldingSeed {
  id: string;
  symbol: string;
  qty: number;
  wrapper: Wrapper;
  account: string;
  /** trading days ago that the position was opened */
  daysAgo: number;
  /** avg price as a multiple of the market price on the open date */
  costFactor: number;
  targetPct?: number;
  /** set when the user enters an explicit average price on the add-position form */
  fixedAvgPrice?: number;
}

const S = (
  symbol: string,
  qty: number,
  wrapper: Wrapper,
  account: string,
  daysAgo: number,
  costFactor: number,
  targetPct?: number,
): HoldingSeed => ({
  id: `h_${symbol.toLowerCase().replace(/\W/g, "")}`,
  symbol,
  qty,
  wrapper,
  account,
  daysAgo,
  costFactor,
  targetPct,
});

export const HOLDING_SEEDS: HoldingSeed[] = [
  S("VWRP", 900, "SIPP", "Vanguard SIPP", 1210, 1.01, 12),
  S("CSP1", 480, "ISA", "iWeb ISA", 1080, 0.98, 20),
  S("NVDA", 420, "ISA", "iWeb ISA", 965, 0.62, 8),
  S("MSFT", 145, "SIPP", "Vanguard SIPP", 1145, 0.88, 6),
  S("AAPL", 210, "ISA", "iWeb ISA", 890, 1.04, 4),
  S("EQQQ", 220, "ISA", "iWeb ISA", 845, 0.91, 9),
  S("SMT", 2400, "ISA", "AJ Bell ISA", 1190, 1.34, 2),
  S("AZN", 400, "ISA", "AJ Bell ISA", 1165, 0.93, 5),
  S("SHEL", 1400, "GIA", "IG Dealing", 1230, 0.81, 4),
  S("IGLT", 3100, "SIPP", "Vanguard SIPP", 745, 1.07, 6),
  S("SGLN", 880, "GIA", "IG Dealing", 960, 0.79, 4),
  S("ASML", 42, "GIA", "IG Dealing", 690, 1.12, 3),
  S("LSEG", 310, "ISA", "AJ Bell ISA", 610, 0.94, 3),
  S("NOVOB", 540, "GIA", "IG Dealing", 515, 1.21, 3),
  S("TSM", 260, "ISA", "iWeb ISA", 425, 0.74, 5),
  S("BRK.B", 55, "GIA", "IG Dealing", 540, 0.86, 2),
  S("ARM", 180, "GIA", "IG Dealing", 88, 1.09),
  S("FIDGLSP", 1250, "SIPP", "Fidelity SIPP", 132, 0.97),
];

export interface Holding extends HoldingSeed {
  openedOn: string;
  avgPrice: number;
  cost: number;
}

export function buildHolding(seed: HoldingSeed): Holding {
  const idx = Math.max(0, MAX_BARS - seed.daysAgo);
  const mkt = priceAtIndex(seed.symbol, idx);
  const jitter = 1 + (seeded(`cost:${seed.symbol}`, -0.02, 0.02) as number);
  const avgPrice = seed.fixedAvgPrice ?? +(mkt * seed.costFactor * jitter).toFixed(4);
  return {
    ...seed,
    openedOn: dateAt(idx),
    avgPrice,
    cost: +(avgPrice * seed.qty).toFixed(2),
  };
}

export const WATCHLIST = ["GOOGL", "AMZN", "LLY", "RR", "MC", "VHYL", "VUKE", "PLTR"];

export type FlowKind = "Deposit" | "Withdrawal" | "Dividend" | "Fee";
export interface CashFlow {
  id: string;
  date: string;
  kind: FlowKind;
  amount: number;
  note: string;
  /** the opening transfer is solved so that book cost + cash reconciles to the ledger */
  derived?: boolean;
}

/** Target uninvested cash across accounts once every seed position is paid for. */
export const TARGET_CASH = 26400;

const d = (daysAgo: number) => dateAt(Math.max(0, MAX_BARS - daysAgo));

export const CASHFLOW_SEEDS: CashFlow[] = [
  { id: "cf1", date: d(1250), kind: "Deposit", amount: 0, derived: true, note: "Opening transfer from legacy broker" },
  { id: "cf2", date: d(1120), kind: "Deposit", amount: 20000, note: "ISA allowance 22/23" },
  { id: "cf3", date: d(985), kind: "Deposit", amount: 62000, note: "Bonus — deployed into NVDA / SGLN" },
  { id: "cf4", date: d(870), kind: "Deposit", amount: 20000, note: "ISA allowance 23/24" },
  { id: "cf5", date: d(760), kind: "Deposit", amount: 46000, note: "SIPP employer contribution + gilt ladder" },
  { id: "cf6", date: d(690), kind: "Withdrawal", amount: -18000, note: "House deposit top-up" },
  { id: "cf7", date: d(612), kind: "Deposit", amount: 30000, note: "ISA allowance 24/25" },
  { id: "cf8", date: d(515), kind: "Deposit", amount: 30000, note: "Share scheme vest" },
  { id: "cf9", date: d(430), kind: "Deposit", amount: 26000, note: "Rebalance cash — TSM initiation" },
  { id: "cf10", date: d(300), kind: "Dividend", amount: 3120, note: "Accumulated dividends & coupons" },
  { id: "cf11", date: d(210), kind: "Withdrawal", amount: -9500, note: "Tax bill" },
  { id: "cf12", date: d(132), kind: "Deposit", amount: 40000, note: "ISA allowance 25/26 + fund switch" },
  { id: "cf13", date: d(88), kind: "Deposit", amount: 25000, note: "Cash reserve moved in for ARM" },
  { id: "cf14", date: d(34), kind: "Fee", amount: -640, note: "Platform & custody fees (annual)" },
  { id: "cf15", date: d(12), kind: "Deposit", amount: 15000, note: "Monthly savings sweep" },
];

export interface Note {
  id: string;
  symbol: string;
  date: string;
  title: string;
  body: string;
  tag: "Thesis" | "Risk" | "Catalyst" | "Review";
}

export const NOTE_SEEDS: Note[] = [
  { id: "n1", symbol: "NVDA", date: d(41), title: "Trimming discipline", tag: "Risk", body: "Position is now the largest single line in the book. Rule: if weight passes 12% of total value, trim back to 9% and route proceeds to IGLT or cash. Do not let a good thesis become a position-sizing failure." },
  { id: "n2", symbol: "NVDA", date: d(198), title: "Datacentre revenue check", tag: "Review", body: "Hyperscaler capex guides still rising into next year. The question is no longer demand, it is whether margins hold once custom silicon ships in volume. Watch gross margin, not revenue." },
  { id: "n3", symbol: "SMT", date: d(88), title: "Discount thesis is doing the work", tag: "Thesis", body: "Bought for the discount to NAV as much as the underlying book. Private holdings mark slowly; treat published NAV as stale. Exit trigger is discount narrowing inside 4%." },
  { id: "n4", symbol: "SHEL", date: d(305), title: "Cash return over growth", tag: "Thesis", body: "Holding this for buybacks and the dividend, not for a re-rating. If the buyback programme is cut, the reason for owning it is gone." },
  { id: "n5", symbol: "AZN", date: d(63), title: "Oncology pipeline read-through", tag: "Catalyst", body: "Two phase-III readouts in the next six months. Both are already partly in the price. Asymmetry is mildly negative from here — size accordingly." },
  { id: "n6", symbol: "ARM", date: d(19), title: "Thin history — handle with care", tag: "Risk", body: "Only a few months of stored bars, so every risk number the app shows for this line is unreliable. Excluded from correlation work on purpose." },
  { id: "n7", symbol: "IGLT", date: d(150), title: "Duration as insurance", tag: "Thesis", body: "This is not a return holding. It exists so the equity book can fall 30% without forcing a sale. Judge it on behaviour in stress, not on yield." },
  { id: "n8", symbol: "TSM", date: d(112), title: "Geopolitical haircut", tag: "Risk", body: "Applying a permanent valuation haircut for cross-strait risk. If the position ever looks 'cheap enough to double', that is the haircut talking." },
];

export const THESES: Record<string, { text: string; updated: string; conviction: number }> = {
  NVDA: { text: "The accelerated-compute build-out is a multi-year capital cycle, not a single product cycle. Owning the toll booth beats guessing which model wins. Risk is that the market is already paying for perfection — hence a strict trim rule rather than a price target.", updated: d(41), conviction: 8.4 },
  MSFT: { text: "Distribution plus a fortress balance sheet. Enterprise AI attaches to seats that already exist, which makes revenue less speculative than the pure-play narrative suggests. Core long-term compounder position.", updated: d(120), conviction: 8.9 },
  VWRP: { text: "The default. Everything else in this portfolio has to justify itself against simply owning more of this.", updated: d(400), conviction: 9.5 },
  SHEL: { text: "Cash-return vehicle with optionality on an energy-transition re-rating that I am not paying for.", updated: d(305), conviction: 6.8 },
  SMT: { text: "Discount-to-NAV play with a venture tail. Sized small because the mark-to-market on private holdings is genuinely unknowable.", updated: d(88), conviction: 5.9 },
  AZN: { text: "Quality defensive with pipeline optionality. Exists to lower the beta of a tech-heavy book without owning bonds.", updated: d(63), conviction: 7.6 },
  IGLT: { text: "Ballast. Judged on drawdown behaviour, not yield.", updated: d(150), conviction: 7.0 },
  TSM: { text: "The most important company in the world trading at a geopolitical discount. Position size is the risk control.", updated: d(112), conviction: 7.8 },
};
