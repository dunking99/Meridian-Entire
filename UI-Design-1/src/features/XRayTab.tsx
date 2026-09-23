import { useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Bar, Card, CardHeader, Info, Segmented } from "../components/ui";
import { BarList, Donut } from "../components/charts";
import { CHART_PALETTE, SECTOR_COLORS } from "../data/universe";
import { FUND_COMPOSITIONS } from "../data/funds";
import { fmtMoney } from "../lib/format";
import { cn } from "../utils/cn";

export function XRayTab() {
  const { xray: x, portfolio: p, openHolding } = usePortfolio();
  const [sectorView, setSectorView] = useState<"bar" | "pie">("bar");
  const [showAll, setShowAll] = useState(false);

  const stats = [
    {
      label: "Bought vs owned",
      value: `${x.boughtCount} → ${x.ownedCount}`,
      sub: "positions on the statement resolve to distinct underlying companies",
      tone: "info" as const,
    },
    {
      label: "Largest underlying",
      value: x.largest ? `${x.largest.weight.toFixed(2)}%` : "—",
      sub: x.largest ? `${x.largest.name} — reached via ${x.largest.sources.length} route${x.largest.sources.length > 1 ? "s" : ""}` : "",
      tone: (x.largest && x.largest.weight > 7 ? "warn" : "neutral") as "warn" | "neutral",
    },
    {
      label: "Reached more than once",
      value: `${x.overlaps.length}`,
      sub: "companies you own through two or more holdings",
      tone: (x.overlaps.length > 6 ? "warn" : "neutral") as "warn" | "neutral",
    },
    {
      label: "Undisclosed residual",
      value: `${x.residual.toFixed(1)}%`,
      sub: "inside funds that publish only their largest positions",
      tone: "neutral" as const,
    },
  ];

  const topCompanies = x.companies.slice(0, showAll ? 40 : 14);

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------- coverage */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-zinc-100">Look-through coverage</h3>
              <Info text="The share of invested value that can be decomposed into underlying companies — either because you hold the company directly, or because the fund publishes its composition." />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              {fmtMoney(x.coveredValue, { dp: 0 })} of {fmtMoney(p.holdingsValue, { dp: 0 })} invested could be opened up. The rest sits behind
              instruments that publish nothing useful, or that have no corporate underlyings at all.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Bar pct={x.coverage} tone={x.coverage > 85 ? "teal" : x.coverage > 70 ? "sky" : "amber"} height="h-2" />
              <span className="num shrink-0 text-[17px] leading-none font-semibold text-zinc-50">{x.coverage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 lg:w-[290px]">
            <div className="text-[10px] tracking-wider text-zinc-500 uppercase">What this changes</div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
              You hold <span className="num font-medium text-zinc-200">{x.boughtCount}</span> lines. Once every fund is opened up you actually own{" "}
              <span className="num font-medium text-teal-300">{x.ownedCount}</span> distinct companies — and{" "}
              <span className="num font-medium text-amber-300">{x.overlaps.length}</span> of them arrive by more than one route.
            </p>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------------- stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">{s.label}</span>
              {s.tone === "warn" && <Badge tone="warn">watch</Badge>}
            </div>
            <div className="num mt-2 text-[22px] leading-none font-semibold tracking-tight text-zinc-50">{s.value}</div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-zinc-500">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_1fr]">
        {/* ------------------------------------------- largest underlyings */}
        <Card>
          <CardHeader
            title="Largest underlying companies"
            subtitle="Combined exposure across every route — direct holdings and fund positions together"
            right={
              <button onClick={() => setShowAll((s) => !s)} className="text-[10px] text-teal-300/80 transition hover:text-teal-200">
                {showAll ? "Show top 14" : `Show all ${x.companies.length}`}
              </button>
            }
          />
          <div className="space-y-1">
            {topCompanies.map((c) => {
              const maxW = x.companies[0]?.weight ?? 1;
              return (
                <div
                  key={c.symbol}
                  onClick={() => p.positions.find((pp) => pp.symbol === c.symbol) && openHolding(c.symbol)}
                  className={cn(
                    "group relative overflow-hidden rounded-md px-2 py-[7px]",
                    p.positions.find((pp) => pp.symbol === c.symbol) && "cursor-pointer hover:bg-white/[0.04]",
                  )}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-md opacity-[0.15] transition-all duration-500"
                    style={{
                      width: `${(c.weight / maxW) * 100}%`,
                      background: SECTOR_COLORS[c.sector] ?? "#64748b",
                    }}
                  />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="num w-[54px] shrink-0 text-[11px] font-semibold text-zinc-100">{c.symbol}</span>
                      <span className="truncate text-[11px] text-zinc-400">{c.name}</span>
                      {c.direct && <Badge tone="info">direct</Badge>}
                      {c.sources.length > 1 && <Badge tone="warn">×{c.sources.length}</Badge>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="hidden text-[9.5px] text-zinc-600 sm:inline">{c.sources.map((s) => s.via).join(" · ")}</span>
                      <span className="num w-12 text-right text-[11.5px] font-medium text-zinc-200">{c.weight.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ------------------------------------------------------ overlaps */}
        <Card>
          <CardHeader
            title="Reached more than once"
            subtitle="Every duplicated company is diversification you are paying for but not receiving"
            right={<Badge tone={x.overlaps.length > 6 ? "warn" : "neutral"}>{x.overlaps.length}</Badge>}
          />
          <div className="space-y-2">
            {x.overlaps.slice(0, 9).map((c) => (
              <div key={c.symbol} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="num text-[11.5px] font-semibold text-zinc-100">{c.symbol}</span>
                    <span className="truncate text-[10.5px] text-zinc-500">{c.name}</span>
                  </div>
                  <span className="num shrink-0 text-[12px] font-semibold text-amber-300">{c.weight.toFixed(2)}%</span>
                </div>
                <div className="mt-2 space-y-1">
                  {c.sources
                    .slice()
                    .sort((a, b) => b.weight - a.weight)
                    .map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={cn("num w-[52px] shrink-0 text-[10px]", s.via === "Direct" ? "text-sky-300" : "text-zinc-500")}>{s.via}</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-300/70 to-orange-400/70" style={{ width: `${(s.weight / c.weight) * 100}%` }} />
                        </div>
                        <span className="num w-11 shrink-0 text-right text-[10px] text-zinc-400">{s.weight.toFixed(2)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------ blended sectors */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Blended sector exposure"
            subtitle="Every fund's published sector split, weighted by what you hold in it"
            right={
              <Segmented
                size="xs"
                options={[
                  { value: "bar", label: "Bar" },
                  { value: "pie", label: "Pie" },
                ]}
                value={sectorView}
                onChange={(v) => setSectorView(v as "bar" | "pie")}
              />
            }
          />
          {sectorView === "bar" ? (
            <BarList
              items={x.sectors.map((s) => ({ key: s.key, value: s.pct, pct: s.pct, color: SECTOR_COLORS[s.key] ?? "#64748b" }))}
              palette={CHART_PALETTE}
              format={(v) => `${v.toFixed(1)}%`}
              dense
            />
          ) : (
            <div className="flex items-center gap-5">
              <Donut
                data={x.sectors.map((s) => ({ key: s.key, value: s.pct, pct: s.pct, color: SECTOR_COLORS[s.key] ?? "#64748b" }))}
                size={170}
                thickness={24}
                palette={CHART_PALETTE}
                center={
                  <>
                    <span className="num text-[16px] leading-none font-semibold text-zinc-50">{x.sectors[0]?.pct.toFixed(0)}%</span>
                    <span className="mt-1 text-[9px] text-zinc-500">{x.sectors[0]?.key}</span>
                  </>
                }
              />
              <div className="flex-1 space-y-0.5">
                {x.sectors.slice(0, 9).map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: SECTOR_COLORS[s.key] ?? "#64748b" }} />
                      {s.key}
                    </span>
                    <span className="num text-zinc-200">{s.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Blended geography" subtitle="Where the money actually sits once funds are opened up" />
          <BarList
            items={x.regions.map((s) => ({ key: s.key, value: s.pct, pct: s.pct }))}
            palette={CHART_PALETTE}
            format={(v) => `${v.toFixed(1)}%`}
            dense
          />
          <div className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.015] p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-zinc-400">North American exposure vs 65% mandate cap</span>
              <span className={cn("num text-[12px] font-semibold", x.usExposure > 65 ? "text-rose-300" : x.usExposure > 58 ? "text-amber-300" : "text-emerald-300")}>
                {x.usExposure.toFixed(1)}%
              </span>
            </div>
            <div className="relative mt-2">
              <Bar pct={x.usExposure} tone={x.usExposure > 65 ? "rose" : x.usExposure > 58 ? "amber" : "teal"} height="h-1.5" />
              <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-zinc-400" style={{ left: "65%" }} />
            </div>
          </div>
        </Card>
      </div>

      {/* ----------------------------------------------------------- gaps */}
      <Card>
        <CardHeader
          title="Could not be seen through"
          subtitle={`${x.gaps.length} positions covering ${x.gaps.reduce((a, g) => a + g.weight, 0).toFixed(1)}% of invested value`}
          right={<Badge tone="ghost">black boxes</Badge>}
        />
        <div className="space-y-2">
          {x.gaps.map((g) => (
            <div
              key={g.symbol}
              onClick={() => openHolding(g.symbol)}
              className="flex cursor-pointer flex-col gap-2 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 transition hover:border-white/15 hover:bg-white/[0.03] sm:flex-row sm:items-center"
            >
              <div className="flex w-full items-center gap-2.5 sm:w-[240px] sm:shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black/30 text-[9px] text-zinc-500">?</span>
                <div className="min-w-0">
                  <div className="num text-[11.5px] font-semibold text-zinc-100">{g.symbol}</div>
                  <div className="truncate text-[10px] text-zinc-500">{g.name}</div>
                </div>
              </div>
              <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-zinc-400">{g.reason}</p>
              <div className="shrink-0 text-right">
                <div className="num text-[12px] font-semibold text-zinc-200">{g.weight.toFixed(1)}%</div>
                <div className="num text-[10px] text-zinc-600">{fmtMoney(g.value, { compact: true })}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[10.5px] leading-relaxed text-zinc-600">
          Funds that do publish a composition are decomposed from their latest filing —{" "}
          {Object.values(FUND_COMPOSITIONS)
            .map((f) => `${f.symbol} (${f.holdingsCount} lines, ${f.disclosed.toFixed(0)}% disclosed)`)
            .join(", ")}
          . Undisclosed remainders are attributed using each fund's published sector and region split rather than being dropped.
        </p>
      </Card>
    </div>
  );
}
