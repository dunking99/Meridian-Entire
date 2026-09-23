import { useMemo, useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Bar, Button, Card, CardHeader, Delta, Info, Segmented } from "../components/ui";
import { AreaChart, BarList, Donut } from "../components/charts";
import { CHART_PALETTE, SECTOR_COLORS } from "../data/universe";
import { fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { cn } from "../utils/cn";
import { ExposureCheck } from "./ExposureCheck";
import type { Slice } from "../engine/portfolio";

const RANGES = [
  { value: "1M", days: 21 },
  { value: "3M", days: 63 },
  { value: "6M", days: 126 },
  { value: "1Y", days: 252 },
  { value: "3Y", days: 756 },
  { value: "MAX", days: 99999 },
];

type SortKey = "name" | "qty" | "avg" | "price" | "value" | "pl" | "day" | "weight";

export function HoldingsTab({ onAdd }: { onAdd: () => void }) {
  const { portfolio: p, breakdowns, flags, openHolding, setTab, refreshNames, namesRefreshed } = usePortfolio();
  const [range, setRange] = useState("1Y");
  const [sort, setSort] = useState<SortKey>("value");
  const [dir, setDir] = useState<1 | -1>(-1);

  const days = RANGES.find((r) => r.value === range)!.days;
  const slice = useMemo(() => {
    const n = Math.min(days, p.series.values.length);
    return { dates: p.series.dates.slice(-n), values: p.series.values.slice(-n), index: p.series.index.slice(-n) };
  }, [days, p.series]);

  // flow-adjusted so deposits inside the window are not mistaken for performance
  const rangeReturn = slice.index.length > 1 ? (slice.index[slice.index.length - 1] / slice.index[0] - 1) * 100 : 0;
  const unresolved = p.positions.filter((x) => x.unresolved);
  const thin = p.positions.filter((x) => x.thin);

  const sorted = useMemo(() => {
    const key = (x: (typeof p.positions)[number]) =>
      ({ name: x.symbol, qty: x.qty, avg: x.avgPrice, price: x.price, value: x.value, pl: x.plPct, day: x.dayMovePct, weight: x.weight })[sort];
    return [...p.positions].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      if (typeof ka === "string" || typeof kb === "string") return String(ka).localeCompare(String(kb)) * dir;
      return (ka - kb) * dir;
    });
  }, [p.positions, sort, dir]);

  const th = (label: string, k: SortKey, align = "right") => (
    <th
      onClick={() => {
        if (sort === k) setDir((d) => (d === 1 ? -1 : 1));
        else {
          setSort(k);
          setDir(-1);
        }
      }}
      className={cn(
        "cursor-pointer px-3 py-2 text-[10px] font-semibold tracking-wider whitespace-nowrap text-zinc-500 uppercase transition select-none hover:text-zinc-300",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {label}
      <span className={cn("ml-1 text-[8px]", sort === k ? "text-teal-400" : "text-transparent")}>{dir === 1 ? "▲" : "▼"}</span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------- summary strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="anim-in">
          <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">Total value</div>
          <div className="num mt-1.5 text-[26px] leading-none font-semibold tracking-tight text-zinc-50">
            {fmtMoney(p.totalValue, { dp: 0 })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Delta value={rangeReturn} size="xs" />
            <span className="text-[10px] text-zinc-600">over {range === "MAX" ? "all time" : range}, flows stripped</span>
          </div>
          <div className="mt-2.5 border-t border-white/[0.06] pt-2 text-[10px] text-zinc-600">
            {p.positions.length} positions · since {new Date(p.sinceDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
          </div>
        </Card>

        <Card className="anim-in">
          <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">Invested</div>
          <div className="num mt-1.5 text-[26px] leading-none font-semibold tracking-tight text-zinc-50">
            {fmtMoney(p.invested, { dp: 0 })}
          </div>
          <div className="mt-2 text-[10px] text-zinc-600">Book cost across {new Set(p.positions.map((x) => x.account)).size} accounts</div>
          <button
            onClick={() => setTab("allocate")}
            className="group mt-2.5 flex w-full items-center justify-between rounded-lg border border-teal-400/15 bg-teal-400/[0.06] px-2.5 py-2 text-left transition hover:border-teal-400/30 hover:bg-teal-400/10"
          >
            <div>
              <div className="text-[9.5px] tracking-wider text-teal-300/70 uppercase">Cash across accounts</div>
              <div className="num text-[15px] leading-tight font-semibold text-teal-200">{fmtMoney(p.cash, { dp: 0 })}</div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-teal-300/80 transition group-hover:text-teal-200">
              Allocate <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </button>
        </Card>

        <Card className="anim-in">
          <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">Profit</div>
          <div className={cn("num mt-1.5 text-[26px] leading-none font-semibold tracking-tight", p.profit >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {fmtMoney(p.profit, { dp: 0, sign: true })}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Delta value={p.profitPct} size="xs" />
            <span className="text-[10px] text-zinc-600">on book cost</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className="text-[10px] text-zinc-500">Today</span>
            <span className="flex items-center gap-1.5">
              <span className={cn("num text-[11px] font-medium", p.dayChange >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {fmtMoney(p.dayChange, { dp: 0, sign: true })}
              </span>
              <Delta value={p.dayChangePct} size="xs" arrow={false} />
            </span>
          </div>
        </Card>

        <Card className="anim-in">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">Annualised</span>
            <Info text="Compound annual growth of total value against net contributed capital since the first position was opened. The Performance tab separates this into money-weighted and time-weighted figures." />
          </div>
          <div className="num mt-1.5 text-[26px] leading-none font-semibold tracking-tight text-zinc-50">{fmtPct(p.annualised, 2, true)}</div>
          <div className="mt-2 text-[10px] text-zinc-600">over {p.years.toFixed(1)} years</div>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className="text-[10px] text-zinc-500">Worst drawdown</span>
            <span className="num text-[11px] font-medium text-rose-400">{p.maxDD.toFixed(1)}%</span>
          </div>
        </Card>
      </div>

      {/* --------------------------------------------------------- charts */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.75fr_1fr]">
        <Card>
          <CardHeader
            title="Portfolio value"
            subtitle="Market value of all positions plus uninvested cash, marked daily"
            right={<Segmented size="xs" options={RANGES.map((r) => ({ value: r.value, label: r.value }))} value={range} onChange={setRange} />}
          />
          <AreaChart
            dates={slice.dates}
            series={[{ values: slice.values, color: "#2dd4bf", label: "Total value" }]}
            height={214}
            format={(v) => fmtMoney(v, { compact: true })}
          />
        </Card>

        <Card>
          <CardHeader title="By instrument type" subtitle="Share of invested value" />
          <TypeBreakdown data={breakdowns.type} total={p.holdingsValue} />
        </Card>
      </div>

      {/* --------------------------------------------- cross-reference layer */}
      <ExposureCheck />

      {/* ------------------------------------------------- data warnings */}
      {thin.length > 0 && (
        <Card className="border-amber-400/20 bg-amber-400/[0.035]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-[13px] text-amber-300">
              !
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[12.5px] font-semibold text-amber-200">Thin price coverage on {thin.length} holdings</h3>
                <Badge tone="warn">excluded from risk analysis</Badge>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-200/60">
                Volatility, correlation and drawdown figures need at least 250 stored daily bars. These positions are shown everywhere else but are
                left out of the covariance work, so the risk numbers on Analysis and Rebuild describe{" "}
                {(100 - thin.reduce((a, t) => a + t.weight, 0)).toFixed(1)}% of the portfolio, not all of it.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {thin.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openHolding(t.symbol)}
                    className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-black/20 px-2.5 py-1.5 text-left transition hover:border-amber-400/40 hover:bg-black/40"
                  >
                    <span className="num text-[11px] font-semibold text-amber-100">{t.symbol}</span>
                    <span className="num text-[10px] text-amber-200/50">{t.bars} bars</span>
                    <span className="num text-[10px] text-amber-200/50">· {t.weight.toFixed(1)}% weight</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ---------------------------------------------------------- table */}
      <Card pad={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div>
            <h3 className="text-[13px] font-semibold text-zinc-100">Holdings</h3>
            <p className="mt-0.5 text-[11px] text-zinc-500">Click any row to open the research panel</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="subtle"
              size="sm"
              onClick={refreshNames}
              disabled={unresolved.length === 0}
              title={unresolved.length ? `Resolve ${unresolved.length} raw tickers` : "All names resolved"}
            >
              <span className={cn(namesRefreshed && unresolved.length === 0 && "text-emerald-400")}>↻</span>
              Refresh names
              {unresolved.length > 0 && (
                <span className="ml-0.5 rounded bg-amber-400/15 px-1 text-[9px] text-amber-300">{unresolved.length}</span>
              )}
            </Button>
            <Button variant="primary" size="sm" onClick={onAdd}>
              + Add position
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.012]">
                {th("Holding", "name", "left")}
                {th("Units", "qty")}
                {th("Avg price", "avg")}
                {th("Price", "price")}
                {th("Value", "value")}
                {th("P&L", "pl")}
                {th("Today", "day")}
                {th("Weight", "weight")}
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr
                  key={h.id}
                  onClick={() => openHolding(h.symbol)}
                  className="group cursor-pointer border-b border-white/[0.035] transition last:border-0 hover:bg-white/[0.035]"
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold"
                        style={{
                          background: `${SECTOR_COLORS[h.asset.sector] ?? "#64748b"}1f`,
                          color: SECTOR_COLORS[h.asset.sector] ?? "#94a3b8",
                        }}
                      >
                        {h.symbol.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="num text-[12px] font-semibold text-zinc-100">{h.symbol}</span>
                          {h.unresolved && <Badge tone="warn">raw ticker</Badge>}
                          {h.thin && <Badge tone="ghost">thin</Badge>}
                        </div>
                        <div className="truncate text-[10.5px] text-zinc-500">
                          {h.unresolved ? <span className="text-amber-300/60">name not resolved</span> : h.name}
                          <span className="ml-1.5 text-zinc-700">· {h.wrapper}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="num px-3 py-2.5 text-right text-[11.5px] text-zinc-400">{fmtNum(h.qty, h.qty % 1 === 0 ? 0 : 2)}</td>
                  <td className="num px-3 py-2.5 text-right text-[11.5px] text-zinc-400">{fmtMoney(h.avgPrice)}</td>
                  <td className="num px-3 py-2.5 text-right text-[11.5px] text-zinc-200">{fmtMoney(h.price)}</td>
                  <td className="num px-3 py-2.5 text-right text-[12px] font-medium text-zinc-50">{fmtMoney(h.value, { dp: 0 })}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className={cn("num text-[11.5px] font-medium", h.pl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {fmtMoney(h.pl, { dp: 0, sign: true })}
                    </div>
                    <div className={cn("num text-[10px]", h.pl >= 0 ? "text-emerald-400/55" : "text-rose-400/55")}>{fmtPct(h.plPct, 1, true)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Delta value={h.dayMovePct} size="xs" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <Bar pct={(h.weight / Math.max(...p.positions.map((x) => x.weight))) * 100} height="h-1" className="w-10" tone={h.weight > 20 ? "amber" : "teal"} />
                      <span className="num w-10 text-right text-[11.5px] text-zinc-300">{h.weight.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-white/[0.02]">
                <td className="px-3 py-2.5 text-[11px] font-medium text-zinc-400">Cash</td>
                <td colSpan={3} />
                <td className="num px-3 py-2.5 text-right text-[12px] font-medium text-zinc-200">{fmtMoney(p.cash, { dp: 0 })}</td>
                <td colSpan={2} />
                <td className="num px-3 py-2.5 text-right text-[11.5px] text-zinc-400">{((p.cash / p.totalValue) * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ------------------------------------------------ concentration */}
      <Card>
        <CardHeader
          title="Concentration"
          subtitle="Measured against invested value, not total value — cash cannot dilute a concentration problem"
          right={
            <Badge tone={flags.some((f) => f.status === "breach") ? "down" : flags.some((f) => f.status === "warn") ? "warn" : "up"}>
              {flags.filter((f) => f.status !== "ok").length} of {flags.length} outside comfort
            </Badge>
          }
        />
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {flags.map((f) => (
            <div
              key={f.id}
              className={cn(
                "rounded-lg border p-3",
                f.status === "breach"
                  ? "border-rose-400/25 bg-rose-400/[0.05]"
                  : f.status === "warn"
                    ? "border-amber-400/25 bg-amber-400/[0.04]"
                    : "border-white/[0.07] bg-white/[0.015]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-zinc-300">{f.label}</span>
                <span
                  className={cn(
                    "num text-[15px] leading-none font-semibold",
                    f.status === "breach" ? "text-rose-300" : f.status === "warn" ? "text-amber-300" : "text-zinc-100",
                  )}
                >
                  {f.value}
                </span>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500">{f.detail}</p>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={cn(
                    "h-1 w-1 rounded-full",
                    f.status === "breach" ? "bg-rose-400" : f.status === "warn" ? "bg-amber-400" : "bg-emerald-400",
                  )}
                />
                <span className="text-[9.5px] tracking-wider text-zinc-600 uppercase">
                  {f.status === "breach" ? "Limit breached" : f.status === "warn" ? "Approaching limit" : "Within limit"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* -------------------------------------------------- breakdowns */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <BreakdownPanel title="Geography" subtitle="As listed — see X-Ray for look-through" data={breakdowns.geography} total={p.holdingsValue} />
        <BreakdownPanel title="Sector" subtitle="Fund wrappers shown as 'Diversified'" data={breakdowns.sector} total={p.holdingsValue} colorBySector />
        <BreakdownPanel title="Currency" subtitle="Listing currency of each line" data={breakdowns.currency} total={p.holdingsValue} />
        <BreakdownPanel title="Wrapper" subtitle="Tax treatment by account type" data={breakdowns.wrapper} total={p.holdingsValue} />
      </div>
    </div>
  );
}

function TypeBreakdown({ data, total }: { data: Slice[]; total: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const active = data.find((d) => d.key === hover);
  return (
    <div className="flex flex-col items-center gap-3">
      <Donut
        data={data}
        size={158}
        thickness={22}
        palette={CHART_PALETTE}
        activeKey={hover}
        onHover={setHover}
        center={
          <>
            <span className="num text-[17px] leading-none font-semibold text-zinc-50">
              {active ? `${active.pct.toFixed(1)}%` : data.length}
            </span>
            <span className="mt-1 max-w-[86px] text-[9px] leading-tight text-zinc-500">{active ? active.key : "instrument types"}</span>
          </>
        }
      />
      <div className="w-full space-y-1">
        {data.map((d, i) => (
          <div
            key={d.key}
            onMouseEnter={() => setHover(d.key)}
            onMouseLeave={() => setHover(null)}
            className={cn("flex items-center justify-between rounded px-1.5 py-1 text-[11px] transition", hover === d.key ? "bg-white/[0.05]" : "")}
          >
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
              {d.key}
            </span>
            <span className="flex items-center gap-2">
              <span className="num text-[10px] text-zinc-600">{fmtMoney(d.value, { compact: true })}</span>
              <span className="num w-9 text-right font-medium text-zinc-200">{d.pct.toFixed(1)}%</span>
            </span>
          </div>
        ))}
        <div className="mt-1 border-t border-white/[0.06] pt-1.5 text-[10px] text-zinc-600">
          Total invested {fmtMoney(total, { dp: 0 })}
        </div>
      </div>
    </div>
  );
}

function BreakdownPanel({
  title,
  subtitle,
  data,
  total,
  colorBySector,
}: {
  title: string;
  subtitle: string;
  data: Slice[];
  total: number;
  colorBySector?: boolean;
}) {
  const [view, setView] = useState<"bar" | "pie">("bar");
  const [hover, setHover] = useState<string | null>(null);
  const colored = data.map((d, i) => ({
    ...d,
    color: colorBySector ? (SECTOR_COLORS[d.key] ?? CHART_PALETTE[i % CHART_PALETTE.length]) : CHART_PALETTE[i % CHART_PALETTE.length],
  }));
  const active = colored.find((d) => d.key === hover);

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        right={
          <Segmented
            size="xs"
            options={[
              { value: "bar", label: "Bar" },
              { value: "pie", label: "Pie" },
            ]}
            value={view}
            onChange={(v) => setView(v as "bar" | "pie")}
          />
        }
      />
      {view === "bar" ? (
        <BarList
          items={colored.map((d) => ({ key: d.key, value: d.pct, pct: d.pct, color: d.color, sub: fmtMoney(d.value, { compact: true }) }))}
          palette={CHART_PALETTE}
          format={(v) => `${v.toFixed(1)}%`}
        />
      ) : (
        <div className="flex items-center gap-4">
          <Donut
            data={colored}
            size={146}
            thickness={20}
            palette={CHART_PALETTE}
            activeKey={hover}
            onHover={setHover}
            center={
              <>
                <span className="num text-[15px] leading-none font-semibold text-zinc-50">{active ? `${active.pct.toFixed(1)}%` : `${colored.length}`}</span>
                <span className="mt-1 max-w-[76px] text-[9px] leading-tight text-zinc-500">{active ? active.key : title.toLowerCase()}</span>
              </>
            }
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            {colored.map((d) => (
              <div
                key={d.key}
                onMouseEnter={() => setHover(d.key)}
                onMouseLeave={() => setHover(null)}
                className={cn("flex items-center justify-between rounded px-1.5 py-[3px] text-[11px] transition", hover === d.key && "bg-white/[0.05]")}
              >
                <span className="flex min-w-0 items-center gap-1.5 text-zinc-300">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: d.color }} />
                  <span className="truncate">{d.key}</span>
                </span>
                <span className="num shrink-0 font-medium text-zinc-200">{d.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px] text-zinc-600">
        <span>{data.length} groups</span>
        <span className="num">{fmtMoney(total, { dp: 0 })}</span>
      </div>
    </Card>
  );
}


