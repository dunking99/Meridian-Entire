import type { Position } from "@/lib/portfolio";

export const BUCKETS: { label: string; color: string }[] = [
  { label: "US Equity", color: "#6366f1" },
  { label: "Intl Equity", color: "#0ea5e9" },
  { label: "Bonds", color: "#10b981" },
  { label: "Commodities", color: "#f59e0b" },
  { label: "Real Estate", color: "#f472b6" },
  { label: "Crypto", color: "#a855f7" },
  { label: "Cash", color: "#475569" },
];

export const DEFAULT_TARGETS: Record<string, number> = {
  "US Equity": 45,
  "Intl Equity": 18,
  Bonds: 14,
  Commodities: 5,
  "Real Estate": 5,
  Crypto: 0,
  Cash: 13,
};

export function bucketOf(p: Position): string {
  if (p.assetClass === "bond") return "Bonds";
  if (p.assetClass === "crypto") return "Crypto";
  if (p.assetClass === "commodity" || p.sector === "Precious Metals") return "Commodities";
  if (p.sector === "Real Estate") return "Real Estate";
  if (p.region === "US") return "US Equity";
  return "Intl Equity";
}
