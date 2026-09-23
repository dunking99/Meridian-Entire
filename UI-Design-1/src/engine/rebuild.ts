import { UNIVERSE, asset } from "../data/universe";
import { WATCHLIST } from "../data/portfolio";
import { alignedReturns, changePct, series } from "../data/prices";
import { signalFor } from "../data/signals";
import { NEWS } from "../data/news";
import { covMatrix, effectiveHoldings, maxDrawdown, portfolioVol, sum } from "../lib/stats";
import type { Portfolio } from "./portfolio";
import { THIN_BAR_THRESHOLD } from "./portfolio";
import type { XRay } from "./lookthrough";

export interface Mandate {
  risk: number; // 1–10
  horizon: number; // years
  maxPosition: number; // %
  minQuality: number; // 0–10
  incomeNeed: number; // % yield target
  homeBias: number; // % UK floor
  maxSectorPct: number;
  excludeSectors: string[];
}

export const DEFAULT_MANDATE: Mandate = {
  risk: 6,
  horizon: 12,
  maxPosition: 10,
  minQuality: 5.5,
  incomeNeed: 1.5,
  homeBias: 8,
  maxSectorPct: 32,
  excludeSectors: [],
};

export interface Finding {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  metric: string;
  limit: string;
}

export function exposureFindings(p: Portfolio, x: XRay, m: Mandate): Finding[] {
  const base = p.holdingsValue || 1;
  const out: Finding[] = [];
  const techLT = x.sectors.find((s) => s.key === "Technology")?.pct ?? 0;
  const invested = p.positions.map((pp) => (pp.value / base) * 100);
  const eff = effectiveHoldings(invested);
  const bondPct = sum(p.positions.filter((pp) => pp.asset.type === "Bond").map((pp) => (pp.value / base) * 100));
  const ukPct = x.regions.find((r) => r.key === "United Kingdom")?.pct ?? 0;
  const targetBond = Math.max(0, (10 - m.risk) * 6);
  const yieldPct = sum(p.positions.map((pp) => ((pp.value / base) * (pp.asset.yieldPct ?? 0))));

  out.push({
    id: "f-tech",
    severity: techLT > m.maxSectorPct + 8 ? "high" : techLT > m.maxSectorPct ? "medium" : "low",
    title: "Technology concentration, seen through the funds",
    detail: `You bought ${p.positions.filter((pp) => pp.asset.sector === "Technology").length} technology lines directly, but once the index funds are opened up the true sector exposure is materially higher. This is the single largest deviation from the mandate.`,
    metric: `${techLT.toFixed(1)}%`,
    limit: `cap ${m.maxSectorPct}%`,
  });
  out.push({
    id: "f-overlap",
    severity: x.overlaps.length > 8 ? "high" : x.overlaps.length > 4 ? "medium" : "low",
    title: "Duplicated underlying companies",
    detail: `${x.overlaps.length} companies are reached through more than one route. ${x.overlaps.slice(0, 3).map((o) => o.symbol).join(", ")} lead the list. Each duplicate reduces the diversification you think you are paying fund fees for.`,
    metric: `${x.overlaps.length} names`,
    limit: "target ≤ 4",
  });
  out.push({
    id: "f-eff",
    severity: eff < p.positions.length * 0.6 ? "high" : eff < p.positions.length * 0.78 ? "medium" : "low",
    title: "Effective breadth below the line count",
    detail: `The statement shows ${p.positions.length} positions. On a 1/HHI basis the portfolio behaves like ${eff.toFixed(1)}. Position sizing, not instrument count, is what determines breadth.`,
    metric: `${eff.toFixed(1)} of ${p.positions.length}`,
    limit: `target ≥ ${(p.positions.length * 0.78).toFixed(0)}`,
  });
  out.push({
    id: "f-ballast",
    severity: bondPct < targetBond * 0.5 ? "high" : bondPct < targetBond ? "medium" : "low",
    title: "Defensive ballast versus the risk setting",
    detail: `At risk level ${m.risk}/10 over a ${m.horizon}-year horizon the framework wants roughly ${targetBond.toFixed(0)}% in duration or cash-like assets. You hold ${bondPct.toFixed(1)}%. In a 30% equity drawdown this is the difference between rebalancing and selling.`,
    metric: `${bondPct.toFixed(1)}%`,
    limit: `target ${targetBond.toFixed(0)}%`,
  });
  out.push({
    id: "f-us",
    severity: x.usExposure > 70 ? "high" : x.usExposure > 60 ? "medium" : "low",
    title: "Single-country dependence",
    detail: `Look-through North American exposure is ${x.usExposure.toFixed(1)}%. That is a currency and policy bet as much as an equity one, and it is not a decision you explicitly made — it arrived through the index funds.`,
    metric: `${x.usExposure.toFixed(1)}%`,
    limit: "cap 65%",
  });
  out.push({
    id: "f-uk",
    severity: ukPct < m.homeBias * 0.6 ? "medium" : "low",
    title: "Home-currency exposure against liabilities",
    detail: `Look-through UK exposure is ${ukPct.toFixed(1)}% against a mandate floor of ${m.homeBias}%. Your future spending is in sterling; the portfolio is not.`,
    metric: `${ukPct.toFixed(1)}%`,
    limit: `floor ${m.homeBias}%`,
  });
  out.push({
    id: "f-income",
    severity: yieldPct < m.incomeNeed ? "low" : "low",
    title: "Income generation",
    detail: `Blended trailing yield is ${yieldPct.toFixed(2)}% against a stated need of ${m.incomeNeed}%. With a ${m.horizon}-year horizon this is not yet a problem, but it constrains the exit path if the horizon shortens.`,
    metric: `${yieldPct.toFixed(2)}%`,
    limit: `need ${m.incomeNeed}%`,
  });

  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export interface FunnelStage {
  key: string;
  label: string;
  description: string;
  entered: number;
  survived: number;
  dropped: { symbol: string; name: string; reason: string }[];
}

export interface ProposedLine {
  symbol: string;
  name: string;
  weight: number;
  value: number;
  currentWeight: number;
  currentValue: number;
  rationale: string;
  sector: string;
  region: string;
}

export interface Trade {
  symbol: string;
  name: string;
  action: "Buy" | "Add" | "Trim" | "Exit" | "Hold";
  delta: number;
  units: number;
  fromWeight: number;
  toWeight: number;
  note: string;
}

export interface RiskComparison {
  metric: string;
  current: number;
  proposed: number;
  unit: string;
  better: "lower" | "higher";
  note: string;
}

export interface RebuildResult {
  ranAt: string;
  wide: boolean;
  stages: FunnelStage[];
  proposal: ProposedLine[];
  trades: Trade[];
  risk: RiskComparison[];
  verdict: { headline: string; stance: "overhaul" | "tune" | "hold"; body: string[] };
  macro: { regime: string; rates: string; breadth: string; note: string };
  gaps: string[];
  turnover: number;
}

export function runRebuild(p: Portfolio, x: XRay, m: Mandate, wide: boolean): RebuildResult {
  const heldSyms = p.positions.map((pp) => pp.symbol);
  const poolSyms = new Set<string>([...heldSyms, ...WATCHLIST]);
  if (wide) UNIVERSE.filter((a) => a.investable && a.bars > 0).forEach((a) => poolSyms.add(a.symbol));
  let pool = [...poolSyms].filter((s) => asset(s).bars > 0);

  const stages: FunnelStage[] = [];
  const dropAt = (
    key: string,
    label: string,
    description: string,
    test: (s: string) => string | null,
  ) => {
    const entered = pool.length;
    const dropped: { symbol: string; name: string; reason: string }[] = [];
    pool = pool.filter((s) => {
      const reason = test(s);
      if (reason) {
        dropped.push({ symbol: s, name: asset(s).name, reason });
        return false;
      }
      return true;
    });
    stages.push({ key, label, description, entered, survived: pool.length, dropped });
  };

  dropAt(
    "scan",
    "Universe scan",
    `Every held line plus the watchlist${wide ? " plus the whole investable tracked universe" : ""}. Instruments without enough stored history to be risk-assessed are removed here.`,
    (s) => {
      const a = asset(s);
      if (series(s).length < THIN_BAR_THRESHOLD)
        return `Only ${series(s).length} stored bars — below the ${THIN_BAR_THRESHOLD}-bar floor needed to estimate volatility and correlation.`;
      if (a.price <= 0) return "No tradable price on the connected feed.";
      return null;
    },
  );

  const targetBond = Math.max(0, (10 - m.risk) * 6);
  dropAt(
    "macro",
    "Macro & mandate filter",
    `Screens what survives against the mandate: risk ${m.risk}/10, ${m.horizon}-year horizon, sector cap ${m.maxSectorPct}%, excluded sectors applied.`,
    (s) => {
      const a = asset(s);
      if (m.excludeSectors.includes(a.sector)) return `${a.sector} is excluded by the mandate.`;
      if (a.type === "Bond" && targetBond <= 0)
        return "Risk setting leaves no room for duration — fixed income not required.";
      if (a.beta > 1.1 + m.risk * 0.12)
        return `Beta ${a.beta.toFixed(2)} exceeds the ${(1.1 + m.risk * 0.12).toFixed(2)} ceiling implied by risk level ${m.risk}.`;
      if (m.horizon < 6 && a.vol > 0.35)
        return `Annualised volatility ${(a.vol * 100).toFixed(0)}% is unsuitable for a ${m.horizon}-year horizon.`;
      return null;
    },
  );

  dropAt(
    "diligence",
    "Fundamental diligence",
    `Quality floor ${m.minQuality.toFixed(1)}/10, balance-sheet check, and a conviction threshold. This is where most of the tracked universe falls away.`,
    (s) => {
      const sig = signalFor(s);
      if (sig.axes.Quality < m.minQuality)
        return `Quality ${sig.axes.Quality.toFixed(1)} below the ${m.minQuality.toFixed(1)} floor.`;
      if (sig.axes["Balance sheet"] < 4)
        return `Balance-sheet score ${sig.axes["Balance sheet"].toFixed(1)} — leverage risk over a ${m.horizon}-year hold.`;
      if (sig.conviction < 5.2) return `Conviction ${sig.conviction.toFixed(1)} does not clear the 5.2 bar for a from-scratch build.`;
      if (sig.bear.length > sig.bull.length + 1)
        return `Bear case outweighs the bull case ${sig.bear.length}:${sig.bull.length}.`;
      return null;
    },
  );

  dropAt(
    "news",
    "News veto",
    "Any live story carrying a mandate-relevant veto removes the name regardless of how well it scored above.",
    (s) => NEWS.find((nn) => nn.symbols.includes(s) && nn.veto)?.veto ?? null,
  );

  dropAt(
    "timing",
    "Timing & entry",
    "Survivors are checked for entry conditions: extended momentum, drawdown structure and valuation percentile. Deferred names are not rejections — they are re-checked on the next run.",
    (s) => {
      const mom3 = changePct(s, 63);
      const sig = signalFor(s);
      if (mom3 > 34 && sig.axes.Value < 4)
        return `Up ${mom3.toFixed(0)}% in three months on a value score of ${sig.axes.Value.toFixed(1)} — entry deferred, not rejected.`;
      if (sig.axes.Momentum < 2.6 && sig.axes.Value < 5)
        return `Falling and not yet cheap (momentum ${sig.axes.Momentum.toFixed(1)}, value ${sig.axes.Value.toFixed(1)}). No entry trigger.`;
      return null;
    },
  );

  // ---- reconstruction ------------------------------------------------------
  const base = p.holdingsValue || 1;
  const investable = p.totalValue;
  const scored = pool
    .map((s) => {
      const sig = signalFor(s);
      const a = asset(s);
      const riskAdj = 1 / (1 + Math.max(0, a.vol - 0.18) * (10 - m.risk) * 0.4);
      return { symbol: s, raw: (sig.conviction * 0.6 + sig.axes.Quality * 0.4) * riskAdj, a, sig };
    })
    .sort((q, r) => r.raw - q.raw)
    .slice(0, 14);

  const rawSum = sum(scored.map((s) => s.raw)) || 1;
  const cap = m.maxPosition / 100;
  let weights = scored.map((s) => Math.min(s.raw / rawSum, cap));
  const wSum = sum(weights) || 1;
  const cashFloor = Math.min(0.08, Math.max(0.02, (10 - m.risk) / 120));
  weights = weights.map((w) => (w / wSum) * (1 - cashFloor));

  const proposal: ProposedLine[] = scored.map((s, i) => {
    const cur = p.positions.find((pp) => pp.symbol === s.symbol);
    return {
      symbol: s.symbol,
      name: s.a.name,
      weight: weights[i] * 100,
      value: weights[i] * investable,
      currentWeight: cur ? (cur.value / p.totalValue) * 100 : 0,
      currentValue: cur?.value ?? 0,
      sector: s.a.sector,
      region: s.a.region,
      rationale: `Conviction ${s.sig.conviction.toFixed(1)} · quality ${s.sig.axes.Quality.toFixed(1)} · vol ${(s.a.vol * 100).toFixed(0)}% risk-adjusted to the ${m.risk}/10 setting.`,
    };
  });

  const proposedMap = new Map(proposal.map((pl) => [pl.symbol, pl]));
  const trades: Trade[] = [];
  for (const pos of p.positions) {
    const target = proposedMap.get(pos.symbol);
    const toValue = target?.value ?? 0;
    const delta = toValue - pos.value;
    const fromWeight = (pos.value / p.totalValue) * 100;
    const toWeight = (toValue / investable) * 100;
    if (!target) {
      trades.push({
        symbol: pos.symbol,
        name: pos.name,
        action: "Exit",
        delta,
        units: -pos.qty,
        fromWeight,
        toWeight: 0,
        note: findExitReason(stages, pos.symbol) ?? "Did not survive the funnel — no longer justifies a place in a from-scratch build.",
      });
    } else if (Math.abs(delta) / p.totalValue < 0.004) {
      trades.push({ symbol: pos.symbol, name: pos.name, action: "Hold", delta, units: 0, fromWeight, toWeight, note: "Already within 0.4pp of the proposed weight." });
    } else {
      trades.push({
        symbol: pos.symbol,
        name: pos.name,
        action: delta > 0 ? "Add" : "Trim",
        delta,
        units: pos.price > 0 ? delta / pos.price : 0,
        fromWeight,
        toWeight,
        note: target.rationale,
      });
    }
  }
  for (const pl of proposal) {
    if (!p.positions.find((pos) => pos.symbol === pl.symbol)) {
      trades.push({
        symbol: pl.symbol,
        name: pl.name,
        action: "Buy",
        delta: pl.value,
        units: asset(pl.symbol).price > 0 ? pl.value / asset(pl.symbol).price : 0,
        fromWeight: 0,
        toWeight: pl.weight,
        note: pl.rationale,
      });
    }
  }
  const order = { Buy: 0, Add: 1, Trim: 2, Exit: 3, Hold: 4 };
  trades.sort((a, b) => order[a.action] - order[b.action] || Math.abs(b.delta) - Math.abs(a.delta));
  const turnover = (sum(trades.map((t) => Math.abs(t.delta))) / 2 / p.totalValue) * 100;

  // ---- risk comparison -----------------------------------------------------
  const curSyms = p.positions.filter((pp) => pp.bars >= THIN_BAR_THRESHOLD).map((pp) => pp.symbol);
  const propSyms = proposal.map((pl) => pl.symbol).filter((s) => series(s).length >= THIN_BAR_THRESHOLD);
  const allSyms = [...new Set([...curSyms, ...propSyms])];
  const rets = alignedReturns(allSyms, 504);
  const cov = covMatrix(rets);
  const idx = new Map(allSyms.map((s, i) => [s, i]));
  const curW = allSyms.map((s) => {
    const pos = p.positions.find((pp) => pp.symbol === s);
    return pos ? pos.value / base : 0;
  });
  const propW = allSyms.map((s) => (proposedMap.get(s)?.weight ?? 0) / 100);
  const curVol = portfolioVol(curW, cov);
  const propVol = portfolioVol(propW, cov);
  const curBeta = sum(p.positions.map((pp) => (pp.value / base) * pp.asset.beta));
  const propBeta = sum(proposal.map((pl) => (pl.weight / 100) * asset(pl.symbol).beta));
  const curWeights = p.positions.map((pp) => (pp.value / base) * 100);
  const propWeights = proposal.map((pl) => pl.weight);
  const curEff = effectiveHoldings(curWeights);
  const propEff = effectiveHoldings(propWeights);
  const synth = (w: number[]) => {
    const n = Math.min(...allSyms.map((s) => series(s).length));
    const out: number[] = [100];
    for (let t = 1; t < n; t++) {
      let r = 0;
      allSyms.forEach((s, i) => {
        const ser = series(s);
        const o = ser.length - n;
        r += w[i] * (ser[o + t] / ser[o + t - 1] - 1);
      });
      out.push(out[out.length - 1] * (1 + r));
    }
    return out;
  };
  const curDD = maxDrawdown(synth(curW.map((w) => w / (sum(curW) || 1))));
  const propDD = maxDrawdown(synth(propW.map((w) => w / (sum(propW) || 1))));
  void idx;

  const risk: RiskComparison[] = [
    { metric: "Annualised volatility", current: curVol, proposed: propVol, unit: "%", better: "lower", note: "Computed from 504 days of overlapping returns on the full covariance matrix." },
    { metric: "Portfolio beta", current: curBeta, proposed: propBeta, unit: "", better: "lower", note: `Mandate ceiling at risk ${m.risk}/10 is ${(1.1 + m.risk * 0.06).toFixed(2)}.` },
    { metric: "Worst historic drawdown", current: curDD, proposed: propDD, unit: "%", better: "higher", note: "Back-cast on the current weight vector — not a forecast." },
    { metric: "Effective holdings", current: curEff, proposed: propEff, unit: "", better: "higher", note: "1/HHI. Measures real breadth rather than line count." },
    {
      metric: "Largest position",
      current: curWeights.length ? Math.max(...curWeights) : 0,
      proposed: propWeights.length ? Math.max(...propWeights) : 0,
      unit: "%",
      better: "lower",
      note: `Mandate cap ${m.maxPosition}%.`,
    },
  ];

  const highFindings = exposureFindings(p, x, m).filter((f) => f.severity === "high").length;
  const stance: "overhaul" | "tune" | "hold" = turnover > 45 ? "overhaul" : turnover > 18 ? "tune" : "hold";
  const verdict = {
    stance,
    headline:
      stance === "overhaul"
        ? "A from-scratch build would look materially different to what you hold"
        : stance === "tune"
          ? "The shape is right; the sizing is not"
          : "A from-scratch build would land close to where you already are",
    body: [
      `Rebuilt from cash against this mandate, ${turnover.toFixed(0)}% of the portfolio would change hands. ${trades.filter((t) => t.action === "Exit").length} positions would not be repurchased and ${trades.filter((t) => t.action === "Buy").length} new lines would be opened.`,
      highFindings > 0
        ? `${highFindings} exposure finding${highFindings > 1 ? "s are" : " is"} rated high. The dominant one is concentration that arrived through funds rather than through decisions — it does not show up on the holdings statement at all.`
        : "No exposure finding is rated high. The gap between what you hold and what the mandate implies is a sizing question rather than a selection one.",
      `Expected volatility moves from ${curVol.toFixed(1)}% to ${propVol.toFixed(1)}% and effective breadth from ${curEff.toFixed(1)} to ${propEff.toFixed(1)} lines. ${propVol < curVol ? "Less risk for a similar return profile." : "More risk — justified only if the horizon genuinely is " + m.horizon + " years."}`,
      "This is advisory only. Nothing here has been applied to your holdings, and no order has been staged. Treat it as a second opinion from a system that has no attachment to what you already own.",
    ],
  };

  const gaps = [
    ...p.positions.filter((pp) => pp.bars < THIN_BAR_THRESHOLD).map((pp) => `${pp.symbol} — ${pp.bars} stored bars. Excluded from every risk estimate above; its ${((pp.value / p.totalValue) * 100).toFixed(1)}% weight is therefore missing from the volatility and drawdown figures.`),
    ...x.gaps.map((g) => `${g.symbol} — ${g.reason} Its ${g.weight.toFixed(1)}% sits in the portfolio as an unresolved black box.`),
    "Private holdings inside SMT (notably SpaceX at 7.3% of the trust) are marked on a stale NAV. Look-through figures treat them at last published mark.",
    "No tax position is modelled. Exits in the GIA would realise gains; the trade table ignores this entirely.",
  ];

  const macro = {
    regime: "Late-cycle expansion, decelerating",
    rates: "Policy easing priced but not delivered",
    breadth: "Narrow — top decile driving index returns",
    note: "Index concentration is at a post-1970s extreme, which means the diversification inside broad funds is weaker than the label implies. That conditions every finding below: adding another market-cap-weighted global fund would increase the same exposure you already have too much of.",
  };

  return { ranAt: new Date().toISOString(), wide, stages, proposal, trades, risk, verdict, macro, gaps, turnover };
}

function findExitReason(stages: FunnelStage[], symbol: string) {
  for (const s of stages) {
    const d = s.dropped.find((x) => x.symbol === symbol);
    if (d) return `${s.label}: ${d.reason}`;
  }
  return null;
}
