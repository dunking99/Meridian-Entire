"use client";

import { Fragment, useState } from "react";
import { Sparkline } from "@/components/charts";
import { Delta, Td, Th } from "@/components/ui";
import type { Position } from "@/lib/portfolio";
import { fmtCurrency, fmtNumber, fmtQty, signClass } from "@/lib/format";

type SortKey = "marketValue" | "weight" | "dayChangePct" | "unrealizedPct" | "symbol" | "unrealizedPL";

export default function HoldingsTable({ positions, sparks = {} }: { positions: Position[]; sparks?: Record<string, number[]> }) {
  const [sort, setSort] = useState<SortKey>("marketValue");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [open, setOpen] = useState<string | null>(null);

  const rows = [...positions].sort((a, b) => {
    const av = a[sort];
    const bv = b[sort];
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
    return ((av as number) - (bv as number)) * dir;
  });

  function toggle(key: SortKey) {
    if (key === sort) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(key);
      setDir(-1);
    }
  }

  const head = (key: SortKey, label: string, right = false) => (
    <Th className={`${right ? "text-right" : ""} cursor-pointer select-none hover:text-slate-300`}>
      <button onClick={() => toggle(key)}>{label}</button>
    </Th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px]">
        <thead>
          <tr className="border-b border-slate-800">
            {head("symbol", "Position")}
            <Th className="text-right">Quantity</Th>
            <Th className="text-right">Avg cost</Th>
            <Th className="text-right">Price</Th>
            {head("dayChangePct", "Day", true)}
            {head("marketValue", "Value", true)}
            {head("weight", "Weight", true)}
            {head("unrealizedPL", "Unreal. P/L", true)}
            {head("unrealizedPct", "Return", true)}
            <Th className="text-right">Trend</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <Fragment key={p.symbol}>
              <tr
                onClick={() => setOpen(open === p.symbol ? null : p.symbol)}
                className="cursor-pointer border-b border-slate-900/60 hover:bg-slate-800/25"
              >
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{p.symbol}</span>
                    <span className="rounded border border-slate-700 px-1 text-[10px] uppercase text-slate-500">{p.assetClass}</span>
                  </div>
                  <p className="truncate text-xs text-slate-500">{p.name}</p>
                </Td>
                <Td className="text-right tabular-nums">{fmtQty(p.quantity)}</Td>
                <Td className="text-right tabular-nums">{fmtNumber(p.avgCost)}</Td>
                <Td className="text-right tabular-nums">{fmtNumber(p.price)}</Td>
                <Td className="text-right">
                  <Delta value={p.dayChangePct} showArrow={false} />
                </Td>
                <Td className="text-right font-medium tabular-nums text-slate-100">{fmtCurrency(p.marketValue)}</Td>
                <Td className="text-right tabular-nums">{p.weight.toFixed(1)}%</Td>
                <Td className={`text-right tabular-nums ${signClass(p.unrealizedPL)}`}>
                  {p.unrealizedPL >= 0 ? "+" : "−"}
                  {fmtCurrency(Math.abs(p.unrealizedPL))}
                </Td>
                <Td className="text-right">
                  <Delta value={p.unrealizedPct} showArrow={false} />
                </Td>
                <Td className="text-right">
                  <Sparkline data={sparks[p.symbol] ?? [p.prevClose, p.price]} width={64} height={22} />
                </Td>
              </tr>
              {open === p.symbol && (
                <tr className="border-b border-slate-900 bg-slate-950/40">
                  <td colSpan={10} className="px-4 py-3">
                    <div className="grid gap-3 text-xs sm:grid-cols-4">
                      <Detail label="Cost basis" value={fmtCurrency(p.costBasis)} />
                      <Detail label="First bought" value={p.firstBuy} />
                      <Detail label="Realised P/L" value={fmtCurrency(p.realizedPL)} />
                      <Detail label="Dividends received" value={fmtCurrency(p.dividends)} />
                      <Detail label="Sector" value={p.sector} />
                      <Detail label="Region" value={p.region} />
                      <Detail label="Currency" value={p.currency} />
                      <Detail
                        label="Yield on cost"
                        value={p.costBasis > 0 ? `${((p.dividends / p.costBasis) * 100).toFixed(2)}%` : "—"}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-600">{label}</p>
      <p className="mt-0.5 text-slate-300">{value}</p>
    </div>
  );
}
