import { asset, type Asset, type Wrapper } from "../data/universe";
import {
  buildHolding,
  CASHFLOW_SEEDS,
  HOLDING_SEEDS,
  TARGET_CASH,
  type CashFlow,
  type HoldingSeed,
} from "../data/portfolio";
import { CALENDAR, MAX_BARS, indexOfDate, priceAtIndex, series, todayMovePct } from "../data/prices";
import { effectiveHoldings, maxDrawdown, sum } from "../lib/stats";

export interface Position {
  id: string;
  symbol: string;
  name: string;
  unresolved: boolean;
  asset: Asset;
  qty: number;
  avgPrice: number;
  price: number;
  cost: number;
  value: number;
  pl: number;
  plPct: number;
  dayMovePct: number;
  dayMove: number;
  weight: number;
  wrapper: Wrapper;
  account: string;
  openedOn: string;
  targetPct?: number;
  bars: number;
  thin: boolean;
}

export const THIN_BAR_THRESHOLD = 250;

export interface Portfolio {
  positions: Position[];
  flows: CashFlow[];
  cash: number;
  invested: number;
  holdingsValue: number;
  totalValue: number;
  profit: number;
  profitPct: number;
  dayChange: number;
  dayChangePct: number;
  netContributed: number;
  annualised: number;
  sinceDate: string;
  years: number;
  series: { dates: string[]; values: number[]; holdings: number[]; cash: number[]; index: number[] };
  flowsByIndex: Record<number, number>;
  maxDD: number;
}

/**
 * The opening transfer is solved once, against the *seed* book cost, so that the
 * starting cash balance reconciles. It is then held fixed: positions added or
 * removed afterwards move the cash balance rather than being absorbed silently.
 */
const SEED_COST = HOLDING_SEEDS.reduce((a, s) => a + buildHolding(s).cost, 0);
const SEED_IDS = new Set(CASHFLOW_SEEDS.map((f) => f.id));
const SEED_REST = CASHFLOW_SEEDS.filter((f) => !f.derived).reduce((a, f) => a + f.amount, 0);
const OPENING_TRANSFER = Math.round(TARGET_CASH + SEED_COST - SEED_REST);

export function reconcileFlows(flows: CashFlow[]): CashFlow[] {
  void SEED_IDS;
  return flows.map((f) => (f.derived ? { ...f, amount: OPENING_TRANSFER } : f));
}

export function buildPortfolio(seeds: HoldingSeed[], rawFlows: CashFlow[], nameOverrides: Record<string, string> = {}): Portfolio {
  const holdings = seeds.map(buildHolding);
  const totalCost = sum(holdings.map((h) => h.cost));
  const flows = reconcileFlows(rawFlows);
  const netContributed = sum(flows.map((f) => f.amount));
  const cash = netContributed - totalCost;

  const priced = holdings.map((h) => {
    const a = asset(h.symbol);
    const price = a.price;
    const value = price * h.qty;
    const dayMovePct = todayMovePct(h.symbol);
    return { h, a, price, value, dayMovePct };
  });

  const holdingsValue = sum(priced.map((p) => p.value));
  const totalValue = holdingsValue + cash;

  const positions: Position[] = priced.map(({ h, a, price, value, dayMovePct }) => {
    const pl = value - h.cost;
    const bars = series(h.symbol).length;
    return {
      id: h.id,
      symbol: h.symbol,
      name: nameOverrides[h.symbol] ?? a.name,
      unresolved: !!a.unresolved && !nameOverrides[h.symbol],
      asset: a,
      qty: h.qty,
      avgPrice: h.avgPrice,
      price,
      cost: h.cost,
      value,
      pl,
      plPct: h.cost > 0 ? (pl / h.cost) * 100 : 0,
      dayMovePct,
      dayMove: (value * dayMovePct) / 100,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
      wrapper: h.wrapper,
      account: h.account,
      openedOn: h.openedOn,
      targetPct: h.targetPct,
      bars,
      thin: bars < THIN_BAR_THRESHOLD,
    };
  });

  // ---- daily valuation series ---------------------------------------------
  const earliest = Math.min(...holdings.map((h) => MAX_BARS - h.daysAgo), MAX_BARS - 1);
  const start = Math.max(0, earliest - 5);
  const dates: string[] = [];
  const values: number[] = [];
  const holdingsSeries: number[] = [];
  const cashSeries: number[] = [];
  const flowsByIndex: Record<number, number> = {};
  for (const f of flows) {
    const i = Math.max(indexOfDate(f.date), start);
    flowsByIndex[i - start] = (flowsByIndex[i - start] ?? 0) + f.amount;
  }
  const openIdx = new Map(holdings.map((h) => [h.id, MAX_BARS - h.daysAgo]));

  let runningCash = 0;
  let flowCursor = 0;
  const sortedFlows = [...flows].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const sortedBuys = [...holdings].sort((a, b) => b.daysAgo - a.daysAgo);
  let buyCursor = 0;

  for (let i = start; i < MAX_BARS; i++) {
    const dateStr = CALENDAR[i];
    const t = +new Date(dateStr);
    while (flowCursor < sortedFlows.length && +new Date(sortedFlows[flowCursor].date) <= t) {
      runningCash += sortedFlows[flowCursor].amount;
      flowCursor++;
    }
    while (buyCursor < sortedBuys.length && (openIdx.get(sortedBuys[buyCursor].id) ?? 0) <= i) {
      runningCash -= sortedBuys[buyCursor].cost;
      buyCursor++;
    }
    let hv = 0;
    for (const h of holdings) {
      if ((openIdx.get(h.id) ?? 0) <= i) hv += priceAtIndex(h.symbol, i) * h.qty;
    }
    dates.push(dateStr);
    holdingsSeries.push(hv);
    cashSeries.push(runningCash);
    values.push(hv + runningCash);
  }

  // growth-of-1 with external flows stripped out — the honest basis for drawdown
  const index: number[] = [1];
  for (let i = 1; i < values.length; i++) {
    const basis = values[i - 1] + (flowsByIndex[i] ?? 0);
    index.push(basis > 0 ? index[i - 1] * (values[i] / basis) : index[i - 1]);
  }

  const years = Math.max(0.25, (MAX_BARS - start) / 252);
  const profit = holdingsValue - totalCost;
  const dayChange = sum(positions.map((p) => p.dayMove));
  const prevValue = totalValue - dayChange;

  // annualised (money-weighted approximation on the value series, flow-adjusted)
  const growth = totalValue / Math.max(1, netContributed);
  const annualised = (Math.pow(Math.max(growth, 0.05), 1 / years) - 1) * 100;

  return {
    positions: positions.sort((a, b) => b.value - a.value),
    flows,
    cash,
    invested: totalCost,
    holdingsValue,
    totalValue,
    profit,
    profitPct: totalCost > 0 ? (profit / totalCost) * 100 : 0,
    dayChange,
    dayChangePct: prevValue > 0 ? (dayChange / prevValue) * 100 : 0,
    netContributed,
    annualised,
    sinceDate: dates[0],
    years,
    series: { dates, values, holdings: holdingsSeries, cash: cashSeries, index },
    flowsByIndex,
    maxDD: maxDrawdown(index),
  };
}

// ---- breakdowns -----------------------------------------------------------

export interface Slice {
  key: string;
  value: number;
  pct: number;
}

function groupBy(positions: Position[], fn: (p: Position) => string, total: number): Slice[] {
  const map = new Map<string, number>();
  for (const p of positions) map.set(fn(p), (map.get(fn(p)) ?? 0) + p.value);
  return [...map.entries()]
    .map(([key, value]) => ({ key, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export interface Breakdowns {
  geography: Slice[];
  sector: Slice[];
  currency: Slice[];
  wrapper: Slice[];
  type: Slice[];
}

export function breakdowns(p: Portfolio): Breakdowns {
  const base = p.holdingsValue;
  return {
    geography: groupBy(p.positions, (x) => x.asset.region, base),
    sector: groupBy(p.positions, (x) => x.asset.sector, base),
    currency: groupBy(p.positions, (x) => x.asset.currency, base),
    wrapper: groupBy(p.positions, (x) => x.wrapper, base),
    type: groupBy(p.positions, (x) => x.asset.type, base),
  };
}

// ---- concentration --------------------------------------------------------

export interface Flag {
  id: string;
  label: string;
  detail: string;
  value: string;
  status: "ok" | "warn" | "breach";
}

export function concentrationFlags(p: Portfolio, lookThroughUS: number): Flag[] {
  const invested = p.positions.map((x) => (x.value / p.holdingsValue) * 100);
  const sorted = [...invested].sort((a, b) => b - a);
  const largest = sorted[0] ?? 0;
  const top3 = sum(sorted.slice(0, 3));
  const eff = effectiveHoldings(invested);
  const lines = p.positions.length;
  return [
    {
      id: "largest",
      label: "Largest position",
      detail: `${p.positions[0]?.symbol ?? "—"} — limit 25% of invested value`,
      value: `${largest.toFixed(1)}%`,
      status: largest > 25 ? "breach" : largest > 20 ? "warn" : "ok",
    },
    {
      id: "top3",
      label: "Top three combined",
      detail: `${p.positions.slice(0, 3).map((x) => x.symbol).join(" · ")} — limit 60%`,
      value: `${top3.toFixed(1)}%`,
      status: top3 > 60 ? "breach" : top3 > 50 ? "warn" : "ok",
    },
    {
      id: "us",
      label: "Look-through US exposure",
      detail: "Including exposure held inside funds — limit 65%",
      value: `${lookThroughUS.toFixed(1)}%`,
      status: lookThroughUS > 65 ? "breach" : lookThroughUS > 58 ? "warn" : "ok",
    },
    {
      id: "effective",
      label: "Effective holdings",
      detail: `${lines} lines on the statement — 1/HHI says otherwise`,
      value: `${eff.toFixed(1)}`,
      status: eff < lines * 0.55 ? "breach" : eff < lines * 0.75 ? "warn" : "ok",
    },
  ];
}

/** Daily returns with external cash flows stripped out (true strategy returns). */
export function portfolioReturns(p: Portfolio) {
  const v = p.series.values;
  const out: number[] = [];
  for (let i = 1; i < v.length; i++) {
    const base = v[i - 1] + (p.flowsByIndex[i] ?? 0);
    if (base > 0) out.push(v[i] / base - 1);
  }
  return out;
}

/** Growth-of-1 index built from flow-adjusted returns — comparable with a benchmark. */
export function twrIndex(p: Portfolio) {
  const rs = portfolioReturns(p);
  const idx = [1];
  for (const r of rs) idx.push(idx[idx.length - 1] * (1 + r));
  return idx;
}


