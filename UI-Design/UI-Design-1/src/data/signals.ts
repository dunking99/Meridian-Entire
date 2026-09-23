import { asset } from "./universe";
import { rngFor, seeded } from "../lib/random";
import { changePct } from "./prices";

export const AXES = ["Quality", "Value", "Momentum", "Growth", "Balance sheet", "Sentiment"] as const;
export type Axis = (typeof AXES)[number];

export interface Signal {
  symbol: string;
  axes: Record<Axis, number>; // 0–10
  conviction: number; // 0–10
  screener: number; // 0–100
  bull: string[];
  bear: string[];
  precedent: {
    setups: number;
    higher: number; // % resolved higher
    medianMove: number;
    medianDays: number;
    window: string;
    note: string;
  };
}

const BULL_POOL = [
  "Free cash-flow conversion above 90% for eight consecutive quarters",
  "Pricing power intact — realised price/mix ahead of input cost inflation",
  "Net cash balance sheet removes refinancing risk through the cycle",
  "Order backlog covers more than four quarters of revenue",
  "Insider buying in the last two reporting windows",
  "Analyst revisions inflecting positive after six months of cuts",
  "Structural share gain in the fastest-growing end market",
  "Buyback running at >3% of shares outstanding annually",
  "Gross margin expanding despite mix headwinds",
  "Switching costs entrench the installed base",
  "Regulatory clarity removed the main overhang",
  "Operating leverage yet to show in reported numbers",
  "Trading below its own five-year average multiple on forward earnings",
  "Dividend cover above 2x with a progressive policy",
];

const BEAR_POOL = [
  "Multiple sits in the top decile of its ten-year range",
  "Customer concentration — top three buyers exceed 40% of revenue",
  "Capital intensity rising faster than revenue",
  "Competitive response from a better-capitalised incumbent",
  "Working capital absorbing more cash each quarter",
  "Consensus estimates assume no cyclical downturn at all",
  "Regulatory exposure in a jurisdiction with active proceedings",
  "Management incentives tied to revenue, not returns on capital",
  "Currency translation is flattering the reported growth rate",
  "Insider selling above the three-year average pace",
  "Terminal-value assumptions do most of the work in any DCF",
  "Balance-sheet leverage above 2.5x net debt / EBITDA",
  "Key-person risk concentrated in one executive",
  "Share count creeping up through stock-based compensation",
];

const HAND: Record<string, { bull: string[]; bear: string[]; conviction?: number }> = {
  NVDA: {
    bull: [
      "Accelerated compute is a capital cycle, not a product cycle",
      "Software moat (CUDA) converts hardware sales into recurring lock-in",
      "Advanced packaging allocation secured a year ahead of demand",
      "Gross margin has held above 70% through three capacity expansions",
    ],
    bear: [
      "Custom hyperscaler silicon moving to volume on inference workloads",
      "Revenue concentrated in a handful of buyers who are also competitors",
      "Priced for continued acceleration with no digestion quarter",
    ],
    conviction: 8.4,
  },
  MSFT: {
    bull: [
      "AI attaches to seats that already exist — lower adoption risk",
      "Azure growth reaccelerating with improving margin profile",
      "One of a handful of genuine AAA balance sheets",
    ],
    bear: ["Capex intensity has tripled and returns are unproven", "Valuation leaves no room for an enterprise spending pause"],
    conviction: 8.9,
  },
  AAPL: {
    bull: ["Installed base of >2bn devices monetised through services", "Capital return programme is the largest in the market"],
    bear: [
      "Services growth decelerating for two consecutive quarters",
      "App-store economics under regulatory attack in two major regions",
      "Replacement cycle lengthening with no clear catalyst",
      "Trails peers on visible AI product delivery",
    ],
    conviction: 5.8,
  },
  SHEL: {
    bull: ["Buyback yield plus dividend yield above 10%", "Downstream and trading smooth the commodity cycle"],
    bear: ["Brent below the level assumed in buyback guidance", "Transition capex has no agreed return hurdle"],
    conviction: 6.8,
  },
  SMT: {
    bull: ["Discount to NAV still wider than the long-run average", "Access to private positions not available elsewhere"],
    bear: ["Private marks are stale and reflexively optimistic", "Gearing amplifies drawdowns in stress", "Discount has narrowed to 6.1% — part of the entry case is gone"],
    conviction: 5.9,
  },
  TSM: {
    bull: ["Effective monopoly on leading-edge logic", "Customer prepayments de-risk the expansion capex"],
    bear: ["Cross-strait risk is unhedgeable and permanently discounts the multiple", "Export-licence framework widened again"],
    conviction: 7.8,
  },
};

const cache = new Map<string, Signal>();

export function signalFor(symbol: string): Signal {
  const hit = cache.get(symbol);
  if (hit) return hit;
  const a = asset(symbol);
  const rand = rngFor(`sig:${symbol}:v4`);
  const mom12 = changePct(symbol, 252);
  const mom3 = changePct(symbol, 63);

  const clamp10 = (v: number) => Math.max(0.4, Math.min(9.8, v));
  const base = (k: string, lo: number, hi: number) => seeded(`${symbol}:${k}`, lo, hi);

  const quality = clamp10(base("q", 3.4, 9.4) + (a.type !== "Stock" ? 0.9 : 0));
  const value = clamp10(base("v", 2.2, 8.8) - (mom12 > 40 ? 1.6 : 0) + (a.yieldPct ?? 0) * 0.22);
  const momentum = clamp10(5 + mom12 / 22 + mom3 / 30);
  const growth = clamp10(base("g", 2.6, 9.2) + a.drift * 6);
  const balance = clamp10(base("b", 3.8, 9.5) - (a.beta > 1.5 ? 0.9 : 0));
  const sentiment = clamp10(base("s", 3, 9) + (mom3 > 8 ? 0.8 : mom3 < -8 ? -1.1 : 0));

  const axes: Record<Axis, number> = {
    Quality: +quality.toFixed(1),
    Value: +value.toFixed(1),
    Momentum: +momentum.toFixed(1),
    Growth: +growth.toFixed(1),
    "Balance sheet": +balance.toFixed(1),
    Sentiment: +sentiment.toFixed(1),
  };

  const hand = HAND[symbol];
  const composite =
    axes.Quality * 0.26 +
    axes.Value * 0.16 +
    axes.Momentum * 0.16 +
    axes.Growth * 0.2 +
    axes["Balance sheet"] * 0.14 +
    axes.Sentiment * 0.08;

  const pickN = (pool: string[], n: number, salt: string) => {
    const r = rngFor(`${symbol}:${salt}`);
    const copy = [...pool];
    const out: string[] = [];
    for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
    return out;
  };

  const setups = Math.round(seeded(`${symbol}:setups`, 11, 48));
  const higher = Math.round(seeded(`${symbol}:higher`, 34, 78) + (momentum > 6 ? 5 : 0));
  const sig: Signal = {
    symbol,
    axes,
    conviction: +(hand?.conviction ?? composite).toFixed(1),
    screener: Math.round(Math.min(98, Math.max(6, composite * 9.2 + seeded(`${symbol}:scr`, -7, 7)))),
    bull: hand?.bull ?? pickN(BULL_POOL, 2 + Math.floor(rand() * 3), "bull"),
    bear: hand?.bear ?? pickN(BEAR_POOL, 2 + Math.floor(rand() * 3), "bear"),
    precedent: {
      setups,
      higher: Math.min(92, higher),
      medianMove: +seeded(`${symbol}:med`, -6, 14).toFixed(1),
      medianDays: Math.round(seeded(`${symbol}:days`, 22, 96)),
      window: "since 2011",
      note:
        momentum > 6.5
          ? "Setups matched on: 12m momentum decile, valuation percentile and revision breadth."
          : "Setups matched on: drawdown depth from 52w high, valuation percentile and revision breadth.",
    },
  };
  cache.set(symbol, sig);
  return sig;
}

export const convictionTilt = (symbol: string) => {
  const s = signalFor(symbol);
  return +(s.conviction + (s.bull.length - s.bear.length) * 0.22 + (s.precedent.higher - 50) / 45).toFixed(2);
};
