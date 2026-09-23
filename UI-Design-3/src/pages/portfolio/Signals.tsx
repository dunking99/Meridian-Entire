import { useState } from "react";
import { SIGNALS, NEWS, EARNINGS, WATCHLIST, JOURNAL, newsExposure, type SignalSeverity } from "@/data/signals";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Pill } from "@/components/ui/Primitives";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtUSD0, fmtPct, clsTone, relTime, fmtDate, fmtCompact } from "@/lib/format";
import { cn } from "@/utils/cn";
import { IconAlert, IconSpark, IconArrow, IconCalendar, IconTarget } from "@/components/ui/icons";

const SEV_STYLE: Record<SignalSeverity, { dot: string; ring: string; label: string }> = {
  critical: { dot: "bg-down", ring: "border-down/30 bg-down/[0.05]", label: "Action required" },
  warning: { dot: "bg-gold", ring: "border-gold/25 bg-gold/[0.04]", label: "Worth a look" },
  info: { dot: "bg-azure", ring: "border-ink-800 bg-ink-880", label: "For information" },
  good: { dot: "bg-up", ring: "border-up/20 bg-up/[0.03]", label: "On track" },
};

export function Signals() {
  const { setFocus } = useApp();
  const [filter, setFilter] = useState<"All" | SignalSeverity>("All");
  const shown = SIGNALS.filter((s) => filter === "All" || s.severity === filter);

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader
        title="Signals"
        sub="Where the rest of Meridian meets your book. News, earnings, research and your own written rules, checked against live positions."
        right={
          <div className="flex gap-1">
            {(["All", "critical", "warning", "info", "good"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-medium capitalize transition-colors",
                  f === filter ? "bg-ink-700 text-mist-100" : "text-mist-500 hover:text-mist-200",
                )}
              >
                {f}
                {f !== "All" && (
                  <span className="ml-1.5 text-mist-500">{SIGNALS.filter((s) => s.severity === f).length}</span>
                )}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* signal cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:col-span-8">
          {shown.map((s) => (
            <div
              key={s.id}
              className={cn("flex flex-col rounded-xl border p-4 transition-colors hover:border-ink-600", SEV_STYLE[s.severity].ring)}
            >
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full", SEV_STYLE[s.severity].dot)} />
                <span className="text-[9.5px] uppercase tracking-[0.14em] text-mist-500">{s.domain}</span>
                <span className="ml-auto text-[9.5px] text-mist-500">{SEV_STYLE[s.severity].label}</span>
              </div>
              <h3 className="mt-2 text-[13px] font-semibold leading-snug text-mist-100">{s.title}</h3>
              <p className="mt-1.5 flex-1 text-[11.5px] leading-relaxed text-mist-400">{s.detail}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-800/80 pt-2.5">
                {s.metric && <span className="tnum text-[11px] font-medium text-mist-200">{s.metric}</span>}
                <div className="ml-auto flex items-center gap-1.5">
                  {s.tickers?.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFocus(t)}
                      className="rounded-md border border-ink-750 bg-ink-900 px-1.5 py-0.5 text-[10px] font-medium text-mist-300 transition-colors hover:border-acc/40 hover:text-acc"
                    >
                      {t}
                    </button>
                  ))}
                  {s.action && (
                    <span className="flex items-center gap-1 text-[10.5px] text-acc">
                      {s.action} <IconArrow size={11} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* calendar + journal */}
        <div className="space-y-3 xl:col-span-4">
          <Panel>
            <PanelHead title="Earnings calendar" sub="Positions reporting in the next quarter" />
            <div className="mt-3 space-y-1">
              {EARNINGS.slice(0, 7).map((e) => {
                const days = Math.round((new Date(e.date).getTime() - new Date("2026-02-13").getTime()) / 86400000);
                return (
                  <button
                    key={e.ticker}
                    onClick={() => setFocus(e.ticker)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-ink-850"
                  >
                    <div
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-center",
                        days <= 10 ? "border-gold/30 bg-gold/10" : "border-ink-750 bg-ink-880",
                      )}
                    >
                      <span className={cn("tnum text-[12px] font-semibold leading-none", days <= 10 ? "text-gold" : "text-mist-300")}>
                        {new Date(e.date).getUTCDate()}
                      </span>
                      <span className="text-[8px] uppercase text-mist-500">
                        {new Date(e.date).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] font-medium text-mist-100">{e.ticker}</div>
                      <div className="truncate text-[10px] text-mist-500">{e.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="tnum text-[11px] text-mist-300">{e.weight.toFixed(1)}%</div>
                      <div className="tnum text-[9.5px] text-mist-500">±{e.implied.toFixed(1)}% implied</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Decision journal" sub="Your own record, linked to positions" right={<IconSpark size={13} className="text-mist-500" />} />
            <div className="mt-2 space-y-2.5">
              {JOURNAL.slice(0, 4).map((j) => (
                <div key={j.id} className="border-l-2 border-ink-700 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-medium text-mist-100">{j.title}</span>
                    {j.ticker && (
                      <button onClick={() => setFocus(j.ticker!)} className="text-[10px] text-acc hover:underline">
                        {j.ticker}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-mist-400">{j.body}</p>
                  <div className="mt-1 flex items-center gap-2 text-[9.5px] text-mist-500">
                    <span>{fmtDate(j.date)}</span>
                    <span>·</span>
                    <span>{j.kind}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* news matched to book */}
        <Panel className="xl:col-span-8" flush>
          <div className="flex items-center justify-between border-b border-ink-800 px-5 py-3.5">
            <PanelHead title="News, matched to your book" sub="Only stories that touch a position you actually hold" />
            <Pill tone="acc">
              <IconAlert size={10} /> {NEWS.length} matched today
            </Pill>
          </div>
          <div className="divide-y divide-ink-850">
            {NEWS.map((n) => {
              const ex = newsExposure(n);
              return (
                <div key={n.id} className="group px-5 py-3.5 transition-colors hover:bg-ink-850/40">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.sentiment > 0.2 ? "bg-up" : n.sentiment < -0.2 ? "bg-down" : "bg-mist-500",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[12.5px] font-medium leading-snug text-mist-100">{n.headline}</h4>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-mist-400">{n.summary}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="text-[10px] text-mist-500">
                          {n.source} · {relTime(n.at)} · {n.category}
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {ex.held.map((h) => (
                            <button
                              key={h.ticker}
                              onClick={() => setFocus(h.ticker)}
                              className="flex items-center gap-1 rounded-md border border-ink-750 bg-ink-900 px-1.5 py-0.5 text-[10px] transition-colors hover:border-acc/40"
                            >
                              <span className="font-medium text-mist-200">{h.ticker}</span>
                              <span className="tnum text-mist-500">{h.weight.toFixed(1)}%</span>
                              <span className={cn("tnum", clsTone(h.dayChangePct))}>{fmtPct(h.dayChangePct, 1)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="hidden w-[118px] shrink-0 text-right sm:block">
                      <Label>Exposure</Label>
                      <div className="tnum mt-0.5 text-[13px] font-semibold text-mist-100">{ex.weight.toFixed(1)}%</div>
                      <div className="tnum text-[10px] text-mist-500">{fmtCompact(ex.value)}</div>
                      <div className={cn("tnum mt-1 text-[10.5px] font-medium", clsTone(ex.dayPL))}>
                        {ex.dayPL >= 0 ? "+" : "−"}
                        {fmtUSD0(Math.abs(ex.dayPL))} today
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* watchlist */}
        <div className="space-y-3 xl:col-span-4">
          <Panel>
            <PanelHead title="Watchlist" sub="Candidates with a price you would actually pay" right={<IconTarget size={13} className="text-mist-500" />} />
            <div className="mt-2 divide-y divide-ink-850">
              {WATCHLIST.map((w) => {
                const gap = ((w.price / w.target - 1) * 100);
                return (
                  <div key={w.ticker} className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-semibold text-mist-100">{w.ticker}</span>
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-mist-500">{w.name}</span>
                      <span className="tnum text-[11.5px] text-mist-200">${w.price.toFixed(2)}</span>
                      <span className={cn("tnum w-12 text-right text-[10.5px]", clsTone(w.chg))}>{fmtPct(w.chg, 1)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="relative h-1 flex-1 rounded-full bg-ink-800">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-acc/60"
                          style={{ width: `${Math.max(4, Math.min(100, 100 - gap * 4))}%` }}
                        />
                      </div>
                      <span className="tnum text-[10px] text-mist-500">
                        target ${w.target} · {gap > 0 ? `${gap.toFixed(0)}% above` : `${Math.abs(gap).toFixed(0)}% below`}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Pill tone={w.status === "Queued" ? "acc" : "neutral"}>{w.status}</Pill>
                      <span className="truncate text-[10px] text-mist-500">{w.note}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="bg-gradient-to-br from-acc/[0.06] to-transparent">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-acc/15">
                <IconCalendar size={15} className="text-acc" />
              </div>
              <div>
                <h3 className="text-[12.5px] font-semibold text-mist-100">Quarterly review due in 12 days</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-mist-400">
                  Your policy asks for a full re-underwrite of every thesis each quarter. Two positions are flagged as
                  impaired and one sits outside its size band.
                </p>
                <div className="mt-2.5 flex gap-1.5">
                  <Pill tone="down">2 impaired</Pill>
                  <Pill tone="gold">1 oversized</Pill>
                  <Pill tone="up">14 on thesis</Pill>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
