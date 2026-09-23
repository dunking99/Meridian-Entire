import Link from "next/link";
import { notFound } from "next/navigation";
import { getInstrumentHub } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { addNote, toggleAlert, toggleWatchlist } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { AreaChart, Badge, Chip, Conviction, Delta, Empty, KV, LabelBadge, Panel, Sparkline, Stat, Td, Th } from "@/components/ui";
import { fmtDate, fmtDay, fmtMoney, fmtNum, fmtPct, fmtSigned, fmtWhen, toneClass } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function InstrumentPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const portfolio = await getPortfolio();
  const hub = await getInstrumentHub(decodeURIComponent(symbol), portfolio);
  if (!hub) notFound();

  const { instrument, quote } = hub;
  const range = quote ? quote.high52 - quote.low52 || 1 : 1;
  const rangePct = quote ? ((quote.price - quote.low52) / range) * 100 : 0;
  const volRatio = quote && quote.avgVolume ? quote.volume / quote.avgVolume : 0;
  const positionValue = hub.positions.reduce((a, p) => a + p.marketValue, 0);
  const positionWeight = portfolio.totals.nav ? positionValue / portfolio.totals.nav : 0;
  const activeThesis = hub.theses.find((t) => t.status === "active" || t.status === "idea");
  const upside = activeThesis?.targetPrice && quote ? activeThesis.targetPrice / quote.price - 1 : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${instrument.symbol} · ${instrument.name}`}
        subtitle={instrument.description ?? `${instrument.sector} · ${instrument.industry} · ${instrument.country}`}
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/markets", label: "Markets" },
        ]}
        actions={
          <>
            <div className="flex flex-wrap gap-1">
              <Badge tone="slate">{instrument.assetClass}</Badge>
              <Badge tone="slate">{instrument.exchange}</Badge>
              <Badge tone="slate">{instrument.sector}</Badge>
              {hub.isHeld && <Badge tone="emerald">held</Badge>}
              {hub.watchlist.map((w) => (
                <Badge key={w.id} tone="cyan">
                  {w.listName}
                </Badge>
              ))}
              {(instrument.themes ?? "")
                .split(",")
                .filter(Boolean)
                .map((t) => (
                  <Chip key={t} href={`/markets/screener?theme=${t}`} tone="indigo">
                    {t}
                  </Chip>
                ))}
            </div>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Last" value={fmtNum(quote?.price ?? 0)} sub={quote ? `${fmtDate(quote.asOf)} close` : ""} />
        <Stat label="1D" value={fmtSigned(quote?.change ?? 0)} sub={fmtPct(quote?.changePct ?? 0)} tone={(quote?.changePct ?? 0) >= 0 ? "up" : "down"} />
        <Stat label="1M / 3M" value={fmtPct(quote?.r1m ?? 0, 1)} sub={`3m ${fmtPct(quote?.r3m ?? 0, 1)}`} tone={(quote?.r1m ?? 0) >= 0 ? "up" : "down"} />
        <Stat label="YTD" value={fmtPct(quote?.ytd ?? 0, 1)} tone={(quote?.ytd ?? 0) >= 0 ? "up" : "down"} />
        <Stat label="52w range" value={`${fmtNum(quote?.low52 ?? 0, 0)}–${fmtNum(quote?.high52 ?? 0, 0)}`} sub={`at ${rangePct.toFixed(0)}% of range`} />
        <Stat label="Volume vs 30d avg" value={`${(volRatio * 100).toFixed(0)}%`} sub={`${fmtNum(quote?.volume ?? 0, 0)} shares`} tone={volRatio > 1.4 ? "warn" : "neutral"} />
        <Stat label="Market cap" value={instrument.marketCap ? fmtMoney(instrument.marketCap, { compact: true }) : "—"} sub={instrument.themes?.split(",")[0] ?? ""} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Price history" subtitle={quote ? `${quote.history[0]?.d} → ${quote.asOf}` : undefined}>
          <AreaChart data={(quote?.history ?? []).map((h) => h.close)} height={210} />
        </Panel>

        <Panel
          title="Position & exposure"
          subtitle={hub.isHeld ? "Held — the exposure this name contributes to the book" : "Not held. Watchlist entry defines the trigger."}
        >
          {hub.isHeld ? (
            <>
              <KV k="Market value" v={fmtMoney(positionValue)} />
              <KV k="Weight of NAV" v={fmtPct(positionWeight, 2)} tone={positionWeight > 0.12 ? "text-amber-300" : undefined} />
              <KV k="Quantity" v={fmtNum(hub.positions.reduce((a, p) => a + p.quantity, 0), 2)} />
              <KV
                k="Avg cost"
                v={fmtNum(hub.positions.reduce((a, p) => a + p.avgCost * p.quantity, 0) / Math.max(1, hub.positions.reduce((a, p) => a + p.quantity, 0)))}
              />
              <KV
                k="Unrealised"
                v={fmtSigned(hub.positions.reduce((a, p) => a + p.unrealized, 0))}
                tone={hub.positions.reduce((a, p) => a + p.unrealized, 0) >= 0 ? "text-emerald-400" : "text-rose-400"}
              />
              <KV k="Day contribution" v={fmtSigned(hub.positions.reduce((a, p) => a + p.dayContribution, 0))} />
              {activeThesis && upside !== null && <KV k="Upside to target" v={fmtPct(upside, 1)} tone="text-indigo-300" />}
            </>
          ) : (
            <>
              {hub.watchlist.length === 0 && <p className="mb-2 text-xs text-slate-500">No position and not on a watchlist. Add it below to start tracking triggers and news.</p>}
              {hub.watchlist.map((w) => (
                <KV
                  key={w.id}
                  k={`${w.listName} trigger`}
                  v={w.triggerPrice ? `${fmtNum(w.triggerPrice)} (${fmtPct(w.triggerPrice / (quote?.price ?? 1) - 1, 1)} away)` : "no trigger"}
                />
              ))}
              {activeThesis?.targetPrice && quote && <KV k="Thesis target" v={`${fmtNum(activeThesis.targetPrice)} · ${fmtPct(activeThesis.targetPrice / quote.price - 1, 1)}`} />}
            </>
          )}

          <form action={toggleWatchlist} className="mt-3 space-y-2 border-t border-slate-800 pt-3">
            <input type="hidden" name="symbol" value={instrument.symbol} />
            <div>
              <label className={labelCls}>{hub.watchlist.length ? "Toggle a list" : "Add to a list"}</label>
              <select name="listName" className={inputCls} defaultValue={hub.watchlist[0]?.listName ?? "AI Infrastructure"}>
                <option value="AI Infrastructure">AI Infrastructure</option>
                <option value="Quality Compounders">Quality Compounders</option>
                <option value="Rates & Macro Probes">Rates &amp; Macro Probes</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="triggerPrice" type="number" step="any" placeholder="Trigger price" className={inputCls} />
              <input name="note" placeholder="Reason" className={inputCls} />
            </div>
            <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">
              {hub.watchlist.length ? "Add / remove from list" : "Add with reason + trigger"}
            </button>
          </form>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Thesis" subtitle="Stance, conviction, target, invalidation" right={<Link href="/research" className="hover:text-slate-200">Cockpit →</Link>}>
          {hub.theses.length === 0 && <Empty>No written thesis for this name — that is itself a signal.</Empty>}
          <ul className="space-y-3">
            {hub.theses.map((t) => (
              <li key={t.id} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/research/theses/${t.id}`} className="text-[13px] font-medium text-slate-100 hover:text-cyan-300">
                    {t.title}
                  </Link>
                  <LabelBadge value={t.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <LabelBadge value={t.stance} />
                  <Conviction n={t.conviction} />
                  <span>target {t.targetPrice ? fmtNum(t.targetPrice) : "—"}</span>
                  <span>review {t.reviewAt ? fmtDay(t.reviewAt) : "—"}</span>
                </div>
                <p className="mt-1.5 line-clamp-3 text-[11.5px] text-slate-400">{t.body}</p>
                {t.invalidation && <p className="mt-1 text-[11px] text-rose-300/80">Invalidation: {t.invalidation}</p>}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="News touching this name" subtitle="From the auto-link engine: headline symbol > body symbol > name/alias" right={<Link href="/news" className="hover:text-slate-200">Feed →</Link>}>
          {hub.news.length === 0 && <Empty>No linked stories yet.</Empty>}
          <ul className="space-y-3">
            {hub.news.slice(0, 6).map((n) => (
              <li key={n.news.id} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                <Link href={`/news/${n.news.id}`} className="text-[12.5px] text-slate-200 hover:text-cyan-300">
                  {n.news.headline}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500">
                  <span>{n.news.source}</span>
                  <span>{fmtWhen(n.news.publishedAt)}</span>
                  <Badge tone={n.relation === "impacts" ? "rose" : "slate"}>{n.relation}</Badge>
                  <Badge tone={n.news.sentiment > 0.2 ? "emerald" : n.news.sentiment < -0.2 ? "rose" : "slate"}>
                    {n.news.sentiment.toFixed(2)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Research notes" subtitle="Memos, models, earnings work" right={<Link href="/research/notes" className="hover:text-slate-200">All →</Link>}>
          {hub.notes.length === 0 && <Empty>No notes written on this name.</Empty>}
          <ul className="space-y-2.5">
            {hub.notes.slice(0, 5).map((n) => (
              <li key={n.id} className="border-b border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Badge tone="indigo">{n.kind}</Badge>
                  <span className="text-[10.5px] text-slate-500">{fmtDate(n.createdAt)}</span>
                </div>
                <Link href={`/research/notes/${n.id}`} className="mt-1 block text-[12.5px] text-slate-200 hover:text-cyan-300">
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
          <form action={addNote} className="mt-3 space-y-2 border-t border-slate-800 pt-3">
            <input type="hidden" name="symbol" value={instrument.symbol} />
            <input type="hidden" name="kind" value="memo" />
            <input name="title" required placeholder="New note title" className={inputCls} />
            <textarea name="body" rows={2} placeholder="What did you learn?" className={inputCls} />
            <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">Attach note to {instrument.symbol}</button>
          </form>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Catalysts" subtitle="Scheduled events that would move this thesis" dense>
          {hub.catalysts.length === 0 ? (
            <Empty>No dated catalysts.</Empty>
          ) : (
            <table className="w-full">
              <tbody>
                {hub.catalysts.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/60 last:border-0">
                    <Td>
                      <span className="text-slate-200">{c.title}</span>
                      <span className="block text-[10.5px] text-slate-500">{c.note}</span>
                    </Td>
                    <Td align="right">
                      {fmtDay(c.eventDate)}
                      <span className="block text-[10px] text-slate-500">{c.kind}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Alerts" subtitle="Rules attached to this instrument" dense>
          {hub.alerts.length === 0 ? (
            <Empty>No rules armed for this name.</Empty>
          ) : (
            <table className="w-full">
              <tbody>
                {hub.alerts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-800/60 last:border-0">
                    <Td>
                      <span className="text-[11px] text-slate-300">{a.kind.replace("_", " ")}</span>
                      <span className="block text-[10.5px] text-slate-500">{a.note}</span>
                    </Td>
                    <Td align="right">{a.threshold !== null ? fmtNum(a.threshold) : a.keyword ?? "—"}</Td>
                    <Td align="right">
                      <form action={toggleAlert}>
                        <input type="hidden" name="alertId" value={a.id} />
                        <button className={`rounded border px-1.5 py-0.5 text-[10px] ${a.active ? "border-emerald-800 text-emerald-300" : "border-slate-700 text-slate-500"}`}>
                          {a.active ? "armed" : "paused"}
                        </button>
                      </form>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {hub.alertEvents.length > 0 && (
            <div className="mt-3 border-t border-slate-800 pt-2">
              <div className="mb-1 text-[10px] tracking-wider text-slate-500 uppercase">Recently fired</div>
              {hub.alertEvents.slice(0, 4).map((e) => (
                <p key={e.id} className="text-[11px] text-slate-400">
                  <span className="text-slate-500">{fmtWhen(e.firedAt)}</span> · {e.message}
                </p>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Related exposure" subtitle="Same themes — correlated risk in disguise" dense>
          {hub.related.length === 0 ? (
            <Empty>No overlapping themes in the tracked universe.</Empty>
          ) : (
            <table className="w-full">
              <tbody>
                {hub.related.map((r) => {
                  const held = portfolio.positions.find((p) => p.instrument.id === r.quote.instrument.id);
                  return (
                    <tr key={r.quote.instrument.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                      <Td>
                        <Link href={`/markets/${encodeURIComponent(r.quote.instrument.symbol)}`} className="font-medium text-slate-200 hover:text-cyan-300">
                          {r.quote.instrument.symbol}
                        </Link>
                        <span className="block text-[10.5px] text-slate-500">{r.shared} shared theme(s)</span>
                      </Td>
                      <Td align="right">
                        <Delta value={r.quote.r1m} />
                      </Td>
                      <Td align="right">{held ? <Badge tone="emerald">{fmtPct(held.weight, 1)}</Badge> : <span className="text-[10px] text-slate-600">not held</span>}</Td>
                      <Td>
                        <Sparkline data={r.quote.spark} width={60} height={18} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Trade history" subtitle="Fills in this name, with the reasoning attached" dense>
          {hub.trades.length === 0 ? (
            <Empty>No fills recorded.</Empty>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Side</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Price</Th>
                  <Th>Account</Th>
                  <Th>Why</Th>
                </tr>
              </thead>
              <tbody>
                {hub.trades.map((t) => (
                  <tr key={t.trade.id} className="align-top hover:bg-slate-800/30">
                    <Td>{fmtDate(t.trade.executedAt)}</Td>
                    <Td>
                      <Badge tone={t.trade.side === "buy" ? "emerald" : "rose"}>{t.trade.side}</Badge>
                    </Td>
                    <Td align="right">{fmtNum(t.trade.quantity, 2)}</Td>
                    <Td align="right">{fmtNum(t.trade.price)}</Td>
                    <Td>{t.accountName}</Td>
                    <Td>
                      <span className="line-clamp-2 max-w-sm text-[11px] text-slate-400">{t.trade.rationale ?? "—"}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Decision history" subtitle="Journal entries referencing this name" dense>
          {hub.journal.length === 0 ? (
            <Empty>No journal entries for this name.</Empty>
          ) : (
            <table className="w-full">
              <tbody>
                {hub.journal.map((j) => (
                  <tr key={j.id} className="align-top border-b border-slate-800/60 last:border-0">
                    <Td>
                      <div className="flex items-center gap-2">
                        <Badge tone={j.kind === "mistake" ? "rose" : j.kind === "review" ? "indigo" : "slate"}>{j.kind}</Badge>
                        <span className="text-[10.5px] text-slate-500">{fmtWhen(j.decidedAt)}</span>
                      </div>
                      <span className="mt-1 block text-slate-200">{j.title}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">{j.body}</span>
                    </Td>
                    <Td align="right">
                      {j.outcome ? <span className="text-[11px] text-emerald-300">{j.outcome}</span> : j.reviewAt ? <span className="text-[11px] text-slate-500">review {fmtDay(j.reviewAt)}</span> : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <p className={`text-[11px] ${toneClass(quote?.changePct ?? 0)}`}>
        {quote?.history.length ?? 0} sessions of history · {hub.linkCount} graph edges reference this instrument.
      </p>
    </div>
  );
}
