import { useMemo, useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Bar, Button, Card, CardHeader, Collapse, Info } from "../components/ui";
import { exposureFindings, runRebuild, type RebuildResult } from "../engine/rebuild";
import { fmtMoney, fmtNum } from "../lib/format";
import { cn } from "../utils/cn";
import { CHART_PALETTE } from "../data/universe";

export function RebuildTab() {
  const { portfolio: p, xray, mandate, setMandate, openHolding } = usePortfolio();
  const [wide, setWide] = useState(true);
  const [result, setResult] = useState<RebuildResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [synced, setSynced] = useState(false);

  const findings = useMemo(() => exposureFindings(p, xray, mandate), [p, xray, mandate]);

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      setResult(runRebuild(p, xray, mandate, wide));
      setBusy(false);
    }, 620);
  };

  return (
    <div className="space-y-4">
      {/* --------------------------------------------------------- notice */}
      <div className="flex items-center gap-2.5 rounded-lg border border-indigo-400/20 bg-indigo-400/[0.05] px-3.5 py-2.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-400/15 text-[10px] text-indigo-300">◈</span>
        <p className="text-[11px] leading-relaxed text-indigo-200/70">
          <span className="font-semibold text-indigo-200">Advisory only.</span> Rebuild assesses every holding and every investable tracked symbol
          against your mandate and proposes the portfolio it would build from cash — including full exits and names you do not own. It never touches
          your actual holdings and never stages an order.
        </p>
      </div>

      {/* -------------------------------------------------------- mandate */}
      <Card>
        <CardHeader
          title="Mandate"
          subtitle="These settings drive the entire assessment — the funnel, the proposed weights and the risk comparison all move when you change them."
          right={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="subtle"
                onClick={() => {
                  setSynced(true);
                  setTimeout(() => setSynced(false), 2200);
                }}
              >
                {synced ? <span className="text-emerald-400">✓ Synced</span> : "⟳ Sync fund composition"}
              </Button>
              <Button size="sm" variant="primary" onClick={run} disabled={busy}>
                {busy ? "Running…" : "Run rebuild"}
              </Button>
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          <Slider label="Risk level" value={mandate.risk} min={1} max={10} step={1} suffix="/10" onChange={(v) => setMandate({ ...mandate, risk: v })} hint="Drives the beta ceiling and the defensive sleeve" />
          <Slider label="Horizon" value={mandate.horizon} min={1} max={30} step={1} suffix=" yr" onChange={(v) => setMandate({ ...mandate, horizon: v })} hint="Short horizons filter out high-volatility names" />
          <Slider label="Max position" value={mandate.maxPosition} min={3} max={25} step={1} suffix="%" onChange={(v) => setMandate({ ...mandate, maxPosition: v })} hint="Hard cap applied to every proposed weight" />
          <Slider label="Quality floor" value={mandate.minQuality} min={0} max={9} step={0.5} suffix="/10" onChange={(v) => setMandate({ ...mandate, minQuality: v })} hint="Diligence gate — most of the universe fails here" />
          <Slider label="Sector cap" value={mandate.maxSectorPct} min={10} max={60} step={1} suffix="%" onChange={(v) => setMandate({ ...mandate, maxSectorPct: v })} hint="Applied to look-through exposure, not headline weights" />
          <Slider label="Income need" value={mandate.incomeNeed} min={0} max={6} step={0.5} suffix="%" onChange={(v) => setMandate({ ...mandate, incomeNeed: v })} hint="Blended yield the portfolio should generate" />
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 border-t border-white/[0.06] pt-3">
          <input type="checkbox" checked={wide} onChange={(e) => setWide(e.target.checked)} className="accent-teal-400" />
          <span className="text-[11px] text-zinc-300">Search the whole tracked universe</span>
          <span className="text-[10px] text-zinc-600">
            {wide ? "On — every investable instrument Meridian tracks is a candidate" : "Off — restricted to what you hold and watch"}
          </span>
        </label>
      </Card>

      {/* ------------------------------------------------------- findings */}
      <Card>
        <CardHeader
          title="Exposure findings"
          subtitle="The teardown. Shown before you run anything, because these are facts about the portfolio rather than opinions about what to do next."
          right={
            <div className="flex gap-1.5">
              <Badge tone="down">{findings.filter((f) => f.severity === "high").length} high</Badge>
              <Badge tone="warn">{findings.filter((f) => f.severity === "medium").length} medium</Badge>
            </div>
          }
        />
        <div className="space-y-2">
          {findings.map((f) => (
            <div
              key={f.id}
              className={cn(
                "flex flex-col gap-2.5 rounded-lg border p-3 sm:flex-row sm:items-start",
                f.severity === "high" ? "border-rose-400/22 bg-rose-400/[0.04]" : f.severity === "medium" ? "border-amber-400/20 bg-amber-400/[0.03]" : "border-white/[0.06] bg-white/[0.012]",
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                  f.severity === "high" ? "bg-rose-400/15 text-rose-300" : f.severity === "medium" ? "bg-amber-400/15 text-amber-300" : "bg-white/[0.06] text-zinc-500",
                )}
              >
                {f.severity === "high" ? "!" : f.severity === "medium" ? "·" : "✓"}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[12px] font-semibold text-zinc-100">{f.title}</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{f.detail}</p>
              </div>
              <div className="shrink-0 text-right sm:w-[110px]">
                <div className={cn("num text-[16px] leading-none font-semibold", f.severity === "high" ? "text-rose-300" : f.severity === "medium" ? "text-amber-300" : "text-zinc-200")}>
                  {f.metric}
                </div>
                <div className="mt-1 text-[9.5px] text-zinc-600">{f.limit}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!result && (
        <Card className="border-dashed">
          <div className="flex flex-col items-center gap-2.5 py-8 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[16px] text-zinc-500">◎</div>
            <h3 className="text-[13px] font-semibold text-zinc-200">No rebuild run yet</h3>
            <p className="max-w-md text-[11px] leading-relaxed text-zinc-500">
              Running a rebuild puts every candidate through a five-stage funnel — universe scan, macro and mandate filter, fundamental diligence,
              news veto, then timing — and reconstructs a portfolio from cash against what survives.
            </p>
            <Button variant="primary" className="mt-1.5" onClick={run} disabled={busy}>
              {busy ? "Running…" : "Run rebuild"}
            </Button>
          </div>
        </Card>
      )}

      {result && (
        <>
          {/* ------------------------------------------------------ verdict */}
          <Card
            className={cn(
              result.verdict.stance === "overhaul" ? "border-rose-400/22" : result.verdict.stance === "tune" ? "border-amber-400/22" : "border-emerald-400/22",
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge tone={result.verdict.stance === "overhaul" ? "down" : result.verdict.stance === "tune" ? "warn" : "up"}>
                    {result.verdict.stance === "overhaul" ? "Material rebuild" : result.verdict.stance === "tune" ? "Re-sizing" : "Broadly aligned"}
                  </Badge>
                  <span className="text-[10px] text-zinc-600">
                    run {new Date(result.ranAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {result.wide ? "whole universe" : "holdings & watchlist"}
                  </span>
                </div>
                <h3 className="mt-2 text-[15px] leading-snug font-semibold tracking-tight text-zinc-50">{result.verdict.headline}</h3>
                <div className="mt-2.5 space-y-2">
                  {result.verdict.body.map((b, i) => (
                    <p key={i} className="text-[11.5px] leading-relaxed text-zinc-400">
                      {b}
                    </p>
                  ))}
                </div>
              </div>
              <div className="grid shrink-0 grid-cols-3 gap-2.5 lg:w-[290px] lg:grid-cols-1">
                <Stat label="Turnover" value={`${result.turnover.toFixed(0)}%`} tone={result.turnover > 45 ? "down" : "warn"} />
                <Stat label="Full exits" value={String(result.trades.filter((t) => t.action === "Exit").length)} tone="neutral" />
                <Stat label="New buys" value={String(result.trades.filter((t) => t.action === "Buy").length)} tone="neutral" />
              </div>
            </div>
          </Card>

          {/* --------------------------------------------------- risk panel */}
          <Card>
            <CardHeader
              title="Risk comparison"
              subtitle="Current portfolio versus the proposed reconstruction, computed on the same 504-day covariance matrix"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Metric", "Current", "Proposed", "Change", "Basis"].map((h, i) => (
                      <th key={h} className={cn("px-3 py-2 text-[9.5px] font-semibold tracking-wider text-zinc-500 uppercase", i === 0 || i === 4 ? "text-left" : "text-right")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.risk.map((r) => {
                    const delta = r.proposed - r.current;
                    const good = r.better === "lower" ? delta < 0 : delta > 0;
                    return (
                      <tr key={r.metric} className="border-b border-white/[0.03] last:border-0">
                        <td className="px-3 py-2.5 text-[11.5px] font-medium text-zinc-200">{r.metric}</td>
                        <td className="num px-3 py-2.5 text-right text-[11.5px] text-zinc-400">
                          {fmtNum(r.current, 2)}
                          {r.unit}
                        </td>
                        <td className="num px-3 py-2.5 text-right text-[11.5px] font-medium text-zinc-100">
                          {fmtNum(r.proposed, 2)}
                          {r.unit}
                        </td>
                        <td className={cn("num px-3 py-2.5 text-right text-[11.5px] font-medium", Math.abs(delta) < 0.01 ? "text-zinc-500" : good ? "text-emerald-400" : "text-rose-400")}>
                          {delta >= 0 ? "+" : "−"}
                          {Math.abs(delta).toFixed(2)}
                          {r.unit}
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-zinc-600">{r.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ------------------------------------------------ full reasoning */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">Full reasoning</span>
              <div className="h-px flex-1 bg-white/[0.07]" />
            </div>

            <Collapse title="Market context" subtitle="The macro frame every finding below is conditioned on" right={<Badge tone="info">{result.macro.regime}</Badge>}>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  { k: "Regime", v: result.macro.regime },
                  { k: "Rates", v: result.macro.rates },
                  { k: "Breadth", v: result.macro.breadth },
                ].map((m) => (
                  <div key={m.k} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5">
                    <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{m.k}</div>
                    <div className="mt-1 text-[11.5px] font-medium text-zinc-200">{m.v}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">{result.macro.note}</p>
            </Collapse>

            <Collapse
              title="Candidate funnel"
              subtitle={`${result.stages[0]?.entered ?? 0} candidates entered · ${result.stages[result.stages.length - 1]?.survived ?? 0} survived all five stages`}
              defaultOpen
            >
              <div className="mb-4 flex items-end gap-1">
                {result.stages.map((s, i) => {
                  const pct = (s.survived / (result.stages[0]?.entered || 1)) * 100;
                  return (
                    <div key={s.key} className="flex-1">
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-[9.5px] text-zinc-500">{s.label}</span>
                        <span className="num text-[10px] font-medium text-zinc-300">{s.survived}</span>
                      </div>
                      <div className="h-8 w-full overflow-hidden rounded-md bg-white/[0.04]">
                        <div
                          className="h-full rounded-md transition-all duration-700"
                          style={{
                            width: "100%",
                            background: `linear-gradient(90deg, ${CHART_PALETTE[i]}22, ${CHART_PALETTE[i]}66)`,
                            opacity: 0.35 + (pct / 100) * 0.65,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-[9px] text-zinc-600">−{s.dropped.length} dropped</div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2.5">
                {result.stages.map((s) => (
                  <div key={s.key} className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-[11.5px] font-semibold text-zinc-100">{s.label}</h4>
                        <p className="mt-0.5 text-[10.5px] leading-relaxed text-zinc-500">{s.description}</p>
                      </div>
                      <span className="num shrink-0 rounded bg-white/[0.05] px-2 py-1 text-[10px] text-zinc-400">
                        {s.entered} → {s.survived}
                      </span>
                    </div>
                    {s.dropped.length > 0 && (
                      <div className="mt-2.5 space-y-1 border-t border-white/[0.05] pt-2.5">
                        {s.dropped.slice(0, 7).map((d) => (
                          <div key={d.symbol} className="flex gap-2.5 text-[10.5px]">
                            <span className="num w-[58px] shrink-0 font-medium text-zinc-400">{d.symbol}</span>
                            <span className="leading-relaxed text-zinc-600">{d.reason}</span>
                          </div>
                        ))}
                        {s.dropped.length > 7 && <div className="pl-[68px] text-[10px] text-zinc-700">+{s.dropped.length - 7} more</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="Reconstruction proposal" subtitle={`${result.proposal.length} lines the engine would build from cash`}>
              <div className="space-y-1.5">
                {result.proposal.map((pl) => (
                  <div key={pl.symbol} className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="num text-[11.5px] font-semibold text-zinc-100">{pl.symbol}</span>
                        <span className="truncate text-[10.5px] text-zinc-500">{pl.name}</span>
                        <Badge tone="ghost">{pl.sector}</Badge>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="num text-[10px] text-zinc-600">{pl.currentWeight.toFixed(1)}% now</span>
                        <span className="text-[10px] text-zinc-700">→</span>
                        <span className="num w-12 text-right text-[12px] font-semibold text-teal-300">{pl.weight.toFixed(1)}%</span>
                        <span className="num w-16 text-right text-[10px] text-zinc-500">{fmtMoney(pl.value, { compact: true })}</span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Bar pct={(pl.weight / mandate.maxPosition) * 100} tone={pl.weight >= mandate.maxPosition - 0.05 ? "amber" : "teal"} height="h-1" />
                      <span className="shrink-0 text-[9.5px] text-zinc-600">{pl.rationale}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>

            <Collapse title="Trade table" subtitle={`${result.trades.length} implied movements · ${result.turnover.toFixed(0)}% turnover`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Action", "Symbol", "From", "To", "Value", "Units", "Reason"].map((h, i) => (
                        <th key={h} className={cn("px-2.5 py-2 text-[9.5px] font-semibold tracking-wider text-zinc-500 uppercase", i <= 1 || i === 6 ? "text-left" : "text-right")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t) => (
                      <tr
                        key={t.symbol}
                        onClick={() => p.positions.find((x) => x.symbol === t.symbol) && openHolding(t.symbol)}
                        className={cn("border-b border-white/[0.03] transition last:border-0", p.positions.find((x) => x.symbol === t.symbol) && "cursor-pointer hover:bg-white/[0.03]")}
                      >
                        <td className="px-2.5 py-2">
                          <Badge tone={t.action === "Buy" || t.action === "Add" ? "up" : t.action === "Exit" ? "down" : t.action === "Trim" ? "warn" : "ghost"}>{t.action}</Badge>
                        </td>
                        <td className="num px-2.5 py-2 text-[11px] font-medium text-zinc-100">{t.symbol}</td>
                        <td className="num px-2.5 py-2 text-right text-[10.5px] text-zinc-500">{t.fromWeight.toFixed(1)}%</td>
                        <td className="num px-2.5 py-2 text-right text-[10.5px] text-zinc-300">{t.toWeight.toFixed(1)}%</td>
                        <td className={cn("num px-2.5 py-2 text-right text-[11px] font-medium", t.delta >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {fmtMoney(t.delta, { dp: 0, sign: true })}
                        </td>
                        <td className="num px-2.5 py-2 text-right text-[10.5px] text-zinc-500">{fmtNum(t.units, 1)}</td>
                        <td className="max-w-[300px] px-2.5 py-2 text-[10px] leading-relaxed text-zinc-600">{t.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Collapse>

            <Collapse
              title={
                <span className="flex items-center gap-2">
                  Data gaps that limited this assessment
                  <Info text="Every conclusion above is only as good as the data behind it. These are the places where the engine was working with less than it wanted." />
                </span>
              }
              subtitle={`${result.gaps.length} known limitations`}
            >
              <div className="space-y-2">
                {result.gaps.map((g, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />
                    <p className="text-[11px] leading-relaxed text-zinc-400">{g}</p>
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "up" | "down" | "warn" | "neutral" }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5">
      <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{label}</div>
      <div
        className={cn(
          "num mt-1 text-[19px] leading-none font-semibold",
          tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-300" : tone === "warn" ? "text-amber-300" : "text-zinc-100",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">{label}</span>
        <span className="num text-[12px] font-semibold text-zinc-100">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-teal-400"
      />
      <div className="mt-1 text-[9.5px] text-zinc-600">{hint}</div>
    </div>
  );
}
