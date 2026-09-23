import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(ref.current);
    setW(ref.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return { ref, width: w };
}

const smooth = (pts: [number, number][]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  return d;
};

/* -------------------------------------------------------------- AreaChart */
export interface LineSeries {
  values: number[];
  color: string;
  label: string;
  fill?: boolean;
  dashed?: boolean;
}

export function AreaChart({
  dates,
  series,
  height = 190,
  format = (v: number) => v.toFixed(0),
  yTicks = 4,
  markers,
  baseline,
}: {
  dates: string[];
  series: LineSeries[];
  height?: number;
  format?: (v: number) => string;
  yTicks?: number;
  markers?: { index: number; label: string; color?: string }[];
  baseline?: number;
}) {
  const { ref, width } = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 52;
  const padR = 10;
  const padT = 10;
  const padB = 20;
  const innerW = Math.max(10, width - padL - padR);
  const innerH = height - padT - padB;

  const all = series.flatMap((s) => s.values);
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (baseline !== undefined) {
    min = Math.min(min, baseline);
    max = Math.max(max, baseline);
  }
  const span = max - min || 1;
  min -= span * 0.08;
  max += span * 0.08;
  const n = Math.max(1, dates.length - 1);
  const X = (i: number) => padL + (i / n) * innerW;
  const Y = (v: number) => padT + innerH - ((v - min) / (max - min)) * innerH;

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + ((max - min) * i) / yTicks);
  const xLabels = useMemo(() => {
    const count = Math.min(6, dates.length);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round((i / (count - 1 || 1)) * (dates.length - 1));
      return { idx, label: new Date(dates[idx]).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) };
    });
  }, [dates]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - padL;
    const i = Math.round((x / innerW) * n);
    setHover(Math.max(0, Math.min(dates.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 && (
        <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={i} id={`g-${i}-${s.color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} x2={width - padR} y1={Y(t)} y2={Y(t)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={padL - 7} y={Y(t) + 3} textAnchor="end" className="num" fontSize={9} fill="#5b626e">
                {format(t)}
              </text>
            </g>
          ))}
          {xLabels.map((l, i) => (
            <text key={i} x={X(l.idx)} y={height - 5} textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"} fontSize={9} fill="#5b626e">
              {l.label}
            </text>
          ))}
          {baseline !== undefined && (
            <line x1={padL} x2={width - padR} y1={Y(baseline)} y2={Y(baseline)} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
          )}
          {series.map((s, i) => {
            const pts = s.values.map((v, idx) => [X(idx), Y(v)] as [number, number]);
            const path = smooth(pts);
            return (
              <g key={i}>
                {s.fill !== false && (
                  <path
                    d={`${path} L ${X(s.values.length - 1)} ${padT + innerH} L ${X(0)} ${padT + innerH} Z`}
                    fill={`url(#g-${i}-${s.color.replace("#", "")})`}
                  />
                )}
                <path d={path} fill="none" stroke={s.color} strokeWidth={1.6} strokeDasharray={s.dashed ? "4 3" : undefined} strokeLinejoin="round" />
              </g>
            );
          })}
          {markers?.map((m, i) => (
            <line key={i} x1={X(m.index)} x2={X(m.index)} y1={padT} y2={padT + innerH} stroke={m.color ?? "rgba(129,140,248,0.4)"} strokeWidth={1} strokeDasharray="2 3" />
          ))}
          {hover !== null && (
            <g>
              <line x1={X(hover)} x2={X(hover)} y1={padT} y2={padT + innerH} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
              {series.map((s, i) => (
                <circle key={i} cx={X(hover)} cy={Y(s.values[Math.min(hover, s.values.length - 1)])} r={3} fill={s.color} stroke="#0c0f14" strokeWidth={1.5} />
              ))}
            </g>
          )}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute top-1 z-20 min-w-[132px] rounded-lg border border-white/10 bg-[#11151c]/95 px-2.5 py-1.5 shadow-xl backdrop-blur"
          style={{ left: Math.min(Math.max(X(hover) - 66, 0), Math.max(0, width - 140)) }}
        >
          <div className="mb-1 text-[10px] text-zinc-500">
            {new Date(dates[hover]).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          {series.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="num font-medium text-zinc-100">{format(s.values[Math.min(hover, s.values.length - 1)])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- Sparkline */
export function Sparkline({ values, color = "#34d399", width = 64, height = 20 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / span) * height}`);
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------------------------------------------------- Donut */
export interface Slice {
  key: string;
  value: number;
  pct: number;
  color?: string;
}

export function Donut({
  data,
  size = 180,
  thickness = 26,
  center,
  onHover,
  activeKey,
  palette,
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
  onHover?: (k: string | null) => void;
  activeKey?: string | null;
  palette: string[];
}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = size / 2 - thickness / 2 - 2;
  const c = size / 2;
  let acc = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const start = acc;
    const end = acc + angle;
    acc = end;
    const large = angle > Math.PI ? 1 : 0;
    const x1 = c + r * Math.cos(start);
    const y1 = c + r * Math.sin(start);
    const x2 = c + r * Math.cos(end);
    const y2 = c + r * Math.sin(end);
    return {
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      color: d.color ?? palette[i % palette.length],
      key: d.key,
    };
  });
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thickness} />
        {arcs.map((a) => (
          <path
            key={a.key}
            d={a.d}
            fill="none"
            stroke={a.color}
            strokeWidth={activeKey === a.key ? thickness + 5 : thickness}
            strokeLinecap="butt"
            opacity={activeKey && activeKey !== a.key ? 0.28 : 1}
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => onHover?.(a.key)}
            onMouseLeave={() => onHover?.(null)}
          />
        ))}
      </svg>
      {center && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- BarList */
export function BarList({
  items,
  format,
  palette,
  max,
  onClick,
  dense,
}: {
  items: { key: string; label?: string; value: number; pct: number; color?: string; sub?: string }[];
  format?: (v: number) => string;
  palette: string[];
  max?: number;
  onClick?: (k: string) => void;
  dense?: boolean;
}) {
  const top = max ?? Math.max(...items.map((i) => i.pct), 1);
  return (
    <div className={cn("space-y-1.5", dense && "space-y-1")}>
      {items.map((it, i) => (
        <div
          key={it.key}
          onClick={() => onClick?.(it.key)}
          className={cn("group relative overflow-hidden rounded-md px-2 py-1.5", onClick && "cursor-pointer hover:bg-white/[0.04]")}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-md opacity-[0.16] transition-all duration-500 group-hover:opacity-25"
            style={{ width: `${(it.pct / top) * 100}%`, background: it.color ?? palette[i % palette.length] }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: it.color ?? palette[i % palette.length] }} />
              <span className="truncate text-[11.5px] text-zinc-200">{it.label ?? it.key}</span>
              {it.sub && <span className="shrink-0 text-[10px] text-zinc-500">{it.sub}</span>}
            </div>
            <span className="num shrink-0 text-[11.5px] font-medium text-zinc-300">
              {format ? format(it.value) : `${it.pct.toFixed(1)}%`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Radar */
export function Radar({
  axes,
  size = 230,
  color = "#5eead4",
  compare,
}: {
  axes: { axis: string; score: number }[];
  size?: number;
  color?: string;
  compare?: { axis: string; score: number }[];
}) {
  const c = size / 2;
  const r = size / 2 - 34;
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const rr = (v / 10) * r;
    return [c + rr * Math.cos(a), c + rr * Math.sin(a)];
  };
  const poly = (vals: { score: number }[]) => vals.map((v, i) => pt(i, v.score).join(",")).join(" ");
  return (
    <svg width={size} height={size} className="overflow-visible">
      {[2, 4, 6, 8, 10].map((lvl) => (
        <polygon
          key={lvl}
          points={axes.map((_, i) => pt(i, lvl).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.055)"
          strokeWidth={1}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" />;
      })}
      {compare && <polygon points={poly(compare)} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeDasharray="3 3" />}
      <polygon points={poly(axes)} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={1.6} />
      {axes.map((a, i) => {
        const [x, y] = pt(i, 11.3);
        return (
          <text
            key={a.axis}
            x={x}
            y={y}
            fontSize={9}
            fill="#8b93a1"
            textAnchor={Math.abs(x - c) < 6 ? "middle" : x > c ? "start" : "end"}
            dominantBaseline="middle"
          >
            {a.axis}
          </text>
        );
      })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, a.score);
        return <circle key={i} cx={x} cy={y} r={2.4} fill={color} />;
      })}
    </svg>
  );
}

/* ------------------------------------------------------------ RangeMeter */
export function RangeMeter({ low, high, last, label }: { low: number; high: number; last: number; label?: string }) {
  const pct = high > low ? ((last - low) / (high - low)) * 100 : 50;
  return (
    <div>
      <div className="relative h-1.5 w-full rounded-full bg-gradient-to-r from-rose-500/30 via-amber-400/25 to-emerald-400/35">
        <div
          className="absolute top-1/2 h-3.5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.55)]"
          style={{ left: `${Math.max(1, Math.min(99, pct))}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-zinc-500">
        <span className="num">{low.toFixed(2)}</span>
        {label && <span className="text-zinc-400">{label}</span>}
        <span className="num">{high.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- DivergingBars */
export function DivergingBars({
  items,
  format = (v: number) => v.toFixed(2),
  height = 16,
}: {
  items: { key: string; label: string; value: number; sub?: string }[];
  format?: (v: number) => string;
  height?: number;
}) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 0.0001);
  return (
    <div className="space-y-1">
      {items.map((it) => {
        const w = (Math.abs(it.value) / max) * 50;
        const pos = it.value >= 0;
        return (
          <div key={it.key} className="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-white/[0.03]">
            <span className="w-[78px] shrink-0 truncate text-[11px] text-zinc-300">{it.label}</span>
            <div className="relative flex-1" style={{ height }}>
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
              <div
                className={cn("absolute top-1/2 h-[9px] -translate-y-1/2 rounded-[2px] transition-all duration-500", pos ? "bg-emerald-400/70" : "bg-rose-400/70")}
                style={pos ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
              />
            </div>
            <span className={cn("num w-[62px] shrink-0 text-right text-[11px] font-medium", pos ? "text-emerald-400" : "text-rose-400")}>
              {format(it.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- Gauge */
export function ScoreRing({ score, max = 10, size = 76, label }: { score: number; max?: number; size?: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, score / max));
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const color = pct > 0.72 ? "#34d399" : pct > 0.5 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-base leading-none font-semibold text-zinc-50">{score.toFixed(1)}</span>
        {label && <span className="mt-0.5 text-[8.5px] tracking-wider text-zinc-500 uppercase">{label}</span>}
      </div>
    </div>
  );
}
