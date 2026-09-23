import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Sparkline({
  values,
  color,
  height = 28,
  width = 96,
  fill = true,
}: {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
}) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const c = color ?? (values[values.length - 1] >= values[0] ? "#3ddc97" : "#ff6b81");
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - lo) / span) * 28 - 1}`)
    .join(" ");
  const id = `sp${Math.abs([...pts].reduce((a, ch) => a + ch.charCodeAt(0), 0))}`;
  return (
    <svg width={width} height={height} viewBox="0 0 100 30" preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <polygon points={`0,30 ${pts} 100,30`} fill={`url(#${id})`} />}
      <polyline
        points={pts}
        fill="none"
        stroke={c}
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface Slice {
  label: string;
  value: number;
  color: string;
  sub?: string;
}

export function Donut({
  data,
  size = 190,
  thickness = 20,
  center,
  onHover,
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
  onHover?: (i: number | null) => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = size / 2 - thickness / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {data.map((d, i) => {
          const frac = d.value / total;
          const len = frac * circ;
          const el = (
            <circle
              key={d.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={active === i ? thickness + 4 : thickness}
              strokeDasharray={`${Math.max(len - 1.5, 0.5)} ${circ - Math.max(len - 1.5, 0.5)}`}
              strokeDashoffset={-offset}
              opacity={active === null || active === i ? 1 : 0.28}
              className="transition-all duration-200"
              onMouseEnter={() => {
                setActive(i);
                onHover?.(i);
              }}
              onMouseLeave={() => {
                setActive(null);
                onHover?.(null);
              }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {active !== null ? (
          <>
            <span className="text-[10px] uppercase tracking-wider text-mist-500">{data[active].label}</span>
            <span className="tnum text-lg font-semibold text-mist-100">
              {((data[active].value / total) * 100).toFixed(1)}%
            </span>
            {data[active].sub && <span className="tnum text-[11px] text-mist-400">{data[active].sub}</span>}
          </>
        ) : (
          center
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- treemap */
export interface TreeNode {
  id: string;
  value: number;
  ret: number;
  label: string;
  sub?: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  node: TreeNode;
}

function squarify(nodes: TreeNode[], x: number, y: number, w: number, h: number): Rect[] {
  const out: Rect[] = [];
  const total = nodes.reduce((a, n) => a + n.value, 0);
  let items = nodes.map((n) => ({ ...n, area: (n.value / total) * w * h }));
  let cx = x;
  let cy = y;
  let cw = w;
  let ch = h;

  const worst = (row: typeof items, len: number) => {
    const s = row.reduce((a, r) => a + r.area, 0);
    const mx = Math.max(...row.map((r) => r.area));
    const mn = Math.min(...row.map((r) => r.area));
    return Math.max((len * len * mx) / (s * s), (s * s) / (len * len * mn));
  };

  while (items.length) {
    const vertical = cw >= ch;
    const len = vertical ? ch : cw;
    const row: typeof items = [];
    while (items.length) {
      const next = [...row, items[0]];
      if (row.length && worst(row, len) < worst(next, len)) break;
      row.push(items.shift()!);
    }
    const rowArea = row.reduce((a, r) => a + r.area, 0);
    const thick = rowArea / len;
    let pos = vertical ? cy : cx;
    for (const r of row) {
      const sz = r.area / thick;
      out.push(
        vertical
          ? { x: cx, y: pos, w: thick, h: sz, node: r }
          : { x: pos, y: cy, w: sz, h: thick, node: r },
      );
      pos += sz;
    }
    if (vertical) {
      cx += thick;
      cw -= thick;
    } else {
      cy += thick;
      ch -= thick;
    }
  }
  return out;
}

export function Treemap({
  nodes,
  height = 300,
  onSelect,
}: {
  nodes: TreeNode[];
  height?: number;
  onSelect?: (id: string) => void;
}) {
  const sorted = [...nodes].sort((a, b) => b.value - a.value);
  const rects = squarify(sorted, 0, 0, 100, 100);

  const color = (ret: number) => {
    const t = Math.max(-1, Math.min(1, ret / 30));
    if (t >= 0) return `color-mix(in oklab, #3ddc97 ${12 + t * 62}%, #10161c)`;
    return `color-mix(in oklab, #ff6b81 ${12 + -t * 62}%, #10161c)`;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ height }}>
      {rects.map((r) => {
        const big = r.w > 12 && r.h > 12;
        const mid = r.w > 7 && r.h > 8;
        return (
          <button
            key={r.node.id}
            onClick={() => onSelect?.(r.node.id)}
            className="absolute overflow-hidden rounded-[3px] border border-ink-950/70 p-1.5 text-left transition-[filter] hover:z-10 hover:brightness-125"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: `${r.w}%`,
              height: `${r.h}%`,
              background: color(r.node.ret),
            }}
            title={`${r.node.label} · ${r.node.sub ?? ""} · ${r.node.ret >= 0 ? "+" : ""}${r.node.ret.toFixed(1)}%`}
          >
            {mid && (
              <div className="text-[10px] font-semibold leading-none text-white/95">{r.node.label}</div>
            )}
            {big && (
              <div className="tnum mt-0.5 text-[9px] leading-none text-white/70">
                {r.node.ret >= 0 ? "+" : ""}
                {r.node.ret.toFixed(1)}%
              </div>
            )}
            {big && r.h > 22 && r.node.sub && (
              <div className="tnum mt-1 text-[9px] leading-none text-white/50">{r.node.sub}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ column bars */
export function Columns({
  data,
  height = 120,
  fmt,
  tone = "acc",
}: {
  data: { label: string; value: number; hint?: string }[];
  height?: number;
  fmt?: (n: number) => string;
  tone?: "acc" | "gold" | "violet";
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const bg = tone === "gold" ? "bg-gold/70" : tone === "violet" ? "bg-violet/70" : "bg-acc/70";
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group relative flex h-full flex-1 flex-col justify-end gap-1.5">
          <div
            className={cn("w-full rounded-t-[3px] transition-all duration-500 group-hover:brightness-150", bg)}
            style={{ height: `${Math.max((d.value / max) * 100, 1.5)}%` }}
          />
          <span className="text-center text-[9px] text-mist-500">{d.label}</span>
          <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-[10px] text-mist-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {fmt ? fmt(d.value) : d.value.toFixed(0)}
            {d.hint && <span className="ml-1 text-mist-500">{d.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------- diverging bar (returns) */
export function DivergingBar({ value, max, dp = 1 }: { value: number; max: number; dp?: number }) {
  const pct = Math.min(Math.abs(value) / max, 1) * 50;
  return (
    <div className="relative h-4 w-full">
      <div className="absolute left-1/2 top-0 h-full w-px bg-ink-600" />
      <div
        className={cn("absolute top-1/2 h-2 -translate-y-1/2 rounded-sm", value >= 0 ? "bg-up/70" : "bg-down/70")}
        style={value >= 0 ? { left: "50%", width: `${pct}%` } : { right: "50%", width: `${pct}%` }}
      />
      <span
        className={cn(
          "tnum absolute top-1/2 -translate-y-1/2 text-[10px] font-medium",
          value >= 0 ? "text-up" : "text-down",
        )}
        style={value >= 0 ? { left: `calc(50% + ${pct}% + 6px)` } : { right: `calc(50% + ${pct}% + 6px)` }}
      >
        {value >= 0 ? "+" : "−"}
        {Math.abs(value).toFixed(dp)}
      </span>
    </div>
  );
}
