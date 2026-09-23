export type Point = { day: string; value: number };

export const TRADING_DAYS = 252;

export function pct(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Simple period-over-period returns from a value series. */
export function toReturns(series: Point[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].value;
    if (prev > 0) out.push(series[i].value / prev - 1);
  }
  return out;
}

export function totalReturn(series: Point[]): number {
  if (series.length < 2) return 0;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  return first > 0 ? last / first - 1 : 0;
}

export function cagr(series: Point[]): number {
  if (series.length < 2) return 0;
  const years = series.length / TRADING_DAYS;
  if (years <= 0) return 0;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  if (first <= 0) return 0;
  return Math.pow(last / first, 1 / years) - 1;
}

export function volatility(returns: number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * TRADING_DAYS);
}

export function downsideDeviation(returns: number[]): number {
  if (!returns.length) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const losses = returns.filter((r) => r < mean).map((r) => (r - mean) ** 2);
  if (!losses.length) return 0;
  return Math.sqrt(losses.reduce((a, b) => a + b, 0) / returns.length * TRADING_DAYS);
}

export function sharpe(returns: number[], riskFree = 0.04): number {
  const vol = volatility(returns);
  if (vol === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const excess = mean * TRADING_DAYS - riskFree;
  return excess / vol;
}

export function sortino(returns: number[], riskFree = 0.04): number {
  const dd = downsideDeviation(returns);
  if (dd === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  return (mean * TRADING_DAYS - riskFree) / dd;
}

export function maxDrawdown(series: Point[]): { value: number; peakDay: string; troughDay: string } {
  let peak = -Infinity;
  let peakDay = series[0]?.day ?? "";
  let worst = 0;
  let worstPeak = peakDay;
  let worstTrough = peakDay;
  for (const p of series) {
    if (p.value > peak) {
      peak = p.value;
      peakDay = p.day;
    }
    const dd = peak > 0 ? p.value / peak - 1 : 0;
    if (dd < worst) {
      worst = dd;
      worstPeak = peakDay;
      worstTrough = p.day;
    }
  }
  return { value: worst, peakDay: worstPeak, troughDay: worstTrough };
}

export function drawdownSeries(series: Point[]): Point[] {
  let peak = -Infinity;
  return series.map((p) => {
    peak = Math.max(peak, p.value);
    return { day: p.day, value: peak > 0 ? (p.value / peak - 1) * 100 : 0 };
  });
}

/** OLS beta / alpha of `asset` vs `benchmark` on daily returns. */
export function betaAlpha(asset: number[], benchmark: number[]): { beta: number; alpha: number; r2: number } {
  const n = Math.min(asset.length, benchmark.length);
  if (n < 3) return { beta: 0, alpha: 0, r2: 0 };
  const a = asset.slice(-n);
  const b = benchmark.slice(-n);
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let cov = 0;
  let varB = 0;
  let varA = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    varB += (b[i] - mb) ** 2;
    varA += (a[i] - ma) ** 2;
  }
  const beta = varB === 0 ? 0 : cov / varB;
  const alpha = (ma - beta * mb) * TRADING_DAYS;
  const r2 = varB === 0 || varA === 0 ? 0 : (cov * cov) / (varB * varA);
  return { beta, alpha, r2 };
}

export function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const x = a.slice(-n);
  const y = b.slice(-n);
  const mx = x.reduce((p, q) => p + q, 0) / n;
  const my = y.reduce((p, q) => p + q, 0) / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i++) {
    cov += (x[i] - mx) * (y[i] - my);
    vx += (x[i] - mx) ** 2;
    vy += (y[i] - my) ** 2;
  }
  return vx === 0 || vy === 0 ? 0 : cov / Math.sqrt(vx * vy);
}

/** Historical (non-parametric) 1-day VaR / CVaR at a confidence level. */
export function varCvar(returns: number[], confidence = 0.95): { varPct: number; cvarPct: number } {
  if (!returns.length) return { varPct: 0, cvarPct: 0 };
  const sorted = [...returns].sort((x, y) => x - y);
  const idx = Math.max(0, Math.floor((1 - confidence) * sorted.length));
  const tail = sorted.slice(0, idx + 1);
  return {
    varPct: sorted[idx] * 100,
    cvarPct: (tail.reduce((a, b) => a + b, 0) / Math.max(1, tail.length)) * 100,
  };
}

export function monthlyReturnGrid(series: Point[]): { year: number; months: (number | null)[] }[] {
  const byYear = new Map<number, Map<number, { first: number; last: number }>>();
  for (const p of series) {
    const d = new Date(p.day + "T00:00:00Z");
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    if (!byYear.has(y)) byYear.set(y, new Map());
    const row = byYear.get(y)!;
    const cell = row.get(m);
    if (!cell) row.set(m, { first: p.value, last: p.value });
    else cell.last = p.value;
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  return years.map((y) => {
    const row = byYear.get(y)!;
    const months: (number | null)[] = [];
    for (let m = 0; m < 12; m++) {
      const cell = row.get(m);
      months.push(cell && cell.first > 0 ? (cell.last / cell.first - 1) * 100 : null);
    }
    return { year: y, months };
  });
}

/** Money-weighted return (IRR) from dated external cash flows. */
export function irr(flows: { day: string; amount: number }[], currentValue: number): number {
  const today = new Date().toISOString().slice(0, 10);
  const items = [...flows, { day: today, amount: -currentValue }];
  const t0 = new Date(items[0].day + "T00:00:00Z").getTime();
  const npv = (rate: number) =>
    items.reduce((acc, f) => {
      const years = (new Date(f.day + "T00:00:00Z").getTime() - t0) / (365.25 * 86400000);
      return acc + f.amount / Math.pow(1 + rate, years);
    }, 0);
  let lo = -0.95;
  let hi = 2;
  if (npv(lo) * npv(hi) > 0) return 0;
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/** Herfindahl concentration index, 0..1. */
export function hhi(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  return weights.reduce((a, w) => a + (w / total) ** 2, 0);
}
