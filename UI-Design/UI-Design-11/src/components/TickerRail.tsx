"use client";

import { Sparkline } from "@/components/charts";
import type { QuoteRow } from "@/lib/market-data";
import { fmtNumber } from "@/lib/format";

export default function TickerRail({ quotes }: { quotes: QuoteRow[] }) {
  if (!quotes.length) return null;
  return (
    <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
      {quotes.map((q) => {
        const up = q.changePct >= 0;
        return (
          <div key={q.symbol} className="flex min-w-[168px] shrink-0 items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-900/50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-slate-300">{q.symbol}</p>
              <p className="text-xs tabular-nums text-slate-100">
                {fmtNumber(q.price, q.price > 100 ? 0 : q.price > 10 ? 2 : 4)}
              </p>
              <p className={`text-[11px] tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>
                {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
              </p>
            </div>
            <Sparkline data={q.spark.length > 2 ? q.spark : [q.previousClose, q.price]} width={64} height={26} />
          </div>
        );
      })}
    </div>
  );
}
