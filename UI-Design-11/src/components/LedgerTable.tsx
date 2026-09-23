"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Td, Th } from "@/components/ui";
import { fmtCurrency, fmtNumber, fmtQty, signClass } from "@/lib/format";

export type LedgerRow = {
  id: number;
  day: string;
  symbol: string;
  kind: string;
  quantity: number;
  price: number;
  fee: number;
  currency: string;
  note: string | null;
};

const TONES: Record<string, string> = {
  buy: "indigo",
  sell: "rose",
  dividend: "emerald",
  deposit: "sky",
  withdrawal: "amber",
  fee: "slate",
};

export default function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [limit, setLimit] = useState(60);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (kind === "all" ? true : r.kind === kind))
      .filter((r) => (query ? `${r.symbol} ${r.note ?? ""}`.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => (a.day === b.day ? b.id - a.id : b.day.localeCompare(a.day)));
  }, [rows, kind, query]);

  async function remove(id: number) {
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    start(() => router.refresh());
  }

  const shown = filtered.slice(0, limit);
  const invested = filtered.filter((r) => r.kind === "buy").reduce((a, r) => a + r.quantity * r.price + r.fee, 0);
  const proceeds = filtered.filter((r) => r.kind === "sell").reduce((a, r) => a + r.quantity * r.price - r.fee, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          placeholder="Filter by symbol or note"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-52 rounded-md border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500/60"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500/60"
        >
          {["all", "buy", "sell", "dividend", "deposit", "withdrawal", "fee"].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500">
          {filtered.length} rows · invested {fmtCurrency(invested, "USD", 0)} · proceeds {fmtCurrency(proceeds, "USD", 0)}
        </span>
        {pending && <span className="text-xs text-indigo-400">updating…</span>}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/50">
        <table className="w-full min-w-[840px]">
          <thead>
            <tr className="border-b border-slate-800">
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Symbol</Th>
              <Th className="text-right">Quantity</Th>
              <Th className="text-right">Price</Th>
              <Th className="text-right">Fee</Th>
              <Th className="text-right">Cash flow</Th>
              <Th>Note</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const flow =
                r.kind === "buy"
                  ? -(r.quantity * r.price + r.fee)
                  : r.kind === "sell"
                    ? r.quantity * r.price - r.fee
                    : r.kind === "dividend"
                      ? r.quantity * r.price - r.fee
                      : r.kind === "deposit"
                        ? r.price
                        : r.kind === "withdrawal"
                          ? -r.price
                          : -r.price;
              return (
                <tr key={r.id} className="border-b border-slate-900/60 last:border-0 hover:bg-slate-800/25">
                  <Td className="tabular-nums text-slate-400">{r.day}</Td>
                  <Td>
                    <Badge tone={TONES[r.kind] ?? "slate"}>{r.kind}</Badge>
                  </Td>
                  <Td className="font-medium text-slate-100">{r.symbol}</Td>
                  <Td className="text-right tabular-nums">{r.quantity ? fmtQty(r.quantity) : "—"}</Td>
                  <Td className="text-right tabular-nums">{r.price ? fmtNumber(r.price) : "—"}</Td>
                  <Td className="text-right tabular-nums text-slate-500">{r.fee ? fmtNumber(r.fee) : "—"}</Td>
                  <Td className={`text-right tabular-nums ${signClass(flow)}`}>
                    {flow >= 0 ? "+" : "−"}
                    {fmtCurrency(Math.abs(flow))}
                  </Td>
                  <Td className="max-w-[200px] truncate text-xs text-slate-500">{r.note ?? ""}</Td>
                  <Td className="text-right">
                    <button onClick={() => remove(r.id)} className="text-xs text-slate-600 hover:text-rose-400">
                      delete
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > limit && (
        <button onClick={() => setLimit((l) => l + 100)} className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500/50">
          Load 100 more
        </button>
      )}
    </div>
  );
}
