import { useMemo, useState } from "react";
import {
  HOLDINGS, ANNUAL_INCOME, CASH_INCOME, PORT_YIELD, DIV_CALENDAR, DIV_HISTORY, CASH, CASH_TOTAL, INVESTED, TOTAL_COST,
} from "@/data/portfolio";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Pill, Bar } from "@/components/ui/Primitives";
import { PageHeader } from "@/components/ui/PageHeader";
import { fmtUSD0, fmtUSD, MONTHS, clsTone } from "@/lib/format";
import { cn } from "@/utils/cn";
import { IconCoins, IconCalendar } from "@/components/ui/icons";

const MONTHLY_EXPENSES = 4200;

export function Income() {
  const { setFocus } = useApp();
  const [month, setMonth] = useState<number | null>(null);

  const payers = useMemo(
    () => HOLDINGS.filter((h) => h.annualIncome > 0).sort((a, b) => b.annualIncome - a.annualIncome),
    [],
  );

  const monthly = useMemo(() => {
    const out: { m: number; year: number; total: number; items: { ticker: string; amount: number }[] }[] = [];
    for (let k = 0; k < 12; k++) {
      const m = (1 + k) % 12;
      const year = 2026 + (1 + k >= 12 ? 1 : 0);
      const items = DIV_CALENDAR.filter((d) => d.month === m).map((d) => ({ ticker: d.ticker, amount: d.amount }));
      out.push({ m, year, total: items.reduce((a, i) => a + i.amount, 0), items });
    }
    return out;
  }, []);

  const maxMonth = Math.max(...monthly.map((m) => m.total), 1);
  const total = ANNUAL_INCOME + CASH_INCOME;
  const yoc = (ANNUAL_INCOME / TOTAL_COST) * 100;
  const growth = ((DIV_HISTORY[3].amount / DIV_HISTORY[2].amount - 1) * 100);
  const selected = month === null ? null : monthly.find((x) => x.m === month)!;
  const maxIncome = Math.max(...payers.map((p) => p.annualIncome));

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader
        title="Income"
        sub="Forward-looking dividends and interest, projected from current positions and declared rates."
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* hero */}
        <Panel className="xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <Label>Forward 12-month income</Label>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="tnum text-[32px] font-semibold leading-none text-mist-100">{fmtUSD0(total)}</span>
                <Pill tone="up">+{growth.toFixed(0)}% YoY</Pill>
              </div>
              <div className="mt-2 text-[11px] text-mist-500">
                <span className="tnum text-mist-300">{fmtUSD0(total / 12)}</span> per month ·{" "}
                <span className="tnum text-mist-300">{fmtUSD0(total / 365)}</span> per day
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
              {[
                { k: "Portfolio yield", v: `${PORT_YIELD.toFixed(2)}%` },
                { k: "Yield on cost", v: `${yoc.toFixed(2)}%` },
                { k: "Payers", v: `${payers.length}/${HOLDINGS.length}` },
                { k: "Cash yield", v: `${((CASH_INCOME / CASH_TOTAL) * 100).toFixed(2)}%` },
              ].map((s) => (
                <div key={s.k}>
                  <Label>{s.k}</Label>
                  <div className="tnum mt-1 text-[16px] font-semibold text-mist-100">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* calendar */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <Label>Projected payments by month</Label>
              <span className="text-[10px] text-mist-500">Click a column for detail</span>
            </div>
            <div className="mt-3 flex h-[168px] items-end gap-2">
              {monthly.map((m) => (
                <button
                  key={`${m.year}-${m.m}`}
                  onClick={() => setMonth(month === m.m ? null : m.m)}
                  className="group flex h-full flex-1 flex-col justify-end gap-1.5"
                >
                  <span
                    className={cn(
                      "tnum text-center text-[9px] transition-opacity",
                      month === m.m ? "text-gold" : "text-mist-500 opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {Math.round(m.total)}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-[3px] transition-all",
                      month === m.m ? "bg-gold" : "bg-gold/45 group-hover:bg-gold/75",
                    )}
                    style={{ height: `${Math.max((m.total / maxMonth) * 100, 2)}%` }}
                  />
                  <span
                    className={cn(
                      "text-center text-[9.5px]",
                      month === m.m ? "text-mist-100" : "text-mist-500",
                    )}
                  >
                    {MONTHS[m.m].slice(0, 3)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="mt-3 rounded-lg border border-ink-800 bg-ink-850/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-mist-100">
                  {MONTHS[selected.m]} {selected.year}
                </span>
                <span className="tnum text-[13px] font-semibold text-gold">{fmtUSD(selected.total)}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {selected.items
                  .sort((a, b) => b.amount - a.amount)
                  .map((i) => (
                    <button
                      key={i.ticker}
                      onClick={() => setFocus(i.ticker)}
                      className="flex items-center gap-1.5 rounded-md border border-ink-750 bg-ink-880 px-2 py-1 text-[10.5px] hover:border-ink-600"
                    >
                      <span className="font-medium text-mist-200">{i.ticker}</span>
                      <span className="tnum text-mist-400">{fmtUSD(i.amount)}</span>
                    </button>
                  ))}
                {selected.items.length === 0 && <span className="text-[11px] text-mist-500">No dividends scheduled</span>}
              </div>
            </div>
          )}
        </Panel>

        {/* coverage + history */}
        <div className="space-y-3 xl:col-span-4">
          <Panel>
            <PanelHead title="Expense coverage" sub="Against stated monthly spend of $4,200" />
            <div className="mt-4 flex items-baseline gap-2">
              <span className="tnum text-[26px] font-semibold text-mist-100">
                {((total / 12 / MONTHLY_EXPENSES) * 100).toFixed(0)}%
              </span>
              <span className="text-[11px] text-mist-500">of monthly expenses covered</span>
            </div>
            <Bar className="mt-3" pct={(total / 12 / MONTHLY_EXPENSES) * 100} tone="gold" />
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink-800 pt-3">
              <div>
                <Label>Monthly income</Label>
                <div className="tnum mt-1 text-[14px] font-semibold text-mist-100">{fmtUSD0(total / 12)}</div>
              </div>
              <div>
                <Label>Gap to cover</Label>
                <div className="tnum mt-1 text-[14px] font-semibold text-mist-100">
                  {fmtUSD0(Math.max(0, MONTHLY_EXPENSES - total / 12))}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-mist-500">
              At the current {growth.toFixed(0)}% growth rate and no new capital, full coverage arrives in roughly{" "}
              <span className="text-mist-300">
                {Math.ceil(Math.log(MONTHLY_EXPENSES / (total / 12)) / Math.log(1 + growth / 100))} years
              </span>
              .
            </p>
          </Panel>

          <Panel>
            <PanelHead title="Income history" sub="Received per calendar year" />
            <div className="mt-4 flex items-end gap-3" style={{ height: 120 }}>
              {DIV_HISTORY.map((d) => (
                <div key={d.year} className="group flex h-full flex-1 flex-col justify-end gap-2">
                  <span className="tnum text-center text-[10px] text-mist-400">{Math.round(d.amount / 100) / 10}k</span>
                  <div
                    className={cn(
                      "w-full rounded-t-[3px] transition-all",
                      d.year === 2026 ? "bg-gradient-to-t from-acc/30 to-acc/70" : "bg-ink-700 group-hover:bg-ink-600",
                    )}
                    style={{ height: `${(d.amount / DIV_HISTORY[3].amount) * 100}%` }}
                  />
                  <span className="text-center text-[9.5px] text-mist-500">
                    {d.year}
                    {d.year === 2026 && <span className="text-acc"> ·f</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-ink-800 pt-2.5 text-[10.5px] text-mist-500">
              Three-year compound growth of{" "}
              <span className="tnum text-mist-300">
                {(((DIV_HISTORY[3].amount / DIV_HISTORY[0].amount) ** (1 / 3) - 1) * 100).toFixed(1)}%
              </span>{" "}
              per year, with no dividend cuts received.
            </div>
          </Panel>
        </div>

        {/* by holding */}
        <Panel className="xl:col-span-8" flush>
          <div className="px-5 pb-1 pt-4">
            <PanelHead title="Income by position" sub="Forward annual dividends at today's declared rate" />
          </div>
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-ink-850 text-[9.5px] uppercase tracking-wider text-mist-500">
                  <th className="px-3 py-2 text-left font-medium">Position</th>
                  <th className="px-3 py-2 text-right font-medium">Yield</th>
                  <th className="px-3 py-2 text-right font-medium">On cost</th>
                  <th className="px-3 py-2 text-left font-medium">Schedule</th>
                  <th className="px-3 py-2 text-right font-medium">Annual</th>
                  <th className="px-3 py-2 text-right font-medium">Share of income</th>
                </tr>
              </thead>
              <tbody>
                {payers.map((h) => (
                  <tr
                    key={h.ticker}
                    onClick={() => setFocus(h.ticker)}
                    className="cursor-pointer border-b border-ink-850 last:border-0 hover:bg-ink-850/60"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] font-semibold text-mist-100">{h.ticker}</span>
                        <span className="hidden max-w-[180px] truncate text-[10.5px] text-mist-500 sm:block">
                          {h.name}
                        </span>
                      </div>
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-[11.5px] text-mist-200">{h.divYield.toFixed(2)}%</td>
                    <td className={cn("tnum px-3 py-2.5 text-right text-[11.5px]", clsTone(h.yieldOnCost - h.divYield))}>
                      {h.yieldOnCost.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-[3px]">
                        {MONTHS.map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-3 w-[7px] rounded-[1.5px]",
                              h.payMonths.includes(i) ? "bg-gold/70" : "bg-ink-800",
                            )}
                          />
                        ))}
                        <span className="ml-2 text-[10px] text-mist-500">
                          {h.divFreq === 12 ? "monthly" : h.divFreq === 4 ? "quarterly" : "semi-annual"}
                        </span>
                      </div>
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-[11.5px] font-medium text-mist-100">
                      {fmtUSD0(h.annualIncome)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-800">
                          <div className="h-full rounded-full bg-gold/70" style={{ width: `${(h.annualIncome / maxIncome) * 100}%` }} />
                        </div>
                        <span className="tnum w-10 text-right text-[11px] text-mist-400">
                          {((h.annualIncome / ANNUAL_INCOME) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* cash sleeve */}
        <div className="space-y-3 xl:col-span-4">
          <Panel>
            <PanelHead title="Cash interest" sub="Blended across four sleeves" />
            <div className="mt-3 flex items-baseline gap-2">
              <IconCoins size={16} className="text-gold" />
              <span className="tnum text-[22px] font-semibold text-mist-100">{fmtUSD0(CASH_INCOME)}</span>
              <span className="text-[11px] text-mist-500">per year</span>
            </div>
            <div className="mt-3 space-y-2">
              {CASH.map((c) => (
                <div key={c.id}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-mist-300">{c.label}</span>
                    <span className="tnum text-mist-100">{fmtUSD0((c.balance * c.apy) / 100)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Bar pct={(c.balance / CASH_TOTAL) * 100} tone="gold" className="h-1" />
                    <span className="tnum w-10 text-right text-[10px] text-mist-500">{c.apy.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Next payments" sub="Estimated from historical payment dates" />
            <div className="mt-2 divide-y divide-ink-850">
              {monthly[0].items
                .concat(monthly[1].items)
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 6)
                .map((i, idx) => (
                  <button
                    key={`${i.ticker}-${idx}`}
                    onClick={() => setFocus(i.ticker)}
                    className="flex w-full items-center gap-2.5 py-2 text-left"
                  >
                    <IconCalendar size={13} className="text-mist-500" />
                    <span className="text-[11.5px] font-medium text-mist-200">{i.ticker}</span>
                    <span className="text-[10.5px] text-mist-500">
                      {idx < monthly[0].items.length ? MONTHS[monthly[0].m] : MONTHS[monthly[1].m]}
                    </span>
                    <span className="tnum ml-auto text-[11.5px] text-mist-100">{fmtUSD(i.amount)}</span>
                  </button>
                ))}
            </div>
            <div className="mt-2 border-t border-ink-800 pt-2.5 text-[10.5px] text-mist-500">
              Reinvestment is off by default — dividends land in the settlement sleeve and are deployed at the monthly
              rebalance. Income is {((ANNUAL_INCOME / INVESTED) * 100).toFixed(2)}% of invested capital.
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
