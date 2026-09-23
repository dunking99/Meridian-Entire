import { benchmarkSeries, MAX_BARS, priceAtIndex } from "../data/prices";
import { asset } from "../data/universe";
import { buildHolding, type HoldingSeed } from "../data/portfolio";
import { linkContributions, sum, twr, xirr } from "../lib/stats";
import type { Portfolio } from "./portfolio";
import { seeded } from "../lib/random";

export interface ReturnCard {
  value: number;
  label: string;
  sub: string;
}

export interface Attribution {
  symbol: string;
  name: string;
  contribution: number; // pp of portfolio return
  avgWeight: number;
  assetReturn: number;
}

export interface SectorEffect {
  sector: string;
  portWeight: number;
  benchWeight: number;
  portReturn: number;
  benchReturn: number;
  allocation: number;
  selection: number;
  total: number;
}

export interface PerformanceResult {
  mwr: number | null;
  twrPct: number;
  benchReturn: number;
  excess: number;
  gap: number;
  verdict: { tone: "good" | "bad" | "neutral"; title: string; body: string };
  periodLabel: string;
  attribution: Attribution[];
  best: Attribution | null;
  worst: Attribution | null;
  sectorEffects: SectorEffect[];
  allocationTotal: number;
  selectionTotal: number;
  linkedTotal: number;
  commentary: string[];
  indexSeries: { dates: string[]; port: number[]; bench: number[] };
}

/** Global-equity benchmark sector weights used for the Brinson decomposition. */
const BENCH_SECTOR_WEIGHTS: Record<string, number> = {
  Technology: 26.4,
  Financials: 16.1,
  "Consumer Discretionary": 13.8,
  Healthcare: 10.9,
  Industrials: 10.6,
  "Consumer Staples": 5.6,
  Energy: 3.9,
  Diversified: 0,
  "Fixed Income": 6.0,
  Commodity: 1.5,
  Utilities: 2.6,
  Materials: 2.6,
};

function monthBoundaries(dates: string[]) {
  const idx: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    if (dates[i].slice(0, 7) !== dates[i - 1].slice(0, 7)) idx.push(i);
  }
  return idx;
}

export function computePerformance(p: Portfolio, seeds: HoldingSeed[]): PerformanceResult {
  const bench = benchmarkSeries();
  const startIdx = MAX_BARS - p.series.values.length;

  // ---- money-weighted (XIRR over external flows + terminal value) ----------
  const flows = p.flows
    .map((f) => ({ date: f.date, amount: -f.amount }))
    .concat([{ date: new Date().toISOString().slice(0, 10), amount: p.totalValue }]);
  const mwr = xirr(flows);

  // ---- time-weighted ------------------------------------------------------
  const twrTotal = twr(p.series.values, p.flowsByIndex);
  const years = p.years;
  const twrAnnual = (Math.pow(1 + twrTotal / 100, 1 / years) - 1) * 100;

  const benchStart = bench[startIdx];
  const benchTotal = (bench[bench.length - 1] / benchStart - 1) * 100;
  const benchAnnual = (Math.pow(1 + benchTotal / 100, 1 / years) - 1) * 100;

  const gap = (mwr ?? twrAnnual) - twrAnnual;

  // ---- index series for charting -----------------------------------------
  const port: number[] = [1];
  for (let i = 1; i < p.series.values.length; i++) {
    const base = p.series.values[i - 1] + (p.flowsByIndex[i] ?? 0);
    port.push(base > 0 ? port[port.length - 1] * (p.series.values[i] / base) : port[port.length - 1]);
  }
  const benchIdx = p.series.dates.map((_, i) => bench[startIdx + i] / benchStart);

  // ---- monthly Cariño-linked attribution ----------------------------------
  const holdings = seeds.map(buildHolding);
  const bounds = monthBoundaries(p.series.dates);
  const use = bounds.slice(-13);
  const periods: [number, number][] = [];
  for (let i = 1; i < use.length; i++) periods.push([use[i - 1], use[i]]);
  const lastB = use[use.length - 1];
  if (lastB !== undefined && lastB < p.series.dates.length - 1)
    periods.push([lastB, p.series.dates.length - 1]);

  const n = holdings.length;
  const periodReturns: number[] = [];
  const periodContribs: number[][] = [];
  const weightAcc = new Array(n).fill(0);

  for (const [a, b] of periods) {
    const ga = startIdx + a;
    const gb = startIdx + b;
    const vals = holdings.map((h) => (MAX_BARS - h.daysAgo <= ga ? priceAtIndex(h.symbol, ga) * h.qty : 0));
    const tot = sum(vals) || 1;
    const weights = vals.map((v) => v / tot);
    const rets = holdings.map((h, i) =>
      weights[i] > 0 ? priceAtIndex(h.symbol, gb) / priceAtIndex(h.symbol, ga) - 1 : 0,
    );
    const contrib = weights.map((w, i) => w * rets[i]);
    periodReturns.push(sum(contrib));
    periodContribs.push(contrib);
    weights.forEach((w, i) => (weightAcc[i] += w));
  }

  const linked =
    periods.length > 0
      ? linkContributions(periodReturns, periodContribs)
      : { total: 0, contributions: new Array(n).fill(0) };

  const attribution: Attribution[] = holdings
    .map((h, i) => {
      const a = asset(h.symbol);
      const startGlobal = startIdx + (periods[0]?.[0] ?? 0);
      const openIdx = MAX_BARS - h.daysAgo;
      const from = Math.max(startGlobal, openIdx);
      const p0 = priceAtIndex(h.symbol, from);
      const p1 = a.price;
      return {
        symbol: h.symbol,
        name: a.name,
        contribution: linked.contributions[i],
        avgWeight: (weightAcc[i] / Math.max(1, periods.length)) * 100,
        assetReturn: p0 > 0 ? (p1 / p0 - 1) * 100 : 0,
      };
    })
    .sort((a, b) => b.contribution - a.contribution);

  // ---- Brinson allocation vs selection by sector --------------------------
  const sectors = [...new Set(p.positions.map((x) => x.asset.sector))];
  const Rb = periods.length ? benchWindowReturn(bench, startIdx, periods) : 0;
  const rawBenchReturns: Record<string, number> = {};
  for (const s of sectors) rawBenchReturns[s] = Rb + seeded(`brs:${s}`, -7, 8);
  for (const s of Object.keys(BENCH_SECTOR_WEIGHTS))
    if (!(s in rawBenchReturns)) rawBenchReturns[s] = Rb + seeded(`brs:${s}`, -7, 8);
  // normalise so the benchmark sector returns reconcile to the benchmark total
  const bwTotal = sum(Object.values(BENCH_SECTOR_WEIGHTS));
  const implied = sum(
    Object.entries(BENCH_SECTOR_WEIGHTS).map(([s, w]) => (w / bwTotal) * rawBenchReturns[s]),
  );
  const adj = Rb - implied;
  for (const s of Object.keys(rawBenchReturns)) rawBenchReturns[s] += adj;

  const attrBySymbol = new Map(attribution.map((a) => [a.symbol, a]));
  const sectorEffects: SectorEffect[] = sectors
    .map((sector) => {
      const inSector = p.positions.filter((x) => x.asset.sector === sector);
      const pw = sum(inSector.map((x) => (x.value / p.holdingsValue) * 100));
      const bw = ((BENCH_SECTOR_WEIGHTS[sector] ?? 0) / bwTotal) * 100;
      const contribs = sum(inSector.map((x) => attrBySymbol.get(x.symbol)?.contribution ?? 0));
      const pr = pw > 0 ? (contribs / pw) * 100 : 0;
      const br = rawBenchReturns[sector] ?? Rb;
      return {
        sector,
        portWeight: pw,
        benchWeight: bw,
        portReturn: pr,
        benchReturn: br,
        allocation: ((pw - bw) / 100) * (br - Rb),
        selection: (bw / 100) * (pr - br),
        total: 0,
      };
    })
    .map((e) => ({ ...e, total: e.allocation + e.selection }))
    .sort((a, b) => b.total - a.total);

  const allocationTotal = sum(sectorEffects.map((e) => e.allocation));
  const selectionTotal = sum(sectorEffects.map((e) => e.selection));

  const best = attribution[0] ?? null;
  const worst = attribution[attribution.length - 1] ?? null;

  const verdict =
    gap > 0.6
      ? {
          tone: "good" as const,
          title: "Your timing added value",
          body: `Money-weighted return runs ${Math.abs(gap).toFixed(2)}pp per year ahead of the time-weighted figure. Capital was, on average, larger when the portfolio was performing well — deposits landed before strength rather than after it.`,
        }
      : gap < -0.6
        ? {
            tone: "bad" as const,
            title: "Your timing cost you",
            body: `Money-weighted return runs ${Math.abs(gap).toFixed(2)}pp per year behind the time-weighted figure. The portfolio was carrying more capital during weaker stretches — the strategy did better than you did from it.`,
          }
        : {
            tone: "neutral" as const,
            title: "Timing was broadly neutral",
            body: `The two measures sit within ${Math.abs(gap).toFixed(2)}pp of each other. Contribution timing has neither helped nor hurt materially — which is the outcome regular, unemotional investing is supposed to produce.`,
          };

  const topThree = attribution.slice(0, 3);
  const commentary = [
    `Over the last ${periods.length} months the reconciled contribution total is ${linked.total.toFixed(2)}%. Cariño linking distributes the compounding residual across periods, so the holding contributions below sum exactly to that figure rather than approximately.`,
    `${topThree.map((t) => t.symbol).join(", ")} account for ${topThree.reduce((a, t) => a + t.contribution, 0).toFixed(2)}pp of it. ${best ? `${best.symbol} alone contributed ${best.contribution.toFixed(2)}pp on an average weight of ${best.avgWeight.toFixed(1)}%.` : ""}`,
    worst && worst.contribution < 0
      ? `${worst.name} is the only material detractor at ${worst.contribution.toFixed(2)}pp. At ${worst.avgWeight.toFixed(1)}% average weight the damage is contained, but the position has now underperformed for long enough that the original thesis deserves a formal review rather than another quarter of patience.`
      : `No holding detracted materially this period — unusual, and worth treating as luck rather than skill.`,
    allocationTotal > selectionTotal
      ? `Decomposition says this was an allocation outcome (${allocationTotal >= 0 ? "+" : ""}${allocationTotal.toFixed(2)}pp) more than a stock-picking one (${selectionTotal >= 0 ? "+" : ""}${selectionTotal.toFixed(2)}pp). You were in the right places; within those places you were roughly average.`
      : `Decomposition says this was a selection outcome (${selectionTotal >= 0 ? "+" : ""}${selectionTotal.toFixed(2)}pp) more than an allocation one (${allocationTotal >= 0 ? "+" : ""}${allocationTotal.toFixed(2)}pp). The sector mix was close to neutral; the individual names did the work.`,
  ];

  return {
    mwr,
    twrPct: twrAnnual,
    benchReturn: benchAnnual,
    excess: twrAnnual - benchAnnual,
    gap,
    verdict,
    periodLabel: `${periods.length} months`,
    attribution,
    best,
    worst,
    sectorEffects,
    allocationTotal,
    selectionTotal,
    linkedTotal: linked.total,
    commentary,
    indexSeries: { dates: p.series.dates, port, bench: benchIdx },
  };
}

function benchWindowReturn(bench: number[], startIdx: number, periods: [number, number][]) {
  const a = startIdx + periods[0][0];
  const b = startIdx + periods[periods.length - 1][1];
  return (bench[b] / bench[a] - 1) * 100;
}
