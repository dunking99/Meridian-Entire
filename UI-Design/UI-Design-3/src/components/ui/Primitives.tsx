import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { clsTone, fmtPct } from "@/lib/format";

export function Panel({
  className,
  children,
  flush,
}: {
  className?: string;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className={cn("panel rounded-xl", flush ? "" : "p-4 sm:p-5", className)}>{children}</section>
  );
}

export function PanelHead({
  title,
  sub,
  right,
  className,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold tracking-wide text-mist-100">{title}</h3>
        {sub && <p className="mt-0.5 text-[11px] leading-tight text-mist-500">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[10px] font-medium uppercase tracking-[0.14em] text-mist-500", className)}>
      {children}
    </span>
  );
}

export function Delta({
  value,
  dp = 2,
  className,
  arrow = true,
  size = "sm",
}: {
  value: number;
  dp?: number;
  className?: string;
  arrow?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const s = size === "lg" ? "text-base" : size === "md" ? "text-[13px]" : "text-[12px]";
  return (
    <span className={cn("tnum inline-flex items-center gap-1 font-medium", s, clsTone(value), className)}>
      {arrow && (
        <svg width="8" height="8" viewBox="0 0 8 8" className={value < 0 ? "rotate-180" : ""} aria-hidden>
          <path d="M4 0 L8 7 L0 7 Z" fill="currentColor" />
        </svg>
      )}
      {fmtPct(value, dp)}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "up" | "down" | "acc" | "gold" | "violet";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ink-800 text-mist-300 ring-ink-700",
    up: "bg-up/10 text-up ring-up/25",
    down: "bg-down/10 text-down ring-down/25",
    acc: "bg-acc/10 text-acc ring-acc/25",
    gold: "bg-gold/10 text-gold ring-gold/25",
    violet: "bg-violet/10 text-violet ring-violet/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "sm",
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  size?: "xs" | "sm";
}) {
  return (
    <div className="inline-flex rounded-lg border border-ink-750 bg-ink-900 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-[6px] font-medium transition-colors",
            size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
            o === value ? "bg-ink-700 text-mist-100 shadow-sm" : "text-mist-500 hover:text-mist-200",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Ticker({ t, size = "sm" }: { t: string; size?: "sm" | "md" }) {
  const palette = [
    "from-acc/30 to-acc/5 text-acc",
    "from-violet/30 to-violet/5 text-violet",
    "from-azure/30 to-azure/5 text-azure",
    "from-gold/30 to-gold/5 text-gold",
    "from-up/30 to-up/5 text-up",
    "from-down/25 to-down/5 text-down",
  ];
  const idx = [...t].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br font-semibold tracking-tight ring-1 ring-inset ring-white/5",
        palette[idx],
        size === "md" ? "h-9 w-9 text-[11px]" : "h-7 w-7 text-[9px]",
      )}
    >
      {t.replace(".", "").slice(0, 4)}
    </span>
  );
}

export function Bar({
  pct,
  tone = "acc",
  className,
}: {
  pct: number;
  tone?: "acc" | "up" | "down" | "violet" | "gold" | "azure" | "mist";
  className?: string;
}) {
  const bg: Record<string, string> = {
    acc: "bg-acc",
    up: "bg-up",
    down: "bg-down",
    violet: "bg-violet",
    gold: "bg-gold",
    azure: "bg-azure",
    mist: "bg-mist-400",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-750", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", bg[tone])}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function KV({ k, v, tone }: { k: string; v: ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11px] text-mist-500">{k}</span>
      <span className={cn("tnum text-[12px] font-medium text-mist-100", tone)}>{v}</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-ink-700 text-[12px] text-mist-500">
      {children}
    </div>
  );
}
