import { UNIVERSE, asset } from "./universe";
import { gauss, rngFor } from "../lib/random";

export const MAX_BARS = 1260; // ~5 trading years

/** Trading-day calendar ending today (weekdays only), oldest first. */
export const CALENDAR: string[] = (() => {
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < MAX_BARS) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  return out.reverse();
})();

export const dateAt = (i: number) => CALENDAR[Math.max(0, Math.min(CALENDAR.length - 1, i))];
export const indexOfDate = (d: string) => {
  const t = +new Date(d);
  let best = 0;
  for (let i = 0; i < CALENDAR.length; i++) {
    if (+new Date(CALENDAR[i]) <= t) best = i;
    else break;
  }
  return best;
};

/** Shared market factor: regimes, a drawdown, a recovery — gives realistic co-movement. */
const MARKET: number[] = (() => {
  const rand = rngFor("meridian-market-factor-v3");
  const out: number[] = [];
  for (let i = 0; i < MAX_BARS; i++) {
    const phase = i / MAX_BARS;
    // regime: calm -> stress (~35-48%) -> melt-up -> chop
    let drift = 0.00042;
    let vol = 0.0072;
    if (phase > 0.33 && phase < 0.47) {
      drift = -0.0013;
      vol = 0.0155;
    } else if (phase >= 0.47 && phase < 0.78) {
      drift = 0.00092;
      vol = 0.0079;
    } else if (phase >= 0.78) {
      drift = 0.00028;
      vol = 0.0098;
    }
    out.push(drift + gauss(rand) * vol);
  }
  return out;
})();

export const MARKET_RETURNS = MARKET;

const cache = new Map<string, number[]>();

/**
 * Daily closing prices for a symbol, oldest first, ending exactly on the
 * asset's quoted price. Length = the asset's stored bar count.
 */
export function series(symbol: string): number[] {
  const hit = cache.get(symbol);
  if (hit) return hit;
  const a = asset(symbol);
  const n = Math.min(a.bars, MAX_BARS);
  if (n < 2) {
    const empty: number[] = [];
    cache.set(symbol, empty);
    return empty;
  }
  const rand = rngFor(`px:${symbol}:v3`);
  const idio = a.vol / Math.sqrt(252);
  const dailyDrift = a.drift / 252;
  const offset = MAX_BARS - n;
  const raw: number[] = [1];
  for (let i = 1; i < n; i++) {
    const m = MARKET[offset + i] * a.mktBeta;
    const e = gauss(rand) * idio * 0.86;
    raw.push(raw[i - 1] * (1 + dailyDrift + m + e));
  }
  const scale = a.price / raw[raw.length - 1];
  const out = raw.map((v) => +(v * scale).toFixed(4));
  cache.set(symbol, out);
  return out;
}

/** Dates aligned with `series(symbol)`. */
export function seriesDates(symbol: string): string[] {
  const n = series(symbol).length;
  return CALENDAR.slice(MAX_BARS - n);
}

/** Price on a given calendar index (clamped to available history). */
export function priceAtIndex(symbol: string, idx: number): number {
  const s = series(symbol);
  if (!s.length) return asset(symbol).price;
  const offset = MAX_BARS - s.length;
  const i = idx - offset;
  if (i < 0) return s[0];
  if (i >= s.length) return s[s.length - 1];
  return s[i];
}

export function priceOn(symbol: string, date: string) {
  return priceAtIndex(symbol, indexOfDate(date));
}

export function dailyReturns(symbol: string): number[] {
  const s = series(symbol);
  const out: number[] = [];
  for (let i = 1; i < s.length; i++) out.push(s[i] / s[i - 1] - 1);
  return out;
}

/** Returns aligned to the shared calendar tail of `window` days (NaN-free intersection). */
export function alignedReturns(symbols: string[], window = 504) {
  const lens = symbols.map((s) => series(s).length);
  const n = Math.max(3, Math.min(window, ...lens) - 1);
  return symbols.map((s) => dailyReturns(s).slice(-n));
}

export function overlapDays(a: string, b: string) {
  return Math.max(0, Math.min(series(a).length, series(b).length) - 1);
}

export function changePct(symbol: string, days: number) {
  const s = series(symbol);
  if (s.length < 2) return 0;
  const from = s[Math.max(0, s.length - 1 - days)];
  return (s[s.length - 1] / from - 1) * 100;
}

export function todayMovePct(symbol: string) {
  const s = series(symbol);
  if (s.length < 2) return 0;
  return (s[s.length - 1] / s[s.length - 2] - 1) * 100;
}

export function range52w(symbol: string) {
  const s = series(symbol).slice(-252);
  if (!s.length) return { low: 0, high: 0, last: asset(symbol).price, pct: 50 };
  const low = Math.min(...s);
  const high = Math.max(...s);
  const last = s[s.length - 1];
  const pct = high > low ? ((last - low) / (high - low)) * 100 : 50;
  return { low, high, last, pct };
}

/** A blended global-equity benchmark used across Performance. */
export const BENCHMARK_SYMBOL = "__BENCH";
const BENCH = (() => {
  const rand = rngFor("bench-global-60-40-v3");
  const out: number[] = [100];
  for (let i = 1; i < MAX_BARS; i++) {
    const r = 0.00034 + MARKET[i] * 0.92 + gauss(rand) * 0.0016;
    out.push(out[i - 1] * (1 + r));
  }
  return out;
})();
export const benchmarkSeries = () => BENCH;

export const SYMBOLS = UNIVERSE.filter((a) => a.bars > 0).map((a) => a.symbol);
