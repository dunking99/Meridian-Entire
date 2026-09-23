import { useMemo, useState } from "react";
import { HOLDINGS, INVESTED, DAY_PL, TOTAL_UNREALIZED, CASH, CASH_TOTAL, type Holding } from "@/data/portfolio";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Pill, Segmented } from "@/components/ui/Primitives";
import { PageHeader } from "@/components/ui/PageHeader";
import { HoldingsTable } from "@/components/HoldingsTable";
import { Treemap } from "@/components/charts/Micro";
import { fmtUSD0, fmtCompact, clsTone, fmtPct } from "@/lib/format";
import { cn } from "@/utils/cn";
import { IconSearch, IconFilter } from "@/components/ui/icons";

const GROUPS = ["Flat", "Asset class", "Sector", "Account"] as const;
const FILTERS = ["All", "Winners", "Losers", "Watch"] as const;
const VIEWS = ["Table", "Map"] as const;

const groupKey: Record<(typeof GROUPS)[number], keyof Holding | null> = {
  Flat: null,
  "Asset class": "assetClass",
  Sector: "sector",
  Account: "account",
};

export function Holdings() {
  const { setFocus } = useApp();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("Asset class");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<(typeof VIEWS)[number]>("Table");

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return HOLDINGS.filter((h) => {
      if (ql && !h.ticker.toLowerCase().includes(ql) && !h.name.toLowerCase().includes(ql) && !h.sector.toLowerCase().includes(ql))
        return false;
      if (filter === "Winners") return h.unrealized > 0;
      if (filter === "Losers") return h.unrealized < 0;
      if (filter === "Watch") return h.tags.includes("Under review");
      return true;
    });
  }, [q, filter]);

  const grouped = useMemo(() => {
    const key = groupKey[group];
    if (!key) return [{ label: `${rows.length} positions`, rows }];
    const map = new Map<string, Holding[]>();
    rows.forEach((h) => {
      const k = String(h[key]);
      map.set(k, [...(map.get(k) ?? []), h]);
    });
    return [...map.entries()]
      .map(([label, rs]) => ({ label, rows: rs }))
      .sort((a, b) => b.rows.reduce((x, h) => x + h.marketValue, 0) - a.rows.reduce((x, h) => x + h.marketValue, 0));
  }, [rows, group]);

  const shown = rows.reduce((a, h) => a + h.marketValue, 0);
  const shownPL = rows.reduce((a, h) => a + h.unrealized, 0);
  const shownDay = rows.reduce((a, h) => a + h.dayPL, 0);
  const winners = HOLDINGS.filter((h) => h.unrealized > 0).length;

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader
        title="Holdings"
        sub="Every position with quantity, cost, market value and profit. Click any row for lots, thesis and linked news."
        right={
          <>
            <Segmented options={VIEWS} value={view} onChange={setView} />
            <Segmented options={GROUPS} value={group} onChange={setGroup} />
          </>
        }
      />

      {/* summary strip */}
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { k: "Positions", v: String(rows.length), s: `${winners} in profit` },
          { k: "Market value", v: fmtUSD0(shown), s: `${((shown / INVESTED) * 100).toFixed(0)}% of invested` },
          {
            k: "Unrealised P&L",
            v: `${shownPL >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(shownPL))}`,
            s: `book ${TOTAL_UNREALIZED >= 0 ? "+" : "−"}${fmtCompact(Math.abs(TOTAL_UNREALIZED))}`,
            tone: clsTone(shownPL),
          },
          {
            k: "Day P&L",
            v: `${shownDay >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(shownDay))}`,
            s: `book ${DAY_PL >= 0 ? "+" : "−"}${fmtCompact(Math.abs(DAY_PL))}`,
            tone: clsTone(shownDay),
          },
          { k: "Cash", v: fmtUSD0(CASH_TOTAL), s: `${CASH.length} sleeves` },
        ].map((s) => (
          <Panel key={s.k} className="py-3">
            <Label>{s.k}</Label>
            <div className={cn("tnum mt-1 text-[16px] font-semibold text-mist-100", s.tone)}>{s.v}</div>
            <div className="mt-0.5 text-[10px] text-mist-500">{s.s}</div>
          </Panel>
        ))}
      </div>

      {/* controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-ink-750 bg-ink-900 px-3 py-2">
          <IconSearch size={14} className="text-mist-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by ticker, name or sector…"
            className="w-full bg-transparent text-[12px] text-mist-100 outline-none placeholder:text-mist-500"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-[10px] text-mist-500 hover:text-mist-200">
              clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <IconFilter size={13} className="text-mist-500" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                f === filter ? "bg-acc/15 text-acc ring-1 ring-inset ring-acc/25" : "text-mist-500 hover:text-mist-200",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {view === "Map" ? (
        <Panel>
          <PanelHead
            title="Position map"
            sub="Area is portfolio weight, colour is 30-day return. Click a tile to open the position."
          />
          <div className="mt-3">
            <Treemap
              height={460}
              nodes={rows.map((h) => ({
                id: h.ticker,
                value: h.marketValue,
                ret: h.r1m,
                label: h.ticker,
                sub: fmtCompact(h.marketValue),
              }))}
              onSelect={setFocus}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-mist-500">
            <span>Cash of {fmtCompact(CASH_TOTAL)} is excluded from the map</span>
            <span className="flex items-center gap-2">
              −20%
              <span className="h-2 w-28 rounded-full bg-gradient-to-r from-down via-ink-700 to-up" />
              +20%
            </span>
          </div>
        </Panel>
      ) : (
        <div className="space-y-3">
          {grouped.map((g) => {
            const val = g.rows.reduce((a, h) => a + h.marketValue, 0);
            const pl = g.rows.reduce((a, h) => a + h.unrealized, 0);
            const day = g.rows.reduce((a, h) => a + h.dayPL, 0);
            const wt = g.rows.reduce((a, h) => a + h.weight, 0);
            return (
              <Panel key={g.label} flush>
                {group !== "Flat" && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ink-800 px-5 py-2.5">
                    <span className="text-[12px] font-semibold text-mist-100">{g.label}</span>
                    <Pill tone="neutral">{g.rows.length}</Pill>
                    <span className="tnum text-[11px] text-mist-400">{fmtUSD0(val)}</span>
                    <span className="tnum text-[11px] text-mist-500">{wt.toFixed(1)}% of book</span>
                    <span className="ml-auto flex items-center gap-4">
                      <span className={cn("tnum text-[11px]", clsTone(day))}>
                        day {day >= 0 ? "+" : "−"}
                        {fmtCompact(Math.abs(day))}
                      </span>
                      <span className={cn("tnum text-[11.5px] font-medium", clsTone(pl))}>
                        {pl >= 0 ? "+" : "−"}
                        {fmtUSD0(Math.abs(pl))}
                      </span>
                    </span>
                  </div>
                )}
                <div className="px-2 py-1">
                  <HoldingsTable rows={g.rows} onSelect={setFocus} maxWeight={Math.max(...HOLDINGS.map((h) => h.weight))} />
                </div>
              </Panel>
            );
          })}

          {/* cash rows */}
          {filter === "All" && !q && (
            <Panel flush>
              <div className="flex items-center gap-x-4 border-b border-ink-800 px-5 py-2.5">
                <span className="text-[12px] font-semibold text-mist-100">Cash & equivalents</span>
                <Pill tone="neutral">{CASH.length}</Pill>
                <span className="tnum text-[11px] text-mist-400">{fmtUSD0(CASH_TOTAL)}</span>
                <span className="ml-auto text-[11px] text-mist-500">
                  blended {fmtPct(CASH.reduce((a, c) => a + c.balance * c.apy, 0) / CASH_TOTAL, 2).replace("+", "")}
                </span>
              </div>
              <div className="divide-y divide-ink-850 px-5">
                {CASH.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2.5 text-[12px]">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-ink-800 text-[9px] font-semibold text-mist-400">
                      $
                    </span>
                    <span className="flex-1 text-mist-200">{c.label}</span>
                    <span className="hidden text-[11px] text-mist-500 sm:block">{c.kind}</span>
                    <span className="w-24 text-[11px] text-mist-500">{c.account}</span>
                    <span className="tnum w-16 text-right text-[11px] text-acc">{c.apy.toFixed(2)}%</span>
                    <span className="tnum w-28 text-right font-medium text-mist-100">{fmtUSD0(c.balance)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
