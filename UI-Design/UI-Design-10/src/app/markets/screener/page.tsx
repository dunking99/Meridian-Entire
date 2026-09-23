import Link from "next/link";
import { getPortfolio } from "@/lib/portfolio";
import { getScreenerResults } from "@/lib/queries";
import { saveScreen } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Chip, Delta, Empty, KV, Panel, Sparkline, Stat, Td, Th } from "@/components/ui";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const portfolio = await getPortfolio();
  const filters = {
    sector: sp.sector,
    assetClass: sp.assetClass,
    theme: sp.theme,
    minCap: sp.minCap ? Number(sp.minCap) : undefined,
    minR3m: sp.minR3m !== undefined && sp.minR3m !== "" ? Number(sp.minR3m) : undefined,
    maxR3m: sp.maxR3m !== undefined && sp.maxR3m !== "" ? Number(sp.maxR3m) : undefined,
    sort: sp.sort,
    dir: sp.dir,
    held: sp.held,
    watch: sp.watch,
  };
  const { rows, sectors, themes, savedScreens } = await getScreenerResults(portfolio, filters);

  const heldCount = rows.filter((r) => r.held).length;
  const watchCount = rows.filter((r) => r.watched).length;
  const thesisOrphan = rows.filter((r) => r.held && !r.thesis).length;
  const criteria = JSON.stringify(filters);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Screener"
        subtitle="Filter the tracked universe, then overlay the book. Anything that comes back held without a thesis is process debt, not an opportunity."
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/markets", label: "Markets" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Matches" value={String(rows.length)} sub={`of ${portfolio.book.list.length} tracked`} />
        <Stat label="Already held" value={String(heldCount)} sub={`${watchCount} on watchlists`} />
        <Stat label="Held without thesis" value={String(thesisOrphan)} tone={thesisOrphan ? "warn" : "up"} sub="process debt" />
        <Stat label="Saved screens" value={String(savedScreens.length)} sub="reusable filter sets" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_2.5fr]">
        <div className="space-y-4">
          <Panel title="Filter set" subtitle="GET-based, so every result is a shareable URL">
            <form method="get" className="space-y-2.5">
              <div>
                <label className={labelCls}>Sector</label>
                <select name="sector" defaultValue={sp.sector ?? "all"} className={inputCls}>
                  <option value="all">All sectors</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Asset class</label>
                <select name="assetClass" defaultValue={sp.assetClass ?? "all"} className={inputCls}>
                  <option value="all">All classes</option>
                  {["equity", "etf", "crypto", "commodity", "fx", "macro"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Theme</label>
                <select name="theme" defaultValue={sp.theme ?? "all"} className={inputCls}>
                  <option value="all">Any theme</option>
                  {themes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>Min cap ($B)</label>
                  <input name="minCap" type="number" step="any" defaultValue={sp.minCap ?? ""} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>3M ≥ %</label>
                  <input name="minR3m" type="number" step="any" defaultValue={sp.minR3m ?? ""} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>3M ≤ %</label>
                  <input name="maxR3m" type="number" step="any" defaultValue={sp.maxR3m ?? ""} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Held</label>
                  <select name="held" defaultValue={sp.held ?? "any"} className={inputCls}>
                    <option value="any">any</option>
                    <option value="yes">held only</option>
                    <option value="no">not held</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Watchlisted</label>
                  <select name="watch" defaultValue={sp.watch ?? "any"} className={inputCls}>
                    <option value="any">any</option>
                    <option value="yes">watchlist only</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Sort</label>
                  <select name="sort" defaultValue={sp.sort ?? "r3m"} className={inputCls}>
                    <option value="r3m">3M return</option>
                    <option value="r1m">1M return</option>
                    <option value="r1d">1D return</option>
                    <option value="ytd">YTD</option>
                    <option value="marketCap">Market cap</option>
                    <option value="weight">Portfolio weight</option>
                    <option value="symbol">Symbol</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Direction</label>
                  <select name="dir" defaultValue={sp.dir ?? "desc"} className={inputCls}>
                    <option value="desc">desc</option>
                    <option value="asc">asc</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500">
                  Run screen
                </button>
                <Link href="/markets/screener" className="rounded border border-slate-700 px-2 py-1.5 text-xs text-slate-400 hover:border-slate-500">
                  Reset
                </Link>
              </div>
            </form>
          </Panel>

          <Panel title="Save this screen" subtitle="Named screens re-run against live prices">
            <form action={saveScreen} className="space-y-2">
              <input type="hidden" name="criteria" value={criteria} />
              <input name="name" required placeholder="e.g. Cluster names at 3M low" className={inputCls} />
              <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">Save screen</button>
            </form>
            <div className="mt-3 space-y-1.5">
              {savedScreens.map((s) => (
                <div key={s.id} className="rounded border border-slate-800 px-2 py-1.5 text-[11px]">
                  <div className="text-slate-200">{s.name}</div>
                  <div className="truncate text-slate-600">{s.criteria}</div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <KV k="Result set" v={`${rows.length} names`} />
              <KV k="Screen type" v="cross-sectional, price-derived" />
            </div>
          </Panel>
        </div>

        <Panel title={`Results (${rows.length})`} dense>
          {rows.length === 0 ? (
            <Empty>Nothing matches. Loosen a filter — a screen that always returns empty is not telling you anything.</Empty>
          ) : (
            <div className="max-h-[780px] overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Instrument</Th>
                    <Th>Theme</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">1D</Th>
                    <Th align="right">1M</Th>
                    <Th align="right">3M</Th>
                    <Th align="right">YTD</Th>
                    <Th align="right">Market cap</Th>
                    <Th>30d</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.quote.instrument.id} className="hover:bg-slate-800/30">
                      <Td>
                        <Link href={`/markets/${encodeURIComponent(r.quote.instrument.symbol)}`} className="block">
                          <span className="font-semibold text-slate-100 hover:text-cyan-300">{r.quote.instrument.symbol}</span>
                          <span className="block text-[10.5px] text-slate-500">{r.quote.instrument.name}</span>
                        </Link>
                      </Td>
                      <Td>
                        <span className="text-[10.5px] text-slate-500">{r.quote.instrument.themes?.split(",").filter(Boolean).join(" · ")}</span>
                      </Td>
                      <Td align="right">{fmtNum(r.quote.price)}</Td>
                      <Td align="right">
                        <Delta value={r.quote.changePct} />
                      </Td>
                      <Td align="right">
                        <Delta value={r.quote.r1m} />
                      </Td>
                      <Td align="right">
                        <Delta value={r.quote.r3m} />
                      </Td>
                      <Td align="right">
                        <Delta value={r.quote.ytd} />
                      </Td>
                      <Td align="right">{r.quote.instrument.marketCap ? fmtMoney(r.quote.instrument.marketCap, { compact: true }) : "—"}</Td>
                      <Td>
                        <Sparkline data={r.quote.spark} width={70} height={18} />
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {r.held ? <Badge tone="emerald">held {fmtPct(r.weight, 1)}</Badge> : null}
                          {r.watched ? <Badge tone="cyan">watch</Badge> : null}
                          {r.thesis ? (
                            <Link href={`/research/theses/${r.thesis.id}`}>
                              <Badge tone="indigo">{r.thesis.status}</Badge>
                            </Link>
                          ) : r.held ? (
                            <Chip tone="slate">no thesis</Chip>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
