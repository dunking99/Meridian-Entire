import type { ReactNode } from "react";

export function PageHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight text-mist-100">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-mist-500">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  tone = "ghost",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "ghost" | "primary";
}) {
  return (
    <button
      onClick={onClick}
      className={
        tone === "primary"
          ? "inline-flex items-center gap-1.5 rounded-lg bg-acc/15 px-3 py-1.5 text-[11.5px] font-medium text-acc ring-1 ring-inset ring-acc/30 transition-colors hover:bg-acc/25"
          : "inline-flex items-center gap-1.5 rounded-lg border border-ink-750 bg-ink-900 px-3 py-1.5 text-[11.5px] font-medium text-mist-300 transition-colors hover:border-ink-600 hover:text-mist-100"
      }
    >
      {children}
    </button>
  );
}
