"use client";

import Link from "next/link";
import { useState } from "react";

type EnrichResponse = {
  matches: {
    symbol: string;
    name: string;
    score: number;
    basis: string;
    matchedText: string;
    weight: number;
    marketValue: number;
    sector: string | null;
    price: number;
    changePct: number;
  }[];
  totalExposure: number;
  totalWeight: number;
  nav: number;
};

export function EnrichPanel() {
  const [text, setText] = useState("");
  const [headline, setHeadline] = useState("");
  const [result, setResult] = useState<EnrichResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim() && !headline.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, headline }),
      });
      if (res.ok) setResult((await res.json()) as EnrichResponse);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50">
      <header className="border-b border-slate-800/80 px-4 py-3">
        <h2 className="text-[13px] font-semibold tracking-wide text-slate-200 uppercase">Relevance engine</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Paste any headline, filing text, transcript or note. It returns the instruments referenced and what they are worth in the book.
        </p>
      </header>
      <div className="space-y-2 p-4">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline (weighted higher than body)"
          className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Body text…"
          className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600"
        />
        <button
          onClick={run}
          disabled={loading}
          className="w-full rounded bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500 disabled:opacity-60"
        >
          {loading ? "Matching…" : "Match against the book"}
        </button>

        {result && (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded border border-slate-800 px-2 py-1.5">
                <div className="text-slate-500">Exposure referenced</div>
                <div className="tabular-nums text-slate-100">
                  ${result.totalExposure.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="rounded border border-slate-800 px-2 py-1.5">
                <div className="text-slate-500">% of NAV</div>
                <div className="tabular-nums text-cyan-300">{result.totalWeight.toFixed(2)}%</div>
              </div>
            </div>
            {result.matches.length === 0 && <p className="text-[11px] text-slate-500">No tracked instrument matched.</p>}
            <ul className="space-y-1">
              {result.matches.slice(0, 10).map((m) => (
                <li key={m.symbol} className="flex items-center justify-between gap-2 text-[11px]">
                  <Link href={`/markets/${encodeURIComponent(m.symbol)}`} className="text-slate-200 hover:text-cyan-300">
                    {m.symbol}
                    <span className="ml-1 text-slate-600">{m.basis}</span>
                  </Link>
                  <span className="tabular-nums text-slate-500">
                    score {m.score} {m.weight > 0 ? `· held ${m.weight.toFixed(1)}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
