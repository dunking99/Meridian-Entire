import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsDetail } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { addJournalEntry, createAlert, linkNewsToInstrument, toggleNewsFlags } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Delta, Empty, ExposurePill, KV, LabelBadge, Panel, Stat, Td, Th, TierBadge } from "@/components/ui";
import { fmtDate, fmtMoney, fmtNum, fmtPct, fmtWhen, toneClass } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const portfolio = await getPortfolio();
  const detail = await getNewsDetail(Number(id), portfolio);
  if (!detail) notFound();

  const { item, relevance, positions, relatedTheses, relatedNotes, siblings } = detail;
  const sectorMap = new Map<string, number>();
  for (const p of positions) {
    const sector = p.instrument.sector ?? "Other";
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + p.marketValue);
  }
  const sectors = [...sectorMap.entries()].sort((a, b) => b[1] - a[1]);
  const weightedSentiment = positions.length
    ? positions.reduce((a, p) => a + p.dayContribution, 0) / Math.max(1, portfolio.totals.nav)
    : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={item.headline}
        subtitle={`${item.source} · ${fmtDate(item.publishedAt)} (${fmtWhen(item.publishedAt)}) · ${item.kind}`}
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/news", label: "News" },
        ]}
        actions={
          <>
            <TierBadge tier={relevance.tier} />
            <form action={toggleNewsFlags}>
              <input type="hidden" name="newsId" value={item.id} />
              <input type="hidden" name="field" value="saved" />
              <button className={`rounded border px-2 py-1 text-[11px] ${item.saved ? "border-amber-700 text-amber-300" : "border-slate-700 text-slate-400"}`}>
                {item.saved ? "Saved" : "Save for later"}
              </button>
            </form>
            <form action={toggleNewsFlags}>
              <input type="hidden" name="newsId" value={item.id} />
              <input type="hidden" name="field" value="read" />
              <button className={`rounded border px-2 py-1 text-[11px] ${item.read ? "border-slate-700 text-slate-500" : "border-emerald-800 text-emerald-300"}`}>
                {item.read ? "Mark unread" : "Mark read"}
              </button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Book exposure mentioned"
          value={fmtMoney(relevance.exposureValue)}
          sub={`${fmtPct(relevance.exposurePct, 2)} of NAV`}
          tone={relevance.exposureValue > 0 ? "warn" : "neutral"}
          hint="Sum of market value in every position this story references"
        />
        <Stat label="Holdings touched" value={String(relevance.heldMentions)} sub={`${relevance.watchMentions} watchlist names`} />
        <Stat label="Sentiment" value={item.sentiment.toFixed(2)} sub={item.sentiment > 0.2 ? "constructive" : item.sentiment < -0.2 ? "negative" : "neutral"} tone={item.sentiment > 0 ? "up" : "down"} />
        <Stat
          label="Holdings move today"
          value={fmtPct(weightedSentiment, 2)}
          sub={fmtMoney(weightedSentiment * portfolio.totals.nav, { compact: true })}
          tone={weightedSentiment >= 0 ? "up" : "down"}
          hint="Dollar contribution of the named holdings today, as % of NAV"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Panel title="Story" subtitle="Full ingested text — the matcher runs over this body, not just the headline">
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-slate-300">{item.summary}</p>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[11px] text-cyan-300 hover:text-cyan-200">
                Open source ↗
              </a>
            )}
          </Panel>

          <Panel title="Impact on the book" subtitle="The cross-domain answer: which positions, how big, and in what sector">
            {positions.length === 0 ? (
              <Empty>No held name is referenced. This is market colour, not a portfolio event.</Empty>
            ) : (
              <>
                <div className="mb-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                  <KV k="Exposure" v={fmtMoney(relevance.exposureValue)} />
                  <KV k="% of NAV" v={fmtPct(relevance.exposurePct, 2)} />
                  <KV k="Concentrated in" v={relevance.topSector ?? "—"} />
                  <KV k="Thesis links" v={String(relatedTheses.length)} />
                </div>
                <table className="w-full">
                  <thead>
                    <tr>
                      <Th>Position</Th>
                      <Th align="right">Weight</Th>
                      <Th align="right">Value</Th>
                      <Th align="right">1D</Th>
                      <Th align="right">Day P/L</Th>
                      <Th>Thesis</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.positionId} className="hover:bg-slate-800/30">
                        <Td>
                          <Link href={`/markets/${encodeURIComponent(p.instrument.symbol)}`} className="font-medium text-slate-100 hover:text-cyan-300">
                            {p.instrument.symbol}
                          </Link>
                          <span className="block text-[10.5px] text-slate-500">{p.instrument.name}</span>
                        </Td>
                        <Td align="right">{fmtPct(p.weight, 2)}</Td>
                        <Td align="right">{fmtMoney(p.marketValue, { compact: true })}</Td>
                        <Td align="right">
                          <Delta value={p.quote?.changePct ?? 0} />
                        </Td>
                        <Td align="right">
                          <span className={toneClass(p.dayContribution)}>{fmtMoney(p.dayContribution, { compact: true })}</span>
                        </Td>
                        <Td>
                          {p.thesisId ? (
                            <Link href={`/research/theses/${p.thesisId}`} className="text-[11px] text-indigo-300 hover:text-indigo-200">
                              {p.thesisTitle?.slice(0, 42)}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-amber-300/80">no thesis</span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sectors.map(([sector, value]) => (
                    <Badge key={sector} tone="slate">
                      {sector} {fmtPct(value / (portfolio.totals.nav || 1), 1)}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Entities detected" subtitle="Symbol match in headline outweighs body mention, which outweighs name/alias" dense>
            {relevance.mentions.length === 0 ? (
              <Empty>The matcher found no tracked instrument in this text.</Empty>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Instrument</Th>
                    <Th>Match basis</Th>
                    <Th align="right">Score</Th>
                    <Th align="right">Held</Th>
                    <Th align="right">1D</Th>
                    <Th>State</Th>
                  </tr>
                </thead>
                <tbody>
                  {relevance.mentions.map((m) => (
                    <tr key={m.instrument.id} className="hover:bg-slate-800/30">
                      <Td>
                        <Link href={`/markets/${encodeURIComponent(m.instrument.symbol)}`} className="font-medium text-slate-100 hover:text-cyan-300">
                          {m.instrument.symbol}
                        </Link>
                        <span className="block text-[10.5px] text-slate-500">{m.instrument.name}</span>
                      </Td>
                      <Td>
                        <Badge tone={m.basis === "headline-symbol" ? "rose" : m.basis === "body-symbol" ? "amber" : "slate"}>{m.basis}</Badge>
                        <span className="ml-1 text-[10.5px] text-slate-500">“{m.matchedText}”</span>
                      </Td>
                      <Td align="right">{m.score}</Td>
                      <Td align="right">{m.weight > 0 ? <span className="text-emerald-300">{fmtPct(m.weight, 2)}</span> : <span className="text-slate-600">—</span>}</Td>
                      <Td align="right">
                        <Delta value={portfolio.book.byId.get(m.instrument.id)?.changePct ?? 0} />
                      </Td>
                      <Td>
                        {m.weight > 0 ? <Badge tone="emerald">position</Badge> : null}
                        {relatedTheses.some((t) => t.instrumentId === m.instrument.id) ? <Badge tone="indigo">thesis</Badge> : null}
                        {m.weight === 0 && !relatedTheses.some((t) => t.instrumentId === m.instrument.id) ? (
                          <Badge tone="slate">unheld</Badge>
                        ) : null}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Actions from this story" subtitle="A story is only useful if it changes something">
            <form action={addJournalEntry} className="space-y-2 border-b border-slate-800 pb-3">
              <div>
                <label className={labelCls}>Journal this story</label>
                <input type="hidden" name="kind" value="observation" />
                <input type="hidden" name="title" value={`Read: ${item.headline.slice(0, 110)}`} />
                <input type="hidden" name="symbol" value={relevance.mentions[0]?.instrument.symbol ?? ""} />
                <textarea name="body" rows={3} className={inputCls} placeholder="What does this change — position size, thesis, or nothing?" />
              </div>
              <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">Write to journal</button>
            </form>

            <form action={createAlert} className="space-y-2 border-b border-slate-800 py-3">
              <input type="hidden" name="kind" value="news_keyword" />
              <label className={labelCls}>Arm a keyword watch from this story</label>
              <input name="keyword" className={inputCls} defaultValue={relevance.mentions[0]?.instrument.symbol ?? ""} placeholder="keyword, e.g. guidance cut" />
              <input name="note" className={inputCls} placeholder="Why this keyword matters" />
              <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">Create watch rule</button>
            </form>

            <form action={linkNewsToInstrument} className="space-y-2 pt-3">
              <input type="hidden" name="newsId" value={item.id} />
              <label className={labelCls}>Manually attach an instrument</label>
              <input name="symbol" className={inputCls} placeholder="Ticker the engine missed" />
              <button className="w-full rounded border border-cyan-800 px-2 py-1.5 text-xs text-cyan-200 hover:border-cyan-600">Attach to story</button>
            </form>
          </Panel>

          <Panel title="Research it touched" subtitle="Theses and notes sitting on the same instruments">
            <div className="space-y-2 text-xs">
              {relatedTheses.length === 0 && relatedNotes.length === 0 && <Empty>No linked research.</Empty>}
              {relatedTheses.map((t) => (
                <div key={t.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <LabelBadge value={t.status} />
                    <ConvictionInline n={t.conviction} />
                  </div>
                  <Link href={`/research/theses/${t.id}`} className="mt-1 block text-slate-200 hover:text-cyan-300">
                    {t.title}
                  </Link>
                  {t.invalidation && <p className="mt-0.5 text-[10.5px] text-rose-300/80">Breaks if: {t.invalidation}</p>}
                </div>
              ))}
              {relatedNotes.slice(0, 4).map((n) => (
                <div key={n.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                  <Badge tone="indigo">{n.kind}</Badge>
                  <Link href={`/research/notes/${n.id}`} className="mt-1 block text-slate-200 hover:text-cyan-300">
                    {n.title}
                  </Link>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Related coverage" subtitle="Same instruments, earlier tape — the context trail" dense>
            {siblings.length === 0 && <Empty>No related stories.</Empty>}
            <ul className="space-y-2 p-3 text-xs">
              {siblings.slice(0, 7).map((s) => (
                <li key={s.news.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                  <Link href={`/news/${s.news.id}`} className="text-slate-300 hover:text-cyan-300">
                    {s.news.headline}
                  </Link>
                  <div className="mt-0.5 text-[10.5px] text-slate-500">
                    {s.news.source} · {fmtWhen(s.news.publishedAt)} · {s.relation}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Provenance">
            <KV k="Ingested" v={fmtWhen(item.publishedAt)} />
            <KV k="Source" v={item.source} />
            <KV k="Kind" v={item.kind} />
            <KV k="Entities matched" v={String(relevance.mentions.length)} />
            <KV k="News id" v={`#${item.id}`} />
            <KV k="Match score" v={relevance.score.toFixed(1)} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ConvictionInline({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Conviction ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-2.5 rounded-sm ${i <= n ? "bg-indigo-400" : "bg-slate-700"}`} />
      ))}
    </span>
  );
}
