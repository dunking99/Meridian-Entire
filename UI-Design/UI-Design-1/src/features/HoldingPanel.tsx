import { useEffect, useMemo, useState } from "react";
import { usePortfolio, type PanelTab } from "../state/store";
import { Badge, Bar, Button, Field, Info, inputCls, Segmented } from "../components/ui";
import { AreaChart, RangeMeter, Radar, ScoreRing } from "../components/charts";
import { changePct, dailyReturns, range52w, series, seriesDates } from "../data/prices";
import { signalFor } from "../data/signals";
import { newsFor } from "../data/news";
import { FUND_COMPOSITIONS } from "../data/funds";
import { THESES } from "../data/portfolio";
import { correlationsAgainst } from "../engine/analysis";
import { annualisedVol, cagr, maxDrawdown, sharpe } from "../lib/stats";
import { fmtCap, fmtDate, fmtMoney, fmtNum, fmtPct, relTime } from "../lib/format";
import { cn } from "../utils/cn";
import { SECTOR_COLORS } from "../data/universe";

const RANGES = [
  { value: "1M", days: 21 },
  { value: "3M", days: 63 },
  { value: "6M", days: 126 },
  { value: "1Y", days: 252 },
  { value: "MAX", days: 99999 },
];

const TABS: { key: PanelTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "holding", label: "Holding" },
  { key: "updates", label: "Updates" },
  { key: "notes", label: "Notes" },
];

export function HoldingPanel() {
  const { selected, closePanel, panelTab, setPanelTab, portfolio: p, notes, addNote, setTarget } = usePortfolio();
  const pos = p.positions.find((x) => x.symbol === selected);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && closePanel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [closePanel]);

  if (!selected || !pos) return null;
  const sig = signalFor(pos.symbol);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={closePanel} />
      <aside className="anim-sheet relative flex h-full w-full max-w-[620px] flex-col border-l border-white/[0.08] bg-[#0a0c10] shadow-2xl">
        {/* header */}
        <div className="shrink-0 border-b border-white/[0.07] px-5 pt-4 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ background: `${SECTOR_COLORS[pos.asset.sector] ?? "#64748b"}20`, color: SECTOR_COLORS[pos.asset.sector] ?? "#94a3b8" }}
              >
                {pos.symbol.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="num text-[16px] leading-none font-semibold tracking-tight text-zinc-50">{pos.symbol}</h2>
                  <Badge tone="ghost">{pos.asset.type}</Badge>
                  <Badge tone="ghost">{pos.wrapper}</Badge>
                  {pos.thin && <Badge tone="warn">thin history</Badge>}
                </div>
                <p className="mt-1 truncate text-[11.5px] text-zinc-500">
                  {pos.name} · {pos.asset.exchange} · {pos.asset.currency}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-3">
              <div className="text-right">
                <div className="num text-[16px] leading-none font-semibold text-zinc-50">{fmtMoney(pos.price)}</div>
                <div className={cn("num mt-1 text-[11px]", pos.dayMovePct >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(pos.dayMovePct, 2, true)}</div>
              </div>
              <button onClick={closePanel} className="rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200">
                ✕
              </button>
            </div>
          </div>
          <div className="mt-3.5 flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setPanelTab(t.key)}
                className={cn(
                  "relative px-3 py-2 text-[11.5px] font-medium transition",
                  panelTab === t.key ? "text-zinc-50" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {t.label}
                {t.key === "updates" && newsFor(pos.symbol).length > 0 && (
                  <span className="ml-1.5 rounded bg-white/[0.08] px-1 text-[9px] text-zinc-400">{newsFor(pos.symbol).length}</span>
                )}
                {t.key === "notes" && notes.filter((n) => n.symbol === pos.symbol).length > 0 && (
                  <span className="ml-1.5 rounded bg-white/[0.08] px-1 text-[9px] text-zinc-400">{notes.filter((n) => n.symbol === pos.symbol).length}</span>
                )}
                {panelTab === t.key && <span className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-teal-400 to-emerald-400" />}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {panelTab === "overview" && <Overview pos={pos} sig={sig} />}
          {panelTab === "holding" && <HoldingDetail pos={pos} onTarget={setTarget} />}
          {panelTab === "updates" && <Updates symbol={pos.symbol} />}
          {panelTab === "notes" && <Notes symbol={pos.symbol} name={pos.name} notes={notes.filter((n) => n.symbol === pos.symbol)} addNote={addNote} />}
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------- Overview */
function Overview({ pos, sig }: { pos: ReturnType<typeof usePortfolio>["portfolio"]["positions"][number]; sig: ReturnType<typeof signalFor> }) {
  const { portfolio: p, openHolding } = usePortfolio();
  const [range, setRange] = useState("1Y");
  const days = RANGES.find((r) => r.value === range)!.days;
  const full = series(pos.symbol);
  const dates = seriesDates(pos.symbol);
  const n = Math.min(days, full.length);
  const r52 = range52w(pos.symbol);
  const comp = FUND_COMPOSITIONS[pos.symbol];
  const corr = useMemo(() => correlationsAgainst(p, pos.symbol), [p, pos.symbol]);
  const rangeChange = n > 1 ? (full[full.length - 1] / full[full.length - n] - 1) * 100 : 0;

  return (
    <div className="space-y-4">
      <Section
        title="Price"
        right={<Segmented size="xs" options={RANGES.map((r) => ({ value: r.value, label: r.value }))} value={range} onChange={setRange} />}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className={cn("num text-[13px] font-semibold", rangeChange >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(rangeChange, 2, true)}</span>
          <span className="text-[10px] text-zinc-600">over {range === "MAX" ? `${full.length} stored bars` : range}</span>
        </div>
        <AreaChart
          dates={dates.slice(-n)}
          series={[{ values: full.slice(-n), color: rangeChange >= 0 ? "#34d399" : "#fb7185", label: pos.symbol }]}
          height={168}
          format={(v) => fmtMoney(v, { dp: v > 100 ? 0 : 2 })}
        />
      </Section>

      <Section title="52-week range">
        <RangeMeter low={r52.low} high={r52.high} last={r52.last} label={`${r52.pct.toFixed(0)}% of range`} />
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {[
            { k: "1M", v: changePct(pos.symbol, 21) },
            { k: "3M", v: changePct(pos.symbol, 63) },
            { k: "6M", v: changePct(pos.symbol, 126) },
            { k: "1Y", v: changePct(pos.symbol, 252) },
          ].map((x) => (
            <div key={x.k} className="rounded-md border border-white/[0.06] bg-white/[0.015] px-2 py-1.5 text-center">
              <div className="text-[9px] text-zinc-600">{x.k}</div>
              <div className={cn("num mt-0.5 text-[11px] font-medium", x.v >= 0 ? "text-emerald-400" : "text-rose-400")}>{fmtPct(x.v, 1, true)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Conviction" right={<Badge tone={sig.conviction >= 7.5 ? "up" : sig.conviction >= 6 ? "neutral" : "warn"}>{sig.conviction >= 7.5 ? "High" : sig.conviction >= 6 ? "Moderate" : "Low"}</Badge>}>
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <ScoreRing score={sig.conviction} label="conviction" size={78} />
            <span className="text-[9px] text-zinc-600">screener {sig.screener}</span>
          </div>
          <Radar axes={Object.entries(sig.axes).map(([axis, score]) => ({ axis, score }))} size={186} color="#818cf8" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {Object.entries(sig.axes).map(([axis, score]) => (
            <div key={axis} className="rounded-md border border-white/[0.05] bg-white/[0.012] px-2 py-1.5">
              <div className="truncate text-[9px] text-zinc-600">{axis}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <Bar pct={score * 10} tone={score >= 7 ? "teal" : score >= 5 ? "sky" : "amber"} height="h-1" />
                <span className="num text-[10px] font-medium text-zinc-300">{score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {comp && (
        <Section title="Fund composition" right={<Badge tone="info">{comp.holdingsCount} holdings</Badge>}>
          <div className="mb-2 flex items-center justify-between text-[10px] text-zinc-600">
            <span>Top {comp.lines.length} disclosed · {comp.disclosed.toFixed(1)}% of the fund</span>
            <span className="num">as of {fmtDate(comp.asOf)}</span>
          </div>
          <div className="space-y-1">
            {comp.lines.slice(0, 10).map((l) => (
              <div key={l.symbol} className="group relative overflow-hidden rounded-md px-2 py-1">
                <div
                  className="absolute inset-y-0 left-0 rounded-md opacity-[0.14]"
                  style={{ width: `${(l.weight / comp.lines[0].weight) * 100}%`, background: SECTOR_COLORS[l.sector] ?? "#64748b" }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="num w-[52px] shrink-0 text-[10.5px] font-medium text-zinc-200">{l.symbol}</span>
                    <span className="truncate text-[10.5px] text-zinc-500">{l.name}</span>
                  </span>
                  <span className="num shrink-0 text-[10.5px] text-zinc-300">{l.weight.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {corr.length > 0 && (
        <Section title="Correlation with your other holdings" right={<Badge tone="ghost">504-day window</Badge>}>
          <div className="space-y-1">
            {[...corr.slice(0, 4), ...corr.slice(-3)].map((c, i, arr) => (
              <div key={c.symbol}>
                {i === 4 && <div className="my-1.5 border-t border-dashed border-white/[0.07]" />}
                <button onClick={() => openHolding(c.symbol)} className="flex w-full items-center gap-2.5 rounded px-1.5 py-1 hover:bg-white/[0.04]">
                  <span className="num w-[54px] shrink-0 text-left text-[10.5px] font-medium text-zinc-200">{c.symbol}</span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-white/15" />
                    <div
                      className={cn("absolute top-0 h-full rounded-full", c.r >= 0 ? "bg-rose-400/70" : "bg-emerald-400/70")}
                      style={c.r >= 0 ? { left: "50%", width: `${c.r * 50}%` } : { right: "50%", width: `${Math.abs(c.r) * 50}%` }}
                    />
                  </div>
                  <span className={cn("num w-10 shrink-0 text-right text-[10.5px] font-medium", c.r >= 0.6 ? "text-rose-400" : c.r < 0.2 ? "text-emerald-400" : "text-zinc-400")}>
                    {c.r.toFixed(2)}
                  </span>
                  <span className="num w-9 shrink-0 text-right text-[9.5px] text-zinc-600">{c.weight.toFixed(1)}%</span>
                </button>
                {i === arr.length - 1 && <div className="mt-1.5 text-[9.5px] text-zinc-600">Top four most correlated above the line, three least below.</div>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Bull / bear tally" right={<span className="text-[10px] text-zinc-600">{sig.bull.length} vs {sig.bear.length}</span>}>
        <div className="mb-2.5 flex h-1.5 overflow-hidden rounded-full">
          <div className="bg-emerald-400/70" style={{ width: `${(sig.bull.length / (sig.bull.length + sig.bear.length)) * 100}%` }} />
          <div className="flex-1 bg-rose-400/70" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[9.5px] font-semibold tracking-wider text-emerald-400/70 uppercase">Bull case</div>
            <ul className="space-y-1.5">
              {sig.bull.map((b, i) => (
                <li key={i} className="flex gap-2 text-[10.5px] leading-relaxed text-zinc-400">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-emerald-400/70" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1.5 text-[9.5px] font-semibold tracking-wider text-rose-400/70 uppercase">Bear case</div>
            <ul className="space-y-1.5">
              {sig.bear.map((b, i) => (
                <li key={i} className="flex gap-2 text-[10.5px] leading-relaxed text-zinc-400">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-rose-400/70" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        title={
          <span className="flex items-center gap-1.5">
            Precedent study
            <Info text="Historic setups in this instrument matched on momentum decile, valuation percentile and revision breadth, then measured forward. Small samples — read as context, not probability." />
          </span>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          <PrecStat label="Setups" value={String(sig.precedent.setups)} sub={sig.precedent.window} />
          <PrecStat label="Resolved higher" value={`${sig.precedent.higher}%`} sub="of matched cases" tone={sig.precedent.higher > 55 ? "up" : sig.precedent.higher < 45 ? "down" : "neutral"} />
          <PrecStat label="Median move" value={fmtPct(sig.precedent.medianMove, 1, true)} sub="forward" tone={sig.precedent.medianMove > 0 ? "up" : "down"} />
          <PrecStat label="Median time" value={`${sig.precedent.medianDays}d`} sub="to resolve" />
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">{sig.precedent.note}</p>
      </Section>
    </div>
  );
}

/* --------------------------------------------------------- Holding tab */
function HoldingDetail({
  pos,
  onTarget,
}: {
  pos: ReturnType<typeof usePortfolio>["portfolio"]["positions"][number];
  onTarget: (s: string, pct: number) => void;
}) {
  const s = series(pos.symbol);
  const rets = dailyReturns(pos.symbol);
  const measurable = s.length >= 250;
  const years = s.length / 252;
  const thesis = THESES[pos.symbol];
  const [target, setTargetLocal] = useState(String(pos.targetPct ?? ""));

  const grid = [
    { k: "Units", v: fmtNum(pos.qty, pos.qty % 1 === 0 ? 0 : 3) },
    { k: "Average price", v: fmtMoney(pos.avgPrice) },
    { k: "Current price", v: fmtMoney(pos.price) },
    { k: "Market value", v: fmtMoney(pos.value, { dp: 0 }) },
    { k: "Book cost", v: fmtMoney(pos.cost, { dp: 0 }) },
    { k: "Profit / loss", v: fmtMoney(pos.pl, { dp: 0, sign: true }), tone: pos.pl >= 0 ? "up" : "down" },
    { k: "Return", v: fmtPct(pos.plPct, 2, true), tone: pos.plPct >= 0 ? "up" : "down" },
    { k: "Weight", v: `${pos.weight.toFixed(2)}%` },
  ];

  const live = [
    { k: "Market cap", v: pos.asset.mcap ? fmtCap(pos.asset.mcap) : "—" },
    { k: "Beta", v: pos.asset.beta.toFixed(2) },
    { k: "Expense ratio", v: pos.asset.expense != null ? `${pos.asset.expense.toFixed(2)}%` : "—" },
    { k: "Trailing yield", v: pos.asset.yieldPct != null ? `${pos.asset.yieldPct.toFixed(2)}%` : "—" },
    { k: "Stored bars", v: String(pos.bars), warn: pos.thin },
    { k: "Opened", v: fmtDate(pos.openedOn) },
  ];

  const delivery = measurable
    ? [
        { k: "CAGR", v: fmtPct(cagr(s, years), 2, true), tone: cagr(s, years) >= 0 ? "up" : "down" },
        { k: "Volatility", v: `${annualisedVol(rets).toFixed(1)}%` },
        { k: "Sharpe", v: sharpe(rets).toFixed(2), tone: sharpe(rets) > 0.5 ? "up" : sharpe(rets) < 0 ? "down" : undefined },
        { k: "Max drawdown", v: `${maxDrawdown(s).toFixed(1)}%`, tone: "down" as const },
      ]
    : [];

  return (
    <div className="space-y-4">
      <Section title="Position">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.06] sm:grid-cols-4">
          {grid.map((g) => (
            <div key={g.k} className="bg-[#0c0f14] p-2.5">
              <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{g.k}</div>
              <div className={cn("num mt-1 text-[12.5px] font-medium", g.tone === "up" ? "text-emerald-400" : g.tone === "down" ? "text-rose-400" : "text-zinc-100")}>{g.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-wider text-zinc-500 uppercase">Target weight</div>
            <div className="mt-1 flex items-center gap-2">
              <Bar pct={pos.targetPct ? (pos.weight / pos.targetPct) * 100 : 0} tone={pos.targetPct && pos.weight > pos.targetPct ? "amber" : "teal"} height="h-1.5" />
              <span className="num shrink-0 text-[10px] text-zinc-500">
                {pos.weight.toFixed(1)}% / {pos.targetPct ?? "—"}%
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <input className={cn(inputCls, "num w-16 text-center")} value={target} placeholder="—" onChange={(e) => setTargetLocal(e.target.value.replace(/[^0-9.]/g, ""))} />
            <Button size="sm" variant="subtle" onClick={() => onTarget(pos.symbol, parseFloat(target) || 0)}>
              Set
            </Button>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-zinc-600">
          Held in {pos.account} · {pos.wrapper} wrapper · opened {fmtDate(pos.openedOn, "long")}
        </div>
      </Section>

      <Section title="Key stats" right={<Badge tone="ghost">live feed</Badge>}>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.06] sm:grid-cols-3">
          {live.map((g) => (
            <div key={g.k} className="bg-[#0c0f14] p-2.5">
              <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{g.k}</div>
              <div className={cn("num mt-1 text-[12.5px] font-medium", g.warn ? "text-amber-400" : "text-zinc-100")}>{g.v}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Long-run delivery"
        right={<Badge tone={measurable ? "ghost" : "warn"}>{measurable ? `${(series(pos.symbol).length / 252).toFixed(1)} years stored` : "not measurable"}</Badge>}
      >
        {measurable ? (
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.06] sm:grid-cols-4">
            {delivery.map((g) => (
              <div key={g.k} className="bg-[#0c0f14] p-2.5">
                <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{g.k}</div>
                <div className={cn("num mt-1 text-[12.5px] font-medium", g.tone === "up" ? "text-emerald-400" : g.tone === "down" ? "text-rose-400" : "text-zinc-100")}>{g.v}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.04] p-3">
            <p className="text-[11px] leading-relaxed text-amber-200/70">
              Only {pos.bars} daily bars are stored for {pos.symbol}. CAGR, Sharpe, volatility and maximum drawdown need at least 250 to mean
              anything, so they are deliberately not shown rather than shown unreliably.
            </p>
          </div>
        )}
      </Section>

      <Section title="Saved thesis" right={thesis ? <Badge tone="info">conviction {thesis.conviction.toFixed(1)}</Badge> : <Badge tone="ghost">none saved</Badge>}>
        {thesis ? (
          <div className="rounded-lg border border-white/[0.07] bg-gradient-to-br from-white/[0.03] to-transparent p-3.5">
            <p className="text-[11.5px] leading-relaxed text-zinc-300">{thesis.text}</p>
            <div className="mt-2.5 border-t border-white/[0.06] pt-2 text-[10px] text-zinc-600">Last updated {fmtDate(thesis.updated, "long")}</div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/[0.1] p-4 text-center">
            <p className="text-[11px] text-zinc-500">
              No thesis saved for this holding. A position without a written reason to own it is a position without an exit condition.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------- Updates tab */
function Updates({ symbol }: { symbol: string }) {
  const items = newsFor(symbol);
  if (!items.length)
    return (
      <div className="rounded-xl border border-dashed border-white/[0.1] p-8 text-center">
        <p className="text-[11.5px] text-zinc-500">No stories tagged to {symbol} in the current window.</p>
      </div>
    );
  return (
    <div className="space-y-2.5">
      <p className="text-[10.5px] text-zinc-600">{items.length} stories tagged to {symbol}, newest first. Cross-referenced automatically from the news feed.</p>
      {items.map((n) => (
        <div key={n.id} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5 transition hover:border-white/[0.14]">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={n.sentiment === "positive" ? "up" : n.sentiment === "negative" ? "down" : "neutral"}>{n.sentiment}</Badge>
            <Badge tone={n.impact === "high" ? "warn" : "ghost"}>{n.impact} impact</Badge>
            <span className="text-[10px] text-zinc-600">{n.source}</span>
            <span className="text-[10px] text-zinc-700">·</span>
            <span className="text-[10px] text-zinc-600">{relTime(new Date(Date.now() - n.ago * 3600_000).toISOString())}</span>
          </div>
          <h4 className="text-[12.5px] leading-snug font-semibold text-zinc-100">{n.headline}</h4>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{n.summary}</p>
          {n.veto && (
            <div className="mt-2.5 flex gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] p-2">
              <span className="text-[10px] text-rose-300">⊘</span>
              <p className="text-[10px] leading-relaxed text-rose-200/70">
                <span className="font-semibold">Carries a rebuild veto.</span> {n.veto}
              </p>
            </div>
          )}
          {n.symbols.length > 1 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.05] pt-2">
              <span className="text-[9.5px] text-zinc-600">also tagged</span>
              {n.symbols.filter((s) => s !== symbol).map((s) => (
                <span key={s} className="num rounded bg-white/[0.05] px-1.5 py-0.5 text-[9.5px] text-zinc-400">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ Notes tab */
function Notes({
  symbol,
  name,
  notes,
  addNote,
}: {
  symbol: string;
  name: string;
  notes: ReturnType<typeof usePortfolio>["notes"];
  addNote: ReturnType<typeof usePortfolio>["addNote"];
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<"Thesis" | "Risk" | "Catalyst" | "Review">("Review");

  const submit = () => {
    if (!title.trim() && !body.trim()) return;
    addNote({ symbol, date: new Date().toISOString().slice(0, 10), title: title.trim() || "Untitled note", body: body.trim(), tag });
    setTitle("");
    setBody("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-200">Add a note on {name}</span>
          <Segmented
            size="xs"
            options={[
              { value: "Thesis", label: "Thesis" },
              { value: "Risk", label: "Risk" },
              { value: "Catalyst", label: "Catalyst" },
              { value: "Review", label: "Review" },
            ]}
            value={tag}
            onChange={(v) => setTag(v as typeof tag)}
          />
        </div>
        <div className="space-y-2.5">
          <Field label="Title">
            <input className={inputCls} placeholder="e.g. Position sizing rule" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Note">
            <textarea
              className={cn(inputCls, "h-24 resize-none leading-relaxed")}
              placeholder="What changed, what you concluded, and what would make you change your mind."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <Button variant="primary" size="sm" onClick={submit} disabled={!title.trim() && !body.trim()}>
            Save note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.1] p-8 text-center">
          <p className="text-[11.5px] text-zinc-500">No notes on {symbol} yet.</p>
        </div>
      ) : (
        <div className="relative space-y-3 pl-4">
          <div className="absolute top-2 bottom-2 left-[5px] w-px bg-white/[0.07]" />
          {notes
            .slice()
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
            .map((n) => (
              <div key={n.id} className="relative">
                <span
                  className={cn(
                    "absolute top-[7px] -left-[15px] h-[9px] w-[9px] rounded-full border-2 border-[#0a0c10]",
                    n.tag === "Risk" ? "bg-rose-400" : n.tag === "Thesis" ? "bg-teal-400" : n.tag === "Catalyst" ? "bg-amber-400" : "bg-sky-400",
                  )}
                />
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3.5">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={n.tag === "Risk" ? "down" : n.tag === "Thesis" ? "up" : n.tag === "Catalyst" ? "warn" : "info"}>{n.tag}</Badge>
                    <span className="num text-[10px] text-zinc-600">{fmtDate(n.date, "long")}</span>
                  </div>
                  <h4 className="text-[12px] font-semibold text-zinc-100">{n.title}</h4>
                  {n.body && <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">{n.body}</p>}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- helpers */
function Section({ title, children, right }: { title: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function PrecStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "up" | "down" | "neutral" }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5 text-center">
      <div className="text-[9px] tracking-wider text-zinc-600 uppercase">{label}</div>
      <div className={cn("num mt-1 text-[14px] font-semibold", tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-zinc-100")}>{value}</div>
      <div className="mt-0.5 text-[9px] text-zinc-600">{sub}</div>
    </div>
  );
}
