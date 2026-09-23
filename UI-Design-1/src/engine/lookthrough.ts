import { FUND_COMPOSITIONS, LOOKTHROUGH_GAPS } from "../data/funds";
import { asset } from "../data/universe";
import type { Portfolio, Position } from "./portfolio";

export interface Source {
  via: string; // "Direct" or fund symbol
  weight: number; // % of total invested value contributed by this source
}

export interface UnderlyingCompany {
  symbol: string;
  name: string;
  sector: string;
  region: string;
  weight: number;
  sources: Source[];
  direct: boolean;
}

export interface Gap {
  symbol: string;
  name: string;
  value: number;
  weight: number;
  reason: string;
}

export interface XRay {
  coverage: number;
  coveredValue: number;
  companies: UnderlyingCompany[];
  overlaps: UnderlyingCompany[];
  sectors: { key: string; pct: number }[];
  regions: { key: string; pct: number }[];
  gaps: Gap[];
  boughtCount: number;
  ownedCount: number;
  largest: UnderlyingCompany | null;
  usExposure: number;
  residual: number;
}

export function computeXRay(p: Portfolio): XRay {
  const base = p.holdingsValue || 1;
  const map = new Map<string, UnderlyingCompany>();
  const sectorAcc = new Map<string, number>();
  const regionAcc = new Map<string, number>();
  const gaps: Gap[] = [];
  let coveredValue = 0;
  let residual = 0;

  const add = (
    symbol: string,
    name: string,
    sector: string,
    region: string,
    weight: number,
    via: string,
    direct: boolean,
  ) => {
    const cur = map.get(symbol);
    if (cur) {
      cur.weight += weight;
      cur.sources.push({ via, weight });
      cur.direct = cur.direct || direct;
    } else {
      map.set(symbol, { symbol, name, sector, region, weight, sources: [{ via, weight }], direct });
    }
    sectorAcc.set(sector, (sectorAcc.get(sector) ?? 0) + weight);
    regionAcc.set(region, (regionAcc.get(region) ?? 0) + weight);
  };

  const isFundLike = (pos: Position) => ["ETF", "Fund", "Trust", "Bond", "Commodity"].includes(pos.asset.type);

  for (const pos of p.positions) {
    const w = (pos.value / base) * 100;
    if (!isFundLike(pos)) {
      add(pos.symbol, pos.name, pos.asset.sector, pos.asset.region, w, "Direct", true);
      coveredValue += pos.value;
      continue;
    }
    const comp = FUND_COMPOSITIONS[pos.symbol];
    if (!comp) {
      gaps.push({
        symbol: pos.symbol,
        name: pos.name,
        value: pos.value,
        weight: w,
        reason: LOOKTHROUGH_GAPS[pos.symbol] ?? "No composition data available for this instrument.",
      });
      // still attribute sector/region at the wrapper level so the blend sums to 100
      sectorAcc.set(pos.asset.sector, (sectorAcc.get(pos.asset.sector) ?? 0) + w);
      regionAcc.set(pos.asset.region, (regionAcc.get(pos.asset.region) ?? 0) + w);
      continue;
    }
    coveredValue += pos.value;
    for (const line of comp.lines) {
      add(line.symbol, line.name, line.sector, line.region, (w * line.weight) / 100, pos.symbol, false);
    }
    const disclosedPct = comp.lines.reduce((a, l) => a + l.weight, 0);
    const rest = Math.max(0, 100 - disclosedPct);
    residual += (w * rest) / 100;
    // blend the fund's published sector/region split across the undisclosed remainder
    for (const [k, v] of Object.entries(comp.sectors)) {
      const undisclosedShare = (w * rest * (v / 100)) / 100;
      sectorAcc.set(k, (sectorAcc.get(k) ?? 0) + undisclosedShare);
    }
    for (const [k, v] of Object.entries(comp.regions)) {
      const undisclosedShare = (w * rest * (v / 100)) / 100;
      regionAcc.set(k, (regionAcc.get(k) ?? 0) + undisclosedShare);
    }
  }

  const companies = [...map.values()].sort((a, b) => b.weight - a.weight);
  const overlaps = companies.filter((c) => c.sources.length > 1).sort((a, b) => b.weight - a.weight);
  const sectors = [...sectorAcc.entries()]
    .map(([key, pct]) => ({ key, pct }))
    .sort((a, b) => b.pct - a.pct);
  const regions = [...regionAcc.entries()]
    .map(([key, pct]) => ({ key, pct }))
    .sort((a, b) => b.pct - a.pct);

  return {
    coverage: (coveredValue / base) * 100,
    coveredValue,
    companies,
    overlaps,
    sectors,
    regions,
    gaps,
    boughtCount: p.positions.length,
    ownedCount: companies.length,
    largest: companies[0] ?? null,
    usExposure: regions.find((r) => r.key === "North America")?.pct ?? 0,
    residual,
  };
}

export const fundName = (symbol: string) => asset(symbol).name;
