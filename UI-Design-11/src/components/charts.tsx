"use client";

import { useMemo, useState } from "react";
import { MONTH_LABELS } from "@/lib/format";

export type Pt = { day: string; value: number };

/* ------------------------------ sparkline ------------------------------ */

export function Sparkline({
  data,
  width = 110,
  height = 30,
  color,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || data.length < 2) return <div style={{ width, height }} className="opacity-30" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stroke = color ?? (data[data.length - 1] >= data[0] ? "#34d399" : "#fb7185");
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 2 - ((v - min) / span) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------ line chart ----------------------------- */

function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks;
}

export function LineChart({
  series,
  height = 260,
  color = "#818cf8",
  fill = true,
  zeroLine = false,
  formatValue,
  formatDay,
}: {
  series: Pt[];
  height?: number;
  color?: string;
  fill?: boolean;
  zeroLine?: boolean;
  formatValue?: (n: number) => string;
  formatDay?: (s: string) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = height;
  const padL = 56;
  const padR = 12;
  const padT = 12;
  const padB = 24;

  const geom = useMemo(() => {
    if (series.length < 2) return null;
    const values = series.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (zeroLine) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }
    const pad = (max - min) * 0.08 || 1;
    min -= pad;
    max += pad;
    const x = (i: number) => padL + (i / (series.length - 1)) * (W - padL - padR);
    const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
    const line = series.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
    const area = `${line} L${x(series.length - 1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;
    return { min, max, x, y, line, area, ticks: niceTicks(min, max, 5) };
  }, [series, zeroLine, H, W]);

  if (!geom) return <div className="flex h-32 items-center justify-center text-sm text-slate-500">Not enough history</div>;
  const idx = hover ?? series.length - 1;
  const fmtV = formatValue ?? ((n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 }));
  const fmtD = formatDay ?? ((s: string) => s);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const rel = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((rel - padL) / (W - padL - padR)) * (series.length - 1));
          setHover(Math.max(0, Math.min(series.length - 1, i)));
        }}>
        <defs>
          <linearGradient id={`g${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {geom.ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={geom.y(t)} y2={geom.y(t)} stroke="#1e293b" strokeWidth={1} />
            <text x={padL - 6} y={geom.y(t) + 3} textAnchor="end" fontSize={9} fill="#64748b">
              {fmtV(t)}
            </text>
          </g>
        ))}
        {zeroLine && <line x1={padL} x2={W - padR} y1={geom.y(0)} y2={geom.y(0)} stroke="#475569" strokeDasharray="3 3" />}
        {fill && <path d={geom.area} fill={`url(#g${color.replace("#", "")})`} />}
        <path d={geom.line} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <line x1={geom.x(idx)} x2={geom.x(idx)} y1={padT} y2={H - padB} stroke="#475569" strokeWidth={0.8} />
        <circle cx={geom.x(idx)} cy={geom.y(series[idx].value)} r={3} fill={color} />
        {series.length > 60 && (
          <>
            <text x={padL} y={H - 8} fontSize={9} fill="#64748b">{fmtD(series[0].day)}</text>
            <text x={W - padR} y={H - 8} fontSize={9} fill="#64748b" textAnchor="end">
              {fmtD(series[series.length - 1].day)}
            </text>
          </>
        )}
      </svg>
      <div className="pointer-events-none absolute right-3 top-1 rounded-md border border-slate-700 bg-slate-900/90 px-2 py-1 text-xs tabular-nums text-slate-200">
        {fmtD(series[idx].day)} · {fmtV(series[idx].value)}
      </div>
    </div>
  );
}

export function MultiLineChart({
  series,
  colors,
  height = 280,
  formatValue,
}: {
  series: { name: string; points: Pt[] }[];
  colors: string[];
  height?: number;
  formatValue?: (n: number) => string;
}) {
  const W = 720;
  const H = height;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 22;
  const maxLen = Math.max(...series.map((s) => s.points.length), 0);
  if (!maxLen) return <div className="flex h-32 items-center justify-center text-sm text-slate-500">No overlap</div>;

  const all = series.flatMap((s) => s.points.map((p) => p.value));
  let min = Math.min(...all);
  let max = Math.max(...all);
  const pad = (max - min) * 0.08 || 1;
  min -= pad;
  max += pad;
  const x = (i: number) => padL + (i / (maxLen - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - min) / (max - min || 1)) * (H - padT - padB);
  const fmtV = formatValue ?? ((n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 }));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {niceTicks(min, max, 5).map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#1e293b" />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize={9} fill="#64748b">{fmtV(t)}</text>
          </g>
        ))}
        {series.map((s, si) => {
          const offset = maxLen - s.points.length;
          const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i + offset).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
          return <path key={s.name} d={d} fill="none" stroke={colors[si % colors.length]} strokeWidth={1.8} />;
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {series.map((s, i) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- bars ---------------------------------- */

export function BarChart({
  data,
  height = 200,
  color = "#6366f1",
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
}) {
  if (!data.length) return <div className="flex h-24 items-center justify-center text-sm text-slate-500">No data</div>;
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  const fmtV = formatValue ?? ((n: number) => n.toFixed(0));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[9px] tabular-nums text-slate-500 opacity-0 transition group-hover:opacity-100">{fmtV(d.value)}</span>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${Math.max(1.5, (Math.abs(d.value) / max) * (height - 26))}px`,
              background: d.value >= 0 ? color : "#fb7185",
            }}
            title={`${d.label}: ${fmtV(d.value)}`}
          />
          <span className="text-[9px] text-slate-600">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ donut ---------------------------------- */

export function Donut({
  data,
  size = 170,
  thickness = 22,
  centerLabel,
  centerSub,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={thickness} />
        {data.map((d) => {
          const len = (d.value / total) * c;
          const el = (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-semibold text-slate-100">{centerLabel}</span>
        {centerSub && <span className="text-[10px] text-slate-500">{centerSub}</span>}
      </div>
    </div>
  );
}

/* ----------------------------- heatmap --------------------------------- */

export function MonthlyHeatmap({ grid }: { grid: { year: number; months: (number | null)[] }[] }) {
  const color = (v: number) => {
    const t = Math.min(1, Math.abs(v) / 6);
    return v >= 0 ? `rgba(16,185,129,${0.12 + t * 0.8})` : `rgba(244,63,94,${0.12 + t * 0.8})`;
  };
  if (!grid.length) return <div className="text-sm text-slate-500">Not enough history for a monthly grid.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 text-xs">
        <thead>
          <tr>
            <th className="px-1 text-left text-[10px] text-slate-500">Yr</th>
            {MONTH_LABELS.map((m) => (
              <th key={m} className="px-1 text-center text-[10px] font-normal text-slate-500">{m}</th>
            ))}
            <th className="px-1 text-center text-[10px] text-slate-500">Yr</th>
          </tr>
        </thead>
        <tbody>
          {grid.map((row) => {
            const vals = row.months.filter((v): v is number => v != null);
            const yearTotal = vals.length ? vals.reduce((a, b) => a / 100 + 1, 1) : 0;
            return (
              <tr key={row.year}>
                <td className="px-1 text-slate-500">{row.year}</td>
                {row.months.map((v, i) => (
                  <td
                    key={i}
                    className="rounded px-1 py-1 text-center tabular-nums text-slate-900"
                    style={{ background: v == null ? "#0f172a" : color(v) }}
                    title={v == null ? "" : `${MONTH_LABELS[i]} ${row.year}: ${v.toFixed(2)}%`}
                  >
                    {v == null ? "" : v.toFixed(1)}
                  </td>
                ))}
                <td className={`px-1 text-center tabular-nums ${vals.length ? (yearTotal >= 1 ? "text-emerald-400" : "text-rose-400") : "text-slate-600"}`}>
                  {vals.length ? `${((yearTotal - 1) * 100).toFixed(1)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------- correlation grid --------------------------- */

export function CorrelationMatrix({ labels, matrix }: { labels: string[]; matrix: number[][] }) {
  const cell = (v: number) => {
    if (v >= 0) return `rgba(99,102,241,${Math.min(1, Math.abs(v)) * 0.85})`;
    return `rgba(16,185,129,${Math.min(1, Math.abs(v)) * 0.85})`;
  };
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-[10px]">
        <thead>
          <tr>
            <th />
            {labels.map((l) => (
              <th key={l} className="px-1 py-1 text-slate-500">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="pr-1 text-slate-400">{labels[i]}</td>
              {row.map((v, j) => (
                <td key={j} className="rounded px-1.5 py-1 text-center tabular-nums text-slate-100" style={{ background: cell(v) }} title={`${labels[i]} vs ${labels[j]}: ${v.toFixed(2)}`}>
                  {i === j ? "1.00" : v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
