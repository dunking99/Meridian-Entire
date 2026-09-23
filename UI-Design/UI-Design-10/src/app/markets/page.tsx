import Link from "next/link";
import { getPortfolio } from "@/lib/portfolio";
import { breadth, groupPerformance } from "@/lib/market";
import { db } from "@/db";
import { theses, watchlistItems } from "@/db/schema";
import { PageHeader } from "@/components/shell";
import { Badge, Chip, Delta, Empty, Panel, Sparkline, Stat, Td, Th } from "@/components/ui";
import { fmtMoney, fmtNum, fmtPct, toneClass } from "@/lib/format";

const inputCls = "rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<{ assetClass?: string; sector?: string; sort?: string; flags?: string }>;
}) {
  const sp = await searchParams;
  const portfolio = await getPortfolio();
  const [watchRows, thesisRows] = await Promise.all([
    db.select({ id: watchlistItems.instrumentId, list: watchlistItems.listName }).from(watchlistItems),
    db.select({ id: theses.instrumentId, title: theses.title, status: theses.status }).from(theses),
  ]);

  const heldIds = new Set(portfolio.positions.map((p) => p.instrument.id));
  const watchIds = new Map(watchRows.map((w) => [w.id, w.list]));
  const thesisByInstrument = new Map(thesisRows.filter((t) => t.id).map((t) => [t.id as number, t]));

  let rows = portfolio.book.list;
  const assetClasses = [...new Set(rows.map((q) => q.instrument.assetClass))].sort();
  const sectors = [...new Set(rows.map((q) => q.instrument.sector ?? "Other"))].sort();
  if (sp.assetClass && sp.assetClass !== "all") rows = rows.filter((q) => q.instrument.assetClass === sp.assetClass);
  if (sp.sector && sp.sector !== "all") rows = rows.filter((q) => (q.instrument.sector ?? "Other") === sp.sector);
  if (sp.flags === "held") rows = rows.filter((q) => heldIds.has(q.instrument.id));
  if (sp.flags === "watch") rows = rows.filter((q) => watchIds.has(q.instrument.id));

  const sortKey = sp.sort ?? "marketCap";
  rows = [...rows].sort((a, b) => {
    switch (sortKey) {
      case "r1d":
        return b.changePct - a.changePct;
      case "r1m":
        return b.r1m - a.r1m;
      case "r3m":
        return b.r3m - a.r3m;
      case "symbol":
        return a.instrument.symbol.localeCompare(b.instrument.symbol);
      default:
        return (b.instrument.marketCap ?? 0) - (a.instrument.marketCap ?? 0);
    }
  });

  const b = breadth(portfolio.book.list);
  const sectorPerf = groupPerformance(portfolio.book.list, "sector");
  const classPerf = groupPerformance(portfolio.book.list, "assetClass");
  const best = [...sectorPerf].sort((x, y) => y.r1d - x.r1d);
  const macro = portfolio.book.list.filter((q) => ["index", "macro", "commodity", "fx"].includes(q.instrument.assetClass));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Markets"
        subtitle="The whole universe, with my own book overlaid: held, watched, thesis-linked. Cross-sectional context before single-name detail."
        breadcrumb={[{ href: "/", label: "Today" }]}
        actions={
          <>
            <Link href="/markets/screener" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
              Screener →
            </Link>
            <Link href="/markets/calendar" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
              Calendar →
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Breadth (universe)" value={`${b.adv} / ${b.dec}`} sub={`${b.flat} unchanged`} />
        <Stat label="Average move" value={fmtPct(b.avg)} tone={b.avg >= 0 ? "up" : "down"} />
        <Stat label="Best sector" value={best[0]?.label ?? "—"} sub={best[0] ? fmtPct(best[0].r1d) : ""} tone="up" />
        <Stat label="Worst sector" value={best[best.length - 1]?.label ?? "—"} sub={best.length ? fmtPct(best[best.length - 1].r1d) : ""} tone="down" />
        <Stat label="Instruments" value={String(portfolio.book.list.length)} sub={`${heldIds.size} held · ${watchIds.size} watched`} />
        <Stat label="Macro reads" value={String(macro.length)} sub="rates, dollar, vol, commodities" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Sector performance" subtitle="Equal-weighted average of the names I actually track, not a vendor index">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Sector</Th>
                <Th align="right">Names</Th>
                <Th align="right">Avg 1D</Th>
                <Th align="right">Avg 1M</Th>
                <Th align="right">Market cap</Th>
                <Th>Sparkline</Th>
              </tr>
            </thead>
            <tbody>
              {sectorPerf.map((s) => (
                <tr key={s.label} className="hover:bg-slate-800/30">
                  <Td>
                    <span className="text-slate-200">{s.label}</span>
                  </Td>
                  <Td align="right">{s.count}</Td>
                  <Td align="right">
                    <Delta value={s.r1d} />
                  </Td>
                  <Td align="right">
                    <Delta value={s.r1m} />
                  </Td>
                  <Td align="right">{s.marketCap ? fmtMoney(s.marketCap, { compact: true }) : "—"}</Td>
                  <Td>
                    <Sparkline data={s.members[0]?.spark ?? []} width={90} height={20} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-4">
          <Panel title="Macro dashboard" subtitle="What the book's theses depend on">
            <div className="grid grid-cols-2 gap-2">
              {macro.map((q) => (
                <Link key={q.instrument.id} href={`/markets/${encodeURIComponent(q.instrument.symbol)}`} className="rounded border border-slate-800 px-2 py-1.5 hover:border-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-300">{q.instrument.symbol}</span>
                    <Delta value={q.changePct} />
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="tabular-nums text-slate-100">{fmtNum(q.price, q.price < 10 ? 3 : 2)}</span>
                    <span className="text-[10px] text-slate-500">1m {fmtPct(q.r1m, 1)}</span>
                  </div>
                  <Sparkline data={q.spark} width={130} height={20} className="mt-1 w-full" />
                </Link>
              ))}
            </div>
          </Panel>
          <Panel title="Asset classes">
            <div className="space-y-1.5">
              {classPerf.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    {c.label} <span className="text-slate-600">({c.count})</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Delta value={c.r1d} />
                    <span className="w-16 text-right text-[11px] text-slate-500">1m {fmtPct(c.r1m, 1)}</span>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Universe"
        subtitle="Filter or sort; every row is a link into the instrument hub"
        right={
          <form method="get" className="flex flex-wrap items-center gap-2">
            <select name="assetClass" defaultValue={sp.assetClass ?? "all"} className={inputCls}>
              <option value="all">All classes</option>
              {assetClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select name="sector" defaultValue={sp.sector ?? "all"} className={inputCls}>
              <option value="all">All sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select name="flags" defaultValue={sp.flags ?? "all"} className={inputCls}>
              <option value="all">All names</option>
              <option value="held">Held only</option>
              <option value="watch">Watchlist only</option>
            </select>
            <select name="sort" defaultValue={sortKey} className={inputCls}>
              <option value="marketCap">Sort: market cap</option>
              <option value="r1d">Sort: 1D</option>
              <option value="r1m">Sort: 1M</option>
              <option value="r3m">Sort: 3M</option>
              <option value="symbol">Sort: symbol</option>
            </select>
            <button type="submit" className="rounded bg-slate-700 px-2.5 py-1.5 text-xs text-slate-100 hover:bg-slate-600">
              Apply
            </button>
          </form>
        }
        dense
      >
        {rows.length === 0 ? (
          <Empty>No instruments match these filters.</Empty>
        ) : (
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Symbol</Th>
                  <Th>Sector / theme</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">1D</Th>
                  <Th align="right">1M</Th>
                  <Th align="right">3M</Th>
                  <Th align="right">YTD</Th>
                  <Th>30d</Th>
                  <Th align="right">% of 52w range</Th>
                  <Th>Book</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => {
                  const range = q.high52 - q.low52 || 1;
                  const pos = ((q.price - q.low52) / range) * 100;
                  const thesis = thesisByInstrument.get(q.instrument.id);
                  return (
                    <tr key={q.instrument.id} className="hover:bg-slate-800/30">
                      <Td>
                        <Link href={`/markets/${encodeURIComponent(q.instrument.symbol)}`} className="block">
                          <span className="font-semibold text-slate-100 hover:text-cyan-300">{q.instrument.symbol}</span>
                          <span className="block text-[10.5px] text-slate-500">{q.instrument.name}</span>
                        </Link>
                      </Td>
                      <Td>
                        <span className="text-[11px] text-slate-400">{q.instrument.sector}</span>
                        <span className="block text-[10px] text-slate-600">{(q.instrument.themes ?? "").split(",").filter(Boolean).join(" · ")}</span>
                      </Td>
                      <Td align="right">{fmtNum(q.price)}</Td>
                      <Td align="right">
                        <Delta value={q.changePct} />
                      </Td>
                      <Td align="right">
                        <Delta value={q.r1m} />
                      </Td>
                      <Td align="right">
                        <Delta value={q.r3m} />
                      </Td>
                      <Td align="right">
                        <Delta value={q.ytd} />
                      </Td>
                      <Td>
                        <Sparkline data={q.spark} width={80} height={20} />
                      </Td>
                      <Td align="right">
                        <span className="flex items-center justify-end gap-2">
                          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-800">
                            <span className="block h-full rounded-full bg-slate-500" style={{ width: `${Math.max(2, Math.min(100, pos))}%` }} />
                          </span>
                          <span className={`tabular-nums ${toneClass(pos - 50)}`}>{pos.toFixed(0)}%</span>
                        </span>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {heldIds.has(q.instrument.id) && <Badge tone="emerald">held</Badge>}
                          {watchIds.has(q.instrument.id) && <Badge tone="cyan">watch</Badge>}
                          {thesis && (
                            <Link href={`/research/theses/${thesis.id}`}>
                              <Badge tone="indigo">thesis</Badge>
                            </Link>
                          )}
                          {!heldIds.has(q.instrument.id) && !watchIds.has(q.instrument.id) && !thesis && <Chip>—</Chip>}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
