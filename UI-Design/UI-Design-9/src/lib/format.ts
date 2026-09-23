export const n = (v: string | number | null | undefined) => (v == null ? 0 : typeof v === "number" ? v : parseFloat(v) || 0);

export function money(v: number, opts: { compact?: boolean; digits?: number } = {}) {
  const abs = Math.abs(v);
  if (opts.compact && abs >= 1_000_000) return `${v < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(2)}M`;
  if (opts.compact && abs >= 10_000) return `${v < 0 ? "-" : ""}$${(abs / 1_000).toFixed(1)}K`;
  const digits = opts.digits ?? (abs < 10 && abs !== 0 ? 4 : 2);
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function price(v: number) {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

export function pct(v: number, digits = 2) {
  const s = v.toFixed(digits);
  return `${v > 0 ? "+" : ""}${s}%`;
}

export function signed(v: number, digits = 2) {
  return `${v > 0 ? "+" : ""}${v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function qty(v: number) {
  return v.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function dateShort(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function relTime(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return dateShort(d);
}

export function tone(v: number) {
  return v > 0 ? "text-emerald-600" : v < 0 ? "text-rose-600" : "text-slate-500";
}
