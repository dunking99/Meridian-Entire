export const fmtCurrency = (n: number, currency = "USD", digits = 2): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtCompact = (n: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0,
  );

export const fmtNumber = (n: number, digits = 2): string =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    Number.isFinite(n) ? n : 0,
  );

export const fmtPct = (n: number, digits = 2): string => `${n > 0 ? "+" : ""}${fmtNumber(n, digits)}%`;

export const fmtQty = (n: number): string =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number.isFinite(n) ? n : 0);

export const fmtDate = (d: string | Date): string => {
  const date = typeof d === "string" ? new Date(d.includes("T") ? d : `${d}T00:00:00Z`) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

export const fmtShortDate = (d: string): string => {
  const date = new Date(`${d}T00:00:00Z`);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
};

export const fmtMonth = (d: string | Date): string => {
  const date = typeof d === "string" ? new Date(d.includes("T") ? d : `${d}T00:00:00Z`) : d;
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
};

export const signClass = (n: number): string => (n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-slate-400");

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function relativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return "never";
  const t = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - t.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
