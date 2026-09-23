import Link from "next/link";
import type { ReactNode } from "react";
import { fmtMoney, fmtPct, toneClass } from "@/lib/format";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
  dense = false,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
          <div>
            {title && <h2 className="text-[13px] font-semibold tracking-wide text-slate-200 uppercase">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0 text-xs text-slate-400">{right}</div>}
        </header>
      )}
      <div className={dense ? "" : "p-4"}>{children}</div>
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
  tone?: "neutral" | "up" | "down" | "warn";
  hint?: string;
}) {
  const toneStyle =
    tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : tone === "warn" ? "text-amber-300" : "text-slate-100";
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5" title={hint}>
      <div className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${toneStyle}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  size = "sm",
}: {
  children: ReactNode;
  tone?: "slate" | "emerald" | "rose" | "amber" | "indigo" | "cyan";
  size?: "xs" | "sm";
}) {
  const tones: Record<string, string> = {
    slate: "border-slate-700 bg-slate-800/70 text-slate-300",
    emerald: "border-emerald-800/70 bg-emerald-950/60 text-emerald-300",
    rose: "border-rose-900/70 bg-rose-950/50 text-rose-300",
    amber: "border-amber-900/60 bg-amber-950/40 text-amber-200",
    indigo: "border-indigo-900/70 bg-indigo-950/50 text-indigo-300",
    cyan: "border-cyan-900/70 bg-cyan-950/50 text-cyan-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium whitespace-nowrap ${tones[tone]} ${
        size === "xs" ? "text-[10px]" : "text-[11px]"
      }`}
    >
      {children}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  if (tier === "act") return <Badge tone="rose">ACT</Badge>;
  if (tier === "monitor") return <Badge tone="amber">MONITOR</Badge>;
  return <Badge tone="slate">FYI</Badge>;
}

const STATUS_TONES: Record<string, "emerald" | "rose" | "amber" | "indigo" | "slate" | "cyan"> = {
  active: "emerald",
  idea: "indigo",
  trimmed: "amber",
  closed: "slate",
  invalidated: "rose",
  long: "emerald",
  short: "rose",
  avoid: "rose",
  macro: "cyan",
  buy: "emerald",
  sell: "rose",
  trim: "amber",
  hold: "slate",
  pass: "slate",
};

export function LabelBadge({ value }: { value: string }) {
  return <Badge tone={STATUS_TONES[value] ?? "slate"}>{value.toUpperCase()}</Badge>;
}

export function Conviction({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Conviction ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-2.5 rounded-sm ${i <= n ? "bg-indigo-400" : "bg-slate-700"}`} />
      ))}
    </span>
  );
}

export function Delta({ value, decimals = 2, showValue = false, valueText }: { value: number; decimals?: number; showValue?: boolean; valueText?: string }) {
  return (
    <span className={`tabular-nums ${toneClass(value)}`}>
      {fmtPct(value, decimals)}
      {showValue && <span className="ml-1 text-[11px] opacity-80">{valueText}</span>}
    </span>
  );
}

/** Inline SVG sparkline — no chart dependency, renders on the server. */
export function Sparkline({
  data,
  width = 96,
  height = 26,
  className = "",
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}) {
  if (!data || data.length < 2) return <div className={`h-[${height}px] w-[${width}px] ${className}`} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const y = (v: number) => height - ((v - min) / span) * (height - 4) - 2;
  const points = data.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`);
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? "#34d399" : "#fb7185";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function AreaChart({
  data,
  width = 720,
  height = 180,
  color = "#34d399",
  compare,
  compareColor = "#64748b",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  compare?: number[];
  compareColor?: string;
}) {
  if (!data || data.length < 2) return <div className="text-xs text-slate-500">Not enough history</div>;
  const all = compare && compare.length ? [...data, ...compare] : data;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const y = (v: number) => height - ((v - min) / span) * (height - 16) - 8;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const comparePath =
    compare && compare.length
      ? compare.map((v, i) => `${i === 0 ? "M" : "L"}${(i * (width / (compare.length - 1))).toFixed(1)},${y(v).toFixed(1)}`).join(" ")
      : null;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" />
      {comparePath && <path d={comparePath} fill="none" stroke={compareColor} strokeWidth="1.2" strokeDasharray="4 4" />}
    </svg>
  );
}

export function BarRow({ label, value, max, tone = "indigo", right }: { label: ReactNode; value: number; max: number; tone?: string; right?: ReactNode }) {
  const width = max ? Math.max(1, (value / max) * 100) : 0;
  const colors: Record<string, string> = { indigo: "bg-indigo-500/70", emerald: "bg-emerald-500/70", cyan: "bg-cyan-500/70" };
  return (
    <div className="grid grid-cols-[minmax(84px,1fr)_2fr_auto] items-center gap-2 text-xs">
      <span className="truncate text-slate-300">{label}</span>
      <span className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <span className={`block h-full rounded-full ${colors[tone] ?? colors.indigo}`} style={{ width: `${width}%` }} />
      </span>
      <span className="tabular-nums text-slate-400">{right}</span>
    </div>
  );
}

export function KV({ k, v, tone }: { k: string; v: ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-800/60 py-1.5 text-xs last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className={`text-right tabular-nums ${tone ?? "text-slate-200"}`}>{v}</span>
    </div>
  );
}

export function SymbolLink({ symbol, name, size = "sm" }: { symbol: string; name?: string; size?: "sm" | "lg" }) {
  return (
    <Link href={`/markets/${encodeURIComponent(symbol)}`} className="group inline-flex flex-col leading-tight">
      <span className={`font-semibold text-slate-100 group-hover:text-cyan-300 ${size === "lg" ? "text-base" : "text-[13px]"}`}>{symbol}</span>
      {name && <span className="text-[11px] text-slate-500 group-hover:text-slate-400">{name}</span>}
    </Link>
  );
}

export function Chip({ children, tone = "slate", href }: { children: ReactNode; tone?: "slate" | "indigo" | "cyan" | "emerald"; href?: string }) {
  const tones: Record<string, string> = {
    slate: "border-slate-700 text-slate-400 hover:border-slate-500",
    indigo: "border-indigo-900/70 text-indigo-300 hover:border-indigo-600",
    cyan: "border-cyan-900/70 text-cyan-300 hover:border-cyan-600",
    emerald: "border-emerald-900/70 text-emerald-300 hover:border-emerald-600",
  };
  const cls = `inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <span className={cls}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-xs text-slate-500">{children}</p>;
}

export function ExposurePill({ value, pct }: { value: number; pct: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded border border-cyan-900/60 bg-cyan-950/40 px-2 py-0.5 text-[11px] text-cyan-200 tabular-nums">
      {fmtMoney(value, { compact: true })} exposure
      <span className="text-cyan-400/70">{fmtPct(pct)} of NAV</span>
    </span>
  );
}

export function Th({ children, align = "left" }: { children?: ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      className={`sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-2.5 py-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className = "" }: { children?: ReactNode; align?: "left" | "right" | "center"; className?: string }) {
  return (
    <td
      className={`border-b border-slate-800/60 px-2.5 py-2 text-[12.5px] text-slate-300 ${
        align === "right" ? "text-right tabular-nums" : align === "center" ? "text-center" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}
