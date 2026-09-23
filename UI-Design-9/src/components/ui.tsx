import Link from "next/link";
import type { ReactNode } from "react";
import { money, pct, tone } from "@/lib/format";
import type { TaggedInstrument } from "@/lib/queries";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "", action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, subTone }: { label: string; value: string; sub?: string; subTone?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {sub && <div className={`mt-0.5 text-sm tabular-nums ${subTone != null ? tone(subTone) : "text-slate-500"}`}>{sub}</div>}
    </div>
  );
}

export function Change({ abs, pctValue, prefix = "" }: { abs?: number; pctValue: number; prefix?: string }) {
  return (
    <span className={`tabular-nums ${tone(pctValue)}`}>
      {abs != null && `${abs > 0 ? "+" : ""}${prefix}${money(abs).replace("$", "")} `}
      ({pct(pctValue)})
    </span>
  );
}

export function Badge({ children, color = "slate" }: { children: ReactNode; color?: "slate" | "green" | "red" | "amber" | "blue" | "violet" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-transparent ${map[color]}`}>{children}</span>;
}

export function sentimentColor(s: string) {
  return s === "positive" ? "green" : s === "negative" ? "red" : "slate";
}
export function stanceColor(s: string) {
  return s === "bullish" ? "green" : s === "bearish" ? "red" : "slate";
}

/** Ticker chip that surfaces cross-domain context: held weight / watchlisted. */
export function TickerChip({ inst, showWeight = true }: { inst: TaggedInstrument; showWeight?: boolean }) {
  const held = inst.position;
  return (
    <Link
      href={`/markets/${inst.symbol}`}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-xs ${
        held ? "border-emerald-300 bg-emerald-50 text-emerald-800" : inst.watchlists.length ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
      title={held ? `Held · ${inst.position!.weight.toFixed(1)}% of portfolio` : inst.watchlists.length ? `Watching (${inst.watchlists.join(", ")})` : inst.name}
    >
      {inst.symbol}
      {held && showWeight && <span className="text-[10px] opacity-80">{inst.position!.weight.toFixed(1)}%</span>}
      {!held && inst.watchlists.length > 0 && <span className="text-[10px]">☆</span>}
    </Link>
  );
}

export function Sparkline({ values, width = 120, height = 32 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 2) - 1}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={up ? "#059669" : "#e11d48"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">{children}</div>;
}

export const inputCls = "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none";
export const btnCls = "inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
