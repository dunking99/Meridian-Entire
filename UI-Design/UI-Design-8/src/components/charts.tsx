"use client";

import { useId, useMemo, useState } from "react";
import { gbp, pct, type HistoryPoint } from "@/lib/portfolio";

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function PerformanceChart({
  data,
  mode,
  showBenchmark,
  height = 260,
}: {
  data: HistoryPoint[];
  mode: "value" | "return";
  showBenchmark: boolean;
  height?: number;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 760;
  const H = height;
  const PAD = { l: 8, r: 8, t: 12, b: 28 };

  const series = useMemo(() => {
    if (mode === "value") return data.map((d) => ({ ...d, v: d.value, b: d.benchmark }));
    const base = data[0]?.value ?? 1;
    const bBase = data[0]?.benchmark ?? 1;
    return data.map((d) => ({
      ...d,
      v: ((d.value - base) / base) * 100,
      b: ((d.benchmark - bBase) / bBase) * 100,
    }));
  }, [data, mode]);

  const { line, area, benchLine, coords, min, max, ticks } = useMemo(() => {
    const vals = series.flatMap((d) => (showBenchmark ? [d.v, d.b] : [d.v]));
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    const pad = (hi - lo) * 0.12 || 1;
    lo -= pad;
    hi += pad;
    const x = (i: number) => PAD.l + (i / Math.max(1, series.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const coords = series.map((d, i) => ({ x: x(i), y: y(d.v), bx: x(i), by: y(d.b), d }));
    const line = smoothPath(coords.map((c) => ({ x: c.x, y: c.y })));
    const benchLine = smoothPath(coords.map((c) => ({ x: c.bx, y: c.by })));
    const first = coords[0];
    const last = coords[coords.length - 1];
    const area = `${line} L ${last.x.toFixed(2)} ${(H - PAD.b).toFixed(2)} L ${first.x.toFixed(2)} ${(H - PAD.b).toFixed(2)} Z`;
    // 4 ticks
    const ticks = [0, 1, 2, 3].map((i) => {
      const v = hi - (i / 3) * (hi - lo);
      return { v, y: y(v) };
    });
    return { line, area, benchLine, coords, min: lo, max: hi, ticks };
  }, [series, showBenchmark, H]);

  const active = hover != null ? coords[hover] : null;
  const xLabels = useMemo(() => {
    const n = 6;
    const out: { i: number; label: string }[] = [];
    for (let k = 0; k < n; k++) {
      const i = Math.round((k / (n - 1)) * (series.length - 1));
      out.push({ i, label: series[i]?.label ?? "" });
    }
    return out;
  }, [series]);

  const fmtY = (v: number) => (mode === "value" ? gbp(Math.round(v / 100) * 100, { compact: true }) : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`);

  return (
    <div className="pchart" style={{ height }}>
      <div className="pchart-y">
        {ticks.map((t, i) => (
          <span key={i} style={{ top: t.y }}>
            {fmtY(t.v)}
          </span>
        ))}
      </div>
      <div
        className="pchart-body"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const rel = (e.clientX - rect.left) / rect.width;
          const idx = Math.round(rel * (series.length - 1));
          setHover(Math.max(0, Math.min(series.length - 1, idx)));
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`pfill-${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => {
            const y = PAD.t + (i / 3) * (H - PAD.t - PAD.b);
            return <line key={i} x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="pgrid" />;
          })}
          <path d={area} fill={`url(#pfill-${gid})`} />
          {showBenchmark && <path d={benchLine} fill="none" className="pbench" />}
          <path d={line} fill="none" className="pline" />
          {active && (
            <g>
              <line x1={active.x} x2={active.x} y1={PAD.t} y2={H - PAD.b} className="pxhair" />
              <circle cx={active.x} cy={active.y} r="4.5" className="pdot" />
              {showBenchmark && <circle cx={active.bx} cy={active.by} r="3.5" className="pdot-b" />}
            </g>
          )}
          {!active && coords.length > 0 && (
            <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="4" className="pdot" />
          )}
        </svg>
        <div className="pchart-x">
          {xLabels.map((l, i) => (
            <span key={i}>{l.label}</span>
          ))}
        </div>
        {active && (
          <div
            className="ptooltip"
            style={{
              left: `calc(${(active.x / W) * 100}% ${active.x / W > 0.72 ? " - 172px" : " + 12px"})`,
              top: Math.max(8, active.y - 84),
            }}
          >
            <div className="ptooltip-date">{active.d.label} · 2026</div>
            <div className="ptooltip-row">
              <i className="dot-accent" />
              <span>Portfolio</span>
              <strong>{mode === "value" ? gbp(active.d.value) : pct(((active.d.value - series[0].v) / 100) * 100 + active.d.v - active.d.v + (series[hover ?? 0]?.v ?? 0), 2)}</strong>
            </div>
            {showBenchmark && (
              <div className="ptooltip-row muted">
                <i className="dot-bench" />
                <span>FTSE All-World</span>
                <strong>{mode === "value" ? gbp(active.d.benchmark) : `${(series[hover ?? 0]?.b ?? 0) >= 0 ? "+" : "−"}${Math.abs(series[hover ?? 0]?.b ?? 0).toFixed(2)}%`}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function WeightBar({ pct: p, color }: { pct: number; color: string }) {
  return (
    <span className="wbar">
      <span className="wbar-track">
        <span className="wbar-fill" style={{ width: `${Math.min(100, p * 3.2)}%`, background: color }} />
      </span>
      <span className="wbar-pct">{p.toFixed(1)}%</span>
    </span>
  );
}

export function HBar({ label, pct: p, value, color, muted }: { label: string; pct: number; value?: string; color: string; muted?: boolean }) {
  return (
    <div className={`hbar ${muted ? "muted" : ""}`}>
      <div className="hbar-top">
        <span>{label}</span>
        <span>
          {value && <strong>{value}</strong>} {p.toFixed(1)}%
        </span>
      </div>
      <div className="hbar-track">
        <div className="hbar-fill" style={{ width: `${p}%`, background: color }} />
      </div>
    </div>
  );
}

export function Donut({ slices, size = 132 }: { slices: { pct: number; color: string }[]; size?: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" className="donut-svg" role="img" aria-label="Allocation donut">
      <circle cx="66" cy="66" r={R} fill="none" strokeWidth="20" stroke="var(--track)" />
      {slices.map((s, i) => {
        const frac = s.pct / 100;
        const dash = frac * C;
        const gap = C - dash;
        const rot = (acc / 100) * 360 - 90;
        acc += s.pct;
        return (
          <circle
            key={i}
            cx="66"
            cy="66"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="20"
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rot} 66 66)`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

export function Spark({ points, up }: { points: number[]; up: boolean }) {
  const W = 64;
  const H = 22;
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * W;
      const y = H - 3 - ((v - lo) / (hi - lo || 1)) * (H - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={`spark ${up ? "up" : "down"}`} aria-hidden="true">
      <path d={path} fill="none" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
