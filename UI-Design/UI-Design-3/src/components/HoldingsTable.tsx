import { useMemo, useState } from "react";
import type { Holding } from "@/data/portfolio";
import { Sparkline } from "@/components/charts/Micro";
import { Ticker } from "@/components/ui/Primitives";
import { cn } from "@/utils/cn";
import { fmtUSD, fmtUSD0, fmtQty, clsTone, fmtCompact } from "@/lib/format";

type Key = "ticker" | "qty" | "price" | "dayChangePct" | "marketValue" | "weight" | "unrealized" | "unrealizedPct" | "dayPL" | "r1m";

const COLS: { key: Key; label: string; align: "left" | "right"; compact?: boolean; w?: string }[] = [
  { key: "ticker", label: "Position", align: "left", compact: true },
  { key: "qty", label: "Qty", align: "right" },
  { key: "price", label: "Last", align: "right", compact: true },
  { key: "dayChangePct", label: "Day", align: "right", compact: true },
  { key: "marketValue", label: "Value", align: "right", compact: true },
  { key: "weight", label: "Weight", align: "right", compact: true },
  { key: "unrealized", label: "Unrealised P&L", align: "right", compact: true },
  { key: "r1m", label: "30-day", align: "right" },
];

export function HoldingsTable({
  rows,
  compact = false,
  onSelect,
  maxWeight,
}: {
  rows: Holding[];
  compact?: boolean;
  onSelect: (t: string) => void;
  maxWeight?: number;
}) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "marketValue", dir: -1 });
  const cols = compact ? COLS.filter((c) => c.compact) : COLS;
  const mw = maxWeight ?? Math.max(...rows.map((r) => r.weight), 1);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * sort.dir;
      return ((av as number) - (bv as number)) * sort.dir;
    });
    return out;
  }, [rows, sort]);

  const toggle = (k: Key) =>
    setSort((s) => (s.key === k ? { key: k, dir: (s.dir * -1) as 1 | -1 } : { key: k, dir: -1 }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr className="border-b border-ink-800">
            {cols.map((c) => (
              <th
                key={c.key}
                onClick={() => toggle(c.key)}
                className={cn(
                  "cursor-pointer select-none whitespace-nowrap px-2.5 py-2 text-[10px] font-medium uppercase tracking-wider text-mist-500 transition-colors hover:text-mist-300",
                  c.align === "right" ? "text-right" : "text-left",
                )}
              >
                {c.label}
                {sort.key === c.key && <span className="ml-1 text-acc">{sort.dir === -1 ? "↓" : "↑"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => (
            <tr
              key={h.ticker}
              onClick={() => onSelect(h.ticker)}
              className="group cursor-pointer border-b border-ink-850 transition-colors last:border-0 hover:bg-ink-850/70"
            >
              <td className="px-2.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Ticker t={h.ticker} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-mist-100">{h.ticker}</span>
                      {h.tags.includes("Under review") && (
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" title="Under review" />
                      )}
                    </div>
                    <div className="max-w-[190px] truncate text-[10.5px] text-mist-500">{h.name}</div>
                  </div>
                </div>
              </td>

              {!compact && (
                <td className="tnum px-2.5 py-2.5 text-right text-[12px] text-mist-300">{fmtQty(h.qty)}</td>
              )}

              <td className="px-2.5 py-2.5 text-right">
                <div className="tnum text-[12px] text-mist-100">{fmtUSD(h.price)}</div>
                {!compact && <div className="tnum text-[10px] text-mist-500">avg {fmtUSD(h.avgCost)}</div>}
              </td>

              <td className={cn("tnum px-2.5 py-2.5 text-right text-[12px] font-medium", clsTone(h.dayChangePct))}>
                {h.dayChangePct >= 0 ? "+" : "−"}
                {Math.abs(h.dayChangePct).toFixed(2)}%
                {!compact && (
                  <div className={cn("tnum text-[10px] font-normal opacity-80")}>
                    {h.dayPL >= 0 ? "+" : "−"}
                    {fmtCompact(Math.abs(h.dayPL))}
                  </div>
                )}
              </td>

              <td className="tnum px-2.5 py-2.5 text-right text-[12px] text-mist-100">{fmtUSD0(h.marketValue)}</td>

              <td className="px-2.5 py-2.5">
                <div className="flex items-center justify-end gap-2">
                  <div className="hidden h-1 w-14 overflow-hidden rounded-full bg-ink-750 sm:block">
                    <div className="h-full rounded-full bg-acc/70" style={{ width: `${(h.weight / mw) * 100}%` }} />
                  </div>
                  <span className="tnum w-10 text-right text-[11.5px] text-mist-300">{h.weight.toFixed(1)}%</span>
                </div>
              </td>

              <td className="px-2.5 py-2.5 text-right">
                <div className={cn("tnum text-[12px] font-medium", clsTone(h.unrealized))}>
                  {h.unrealized >= 0 ? "+" : "−"}
                  {fmtUSD0(Math.abs(h.unrealized))}
                </div>
                <div className={cn("tnum text-[10px]", clsTone(h.unrealizedPct))}>
                  {h.unrealizedPct >= 0 ? "+" : "−"}
                  {Math.abs(h.unrealizedPct).toFixed(1)}%
                </div>
              </td>

              {!compact && (
                <td className="px-2.5 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <Sparkline values={h.series.slice(-22)} width={70} height={24} />
                    <span className={cn("tnum w-12 text-right text-[11px]", clsTone(h.r1m))}>
                      {h.r1m >= 0 ? "+" : "−"}
                      {Math.abs(h.r1m).toFixed(1)}%
                    </span>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
