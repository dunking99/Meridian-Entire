import { getPriceSeries } from "@/lib/portfolio";
import { cagr, maxDrawdown, sharpe, toReturns, volatility, type Point } from "@/lib/stats";
import type { Pt } from "@/components/charts";

export const dynamic = "force-dynamic";

type Result = {
  name: string;
  series: Pt[];
  final: number;
  cagr: number;
  vol: number;
  sharpe: number;
  maxDrawdown: number;
  contributed: number;
};

async function simulate(
  name: string,
  weights: Record<string, number>,
  initial: number,
  monthly: number,
  years: number,
  rebalance: boolean,
  priceMap: Map<string, Map<string, number>>,
  allDays: string[],
): Promise<Result | null> {
  const symbols = Object.keys(weights).filter((s) => priceMap.has(s));
  if (!symbols.length || !allDays.length) return null;

  const total = symbols.reduce((a, s) => a + weights[s], 0) || 1;
  const norm = Object.fromEntries(symbols.map((s) => [s, weights[s] / total]));

  const priceAt = (sym: string, day: string): number | null => {
    const map = priceMap.get(sym)!;
    if (map.has(day)) return map.get(day)!;
    return null;
  };

  const lastKnown = new Map<string, number>();
  const units = new Map<string, number>();
  const series: Point[] = [];
  let contributed = initial;
  let monthCursor = allDays[0].slice(0, 7);
  let lastYear = allDays[0].slice(0, 4);

  // Seed initial purchase
  for (const s of symbols) {
    const p = priceAt(s, allDays[0]);
    if (p) {
      units.set(s, (initial * norm[s]) / p);
      lastKnown.set(s, p);
    }
  }

  for (const day of allDays) {
    for (const s of symbols) {
      const p = priceAt(s, day);
      if (p != null) lastKnown.set(s, p);
    }

    const month = day.slice(0, 7);
    if (month !== monthCursor) {
      monthCursor = month;
      contributed += monthly;
      for (const s of symbols) {
        const p = lastKnown.get(s);
        if (p) units.set(s, (units.get(s) ?? 0) + (monthly * norm[s]) / p);
      }
    }

    if (rebalance && day.slice(0, 4) !== lastYear) {
      lastYear = day.slice(0, 4);
      const value = symbols.reduce((a, s) => a + (units.get(s) ?? 0) * (lastKnown.get(s) ?? 0), 0);
      for (const s of symbols) {
        const p = lastKnown.get(s);
        if (p) units.set(s, (value * norm[s]) / p);
      }
    }

    const value = symbols.reduce((a, s) => a + (units.get(s) ?? 0) * (lastKnown.get(s) ?? 0), 0);
    series.push({ day, value });
  }

  const ret = toReturns(series);
  return {
    name,
    series,
    final: series[series.length - 1]?.value ?? 0,
    cagr: cagr(series),
    vol: volatility(ret),
    sharpe: sharpe(ret),
    maxDrawdown: maxDrawdown(series).value,
    contributed,
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    weights?: Record<string, number>;
    initial?: number;
    monthly?: number;
    years?: number;
    rebalance?: boolean;
    compare?: string[];
  };

  const weights = body.weights ?? { VOO: 60, BND: 40 };
  const initial = Number(body.initial ?? 10000);
  const monthly = Number(body.monthly ?? 500);
  const years = Number(body.years ?? 10);
  const rebalance = Boolean(body.rebalance ?? true);

  const presets: Record<string, Record<string, number>> = {
    "60/40": { VOO: 60, BND: 40 },
    "All equity": { VOO: 100 },
    "Global + gold": { VOO: 45, VXUS: 25, BND: 20, GLD: 10 },
    "Dividend tilt": { SCHD: 40, VOO: 30, BND: 30 },
    "S&P 500": { SPY: 100 },
  };

  const runs: { name: string; weights: Record<string, number> }[] = [{ name: "Your mix", weights }];
  for (const c of body.compare ?? ["60/40", "S&P 500"]) {
    if (presets[c]) runs.push({ name: c, weights: presets[c] });
  }

  const allSymbols = [...new Set(runs.flatMap((r) => Object.keys(r.weights)))];
  const priceMap = await getPriceSeries(allSymbols);

  const anyDays = [...new Set([...priceMap.values()].flatMap((m) => [...m.keys()]))].sort();
  if (!anyDays.length) return Response.json({ ok: false, error: "No price history in the archive" }, { status: 400 });

  const start = new Date();
  start.setUTCFullYear(start.getUTCFullYear() - years);
  const startDay = start.toISOString().slice(0, 10);
  const days = anyDays.filter((d) => d >= startDay);

  const results = (
    await Promise.all(
      runs.map((r) => simulate(r.name, r.weights, initial, monthly, years, rebalance, priceMap, days)),
    )
  ).filter(Boolean) as Result[];

  return Response.json({ ok: true, initial, monthly, years, rebalance, days: days.length, results });
}
