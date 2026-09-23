import type { ReactNode } from "react";
import { signClass } from "@/lib/format";

export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`rounded-xl border border-slate-800/80 bg-slate-900/50 shadow-lg shadow-black/20 ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-800/70 px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-wide text-slate-200">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "pos" | "neg";
  hint?: string;
}) {
  const toneClass = tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-slate-100";
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4" title={hint}>
      <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1.5 text-xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs tabular-nums text-slate-500">{sub}</p>}
    </div>
  );
}

export function Delta({ value, suffix = "%", digits = 2, showArrow = true }: { value: number; suffix?: string; digits?: number; showArrow?: boolean }) {
  const arrow = !showArrow ? "" : value > 0 ? "▲ " : value < 0 ? "▼ " : "• ";
  return (
    <span className={`tabular-nums ${signClass(value)}`}>
      {arrow}
      {value > 0 ? "+" : ""}
      {value.toFixed(digits)}
      {suffix}
    </span>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[tone] ?? map.slate}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  blurb,
  right,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-400">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-50">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{blurb}</p>
      </div>
      {right}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500 ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-sm text-slate-300 ${className}`}>{children}</td>;
}
