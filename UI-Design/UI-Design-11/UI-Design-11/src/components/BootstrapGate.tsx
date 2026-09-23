"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BootstrapGate({ ready }: { ready: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "running" | "done">(ready ? "done" : "idle");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (ready || phase !== "idle") return;
    let cancelled = false;
    setPhase("running");
    setLog(["Ensuring instrument universe…", "Fetching price history (Yahoo Finance)…", "Seeding the demo ledger…"]);
    fetch("/api/bootstrap", { method: "POST" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setLog((l) => [
          ...l,
          `${j.instruments} instruments · ${j.symbolsSynced} symbols · ${j.priceRows.toLocaleString()} price rows · ${j.ledgerRows} ledger rows`,
          j.synthetic ? "Network unavailable — offline price model used." : "Live data ingested.",
        ]);
        setPhase("done");
        setTimeout(() => router.refresh(), 400);
      })
      .catch(() => {
        if (!cancelled) setPhase("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, phase, router]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#070b14]/95 backdrop-blur">
      <div className="w-[420px] rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-400">Meridian</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">Initialising the archive</h2>
        <p className="mt-1 text-xs text-slate-500">First run only — building the local price history the rest of the terminal reads from.</p>
        <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
          {log.map((l, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-indigo-400">›</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
        {phase === "running" && <div className="mt-5 h-1 overflow-hidden rounded bg-slate-800"><div className="h-full w-1/3 animate-pulse rounded bg-indigo-500" /></div>}
      </div>
    </div>
  );
}
