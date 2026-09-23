import Link from "next/link";
import { getWatchViews } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { toggleWatchlist } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Delta, Empty, Panel, Sparkline, Stat, Td, Th } from "@/components/ui";
import { fmtDay, fmtNum, fmtPct, toneClass } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";

export default async function WatchlistsPage() {
  const portfolio = await getPortfolio();
  const { lists } = await getWatchViews(portfolio);

  const allRows = lists.flatMap((l) => l.rows);
  const triggered = allRows.filter((r) => r.triggerPrice && (r.triggerDistance ?? 0) <= 0);
  const approaching = allRows.filter((r) => r.triggerPrice && (r.triggerDistance ?? 1) > 0 && (r.triggerDistance ?? 1) < 0.08);
  const withThesis = allRows.filter((r) => r.thesis);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Watchlists"
        subtitle="A watchlist entry is a decision deferred, not a bookmark. Each row carries the reason, a trigger price, the thesis it belongs to, and the freshest story."
        breadcrumb={[{ href: "/", label: "Today" }]}
        actions={
          <Link href="/alerts" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
            Alert rules →
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Names tracked" value={String(allRows.length)} sub={`${lists.length} lists`} />
        <Stat label="Triggers breached" value={String(triggered.length)} tone={triggered.length ? "warn" : "up"} sub="decision required" />
        <Stat label="Within 8% of trigger" value={String(approaching.length)} sub="watch closely" />
        <Stat label="Already held" value={String(allRows.filter((r) => r.held).length)} sub={`${allRows.filter((r) => !r.held).length} pre-position`} />
      </div>

      {(triggered.length > 0 || approaching.length > 0) && (
        <Panel title="Trigger board" subtitle="Where price has done the work — the only rows that need action" dense>
          <table className="w-full">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>List</Th>
                <Th align="right">Price</Th>
                <Th align="right">Trigger</Th>
                <Th align="right">Distance</Th>
                <Th>Thesis</Th>
                <Th>Fresh news</Th>
              </tr>
            </thead>
            <tbody>
              {[...triggered, ...approaching].map((r) => (
                <tr key={`${r.itemId}-trigger`} className="hover:bg-slate-800/30">
                  <Td>
                    <Link href={`/markets/${encodeURIComponent(r.symbol)}`} className="font-medium text-slate-100 hover:text-cyan-300">
                      {r.symbol}
                    </Link>
                  </Td>
                  <Td>
                    <span className="text-[11px] text-slate-400">{lists.find((l) => l.rows.some((x) => x.itemId === r.itemId))?.listName}</span>
                  </Td>
                  <Td align="right">{fmtNum(r.quote.price)}</Td>
                  <Td align="right">{fmtNum(r.triggerPrice ?? 0)}</Td>
                  <Td align="right">
                    <span className={toneClass(r.triggerDistance ?? 0)}>{fmtPct(r.triggerDistance ?? 0, 1)}</span>
                  </Td>
                  <Td>
                    {r.thesis ? (
                      <Link href={`/research/theses/${r.thesis.id}`} className="text-[11px] text-indigo-300 hover:text-indigo-200">
                        {r.thesis.status} · conv {r.thesis.conviction}
                      </Link>
                    ) : (
                      <span className="text-[11px] text-amber-300/80">no thesis</span>
                    )}
                  </Td>
                  <Td>
                    {r.latestNews ? (
                      <Link href={`/news/${r.latestNews.id}`} className="line-clamp-1 max-w-sm text-[11px] text-slate-400 hover:text-cyan-300">
                        {r.latestNews.headline}
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-600">quiet</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <div className="grid gap-4 xl:grid-cols-[2.6fr_1fr]">
        <div className="space-y-4">
          {lists.map((list) => (
            <Panel key={list.listName} title={list.listName} subtitle={list.note} right={<span className="text-slate-500">{list.rows.length} names · {list.rows.filter((r) => r.held).length} held</span>} dense>
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <Th>Name</Th>
                      <Th align="right">Price</Th>
                      <Th align="right">1D</Th>
                      <Th align="right">1M</Th>
                      <Th>30d</Th>
                      <Th align="right">Trigger</Th>
                      <Th>Reason / notes</Th>
                      <Th>Next catalyst</Th>
                      <Th>Book</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.rows.map((r) => (
                      <tr key={r.itemId} className="align-top hover:bg-slate-800/30">
                        <Td>
                          <Link href={`/markets/${encodeURIComponent(r.symbol)}`} className="block">
                            <span className="font-semibold text-slate-100 hover:text-cyan-300">{r.symbol}</span>
                            <span className="block text-[10.5px] text-slate-500">{r.name}</span>
                          </Link>
                        </Td>
                        <Td align="right">{fmtNum(r.quote.price)}</Td>
                        <Td align="right">
                          <Delta value={r.quote.changePct} />
                        </Td>
                        <Td align="right">
                          <Delta value={r.quote.r1m} />
                        </Td>
                        <Td>
                          <Sparkline data={r.quote.spark} width={70} height={18} />
                        </Td>
                        <Td align="right">
                          {r.triggerPrice ? (
                            <>
                              {fmtNum(r.triggerPrice)}
                              <span className={`block text-[10px] ${toneClass(r.triggerDistance ?? 0)}`}>{fmtPct(r.triggerDistance ?? 0, 1)}</span>
                            </>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </Td>
                        <Td>
                          <span className="max-w-xs text-[11px] text-slate-400">{r.note}</span>
                          {r.openAlerts > 0 && <Badge tone="amber">{r.openAlerts} rule(s)</Badge>}
                        </Td>
                        <Td>
                          {r.catalysts[0] ? (
                            <span className="text-[11px] text-slate-400">
                              {r.catalysts[0].title.slice(0, 30)}
                              <span className="block text-[10px] text-slate-600">
                                {fmtDay(r.catalysts[0].eventDate)} · {r.catalysts[0].daysOut}d
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600">none scheduled</span>
                          )}
                        </Td>
                        <Td>
                          <div className="space-y-1">
                            {r.held ? <Badge tone="emerald">held {fmtPct(r.weight, 1)}</Badge> : <Badge tone="slate">not held</Badge>}
                            {r.thesis ? (
                              <Link href={`/research/theses/${r.thesis.id}`} className="block">
                                <Badge tone="indigo">{r.thesis.status}</Badge>
                              </Link>
                            ) : null}
                            <form action={toggleWatchlist}>
                              <input type="hidden" name="symbol" value={r.symbol} />
                              <input type="hidden" name="listName" value={list.listName} />
                              <button className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-rose-800 hover:text-rose-300">remove</button>
                            </form>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
          {lists.length === 0 && <Empty>No watchlists yet — add your first name from any instrument hub.</Empty>}
        </div>

        <div className="space-y-4">
          <Panel title="Add to a list" subtitle="Trigger price is optional but a name without one is just a bookmark">
            <form action={toggleWatchlist} className="space-y-2.5">
              <select name="listName" className={inputCls} defaultValue="AI Infrastructure">
                <option value="AI Infrastructure">AI Infrastructure</option>
                <option value="Quality Compounders">Quality Compounders</option>
                <option value="Rates &amp; Macro Probes">Rates &amp; Macro Probes</option>
              </select>
              <input name="symbol" required placeholder="Ticker" className={inputCls} />
              <input name="triggerPrice" type="number" step="any" placeholder="Trigger price" className={inputCls} />
              <input name="note" placeholder="Why it is on the list" className={inputCls} />
              <button className="w-full rounded bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500">Toggle on list</button>
            </form>
          </Panel>

          <Panel title="Discipline checks">
            <div className="space-y-2 text-xs">
              <p className="text-slate-400">
                Names with a written thesis: <span className="text-slate-200">{withThesis.length}</span> / {allRows.length}
              </p>
              <p className="text-slate-400">
                Names without a trigger price: <span className="text-amber-300">{allRows.filter((r) => !r.triggerPrice).length}</span>
              </p>
              <p className="text-slate-400">
                Held names sitting on a watchlist: <span className="text-cyan-300">{allRows.filter((r) => r.held).length}</span>
              </p>
              <p className="text-slate-500">
                A watchlist is the pre-commitment layer: it converts a thesis into a price-conditioned action so the decision is not made under
                pressure.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
