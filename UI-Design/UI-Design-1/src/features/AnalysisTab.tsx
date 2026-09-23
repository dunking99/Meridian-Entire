import { useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Card, CardHeader, Info, Segmented } from "../components/ui";
import { Donut, Radar, ScoreRing } from "../components/charts";
import { CHART_PALETTE, SECTOR_COLORS } from "../data/universe";
import { fmtMoney } from "../lib/format";
import { cn } from "../utils/cn";
import type { Axis } from "../data/signals";

export function AnalysisTab() {
  const { portfolio: p, breakdowns, scorecard, correlations, openHolding } = usePortfolio();
  const [includeCash, setIncludeCash] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [axis, setAxis] = useState<Axis>("Quality");

  const comp = [
    ...p.positions.map((x) => ({ key: x.symbol, value: x.value, pct: (x.value / p.totalValue) * 100 })),
    ...(includeCash ? [{ key: "Cash", value: p.cash, pct: (p.cash / p.totalValue) * 100 }] : []),
  ];
  const compTotal = comp.reduce((a, c) => a + c.value, 0);
  const normalised = comp.map((c) => ({ ...c, pct: (c.value / compTotal) * 100 }));
  const active = normalised.find((c) => c.key === hover);
  const detail = scorecard.detail.find((d) => d.axis === axis)!;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.25fr_1fr]">
        {/* ------------------------------------------------- composition */}
        <Card>
          <CardHeader
            title="Composition"
            subtitle="Every line plus uninvested cash, as a share of total portfolio value"
            right={
              <Segmented
                size="xs"
                options={[
                  { value: "with", label: "With cash" },
                  { value: "without", label: "Invested only" },
                ]}
                value={includeCash ? "with" : "without"}
                onChange={(v) => setIncludeCash(v === "with")}
              />
            }
          />
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <Donut
              data={normalised.map((c, i) => ({
                ...c,
                color: c.key === "Cash" ? "#3f4653" : (SECTOR_COLORS[p.positions.find((x) => x.symbol === c.key)?.asset.sector ?? ""] ?? CHART_PALETTE[i % CHART_PALETTE.length]),
              }))}
              size={214}
              thickness={30}
              palette={CHART_PALETTE}
              activeKey={hover}
              onHover={setHover}
              center={
                <>
                  <span className="num text-[22px] leading-none font-semibold text-zinc-50">
                    {active ? `${active.pct.toFixed(1)}%` : fmtMoney(compTotal, { compact: true })}
                  </span>
                  <span className="mt-1 max-w-[100px] text-[9.5px] leading-tight text-zinc-500">
                    {active ? active.key : `${normalised.length} components`}
                  </span>
                </>
              }
            />
            <div className="grid max-h-[230px] min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-px overflow-y-auto sm:grid-cols-2">
              {normalised
                .slice()
                .sort((a, b) => b.pct - a.pct)
                .map((c, i) => (
                  <button
                    key={c.key}
                    onMouseEnter={() => setHover(c.key)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => c.key !== "Cash" && openHolding(c.key)}
                    className={cn("flex items-center justify-between rounded px-1.5 py-[3px] text-[11px] transition", hover === c.key && "bg-white/[0.05]")}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-zinc-300">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background:
                            c.key === "Cash"
                              ? "#3f4653"
                              : (SECTOR_COLORS[p.positions.find((x) => x.symbol === c.key)?.asset.sector ?? ""] ?? CHART_PALETTE[i % CHART_PALETTE.length]),
                        }}
                      />
                      <span className="num truncate">{c.key}</span>
                    </span>
                    <span className="num shrink-0 text-zinc-400">{c.pct.toFixed(1)}%</span>
                  </button>
                ))}
            </div>
          </div>
        </Card>

        {/* -------------------------------------------- portfolio type box */}
        <Card>
          <CardHeader title="Portfolio type" subtitle="What the shape of the book says about how it is actually run" />
          <div className="space-y-2">
            {breakdowns.type.map((t, i) => (
              <div key={t.key} className="flex items-center gap-3">
                <span className="w-[74px] shrink-0 text-[11px] text-zinc-400">{t.key}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
                  <div
                    className="flex h-full items-center justify-end rounded-md pr-1.5 transition-all duration-700"
                    style={{ width: `${Math.max(t.pct, 5)}%`, background: `linear-gradient(90deg, ${CHART_PALETTE[i % CHART_PALETTE.length]}33, ${CHART_PALETTE[i % CHART_PALETTE.length]}88)` }}
                  >
                    <span className="num text-[9.5px] font-medium text-zinc-100">{t.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <span className="num w-14 shrink-0 text-right text-[10px] text-zinc-600">{fmtMoney(t.value, { compact: true })}</span>
              </div>
            ))}
          </div>
          <div className="mt-3.5 space-y-2 border-t border-white/[0.06] pt-3">
            <TypeVerdict p={p} />
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------ scorecard */}
      <Card>
        <CardHeader
          title="Scorecard"
          subtitle="Each axis is the value-weighted average across every holding. Per-axis detail shows which lines are lifting or dragging it, weighted by actual pull rather than raw score."
          right={<Badge tone={scorecard.overall >= 6.5 ? "up" : scorecard.overall >= 5.5 ? "neutral" : "warn"}>{scorecard.grade}</Badge>}
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[268px_1fr]">
          <div className="flex flex-col items-center gap-3">
            <Radar axes={scorecard.axes} size={218} />
            <div className="flex items-center gap-3">
              <ScoreRing score={scorecard.overall} label="overall" size={72} />
              <div className="text-[10.5px] leading-relaxed text-zinc-500">
                Weighted across
                <br />
                {p.positions.length} holdings
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {scorecard.axes.map((a) => (
                <button
                  key={a.axis}
                  onClick={() => setAxis(a.axis)}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left transition",
                    axis === a.axis ? "border-teal-400/35 bg-teal-400/[0.07]" : "border-white/[0.06] bg-white/[0.015] hover:border-white/15",
                  )}
                >
                  <div className="text-[10px] text-zinc-500">{a.axis}</div>
                  <div className="mt-0.5 flex items-end gap-1.5">
                    <span className={cn("num text-[16px] leading-none font-semibold", a.score >= 7 ? "text-emerald-400" : a.score >= 5.5 ? "text-zinc-100" : "text-amber-400")}>
                      {a.score.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-zinc-600">/10</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-zinc-100">
                  {detail.axis} · {detail.score.toFixed(2)}
                </span>
                <Info text="Pull = position weight × (holding score − portfolio score on this axis). A high-scoring 1% position barely moves the number; a mediocre 20% position moves it a lot." />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-[9.5px] font-semibold tracking-wider text-emerald-400/70 uppercase">Lifting the score</div>
                  <div className="space-y-1">
                    {detail.lifters.map((l) => (
                      <PullRow key={l.symbol} row={l} tone="up" onClick={() => openHolding(l.symbol)} max={Math.max(...detail.lifters.map((z) => z.pull), 0.01)} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-[9.5px] font-semibold tracking-wider text-rose-400/70 uppercase">Dragging it down</div>
                  <div className="space-y-1">
                    {detail.draggers.map((l) => (
                      <PullRow key={l.symbol} row={l} tone="down" onClick={() => openHolding(l.symbol)} max={Math.max(...detail.draggers.map((z) => Math.abs(z.pull)), 0.01)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- correlation */}
      <Card>
        <CardHeader
          title="Correlation"
          subtitle={`Daily returns over the overlapping window. Average pairwise correlation across the book is ${correlations.avg.toFixed(2)}.`}
          right={
            correlations.excluded.length > 0 ? (
              <Badge tone="warn">{correlations.excluded.length} excluded — thin history</Badge>
            ) : undefined
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-rose-300/70 uppercase">Moving most together</span>
              <Info text="High correlation between two large positions means the portfolio is less diversified than the line count suggests — they will fall together." />
            </div>
            <div className="space-y-1.5">
              {correlations.highest.map((pair) => (
                <PairRow key={`${pair.a}-${pair.b}`} pair={pair} tone="high" onOpen={openHolding} />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-semibold tracking-[0.12em] text-emerald-300/70 uppercase">Moving least together</div>
            <div className="space-y-1.5">
              {correlations.lowest.map((pair) => (
                <PairRow key={`${pair.a}-${pair.b}`} pair={pair} tone="low" onOpen={openHolding} />
              ))}
            </div>
          </div>
        </div>
        {correlations.excluded.length > 0 && (
          <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[10.5px] leading-relaxed text-zinc-600">
            Excluded from this panel:{" "}
            {correlations.excluded.map((e) => `${e.symbol} (${e.bars} bars)`).join(", ")}. Correlation estimated on fewer than 250 overlapping
            observations is noise dressed up as a number.
          </p>
        )}
      </Card>
    </div>
  );
}

function PullRow({
  row,
  tone,
  onClick,
  max,
}: {
  row: { symbol: string; name: string; score: number; weight: number; pull: number };
  tone: "up" | "down";
  onClick: () => void;
  max: number;
}) {
  return (
    <button onClick={onClick} className="group relative flex w-full items-center gap-2 overflow-hidden rounded px-1.5 py-1 text-left hover:bg-white/[0.04]">
      <div
        className={cn("absolute inset-y-0 left-0 rounded opacity-[0.13]", tone === "up" ? "bg-emerald-400" : "bg-rose-400")}
        style={{ width: `${(Math.abs(row.pull) / max) * 100}%` }}
      />
      <span className="num relative w-[52px] shrink-0 text-[11px] font-medium text-zinc-200">{row.symbol}</span>
      <span className="num relative shrink-0 text-[10px] text-zinc-500">{row.score.toFixed(1)}</span>
      <span className="relative flex-1 truncate text-[10px] text-zinc-600">{row.weight.toFixed(1)}% weight</span>
      <span className={cn("num relative shrink-0 text-[10.5px] font-medium", tone === "up" ? "text-emerald-400" : "text-rose-400")}>
        {row.pull >= 0 ? "+" : "−"}
        {Math.abs(row.pull).toFixed(2)}
      </span>
    </button>
  );
}

function PairRow({
  pair,
  tone,
  onOpen,
}: {
  pair: { a: string; b: string; aName: string; bName: string; r: number; combinedWeight: number; days: number };
  tone: "high" | "low";
  onOpen: (s: string) => void;
}) {
  const intensity = Math.abs(pair.r);
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5 transition hover:border-white/12">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <button onClick={() => onOpen(pair.a)} className="num shrink-0 text-[11.5px] font-semibold text-zinc-100 hover:text-teal-300">
            {pair.a}
          </button>
          <span className="text-[10px] text-zinc-600">↔</span>
          <button onClick={() => onOpen(pair.b)} className="num shrink-0 text-[11.5px] font-semibold text-zinc-100 hover:text-teal-300">
            {pair.b}
          </button>
        </div>
        <span
          className={cn("num shrink-0 rounded px-1.5 py-0.5 text-[11.5px] font-semibold", tone === "high" ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300")}
        >
          {pair.r >= 0 ? "" : "−"}
          {Math.abs(pair.r).toFixed(2)}
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={cn("h-full rounded-full transition-all duration-700", tone === "high" ? "bg-gradient-to-r from-rose-400/60 to-rose-400" : "bg-gradient-to-r from-emerald-400/60 to-emerald-400")}
          style={{ width: `${intensity * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-zinc-600">
        <span>combined weight {pair.combinedWeight.toFixed(1)}%</span>
        <span className="num">{pair.days} overlapping days</span>
      </div>
    </div>
  );
}

function TypeVerdict({ p }: { p: ReturnType<typeof usePortfolio>["portfolio"] }) {
  const byType = new Map<string, number>();
  for (const pos of p.positions) byType.set(pos.asset.type, (byType.get(pos.asset.type) ?? 0) + pos.value);
  const passive = ((byType.get("ETF") ?? 0) + (byType.get("Fund") ?? 0)) / p.holdingsValue;
  const direct = (byType.get("Stock") ?? 0) / p.holdingsValue;
  const defensive = ((byType.get("Bond") ?? 0) + (byType.get("Commodity") ?? 0)) / p.holdingsValue;

  const lines = [
    {
      label: "Core-satellite",
      body: `${(passive * 100).toFixed(0)}% sits in pooled vehicles and ${(direct * 100).toFixed(0)}% in individual companies. That is a core-satellite structure — the funds set the return, the single names set the dispersion.`,
    },
    {
      label: "Defensive sleeve",
      body: `${(defensive * 100).toFixed(0)}% in bonds and physical commodity. This is the part that decides whether a 30% equity drawdown is survivable without selling.`,
    },
    {
      label: "Cash drag",
      body: `${((p.cash / p.totalValue) * 100).toFixed(1)}% uninvested. Below 3% is operational; above 8% is an unmade decision.`,
    },
  ];
  return (
    <>
      {lines.map((l) => (
        <div key={l.label} className="flex gap-2.5">
          <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-teal-400/60" />
          <p className="text-[10.5px] leading-relaxed text-zinc-500">
            <span className="font-medium text-zinc-300">{l.label}.</span> {l.body}
          </p>
        </div>
      ))}
    </>
  );
}
