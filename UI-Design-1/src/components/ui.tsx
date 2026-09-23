import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

/* ------------------------------------------------------------------ Card */
export function Card({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-white/[0.07] bg-[#0c0f14]/80 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur",
        pad && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="truncate text-[13px] font-semibold tracking-tight text-zinc-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- Badge */
const badgeTones: Record<string, string> = {
  neutral: "bg-white/[0.06] text-zinc-300 border-white/10",
  up: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  down: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  warn: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  info: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  ai: "bg-violet-400/10 text-violet-300 border-violet-400/25",
  ghost: "bg-transparent text-zinc-500 border-white/10",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
        badgeTones[tone] ?? badgeTones.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- Button */
export function Button({
  children,
  onClick,
  variant = "default",
  size = "md",
  className,
  disabled,
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost" | "subtle" | "danger";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  const variants = {
    default:
      "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-200 border border-white/10 hover:border-white/20",
    primary:
      "bg-gradient-to-b from-teal-300 to-emerald-500 text-emerald-950 border border-emerald-300/40 hover:from-teal-200 hover:to-emerald-400 font-semibold shadow-[0_6px_20px_-8px_rgba(45,212,191,0.65)]",
    ghost: "bg-transparent hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border border-transparent",
    subtle: "bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-zinc-100 border border-white/[0.06]",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-400/20",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ SegmentedControl */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-white/[0.07] bg-black/30 p-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[6px] font-medium transition-all duration-150",
            size === "xs" ? "px-1.5 py-[3px] text-[10px]" : size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs",
            value === o.value
              ? "bg-white/[0.1] text-zinc-50 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Delta */
export function Delta({
  value,
  suffix = "%",
  dp = 2,
  className,
  arrow = true,
  size = "sm",
}: {
  value: number;
  suffix?: string;
  dp?: number;
  className?: string;
  arrow?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const up = value > 0;
  const flat = Math.abs(value) < 0.005;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-0.5 font-medium",
        size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
        flat ? "text-zinc-400" : up ? "text-emerald-400" : "text-rose-400",
        className,
      )}
    >
      {arrow && !flat && <span className="text-[0.85em] leading-none">{up ? "▲" : "▼"}</span>}
      {!arrow && !flat && (up ? "+" : "−")}
      {Math.abs(value).toFixed(dp)}
      {suffix}
    </span>
  );
}

/* --------------------------------------------------------------- Tooltip */
export function Info({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/15 text-[8px] leading-none text-zinc-500 transition hover:border-white/30 hover:text-zinc-300"
      >
        i
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-60 -translate-x-1/2 rounded-lg border border-white/10 bg-[#11151c] p-2.5 text-[11px] leading-relaxed font-normal tracking-normal text-zinc-300 normal-case shadow-2xl">
          {text}
        </span>
      )}
    </span>
  );
}

/* ----------------------------------------------------------------- Modal */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-6 backdrop-blur-sm">
      <div className={cn("anim-in mt-16 w-full rounded-2xl border border-white/10 bg-[#0c0f14] shadow-2xl", width)}>
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Field */
export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[10px] font-medium tracking-wider text-zinc-500 uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-zinc-600">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-white/[0.09] bg-black/40 px-2.5 py-1.5 text-xs text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/15";

/* ----------------------------------------------------------- Progress bar */
export function Bar({
  pct,
  tone = "teal",
  className,
  height = "h-1.5",
}: {
  pct: number;
  tone?: "teal" | "amber" | "rose" | "violet" | "sky" | "zinc";
  className?: string;
  height?: string;
}) {
  const tones = {
    teal: "bg-gradient-to-r from-teal-400 to-emerald-400",
    amber: "bg-gradient-to-r from-amber-300 to-orange-400",
    rose: "bg-gradient-to-r from-rose-400 to-pink-500",
    violet: "bg-gradient-to-r from-violet-400 to-indigo-400",
    sky: "bg-gradient-to-r from-sky-400 to-cyan-400",
    zinc: "bg-zinc-500",
  };
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-white/[0.06]", height, className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- Empty note */
export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] leading-relaxed text-zinc-500", className)}>{children}</p>;
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">{children}</span>
      {right}
    </div>
  );
}

/* --------------------------------------------------------------- Collapse */
export function Collapse({
  title,
  subtitle,
  children,
  defaultOpen = false,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.015]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-zinc-100">
            <span className={cn("text-[9px] text-zinc-500 transition-transform duration-200", open && "rotate-90")}>▶</span>
            {title}
          </div>
          {subtitle && <p className="mt-0.5 pl-4 text-[11px] text-zinc-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </button>
      {open && <div className="anim-in border-t border-white/[0.06] px-4 py-3.5">{children}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- useHover */
export function useOutsideClick<T extends HTMLElement>(cb: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [cb]);
  return ref;
}
