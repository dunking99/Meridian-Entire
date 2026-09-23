import { UNIVERSE, asset } from "../data/universe";
import { WATCHLIST } from "../data/portfolio";
import { alignedReturns, changePct, series } from "../data/prices";
import { convictionTilt, signalFor } from "../data/signals";
import { NEWS } from "../data/news";
import { covMatrix, maxSharpeWeights, mean, sum } from "../lib/stats";
import type { Portfolio } from "./portfolio";
import { THIN_BAR_THRESHOLD } from "./portfolio";

export type AllocMode = "auto" | "targets";

export interface Candidate {
  symbol: string;
  name: string;
  held: boolean;
  source: "Holding" | "Watchlist" | "Universe";
  conviction: number;
  tilt: number;
  screener: number;
  precedent: number;
  bull: number;
  bear: number;
  riskContribution: number;
  momentum: number;
  score: number;
  weight: number;
  targetPct?: number;
  gapPct?: number;
  newsVeto?: string;
}

export interface Allocation {
  symbol: string;
  name: string;
  amount: number;
  units: number;
  price: number;
  rationale: string;
  score: number;
  newWeight: number;
  oldWeight: number;
}

export interface Rejected {
  symbol: string;
  name: string;
  reason: string;
  score: number;
}

export interface StatAlt {
  symbol: string;
  name: string;
  weight: number;
  amount: number;
}

export interface Plan {
  mode: AllocMode;
  amount: number;
  wide: boolean;
  allocations: Allocation[];
  rejected: Rejected[];
  statistical: StatAlt[];
  statSharpe: number;
  deployed: number;
  residual: number;
  notes: string[];
  generatedAt: string;
}

const MIN_TICKET = 500;
const MAX_SINGLE_SHARE = 0.32;
const MAX_RESULT_WEIGHT = 25;

/** Marginal contribution to portfolio risk, 0–1 normalised. */
function riskContributions(p: Portfolio, symbols: string[]) {
  const held = p.positions.filter((x) => x.bars >= THIN_BAR_THRESHOLD);
  const heldSyms = held.map((h) => h.symbol);
  const all = [...new Set([...heldSyms, ...symbols])].filter((s) => series(s).length >= THIN_BAR_THRESHOLD);
  const rets = alignedReturns(all, 504);
  const cov = covMatrix(rets);
  const base = p.holdingsValue || 1;
  const w = all.map((s) => {
    const pos = p.positions.find((x) => x.symbol === s);
    return pos ? pos.value / base : 0;
  });
  const out = new Map<string, number>();
  const idx = new Map(all.map((s, i) => [s, i]));
  let maxAbs = 1e-9;
  for (const s of all) {
    const i = idx.get(s)!;
    let mc = 0;
    for (let j = 0; j < all.length; j++) mc += w[j] * cov[i][j];
    out.set(s, mc);
    maxAbs = Math.max(maxAbs, Math.abs(mc));
  }
  const norm = new Map<string, number>();
  for (const [k, v] of out) norm.set(k, v / maxAbs);
  return norm;
}

export function buildCandidates(p: Portfolio, wide: boolean): Candidate[] {
  const heldSyms = new Set(p.positions.map((x) => x.symbol));
  const pool = new Set<string>([...heldSyms, ...WATCHLIST]);
  if (wide) UNIVERSE.filter((a) => a.investable && a.bars > 0).forEach((a) => pool.add(a.symbol));
  const symbols = [...pool].filter((s) => asset(s).bars > 0);
  const risk = riskContributions(p, symbols);
  const base = p.holdingsValue || 1;

  return symbols
    .map((symbol) => {
      const a = asset(symbol);
      const sig = signalFor(symbol);
      const pos = p.positions.find((x) => x.symbol === symbol);
      const rc = risk.get(symbol) ?? 0.5;
      const mom = changePct(symbol, 126);
      const veto = NEWS.find((nn) => nn.symbols.includes(symbol) && nn.veto)?.veto;
      const tilt = convictionTilt(symbol);
      const weight = pos ? (pos.value / base) * 100 : 0;
      const score =
        tilt * 7.2 +
        (sig.precedent.higher - 50) * 0.32 +
        sig.screener * 0.18 +
        (sig.bull.length - sig.bear.length) * 2.1 +
        Math.max(-8, Math.min(8, mom / 4)) -
        rc * 14 -
        (veto ? 12 : 0) -
        (pos && pos.targetPct && weight > pos.targetPct ? (weight - pos.targetPct) * 1.4 : 0);
      return {
        symbol,
        name: a.name,
        held: heldSyms.has(symbol),
        source: heldSyms.has(symbol) ? "Holding" : WATCHLIST.includes(symbol) ? "Watchlist" : "Universe",
        conviction: sig.conviction,
        tilt,
        screener: sig.screener,
        precedent: sig.precedent.higher,
        bull: sig.bull.length,
        bear: sig.bear.length,
        riskContribution: rc,
        momentum: mom,
        score,
        weight,
        targetPct: pos?.targetPct,
        gapPct: pos?.targetPct != null ? pos.targetPct - weight : undefined,
        newsVeto: veto,
      } as Candidate;
    })
    .sort((a, b) => b.score - a.score);
}

function statisticalAlternative(candidates: Candidate[], amount: number): { alt: StatAlt[]; sharpe: number } {
  const syms = candidates
    .filter((c) => asset(c.symbol).bars >= THIN_BAR_THRESHOLD)
    .slice(0, 14)
    .map((c) => c.symbol);
  if (syms.length < 3) return { alt: [], sharpe: 0 };
  const rets = alignedReturns(syms, 504);
  const cov = covMatrix(rets);
  const expected = rets.map((r) => mean(r) * 252);
  const w = maxSharpeWeights(expected, cov, 0.042, 0.28, 3000);
  let ret = 0;
  for (let i = 0; i < w.length; i++) ret += w[i] * expected[i];
  let variance = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) variance += w[i] * w[j] * cov[i][j];
  const sharpe = (ret - 0.042) / Math.sqrt(Math.max(variance, 1e-9));
  const alt = syms
    .map((s, i) => ({ symbol: s, name: asset(s).name, weight: w[i] * 100, amount: w[i] * amount }))
    .filter((x) => x.weight > 0.6)
    .sort((a, b) => b.weight - a.weight);
  return { alt, sharpe };
}

export function generatePlan(
  p: Portfolio,
  mode: AllocMode,
  amount: number,
  wide: boolean,
  candidates: Candidate[],
): Plan {
  const allocations: Allocation[] = [];
  const rejected: Rejected[] = [];
  const notes: string[] = [];
  const base = p.totalValue || 1;

  if (mode === "targets") {
    const withTargets = p.positions.filter((x) => x.targetPct != null);
    const futureTotal = p.holdingsValue + amount;
    const gaps = withTargets
      .map((pos) => {
        const target = ((pos.targetPct ?? 0) / 100) * futureTotal;
        return { pos, gap: target - pos.value };
      })
      .filter((g) => g.gap > 0)
      .sort((a, b) => b.gap - a.gap);
    const totalGap = sum(gaps.map((g) => g.gap));
    for (const g of gaps) {
      const share = totalGap > 0 ? g.gap / totalGap : 0;
      const raw = share * amount;
      if (raw < MIN_TICKET) {
        rejected.push({
          symbol: g.pos.symbol,
          name: g.pos.name,
          reason: `Underweight by ${(g.gap / futureTotal * 100).toFixed(2)}pp but the pro-rata ticket is ${raw.toFixed(0)} — below the ${MIN_TICKET} minimum. Rolled into the next contribution.`,
          score: g.gap,
        });
        continue;
      }
      const price = g.pos.price;
      allocations.push({
        symbol: g.pos.symbol,
        name: g.pos.name,
        amount: raw,
        units: price > 0 ? raw / price : 0,
        price,
        score: g.gap,
        oldWeight: (g.pos.value / base) * 100,
        newWeight: ((g.pos.value + raw) / (base + amount)) * 100,
        rationale: `Target ${g.pos.targetPct}% · currently ${((g.pos.value / p.holdingsValue) * 100).toFixed(1)}% of invested value. Closes ${((raw / g.gap) * 100).toFixed(0)}% of the gap.`,
      });
    }
    for (const pos of p.positions) {
      if (pos.targetPct == null) {
        rejected.push({
          symbol: pos.symbol,
          name: pos.name,
          reason: "No target weight set for this holding — excluded from target-based splitting.",
          score: 0,
        });
      } else if (!gaps.find((g) => g.pos.symbol === pos.symbol)) {
        rejected.push({
          symbol: pos.symbol,
          name: pos.name,
          reason: `Already at or above its ${pos.targetPct}% target (${((pos.value / p.holdingsValue) * 100).toFixed(1)}%). New money would push it further out of line.`,
          score: 0,
        });
      }
    }
    notes.push(
      `Split is pro-rata to the size of each underweight gap measured against the portfolio you would have after the ${amount.toLocaleString("en-GB")} contribution — not against today's value. That stops the plan under-funding the largest gaps.`,
    );
  } else {
    const eligible = candidates.filter((c) => c.score > 0 && !c.newsVeto);
    const totalScore = sum(eligible.slice(0, 8).map((c) => c.score));
    let remaining = amount;
    for (const c of candidates) {
      if (c.newsVeto) {
        rejected.push({ symbol: c.symbol, name: c.name, reason: `News veto — ${c.newsVeto}`, score: c.score });
        continue;
      }
      if (c.score <= 0) {
        rejected.push({
          symbol: c.symbol,
          name: c.name,
          reason: `Composite score ${c.score.toFixed(1)} after the risk-contribution penalty (${(c.riskContribution * 100).toFixed(0)}% of the worst marginal risk in the book). Adding here buys correlation, not return.`,
          score: c.score,
        });
        continue;
      }
      if (allocations.length >= 8) {
        rejected.push({
          symbol: c.symbol,
          name: c.name,
          reason: `Ranked ${candidates.indexOf(c) + 1} of ${candidates.length}. Outside the top eight — funding it would create tickets too small to be worth the dealing cost.`,
          score: c.score,
        });
        continue;
      }
      const share = totalScore > 0 ? c.score / totalScore : 0;
      let raw = Math.min(share * amount, amount * MAX_SINGLE_SHARE, remaining);
      const pos = p.positions.find((x) => x.symbol === c.symbol);
      const cur = pos?.value ?? 0;
      const resultWeight = ((cur + raw) / (base + amount)) * 100;
      if (resultWeight > MAX_RESULT_WEIGHT) {
        const capped = (MAX_RESULT_WEIGHT / 100) * (base + amount) - cur;
        if (capped < MIN_TICKET) {
          rejected.push({
            symbol: c.symbol,
            name: c.name,
            reason: `Already at ${c.weight.toFixed(1)}% — any meaningful ticket breaches the ${MAX_RESULT_WEIGHT}% single-position ceiling.`,
            score: c.score,
          });
          continue;
        }
        raw = capped;
      }
      if (raw < MIN_TICKET) {
        rejected.push({
          symbol: c.symbol,
          name: c.name,
          reason: `Score justified only ${raw.toFixed(0)} — below the ${MIN_TICKET} minimum ticket.`,
          score: c.score,
        });
        continue;
      }
      remaining -= raw;
      const sig = signalFor(c.symbol);
      allocations.push({
        symbol: c.symbol,
        name: c.name,
        amount: raw,
        units: c.symbol && asset(c.symbol).price > 0 ? raw / asset(c.symbol).price : 0,
        price: asset(c.symbol).price,
        score: c.score,
        oldWeight: (cur / base) * 100,
        newWeight: ((cur + raw) / (base + amount)) * 100,
        rationale: `Conviction ${c.conviction.toFixed(1)} · ${c.bull} bull / ${c.bear} bear · precedents resolved higher ${sig.precedent.higher}% of ${sig.precedent.setups} setups · screener ${c.screener}. Marginal risk contribution ${(c.riskContribution * 100).toFixed(0)}% of the book's worst.`,
      });
      if (remaining < MIN_TICKET) break;
    }
    notes.push(
      "Auto mode scores every candidate on conviction tilt, the bull/bear tally, precedent resolution, the screener composite and marginal contribution to portfolio risk. Risk contribution is a penalty, not a filter — a strong name still wins if the return case outweighs the correlation it adds.",
    );
    notes.push(
      `Ceilings applied: no single line above ${MAX_RESULT_WEIGHT}% of the post-contribution portfolio, no ticket above ${(MAX_SINGLE_SHARE * 100).toFixed(0)}% of the amount, minimum ticket ${MIN_TICKET}.`,
    );
  }

  const deployed = sum(allocations.map((a) => a.amount));
  const { alt, sharpe } = statisticalAlternative(candidates, amount);

  return {
    mode,
    amount,
    wide,
    allocations: allocations.sort((a, b) => b.amount - a.amount),
    rejected: rejected.sort((a, b) => b.score - a.score),
    statistical: alt,
    statSharpe: sharpe,
    deployed,
    residual: amount - deployed,
    notes,
    generatedAt: new Date().toISOString(),
  };
}
