import { useEffect, useState } from "react";
import { useApp } from "@/app/state";
import { holdingByTicker, DATES, N } from "@/data/portfolio";
import { NEWS } from "@/data/signals";
import { LineChart } from "@/components/charts/LineChart";
import { Delta, KV, Label, Pill, Bar, Ticker } from "@/components/ui/Primitives";
import { IconX, IconArrow, IconCalendar } from "@/components/ui/icons";
import { fmtUSD, fmtUSD0, fmtPct, fmtQty, clsTone, fmtDate, relTime, fmtCompact } from "@/lib/format";
import { cn } from "@/utils/cn";

const RANGES = ["1M", "3M", "6M", "1Y", "3Y"] as const;
const BACK: Record<(typeof RANGES)[number], number> = { "1M": 22, "3M": 64, "6M": 127, "1Y": 253, "3Y": N };

export function HoldingDrawer() {
  const { focus, setFocus } = useApp();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1Y");
  const h = focus ? holdingByTicker(focus) : undefined;

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setFocus(null);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setFocus]);

  if (!h) return null;

  const start = Math.max(0, N - BACK[range]);
  const slice = h.series.slice(start);
  const labels = DATES.slice(start);
  const periodRet = (slice[slice.length - 1] / slice[0] - 1) * 100;
  const pos52 = ((h.price - h.low52) / (h.high52 - h.low52)) * 100;
  const news = NEWS.filter((n) => n.tickers.includes(h.ticker));
  const analyst = h.analyst;
  const totalRatings = analyst ? analyst.buy + analyst.hold + analyst.sell : 0;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-[2px]" onClick={() => setFocus(null)} />
      <aside className="animate-rise relative flex h-full w-full max-w-[560px] flex-col overflow-y-auto border-l border-ink-750 bg-ink-900 shadow-2xl">
        {/* header */}
        <div className="sticky top-0 z-10 border-b border-ink-800 bg-ink-900/95 px-5 py-4 backdrop-blur">
          <div className="flex items-start gap-3">
            <Ticker t={h.ticker} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[15px] font-semibold text-mist-100">{h.name}</h2>
                <Pill tone="neutral">{h.assetClass}</Pill>
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="tnum text-[13px] text-mist-400">{h.ticker}</span>
                <span className="tnum text-[17px] font-semibold text-mist-100">{fmtUSD(h.price)}</span>
                <Delta value={h.dayChangePct} />
                <span className={cn("tnum text-[11px]", clsTone(h.dayChange))}>
                  {h.dayChange >= 0 ? "+" : "−"}
                  {fmtUSD(Math.abs(h.dayChange))}
                </span>
              </div>
            </div>
            <button onClick={() => setFocus(null)} className="rounded-lg p-1.5 text-mist-500 hover:bg-ink-800 hover:text-mist-200">
              <IconX size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {/* chart */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <Label>Price</Label>
                <Delta value={periodRet} size="sm" />
                <span className="text-[10px] text-mist-500">over {range}</span>
              </div>
              <div className="flex gap-0.5">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      r === range ? "bg-ink-700 text-mist-100" : "text-mist-500 hover:text-mist-200",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <LineChart
              labels={labels}
              height={180}
              yFmt={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`}
              tipFmt={(v) => fmtUSD(v)}
              series={[
                {
                  id: `d-${h.ticker}`,
                  label: h.ticker,
                  values: slice,
                  color: periodRet >= 0 ? "#3ddc97" : "#ff6b81",
                  area: true,
                },
              ]}
            />
          </div>

          {/* 52w range */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] text-mist-500">
              <span className="tnum">{fmtUSD(h.low52)}</span>
              <Label>52-week range</Label>
              <span className="tnum">{fmtUSD(h.high52)}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-gradient-to-r from-down/35 via-ink-700 to-up/35">
              <div
                className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mist-100 shadow"
                style={{ left: `${Math.max(2, Math.min(98, pos52))}%` }}
              />
            </div>
          </div>

          {/* position */}
          <div className="grid grid-cols-2 gap-x-5 rounded-lg border border-ink-800 bg-ink-880 p-4 sm:grid-cols-3">
            <KV k="Quantity" v={fmtQty(h.qty)} />
            <KV k="Avg cost" v={fmtUSD(h.avgCost)} />
            <KV k="Market value" v={fmtUSD0(h.marketValue)} />
            <KV k="Cost basis" v={fmtUSD0(h.costBasis)} />
            <KV
              k="Unrealised P&L"
              v={`${h.unrealized >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(h.unrealized))}`}
              tone={clsTone(h.unrealized)}
            />
            <KV k="Return" v={fmtPct(h.unrealizedPct)} tone={clsTone(h.unrealizedPct)} />
            <KV k="Weight" v={`${h.weight.toFixed(2)}%`} />
            <KV k="Day P&L" v={`${h.dayPL >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(h.dayPL))}`} tone={clsTone(h.dayPL)} />
            <KV k="Account" v={h.account} />
          </div>

          {/* metrics row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Beta", v: h.beta.toFixed(2) },
              { k: "Volatility", v: `${h.volatility.toFixed(1)}%` },
              { k: "Div yield", v: `${h.divYield.toFixed(2)}%` },
              { k: "Yield on cost", v: `${h.yieldOnCost.toFixed(2)}%` },
            ].map((m) => (
              <div key={m.k} className="rounded-lg border border-ink-800 bg-ink-880 px-3 py-2.5">
                <Label>{m.k}</Label>
                <div className="tnum mt-1 text-[14px] font-semibold text-mist-100">{m.v}</div>
              </div>
            ))}
          </div>

          {/* period returns */}
          <div>
            <Label>Trailing returns</Label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {[
                { k: "1W", v: h.r1w },
                { k: "1M", v: h.r1m },
                { k: "3M", v: h.r3m },
                { k: "YTD", v: h.rYtd },
                { k: "1Y", v: h.r1y },
              ].map((p) => (
                <div key={p.k} className="rounded-lg border border-ink-800 bg-ink-880 p-2 text-center">
                  <div className="text-[9.5px] text-mist-500">{p.k}</div>
                  <div className={cn("tnum mt-0.5 text-[12px] font-semibold", clsTone(p.v))}>
                    {p.v >= 0 ? "+" : "−"}
                    {Math.abs(p.v).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* thesis */}
          <div className="rounded-lg border border-ink-800 bg-gradient-to-br from-violet/[0.06] to-transparent p-4">
            <div className="flex items-center justify-between">
              <Label>Investment thesis</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={cn("h-1.5 w-3 rounded-sm", i <= h.conviction ? "bg-violet" : "bg-ink-700")}
                  />
                ))}
                <span className="ml-1 text-[10px] text-mist-500">conviction {h.conviction}/5</span>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-mist-300">{h.thesis}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {h.tags.map((t) => (
                <Pill key={t} tone={t === "Under review" || t === "Loser" ? "down" : "neutral"}>
                  {t}
                </Pill>
              ))}
            </div>
          </div>

          {/* lots */}
          <div>
            <Label>Tax lots</Label>
            <div className="mt-2 overflow-hidden rounded-lg border border-ink-800">
              <table className="w-full text-[11.5px]">
                <thead className="bg-ink-880 text-[10px] uppercase tracking-wider text-mist-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Opened</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Cost</th>
                    <th className="px-3 py-2 text-right font-medium">P&L</th>
                    <th className="px-3 py-2 text-right font-medium">Term</th>
                  </tr>
                </thead>
                <tbody>
                  {h.lots.map((l) => {
                    const pl = (h.price - l.price) * l.qty;
                    const days = (new Date("2026-02-13").getTime() - new Date(l.date).getTime()) / 86400000;
                    return (
                      <tr key={l.id} className="border-t border-ink-800">
                        <td className="px-3 py-2 text-mist-300">{fmtDate(l.date)}</td>
                        <td className="tnum px-3 py-2 text-right text-mist-300">{fmtQty(l.qty)}</td>
                        <td className="tnum px-3 py-2 text-right text-mist-300">{fmtUSD(l.price)}</td>
                        <td className={cn("tnum px-3 py-2 text-right font-medium", clsTone(pl))}>
                          {pl >= 0 ? "+" : "−"}
                          {fmtCompact(Math.abs(pl))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Pill tone={days > 365 ? "up" : "gold"}>{days > 365 ? "Long" : "Short"}</Pill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* analyst */}
          {analyst && (
            <div className="rounded-lg border border-ink-800 bg-ink-880 p-4">
              <div className="flex items-center justify-between">
                <Label>Street consensus</Label>
                <span className="text-[10px] text-mist-500">{totalRatings} analysts</span>
              </div>
              <div className="mt-2.5 flex h-2 overflow-hidden rounded-full">
                <div className="bg-up" style={{ width: `${(analyst.buy / totalRatings) * 100}%` }} />
                <div className="bg-mist-500" style={{ width: `${(analyst.hold / totalRatings) * 100}%` }} />
                <div className="bg-down" style={{ width: `${(analyst.sell / totalRatings) * 100}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10.5px]">
                <span className="text-up">{analyst.buy} buy</span>
                <span className="text-mist-400">{analyst.hold} hold</span>
                <span className="text-down">{analyst.sell} sell</span>
              </div>
              <div className="mt-3 border-t border-ink-800 pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-mist-500">Mean target</span>
                  <span className="tnum font-medium text-mist-100">
                    {fmtUSD(analyst.pt)}
                    <span className={cn("ml-2", clsTone(analyst.pt - h.price))}>
                      {fmtPct((analyst.pt / h.price - 1) * 100, 1)}
                    </span>
                  </span>
                </div>
                <Bar className="mt-2" pct={Math.min(100, (h.price / analyst.pt) * 100)} tone="violet" />
              </div>
            </div>
          )}

          {h.nextEarnings && (
            <div className="flex items-center gap-2.5 rounded-lg border border-gold/20 bg-gold/[0.05] px-3.5 py-2.5">
              <IconCalendar size={14} className="text-gold" />
              <span className="text-[12px] text-mist-200">
                Next earnings <strong className="font-medium">{fmtDate(h.nextEarnings)}</strong>
              </span>
              <span className="ml-auto text-[10.5px] text-mist-500">{h.weight.toFixed(1)}% of book at risk</span>
            </div>
          )}

          {/* news */}
          {news.length > 0 && (
            <div>
              <Label>Linked news</Label>
              <div className="mt-2 space-y-1.5">
                {news.map((n) => (
                  <div key={n.id} className="group rounded-lg border border-ink-800 bg-ink-880 p-3">
                    <div className="flex items-start gap-2">
                      <span
                        className={cn(
                          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                          n.sentiment > 0.2 ? "bg-up" : n.sentiment < -0.2 ? "bg-down" : "bg-mist-500",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-[12px] leading-snug text-mist-200 group-hover:text-mist-100">{n.headline}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-mist-500">
                          <span>{n.source}</span>
                          <span>·</span>
                          <span>{relTime(n.at)}</span>
                          <span>·</span>
                          <span>{n.category}</span>
                        </div>
                      </div>
                      <IconArrow size={13} className="ml-auto mt-1 shrink-0 text-mist-500 opacity-0 transition group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
