import { AXES, signalFor, type Axis } from "../data/signals";
import { alignedReturns, overlapDays } from "../data/prices";
import { correlation } from "../lib/stats";
import type { Portfolio, Position } from "./portfolio";
import { THIN_BAR_THRESHOLD } from "./portfolio";

export interface AxisDetail {
  axis: Axis;
  score: number;
  lifters: { symbol: string; name: string; score: number; weight: number; pull: number }[];
  draggers: { symbol: string; name: string; score: number; weight: number; pull: number }[];
}

export interface Scorecard {
  overall: number;
  axes: { axis: Axis; score: number }[];
  detail: AxisDetail[];
  grade: string;
}

export function computeScorecard(p: Portfolio): Scorecard {
  const base = p.holdingsValue || 1;
  const rows = p.positions.map((pos) => ({
    pos,
    w: pos.value / base,
    sig: signalFor(pos.symbol),
  }));

  const axes = AXES.map((axis) => ({
    axis,
    score: rows.reduce((acc, r) => acc + r.w * r.sig.axes[axis], 0),
  }));

  const detail: AxisDetail[] = axes.map(({ axis, score }) => {
    const pulls = rows
      .map((r) => ({
        symbol: r.pos.symbol,
        name: r.pos.name,
        score: r.sig.axes[axis],
        weight: r.w * 100,
        pull: r.w * (r.sig.axes[axis] - score),
      }))
      .sort((a, b) => b.pull - a.pull);
    return {
      axis,
      score,
      lifters: pulls.filter((x) => x.pull > 0).slice(0, 4),
      draggers: pulls.filter((x) => x.pull < 0).sort((a, b) => a.pull - b.pull).slice(0, 4),
    };
  });

  const overall = axes.reduce((a, x) => a + x.score, 0) / axes.length;
  const grade =
    overall >= 7.5 ? "Strong" : overall >= 6.5 ? "Solid" : overall >= 5.5 ? "Fair" : overall >= 4.5 ? "Mixed" : "Weak";
  return { overall, axes, detail, grade };
}

export interface PairCorrelation {
  a: string;
  b: string;
  aName: string;
  bName: string;
  r: number;
  combinedWeight: number;
  days: number;
}

export interface CorrelationResult {
  pairs: PairCorrelation[];
  highest: PairCorrelation[];
  lowest: PairCorrelation[];
  excluded: Position[];
  avg: number;
  matrix: { symbols: string[]; values: number[][] };
}

export function computeCorrelations(p: Portfolio): CorrelationResult {
  const usable = p.positions.filter((x) => x.bars >= THIN_BAR_THRESHOLD);
  const excluded = p.positions.filter((x) => x.bars < THIN_BAR_THRESHOLD);
  const symbols = usable.map((x) => x.symbol);
  const rets = alignedReturns(symbols, 504);
  const base = p.holdingsValue || 1;
  const weight = new Map(usable.map((x) => [x.symbol, (x.value / base) * 100]));

  const values: number[][] = symbols.map(() => new Array(symbols.length).fill(1));
  const pairs: PairCorrelation[] = [];
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const r = correlation(rets[i], rets[j]);
      values[i][j] = r;
      values[j][i] = r;
      pairs.push({
        a: symbols[i],
        b: symbols[j],
        aName: usable[i].name,
        bName: usable[j].name,
        r,
        combinedWeight: (weight.get(symbols[i]) ?? 0) + (weight.get(symbols[j]) ?? 0),
        days: overlapDays(symbols[i], symbols[j]),
      });
    }
  }
  const sorted = [...pairs].sort((a, b) => b.r - a.r);
  const avg = pairs.length ? pairs.reduce((a, x) => a + x.r, 0) / pairs.length : 0;
  return {
    pairs,
    highest: sorted.slice(0, 5),
    lowest: sorted.slice(-5).reverse(),
    excluded,
    avg,
    matrix: { symbols, values },
  };
}

/** Correlation of one holding against every other holding. */
export function correlationsAgainst(p: Portfolio, symbol: string) {
  const others = p.positions.filter((x) => x.symbol !== symbol && x.bars >= THIN_BAR_THRESHOLD);
  const self = p.positions.find((x) => x.symbol === symbol);
  if (!self || self.bars < 60) return [];
  const syms = [symbol, ...others.map((o) => o.symbol)];
  const rets = alignedReturns(syms, 504);
  return others
    .map((o, i) => ({
      symbol: o.symbol,
      name: o.name,
      weight: (o.value / (p.holdingsValue || 1)) * 100,
      r: correlation(rets[0], rets[i + 1]),
      days: overlapDays(symbol, o.symbol),
    }))
    .sort((a, b) => b.r - a.r);
}
