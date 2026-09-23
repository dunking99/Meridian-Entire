export const CCY = "£";

export function fmtMoney(v: number, opts: { compact?: boolean; dp?: number; sign?: boolean } = {}) {
  const { compact = false, dp, sign = false } = opts;
  const abs = Math.abs(v);
  const pre = sign ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : "";
  if (compact && abs >= 1000) {
    const units: [number, string][] = [
      [1e9, "bn"],
      [1e6, "m"],
      [1e3, "k"],
    ];
    for (const [d, s] of units) {
      if (abs >= d) {
        const n = abs / d;
        return `${pre}${CCY}${n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2)}${s}`;
      }
    }
  }
  const decimals = dp ?? (abs >= 1000 ? 0 : 2);
  return `${pre}${CCY}${abs.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function fmtNum(v: number, dp = 2) {
  return v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function fmtPct(v: number, dp = 2, sign = false) {
  const pre = sign ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : "";
  return `${pre}${Math.abs(v).toFixed(dp)}%`;
}

export function fmtSignedPct(v: number, dp = 2) {
  return fmtPct(v, dp, true);
}

export function fmtCap(v: number) {
  if (v >= 1e12) return `${CCY}${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${CCY}${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${CCY}${(v / 1e6).toFixed(0)}M`;
  return fmtMoney(v);
}

export function fmtDate(d: Date | string, style: "short" | "med" | "long" = "med") {
  const date = typeof d === "string" ? new Date(d) : d;
  if (style === "short")
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  if (style === "long")
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

export function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function relTime(d: string) {
  const then = new Date(d).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d, "med");
}

export const toneOf = (v: number) => (v > 0 ? "up" : v < 0 ? "down" : "flat");
