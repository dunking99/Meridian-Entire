import { useMemo, useState } from "react";
import {
  HOLDINGS, TOTAL_VALUE, CASH_TOTAL, CASH_WEIGHT, groupBy, DRIFT, TOP5_WEIGHT, HHI, EFFECTIVE_N, INVESTED,
} from "@/data/portfolio";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Segmented, Pill } from "@/components/ui/Primitives";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { Donut, Treemap } from "@/components/charts/Micro";
import { CLASS_COLORS, SECTOR_COLORS, REGION_COLORS, ACCOUNT_COLORS, pickColor } from "@/lib/palette";
import { fmtUSD0, fmtCompact, clsTone } from "@/lib/format";
import { cn } from "@/utils/cn";
import { IconTarget, IconCheck } from "@/components/ui/icons";

const DIMS = ["Asset class", "Sector", "Region", "Account"] as const;
type Dim = (typeof DIMS)[number];

const DIM_KEY: Record<Dim, "assetClass" | "sector" | "region" | "account"> = {
  "Asset class": "assetClass",
  Sector: "sector",
  Region: "region",
  Account: "account",
};
const DIM_COLORS: Record<Dim, Record<string, string>> = {
  "Asset class": CLASS_COLORS,
  Sector: SECTOR_COLORS,
  Region: REGION_COLORS,
  Account: ACCOUNT_COLORS,
};

const BENCH_SECTOR: Record<string, number> = {
  "Information Technology": 33.4,
  Financials: 13.1,
  "Health Care": 10.2,
  "Consumer Discretionary": 10.6,
  "Consumer Staples": 5.4,
  Energy: 3.2,
  Materials: 2.1,
  "Broad Market": 0,
  "Government Bonds": 0,
  "Digital Assets": 0,
};

const FACTORS = [
  { k: "Growth ↔ Value", v: -34, left: "Value", right: "Growth" },
  { k: "Large ↔ Small", v: -62, left: "Small", right: "Mega" },
  { k: "Cyclical ↔ Defensive", v: 18, left: "Defensive", right: "Cyclical" },
  { k: "Domestic ↔ International", v: -48, left: "Intl", right: "US" },
];

const CURRENCY = [
  { k: "USD", v: 78.4 },
  { k: "EUR", v: 9.1 },
  { k: "TWD", v: 6.2 },
  { k: "DKK", v: 1.7 },
  { k: "Other", v: 4.6 },
];

export function Allocation() {
  const { setFocus } = useApp();
  const [dim, setDim] = useState<Dim>("Sector");
  const [includeCash, setIncludeCash] = useState(true);
  const [applied, setApplied] = useState<string[]>([]);

  const rows = useMemo(() => {
    const g = groupBy(DIM_KEY[dim]).map((x) => ({
      label: x.label,
      value: x.value,
      count: x.holdings.length,
      color: pickColor(DIM_COLORS[dim], x.label),
      holdings: x.holdings,
    }));
    if (includeCash)
      g.push({ label: "Cash", value: CASH_TOTAL, count: 4, color: "#5b6575", holdings: [] });
    return g.sort((a, b) => b.value - a.value);
  }, [dim, includeCash]);

  const base = includeCash ? TOTAL_VALUE : INVESTED;
  const breaches = DRIFT.filter((d) => d.action !== "Hold");
  const buyTotal = breaches.filter((b) => b.action === "Buy").reduce((a, b) => a + b.deltaUSD, 0);
  const sellTotal = breaches.filter((b) => b.action === "Sell").reduce((a, b) => a + Math.abs(b.deltaUSD), 0);
  const maxDrift = Math.max(...DRIFT.map((d) => Math.abs(d.drift)));

  const sectorRows = useMemo(
    () =>
      groupBy("sector")
        .map((s) => ({
          label: s.label,
          w: s.weight,
          bench: BENCH_SECTOR[s.label] ?? 0,
        }))
        .sort((a, b) => b.w - a.w),
    [],
  );

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader
        title="Allocation & rebalancing"
        sub="Where the money actually sits, how far it has drifted from plan, and the smallest set of trades that fixes it."
        right={
          <>
            <button
              onClick={() => setIncludeCash(!includeCash)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                includeCash ? "border-acc/30 bg-acc/10 text-acc" : "border-ink-750 bg-ink-900 text-mist-400",
              )}
            >
              {includeCash ? "Cash included" : "Cash excluded"}
            </button>
            <Segmented options={DIMS} value={dim} onChange={setDim} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* explorer */}
        <Panel className="xl:col-span-8">
          <PanelHead title={`Exposure by ${dim.toLowerCase()}`} sub={`${fmtUSD0(base)} across ${rows.length} buckets`} />
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center">
            <Donut
              data={rows.map((r) => ({ label: r.label, value: r.value, color: r.color, sub: fmtCompact(r.value) }))}
              size={196}
              thickness={22}
              center={
                <>
                  <span className="text-[10px] uppercase tracking-wider text-mist-500">Total</span>
                  <span className="tnum text-[19px] font-semibold text-mist-100">{fmtCompact(base)}</span>
                  <span className="text-[10px] text-mist-500">{dim}</span>
                </>
              }
            />
            <div className="min-w-0 flex-1 space-y-2.5">
              {rows.map((r) => (
                <div key={r.label}>
                  <div className="flex items-baseline gap-2">
                    <i className="h-2 w-2 shrink-0 rounded-sm" style={{ background: r.color }} />
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-mist-200">{r.label}</span>
                    <span className="text-[10px] text-mist-500">{r.count} pos</span>
                    <span className="tnum w-20 text-right text-[11px] text-mist-400">{fmtCompact(r.value)}</span>
                    <span className="tnum w-12 text-right text-[11.5px] font-medium text-mist-100">
                      {((r.value / base) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(r.value / base) * 100}%`, background: r.color, opacity: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* concentration */}
        <Panel className="xl:col-span-4">
          <PanelHead title="Concentration" sub="How much of the outcome rests on a few names" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { k: "Top 5 weight", v: `${TOP5_WEIGHT.toFixed(1)}%`, s: "policy max 40%" },
              { k: "Largest position", v: `${Math.max(...HOLDINGS.map((h) => h.weight)).toFixed(1)}%`, s: "policy max 12%" },
              { k: "Effective holdings", v: String(EFFECTIVE_N), s: `${HOLDINGS.length} nominal` },
              { k: "Herfindahl", v: String(HHI), s: "lower is broader" },
            ].map((m) => (
              <div key={m.k} className="rounded-lg border border-ink-800 bg-ink-880 px-3 py-2.5">
                <Label>{m.k}</Label>
                <div className="tnum mt-1 text-[15px] font-semibold text-mist-100">{m.v}</div>
                <div className="mt-0.5 text-[9.5px] text-mist-500">{m.s}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Label className="text-[9px]">Weight ladder</Label>
            <div className="mt-2">
              <Treemap
                height={188}
                nodes={HOLDINGS.map((h) => ({
                  id: h.ticker,
                  value: h.marketValue,
                  ret: h.unrealizedPct / 3,
                  label: h.ticker,
                }))}
                onSelect={setFocus}
              />
            </div>
          </div>
        </Panel>

        {/* rebalancer */}
        <Panel className="xl:col-span-12" flush>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-5 py-3.5">
            <PanelHead
              title="Rebalancer"
              sub={`${breaches.length} of ${DRIFT.length} positions outside the ±0.75pp band`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="up">Buy {fmtCompact(buyTotal)}</Pill>
              <Pill tone="down">Sell {fmtCompact(sellTotal)}</Pill>
              <Pill tone="neutral">Cash after {fmtCompact(CASH_TOTAL - buyTotal + sellTotal)}</Pill>
              <Button tone="primary" onClick={() => setApplied(breaches.map((b) => b.ticker))}>
                <IconTarget size={13} /> Stage all trades
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto px-2 py-1">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-ink-850 text-[9.5px] uppercase tracking-wider text-mist-500">
                  <th className="px-3 py-2 text-left font-medium">Position</th>
                  <th className="px-3 py-2 text-right font-medium">Actual</th>
                  <th className="px-3 py-2 text-right font-medium">Target</th>
                  <th className="px-3 py-2 text-center font-medium">Drift</th>
                  <th className="px-3 py-2 text-right font-medium">Trade</th>
                  <th className="px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {DRIFT.map((d) => {
                  const h = HOLDINGS.find((x) => x.ticker === d.ticker)!;
                  const staged = applied.includes(d.ticker);
                  return (
                    <tr
                      key={d.ticker}
                      onClick={() => setFocus(d.ticker)}
                      className="cursor-pointer border-b border-ink-850 last:border-0 hover:bg-ink-850/60"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11.5px] font-semibold text-mist-100">{d.ticker}</span>
                          <span className="hidden max-w-[220px] truncate text-[10.5px] text-mist-500 sm:block">
                            {d.name}
                          </span>
                        </div>
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-[11.5px] text-mist-200">{d.weight.toFixed(2)}%</td>
                      <td className="tnum px-3 py-2.5 text-right text-[11.5px] text-mist-500">{d.target.toFixed(1)}%</td>
                      <td className="px-3 py-2.5">
                        <div className="relative mx-auto h-4 w-40">
                          <div className="absolute left-1/2 top-0 h-full w-px bg-ink-600" />
                          <div
                            className={cn(
                              "absolute top-1/2 h-1.5 -translate-y-1/2 rounded-sm",
                              d.drift >= 0 ? "bg-gold/80" : "bg-azure/80",
                            )}
                            style={
                              d.drift >= 0
                                ? { left: "50%", width: `${(Math.abs(d.drift) / maxDrift) * 50}%` }
                                : { right: "50%", width: `${(Math.abs(d.drift) / maxDrift) * 50}%` }
                            }
                          />
                        </div>
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-[11.5px]">
                        <span className={d.action === "Hold" ? "text-mist-500" : "text-mist-100"}>
                          {d.action === "Hold" ? "—" : `${d.deltaUSD > 0 ? "+" : "−"}${fmtCompact(Math.abs(d.deltaUSD))}`}
                        </span>
                        {d.action !== "Hold" && (
                          <div className="text-[9.5px] text-mist-500">
                            {Math.abs(d.deltaUSD / h.price) < 1
                              ? (d.deltaUSD / h.price).toFixed(3)
                              : Math.round(Math.abs(d.deltaUSD / h.price))}{" "}
                            sh
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {d.action === "Hold" ? (
                          <span className="text-[10.5px] text-mist-500">In band</span>
                        ) : staged ? (
                          <Pill tone="acc">
                            <IconCheck size={10} /> Staged
                          </Pill>
                        ) : (
                          <Pill tone={d.action === "Buy" ? "up" : "down"}>{d.action}</Pill>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-800 px-5 py-3 text-[10.5px] text-mist-500">
            <span>
              Cash weight {CASH_WEIGHT.toFixed(1)}% versus a 5.0% policy ceiling — deploying the excess closes{" "}
              {breaches.filter((b) => b.action === "Buy").length} underweights.
            </span>
            <span>Bands: ±0.75pp · tax-aware ordering prefers long-term lots</span>
          </div>
        </Panel>

        {/* sector vs benchmark */}
        <Panel className="xl:col-span-7">
          <PanelHead title="Sector tilts versus the index" sub="Active weight against S&P 500 sector weights" />
          <div className="mt-3 space-y-2">
            {sectorRows.map((s) => {
              const active = s.w - s.bench;
              return (
                <div key={s.label} className="grid grid-cols-[150px_1fr_54px] items-center gap-3">
                  <span className="truncate text-[11px] text-mist-300">{s.label}</span>
                  <div className="relative h-4">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-ink-600" />
                    <div
                      className={cn(
                        "absolute top-1/2 h-2 -translate-y-1/2 rounded-sm",
                        active >= 0 ? "bg-acc/70" : "bg-violet/70",
                      )}
                      style={
                        active >= 0
                          ? { left: "50%", width: `${Math.min(50, (Math.abs(active) / 22) * 50)}%` }
                          : { right: "50%", width: `${Math.min(50, (Math.abs(active) / 22) * 50)}%` }
                      }
                    />
                  </div>
                  <span className={cn("tnum text-right text-[11px] font-medium", clsTone(active))}>
                    {active >= 0 ? "+" : "−"}
                    {Math.abs(active).toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t border-ink-800 pt-2.5 text-[10.5px] text-mist-500">
            Overweights in teal, underweights in violet. Broad-market ETFs are mapped to their own bucket rather than
            look-through, so true technology exposure is roughly 6pp higher than shown.
          </div>
        </Panel>

        {/* factors + currency */}
        <div className="space-y-3 xl:col-span-5">
          <Panel>
            <PanelHead title="Style tilts" sub="Derived from position-level factor loadings" />
            <div className="mt-4 space-y-4">
              {FACTORS.map((f) => (
                <div key={f.k}>
                  <div className="flex items-center justify-between text-[10px] text-mist-500">
                    <span>{f.left}</span>
                    <span className="text-[10.5px] text-mist-300">{f.k}</span>
                    <span>{f.right}</span>
                  </div>
                  <div className="relative mt-1.5 h-2 rounded-full bg-ink-800">
                    <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-ink-600" />
                    <div
                      className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-900 bg-acc shadow"
                      style={{ left: `${50 - f.v / 2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Currency exposure" sub="Look-through of listing and revenue mix" />
            <div className="mt-3 flex h-3 overflow-hidden rounded-full">
              {CURRENCY.map((c, i) => (
                <div
                  key={c.k}
                  style={{
                    width: `${c.v}%`,
                    background: ["#63e6d2", "#a894fa", "#f2c572", "#63a7ff", "#5b6575"][i],
                  }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {CURRENCY.map((c, i) => (
                <div key={c.k}>
                  <div className="flex items-center gap-1.5">
                    <i
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: ["#63e6d2", "#a894fa", "#f2c572", "#63a7ff", "#5b6575"][i] }}
                    />
                    <span className="text-[10.5px] text-mist-400">{c.k}</span>
                  </div>
                  <div className="tnum mt-0.5 text-[12px] font-medium text-mist-100">{c.v}%</div>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-ink-800 pt-2.5 text-[10.5px] leading-relaxed text-mist-500">
              Unhedged. A 5% dollar rally would cost roughly {fmtCompact(TOTAL_VALUE * 0.216 * 0.05)} on translation,
              before any revenue offset.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
