import { useState } from "react";
import { BENCH_SERIES, DATES, HOLDINGS, N, groupBy } from "@/data/portfolio";
import { NEWS, WATCHLIST, JOURNAL, newsExposure } from "@/data/signals";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Pill, Segmented } from "@/components/ui/Primitives";
import { PageHeader } from "@/components/ui/PageHeader";
import { LineChart } from "@/components/charts/LineChart";
import { Sparkline } from "@/components/charts/Micro";
import { fmtPct, clsTone, relTime, fmtDate, fmtCompact } from "@/lib/format";
import { cn } from "@/utils/cn";
import { IconArrow, IconSpark } from "@/components/ui/icons";

const INDICES = [
  { k: "S&P 500", v: 6412.4, c: 0.34 },
  { k: "Nasdaq 100", v: 23180.7, c: 0.61 },
  { k: "Russell 2000", v: 2418.9, c: -0.22 },
  { k: "US 10Y", v: 3.94, c: -0.04, unit: "%" },
  { k: "VIX", v: 14.8, c: -3.1 },
  { k: "Gold", v: 2986.5, c: 0.48 },
  { k: "Brent", v: 71.2, c: -1.15 },
  { k: "DXY", v: 101.4, c: 0.12 },
];

export function Markets() {
  const [range, setRange] = useState<"3M" | "1Y" | "3Y">("1Y");
  const back = range === "3M" ? 64 : range === "1Y" ? 253 : N;
  const start = Math.max(0, N - back);
  const sectors = groupBy("sector");

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader title="Markets" sub="The tape, seen through the lens of what you own." right={<Segmented options={["3M", "1Y", "3Y"] as const} value={range} onChange={setRange} />} />
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {INDICES.map((i) => (
          <Panel key={i.k} className="py-3">
            <Label>{i.k}</Label>
            <div className="tnum mt-1 text-[15px] font-semibold text-mist-100">
              {i.v.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              {i.unit}
            </div>
            <div className={cn("tnum mt-0.5 text-[10.5px]", clsTone(i.c))}>{fmtPct(i.c)}</div>
          </Panel>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelHead title="S&P 500" sub="Your benchmark of record" />
          <div className="mt-3">
            <LineChart
              labels={DATES.slice(start)}
              height={280}
              series={[{ id: "spx", label: "S&P 500", values: BENCH_SERIES.slice(start), color: "#a894fa", area: true }]}
              yFmt={(v) => v.toFixed(0)}
            />
          </div>
        </Panel>
        <Panel className="xl:col-span-4">
          <PanelHead title="Your sectors today" sub="Weighted day change of sectors you hold" />
          <div className="mt-3 space-y-1.5">
            {sectors.map((s) => {
              const chg = s.holdings.reduce((a, h) => a + h.dayChangePct * h.marketValue, 0) / s.value;
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[11px] text-mist-300">{s.label}</span>
                  <span className="tnum text-[10px] text-mist-500">{s.weight.toFixed(1)}%</span>
                  <div className="relative h-4 w-24">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-ink-700" />
                    <div
                      className={cn("absolute top-1/2 h-1.5 -translate-y-1/2 rounded-sm", chg >= 0 ? "bg-up/70" : "bg-down/70")}
                      style={chg >= 0 ? { left: "50%", width: `${Math.min(50, Math.abs(chg) * 25)}%` } : { right: "50%", width: `${Math.min(50, Math.abs(chg) * 25)}%` }}
                    />
                  </div>
                  <span className={cn("tnum w-12 text-right text-[11px]", clsTone(chg))}>{fmtPct(chg, 1)}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function NewsPage() {
  const { setFocus } = useApp();
  const [only, setOnly] = useState(false);
  const items = only ? NEWS.filter((n) => newsExposure(n).weight > 0) : NEWS;
  return (
    <div className="animate-rise mx-auto max-w-[1100px]">
      <PageHeader
        title="News"
        sub="Every story is checked against your holdings, so relevance is measured in basis points rather than clicks."
        right={
          <button
            onClick={() => setOnly(!only)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[11.5px] font-medium",
              only ? "border-acc/30 bg-acc/10 text-acc" : "border-ink-750 bg-ink-900 text-mist-400",
            )}
          >
            {only ? "Holdings only" : "All stories"}
          </button>
        }
      />
      <div className="space-y-2">
        {items.map((n) => {
          const ex = newsExposure(n);
          return (
            <Panel key={n.id} className="transition-colors hover:border-ink-700">
              <div className="flex items-start gap-3">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.sentiment > 0.2 ? "bg-up" : n.sentiment < -0.2 ? "bg-down" : "bg-mist-500")} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-medium leading-snug text-mist-100">{n.headline}</h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-mist-400">{n.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-mist-500">
                    <span>{n.source}</span>
                    <span>·</span>
                    <span>{relTime(n.at)}</span>
                    <Pill tone="neutral">{n.category}</Pill>
                    {ex.held.map((h) => (
                      <button key={h.ticker} onClick={() => setFocus(h.ticker)} className="rounded border border-ink-750 px-1.5 py-0.5 text-[10px] text-mist-300 hover:border-acc/40 hover:text-acc">
                        {h.ticker} {h.weight.toFixed(1)}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <Label>Book exposure</Label>
                  <div className="tnum text-[14px] font-semibold text-mist-100">{ex.weight.toFixed(1)}%</div>
                  <div className="tnum text-[10px] text-mist-500">{fmtCompact(ex.value)}</div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export function Research() {
  const { setFocus } = useApp();
  return (
    <div className="animate-rise mx-auto max-w-[1300px]">
      <PageHeader title="Research" sub="Theses you have written, candidates you are underwriting, and the evidence behind both." />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <PanelHead title="Live theses" sub="One paragraph per position — the test you will judge it against" />
          <div className="mt-3 space-y-2.5">
            {HOLDINGS.slice(0, 8).map((h) => (
              <button key={h.ticker} onClick={() => setFocus(h.ticker)} className="block w-full rounded-lg border border-ink-800 bg-ink-880 p-3 text-left transition-colors hover:border-ink-700">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-mist-100">{h.ticker}</span>
                  <span className="min-w-0 flex-1 truncate text-[10.5px] text-mist-500">{h.name}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={cn("h-1.5 w-2.5 rounded-sm", i <= h.conviction ? "bg-violet" : "bg-ink-700")} />
                    ))}
                  </div>
                  <Sparkline values={h.series.slice(-60)} width={60} height={20} fill={false} />
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist-400">{h.thesis}</p>
              </button>
            ))}
          </div>
        </Panel>
        <div className="space-y-3 lg:col-span-5">
          <Panel>
            <PanelHead title="Underwriting queue" sub="Not owned yet" />
            <div className="mt-2 divide-y divide-ink-850">
              {WATCHLIST.map((w) => (
                <div key={w.ticker} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-mist-100">{w.ticker}</span>
                    <span className="flex-1 truncate text-[10.5px] text-mist-500">{w.name}</span>
                    <Pill tone={w.status === "Queued" ? "acc" : "neutral"}>{w.status}</Pill>
                  </div>
                  <p className="mt-1 text-[11px] text-mist-400">{w.note}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="bg-gradient-to-br from-violet/[0.06] to-transparent">
            <div className="flex items-center gap-2">
              <IconSpark size={14} className="text-violet" />
              <h3 className="text-[12.5px] font-semibold text-mist-100">Screens</h3>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {["Quality compounders · ROIC > 15%", "Dividend growers · 10y streak", "Net-cash technology", "Deep value ex-US"].map((s) => (
                <div key={s} className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-880 px-3 py-2 text-[11.5px] text-mist-300">
                  {s}
                  <IconArrow size={12} className="ml-auto text-mist-500" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function Journal() {
  const { setFocus } = useApp();
  return (
    <div className="animate-rise mx-auto max-w-[900px]">
      <PageHeader title="Decision journal" sub="What you did, why you did it, and what would prove you wrong." />
      <div className="relative space-y-3 border-l border-ink-800 pl-6">
        {JOURNAL.map((j) => (
          <div key={j.id} className="relative">
            <span className="absolute -left-[29px] top-3 h-2 w-2 rounded-full bg-acc ring-4 ring-ink-950" />
            <Panel>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={j.kind === "Decision" ? "acc" : j.kind === "Review" ? "gold" : "neutral"}>{j.kind}</Pill>
                <h3 className="text-[13px] font-semibold text-mist-100">{j.title}</h3>
                {j.ticker && (
                  <button onClick={() => setFocus(j.ticker!)} className="text-[11px] text-acc hover:underline">
                    {j.ticker}
                  </button>
                )}
                <span className="ml-auto text-[10.5px] text-mist-500">{fmtDate(j.date)}</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-mist-300">{j.body}</p>
            </Panel>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Settings() {
  const { privacy, setPrivacy } = useApp();
  const rows = [
    { k: "Base currency", v: "USD" },
    { k: "Benchmark of record", v: "S&P 500 Total Return" },
    { k: "Rebalance band", v: "±0.75pp" },
    { k: "Cash policy ceiling", v: "5.0% of book" },
    { k: "Max single position", v: "12.0%" },
    { k: "Performance method", v: "Time-weighted, daily" },
    { k: "Cost basis method", v: "Specific lot" },
    { k: "Review cadence", v: "Quarterly" },
  ];
  return (
    <div className="animate-rise mx-auto max-w-[760px]">
      <PageHeader title="Settings" sub="The policy that the rest of the application enforces on your behalf." />
      <Panel flush>
        <div className="divide-y divide-ink-850">
          {rows.map((r) => (
            <div key={r.k} className="flex items-center justify-between px-5 py-3">
              <span className="text-[12px] text-mist-300">{r.k}</span>
              <span className="tnum text-[12px] font-medium text-mist-100">{r.v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3">
            <div>
              <span className="text-[12px] text-mist-300">Privacy mode</span>
              <p className="text-[10.5px] text-mist-500">Blur every monetary figure</p>
            </div>
            <button
              onClick={() => setPrivacy(!privacy)}
              className={cn("h-5 w-9 rounded-full p-0.5 transition-colors", privacy ? "bg-acc/70" : "bg-ink-700")}
            >
              <span className={cn("block h-4 w-4 rounded-full bg-mist-100 transition-transform", privacy && "translate-x-4")} />
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
