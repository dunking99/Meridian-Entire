"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TargetEditor({
  buckets,
  targets,
  band,
}: {
  buckets: { label: string; color: string }[];
  targets: Record<string, number>;
  band: number;
}) {
  const router = useRouter();
  const [vals, setVals] = useState<Record<string, number>>(targets);
  const [bandVal, setBandVal] = useState(band);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const total = buckets.reduce((a, b) => a + (vals[b.label] ?? 0), 0);

  async function save() {
    setSaving(true);
    setMsg(null);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "targets", value: vals }),
    });
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "driftBand", value: bandVal }),
    });
    setSaving(false);
    setMsg("Saved");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {buckets.map((b) => (
          <label key={b.label} className="flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/50 px-2.5 py-1.5">
            <span className="flex items-center gap-2 text-xs text-slate-300">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: b.color }} />
              {b.label}
            </span>
            <span className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={vals[b.label] ?? 0}
                onChange={(e) => setVals((v) => ({ ...v, [b.label]: Number(e.target.value) }))}
                className="w-14 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-right text-xs tabular-nums text-slate-200 outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500">%</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Rebalance band
          <input
            type="number"
            min={0.5}
            max={20}
            step={0.5}
            value={bandVal}
            onChange={(e) => setBandVal(Number(e.target.value))}
            className="w-16 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-right text-xs tabular-nums text-slate-200 outline-none focus:border-indigo-500"
          />
          %
        </label>
        <button onClick={save} disabled={saving} className="rounded-md bg-indigo-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
          {saving ? "Saving…" : "Save targets"}
        </button>
        {msg && <span className="text-xs text-emerald-400">{msg}</span>}
        <span className={`text-xs tabular-nums ${Math.abs(total - 100) < 0.01 ? "text-emerald-400" : "text-amber-400"}`}>
          Total {total.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
