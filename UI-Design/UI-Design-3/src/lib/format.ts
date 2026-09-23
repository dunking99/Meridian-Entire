export const fmtUSD = (n: number, dp = 2) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

export const fmtUSD0 = (n: number) => fmtUSD(n, 0);

export function fmtCompact(n: number, prefix = "$") {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1_000_000_000) return `${sign}${prefix}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1_000_000) return `${sign}${prefix}${(a / 1e6).toFixed(2)}M`;
  if (a >= 10_000) return `${sign}${prefix}${(a / 1e3).toFixed(1)}k`;
  if (a >= 1_000) return `${sign}${prefix}${(a / 1e3).toFixed(2)}k`;
  return `${sign}${prefix}${a.toFixed(0)}`;
}

export const fmtPct = (n: number, dp = 2) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(dp)}%`;
export const fmtPctRaw = (n: number, dp = 1) => `${n.toFixed(dp)}%`;

export const fmtSigned = (n: number, dp = 2) =>
  `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })}`;

export const fmtQty = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 4 : 2 });

export const toneOf = (n: number) => (n > 0 ? "up" : n < 0 ? "down" : "flat");

export const clsTone = (n: number) =>
  n > 0 ? "text-up" : n < 0 ? "text-down" : "text-mist-400";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function fmtDateShort(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function fmtMonth(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${MONTHS[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`;
}

export { MONTHS };

export function relTime(iso: string, now = new Date("2026-02-13T16:40:00Z")) {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
