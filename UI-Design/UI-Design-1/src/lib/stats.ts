export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);

export function stdev(a: number[], sample = true) {
  if (a.length < 2) return 0;
  const m = mean(a);
  const v = sum(a.map((x) => (x - m) ** 2)) / (a.length - (sample ? 1 : 0));
  return Math.sqrt(v);
}

export function covariance(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(-n));
  const mb = mean(b.slice(-n));
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[a.length - n + i] - ma) * (b[b.length - n + i] - mb);
  return s / (n - 1);
}

export function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const sa = stdev(a.slice(-n));
  const sb = stdev(b.slice(-n));
  if (!sa || !sb) return 0;
  return clamp(covariance(a, b) / (sa * sb), -1, 1);
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function returnsOf(series: number[]) {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1];
    if (prev > 0) out.push(series[i] / prev - 1);
  }
  return out;
}

export function annualisedVol(dailyReturns: number[]) {
  return stdev(dailyReturns) * Math.sqrt(252) * 100;
}

export function cagr(series: number[], years: number) {
  if (series.length < 2 || years <= 0) return 0;
  const a = series[0];
  const b = series[series.length - 1];
  if (a <= 0) return 0;
  return ((b / a) ** (1 / years) - 1) * 100;
}

export function maxDrawdown(series: number[]) {
  let peak = -Infinity;
  let worst = 0;
  for (const v of series) {
    if (v > peak) peak = v;
    if (peak > 0) worst = Math.min(worst, v / peak - 1);
  }
  return worst * 100;
}

export function sharpe(dailyReturns: number[], rf = 0.042) {
  const vol = stdev(dailyReturns) * Math.sqrt(252);
  if (!vol) return 0;
  const ann = mean(dailyReturns) * 252;
  return (ann - rf) / vol;
}

export function sortino(dailyReturns: number[], rf = 0.042) {
  const downside = dailyReturns.filter((r) => r < 0);
  const dd = Math.sqrt(mean(downside.map((r) => r * r))) * Math.sqrt(252);
  if (!dd) return 0;
  return (mean(dailyReturns) * 252 - rf) / dd;
}

/** Herfindahl index of a weight vector given in percent. */
export function hhi(weightsPct: number[]) {
  return sum(weightsPct.map((w) => (w / 100) ** 2));
}

/** Effective number of holdings = 1 / HHI. */
export function effectiveHoldings(weightsPct: number[]) {
  const h = hhi(weightsPct);
  return h > 0 ? 1 / h : 0;
}

export interface CashFlowPoint {
  date: string;
  amount: number; // negative = money in to the portfolio (a cost to you)
}

function npv(rate: number, flows: CashFlowPoint[], t0: number) {
  return flows.reduce((acc, f) => {
    const yrs = (new Date(f.date).getTime() - t0) / (365 * 864e5);
    return acc + f.amount / Math.pow(1 + rate, yrs);
  }, 0);
}

/** Money-weighted return (XIRR) solved by bisection — robust for messy flow sets. */
export function xirr(flows: CashFlowPoint[]): number | null {
  if (flows.length < 2) return null;
  const sorted = [...flows].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const t0 = new Date(sorted[0].date).getTime();
  const hasPos = sorted.some((f) => f.amount > 0);
  const hasNeg = sorted.some((f) => f.amount < 0);
  if (!hasPos || !hasNeg) return null;
  let lo = -0.9999;
  let hi = 4;
  let fLo = npv(lo, sorted, t0);
  let fHi = npv(hi, sorted, t0);
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid, sorted, t0);
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return ((lo + hi) / 2) * 100;
}

/**
 * Time-weighted return from a daily value series with external flows keyed by index.
 * Flows are applied at the start of the day (deposit increases value without being a gain).
 */
export function twr(values: number[], flowsByIndex: Record<number, number>) {
  let acc = 1;
  for (let i = 1; i < values.length; i++) {
    const f = flowsByIndex[i] ?? 0;
    const base = values[i - 1] + f;
    if (base <= 0) continue;
    acc *= values[i] / base;
  }
  return (acc - 1) * 100;
}

/** Cariño linking coefficient for multi-period arithmetic attribution. */
export function carinoK(totalReturn: number) {
  const R = totalReturn;
  if (Math.abs(R) < 1e-9) return 1;
  return Math.log(1 + R) / R;
}

export function linkContributions(periodReturns: number[], periodContribs: number[][]) {
  const total = periodReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const K = carinoK(total);
  const n = periodContribs[0]?.length ?? 0;
  const out = new Array(n).fill(0);
  periodReturns.forEach((r, t) => {
    const kt = carinoK(r) / K;
    for (let i = 0; i < n; i++) out[i] += periodContribs[t][i] * kt;
  });
  return { total: total * 100, contributions: out.map((v) => v * 100) };
}

/** Covariance matrix (annualised) from aligned daily return vectors. */
export function covMatrix(series: number[][]) {
  const n = series.length;
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++) {
      const c = covariance(series[i], series[j]) * 252;
      m[i][j] = c;
      m[j][i] = c;
    }
  return m;
}

/**
 * Long-only max-Sharpe weights found by seeded randomised search + local refinement.
 * Deterministic: same inputs always produce the same weights.
 */
export function maxSharpeWeights(
  expected: number[],
  cov: number[][],
  rf = 0.042,
  maxWeight = 0.28,
  iterations = 4000,
): number[] {
  const n = expected.length;
  if (!n) return [];
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const score = (w: number[]) => {
    let ret = 0;
    for (let i = 0; i < n; i++) ret += w[i] * expected[i];
    let varc = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) varc += w[i] * w[j] * cov[i][j];
    const vol = Math.sqrt(Math.max(varc, 1e-9));
    return (ret - rf) / vol;
  };
  const normalise = (w: number[]) => {
    const capped = w.map((x) => clamp(x, 0, maxWeight));
    const s = sum(capped) || 1;
    return capped.map((x) => x / s);
  };
  let best = normalise(new Array(n).fill(1 / n));
  let bestScore = score(best);
  for (let it = 0; it < iterations; it++) {
    const cand = normalise(Array.from({ length: n }, () => rand() ** 2.2));
    const s = score(cand);
    if (s > bestScore) {
      bestScore = s;
      best = cand;
    }
  }
  for (let round = 0; round < 700; round++) {
    const step = 0.06 * (1 - round / 700) + 0.004;
    const cand = normalise(best.map((w) => Math.max(0, w + (rand() - 0.5) * step)));
    const s = score(cand);
    if (s > bestScore) {
      bestScore = s;
      best = cand;
    }
  }
  return best;
}

export function portfolioVol(weights: number[], cov: number[][]) {
  let v = 0;
  for (let i = 0; i < weights.length; i++)
    for (let j = 0; j < weights.length; j++) v += weights[i] * weights[j] * cov[i][j];
  return Math.sqrt(Math.max(v, 0)) * 100;
}
