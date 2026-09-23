"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const KINDS = ["buy", "sell", "dividend", "fee", "deposit", "withdrawal"];

export default function AddTrade({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState({
    day: new Date().toISOString().slice(0, 10),
    symbol: "",
    kind: "buy",
    quantity: "",
    price: "",
    fee: "",
    note: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        symbol: form.symbol.toUpperCase(),
        quantity: form.quantity === "" ? undefined : Number(form.quantity),
        price: form.price === "" ? undefined : Number(form.price),
        fee: form.fee === "" ? undefined : Number(form.fee),
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error ?? "Could not save");
      return;
    }
    setOk(`Saved · portfolio ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(json.totalValue)}`);
    setForm((f) => ({ ...f, symbol: "", quantity: "", price: "", fee: "", note: "" }));
    start(() => router.refresh());
  }

  const input = "w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500/60";

  return (
    <form onSubmit={submit} className="grid gap-2">
      <div className={`grid gap-2 ${compact ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-7"}`}>
        <label className="col-span-1">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">Date</span>
          <input type="date" className={input} value={form.day} onChange={(e) => set("day", e.target.value)} required />
        </label>
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">Symbol</span>
          <input className={input} placeholder="VOO / CASH" value={form.symbol} onChange={(e) => set("symbol", e.target.value)} required />
        </label>
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">Type</span>
          <select className={input} value={form.kind} onChange={(e) => set("kind", e.target.value)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">Quantity</span>
          <input className={input} inputMode="decimal" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0.00" />
        </label>
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">Price</span>
          <input className={input} inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
        </label>
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">Fee</span>
          <input className={input} inputMode="decimal" value={form.fee} onChange={(e) => set("fee", e.target.value)} placeholder="0.00" />
        </label>
        <label className={compact ? "col-span-2 lg:col-span-4" : ""}>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">Note</span>
          <input className={input} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="optional" />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-md bg-indigo-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
          {pending ? "Saving…" : "Record transaction"}
        </button>
        {error && <span className="text-xs text-rose-400">{error}</span>}
        {ok && <span className="text-xs text-emerald-400">{ok}</span>}
      </div>
    </form>
  );
}
