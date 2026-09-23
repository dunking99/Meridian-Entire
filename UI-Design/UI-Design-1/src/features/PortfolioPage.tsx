import { useState } from "react";
import { usePortfolio, type TabKey } from "../state/store";
import { HoldingsTab } from "./HoldingsTab";
import { XRayTab } from "./XRayTab";
import { PerformanceTab } from "./PerformanceTab";
import { AnalysisTab } from "./AnalysisTab";
import { AllocateTab } from "./AllocateTab";
import { RebuildTab } from "./RebuildTab";
import { HoldingPanel } from "./HoldingPanel";
import { AddPositionModal } from "./AddPositionModal";
import { fmtMoney, fmtPct } from "../lib/format";
import { cn } from "../utils/cn";
import { Sparkline } from "../components/charts";

const TABS: { key: TabKey; label: string; hint: string }[] = [
  { key: "holdings", label: "Holdings", hint: "Positions, breakdowns and concentration" },
  { key: "xray", label: "X-Ray", hint: "What you own once every fund is opened up" },
  { key: "performance", label: "Performance", hint: "Money- vs time-weighted, attribution" },
  { key: "analysis", label: "Analysis", hint: "Scorecard and correlation" },
  { key: "allocate", label: "Allocate", hint: "Where new cash should go" },
  { key: "rebuild", label: "Rebuild", hint: "Advisory from-scratch reconstruction" },
];

export function PortfolioPage() {
  const { tab, setTab, portfolio: p, flags, xray } = usePortfolio();
  const [addOpen, setAddOpen] = useState(false);
  const spark = p.series.values.slice(-90);
  const attention = flags.filter((f) => f.status !== "ok").length;

  return (
    <div className="grid-noise min-h-screen">
      {/* -------------------------------------------------------- header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#060709]/88 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[19px] leading-none font-semibold tracking-tight text-zinc-50">Portfolio</h1>
                <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9.5px] tracking-wider text-zinc-500 uppercase">
                  personal
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-500">
                {p.positions.length} positions across {new Set(p.positions.map((x) => x.account)).size} accounts ·{" "}
                <span className="text-zinc-400">{xray.ownedCount} underlying companies</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 sm:flex">
              <Sparkline values={spark} color={p.dayChange >= 0 ? "#34d399" : "#fb7185"} width={58} height={20} />
              <div className="text-right">
                <div className="num text-[15px] leading-none font-semibold text-zinc-50">{fmtMoney(p.totalValue, { dp: 0 })}</div>
                <div className={cn("num mt-1 text-[10px]", p.dayChange >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {fmtMoney(p.dayChange, { dp: 0, sign: true })} ({fmtPct(p.dayChangePct, 2, true)}) today
                </div>
              </div>
            </div>
            {attention > 0 && (
              <button
                onClick={() => setTab("holdings")}
                className="flex items-center gap-1.5 rounded-lg border border-amber-400/22 bg-amber-400/[0.07] px-2.5 py-1.5 text-[10.5px] text-amber-200 transition hover:border-amber-400/40"
              >
                <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-amber-400" />
                {attention} concentration flag{attention > 1 ? "s" : ""}
              </button>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10.5px] text-zinc-400">Markets open</span>
            </div>
          </div>
        </div>

        {/* tabs */}
        <nav className="flex gap-0.5 overflow-x-auto px-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              title={t.hint}
              className={cn(
                "relative shrink-0 px-3.5 py-2.5 text-[12.5px] font-medium whitespace-nowrap transition",
                tab === t.key ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {t.label}
              {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-teal-400 to-emerald-400" />}
            </button>
          ))}
        </nav>
      </header>

      {/* --------------------------------------------------------- content */}
      <div key={tab} className="anim-in mx-auto max-w-[1560px] px-5 py-4 pb-16">
        {tab === "holdings" && <HoldingsTab onAdd={() => setAddOpen(true)} />}
        {tab === "xray" && <XRayTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "analysis" && <AnalysisTab />}
        {tab === "allocate" && <AllocateTab />}
        {tab === "rebuild" && <RebuildTab />}
      </div>

      <HoldingPanel />
      <AddPositionModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
