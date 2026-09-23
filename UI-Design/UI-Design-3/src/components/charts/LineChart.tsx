import { useMemo, useState } from "react";
import { useMeasure } from "@/lib/useMeasure";
import { fmtDate } from "@/lib/format";
import { cn } from "@/utils/cn";

export interface ChartSeries {
  id: string;
  label: string;
  values: number[];
  color: string;
  area?: boolean;
  dashed?: boolean;
  width?: number;
}

interface Props {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  yFmt?: (n: number) => string;
  tipFmt?: (n: number, s: ChartSeries) => string;
  padY?: number;
  gridCount?: number;
  zeroLine?: boolean;
  className?: string;
  markers?: { index: number; label: string; tone?: string }[];
  minimal?: boolean;
}

export function LineChart({
  labels,
  series,
  height = 260,
  yFmt = (n) => n.toFixed(0),
  tipFmt,
  padY = 0.08,
  gridCount = 4,
  zeroLine = false,
  className,
  markers = [],
  minimal = false,
}: Props) {
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padL = minimal ? 0 : 6;
  const padR = minimal ? 0 : 52;
  const padB = minimal ? 0 : 20;
  const padT = 8;
  const w = Math.max(width, 120);
  const innerW = Math.max(w - padL - padR, 10);
  const innerH = Math.max(height - padT - padB, 10);
  const n = labels.length;

  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of series)
      for (const v of s.values) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    if (zeroLine) hi = Math.max(hi, 0);
    if (zeroLine) lo = Math.min(lo, 0);
    const span = hi - lo || 1;
    return { min: lo - span * padY, max: hi + span * padY };
  }, [series, padY, zeroLine]);

  const x = (i: number) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - min) / (max - min || 1)) * innerH;

  const path = (vals: number[]) => {
    let d = "";
    for (let i = 0; i < vals.length; i++) d += `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(vals[i]).toFixed(2)}`;
    return d;
  };

  const areaPath = (vals: number[]) =>
    `${path(vals)}L${x(vals.length - 1).toFixed(2)},${(padT + innerH).toFixed(2)}L${padL},${(padT + innerH).toFixed(2)}Z`;

  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= gridCount; i++) out.push(min + ((max - min) * i) / gridCount);
    return out;
  }, [min, max, gridCount]);

  const xTicks = useMemo(() => {
    const count = Math.min(6, Math.max(2, Math.floor(innerW / 110)));
    const out: number[] = [];
    for (let i = 0; i <= count; i++) out.push(Math.round((i / count) * (n - 1)));
    return [...new Set(out)];
  }, [innerW, n]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - padL;
    const i = Math.round((px / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const tipLeft = hover !== null ? Math.min(Math.max(x(hover), 70), w - 90) : 0;

  return (
    <div ref={ref} className={cn("relative select-none", className)} style={{ height }}>
      {width > 0 && (
        <svg
          width={w}
          height={height}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          className="overflow-visible"
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="70%" stopColor={s.color} stopOpacity="0.02" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {!minimal &&
            ticks.map((t, i) => (
              <g key={i}>
                <line
                  x1={padL}
                  x2={padL + innerW}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="currentColor"
                  className="text-ink-750"
                  strokeDasharray={i === 0 ? "" : "2 4"}
                  strokeWidth={1}
                />
                <text
                  x={padL + innerW + 8}
                  y={y(t) + 3}
                  className="fill-mist-500 text-[9px]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {yFmt(t)}
                </text>
              </g>
            ))}

          {zeroLine && (
            <line x1={padL} x2={padL + innerW} y1={y(0)} y2={y(0)} stroke="currentColor" className="text-ink-600" />
          )}

          {markers.map((m, i) => (
            <line
              key={i}
              x1={x(m.index)}
              x2={x(m.index)}
              y1={padT}
              y2={padT + innerH}
              stroke={m.tone ?? "#3b4351"}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}

          {series.map((s) =>
            s.area ? <path key={`a-${s.id}`} d={areaPath(s.values)} fill={`url(#grad-${s.id})`} /> : null,
          )}

          {series.map((s) => (
            <path
              key={`l-${s.id}`}
              d={path(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 1.6}
              strokeDasharray={s.dashed ? "4 3" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {!minimal &&
            xTicks.map((i) => (
              <text
                key={i}
                x={Math.min(Math.max(x(i), 16), padL + innerW - 16)}
                y={height - 4}
                textAnchor="middle"
                className="fill-mist-500 text-[9px]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {new Date(labels[i]).toLocaleDateString(
                  "en-US",
                  n <= 70 ? { month: "short", day: "numeric" } : { month: "short", year: "2-digit" },
                )}
              </text>
            ))}

          {hover !== null && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={padT}
                y2={padT + innerH}
                stroke="currentColor"
                className="text-ink-500"
                strokeWidth={1}
              />
              {series.map((s) => (
                <circle
                  key={s.id}
                  cx={x(hover)}
                  cy={y(s.values[hover])}
                  r={3.2}
                  fill="#0a0c0f"
                  stroke={s.color}
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>
      )}

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-[132px] -translate-x-1/2 rounded-lg border border-ink-700 bg-ink-900/95 px-2.5 py-2 shadow-xl backdrop-blur"
          style={{ left: tipLeft }}
        >
          <div className="mb-1 text-[10px] text-mist-500">{fmtDate(labels[hover])}</div>
          {series.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-mist-400">
                <i className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="tnum font-medium text-mist-100">
                {tipFmt ? tipFmt(s.values[hover], s) : yFmt(s.values[hover])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
