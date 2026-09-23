/**
 * Deterministic synthetic market data.
 * Keeps the app alive with no vendor key; swap in a real provider by replacing
 * `fetchProviderBars` in src/lib/market-provider.ts.
 */
export type SimBar = { d: string; open: number; high: number; low: number; close: number; volume: number };

export type SimSpec = {
  symbol: string;
  start: number;
  vol: number; // annualized-ish daily vol
  drift: number; // daily drift
  seed?: number;
  shock?: number[]; // last N daily returns override (news-driven moves)
  decimals?: number;
  baseVolume?: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function gauss(rng: () => number) {
  const u = Math.max(rng(), 1e-9);
  const v = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function tradingDaysBack(count: number, from = new Date()): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  while (days.length < count) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days.reverse();
}

export function generateBars(spec: SimSpec, days = 300): SimBar[] {
  const rng = mulberry32((spec.seed ?? hash(spec.symbol)) + 7);
  const dates = tradingDaysBack(days);
  const shocks = spec.shock ?? [];
  const decimals = spec.decimals ?? 2;
  let price = spec.start;
  const bars: SimBar[] = [];

  for (let i = 0; i < dates.length; i++) {
    const shockIdx = i - (dates.length - shocks.length);
    const shock = shockIdx >= 0 ? (shocks[shockIdx] ?? 0) : 0;
    const ret = spec.drift + spec.vol * gauss(rng) + shock;
    const open = price;
    const close = Math.max(0.01, open * (1 + ret));
    const wick = Math.abs(ret) + spec.vol * 0.6;
    const high = Math.max(open, close) * (1 + wick * rng() * 0.7);
    const low = Math.min(open, close) * (1 - wick * rng() * 0.7);
    const vol = Math.round(
      (spec.baseVolume ?? 4_000_000) * (0.55 + rng() * 0.9) * (1 + Math.abs(ret) * 14),
    );
    price = close;
    bars.push({
      d: dates[i],
      open: round(open, decimals),
      high: round(high, decimals),
      low: round(low, decimals),
      close: round(close, decimals),
      volume: vol,
    });
  }
  return bars;
}

export function round(n: number, decimals = 2) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function priceDecimals(symbol: string, price: number) {
  if (price < 5) return 4;
  if (price < 1000) return 2;
  return 2;
}
