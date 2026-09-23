import Link from "next/link";
import { notFound } from "next/navigation";
import { getThesisDetail } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { addJournalEntry, addNote, updateThesis } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { AreaChart, Badge, Conviction, Delta, Empty, KV, LabelBadge, Panel, Stat, Td, Th } from "@/components/ui";
import { fmtDate, fmtDay, fmtMoney, fmtNum, fmtPct, fmtSigned, fmtWhen, toneClass } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function ThesisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const portfolio = await getPortfolio();
  const detail = await getThesisDetail(Number(id), portfolio);
  if (!detail) notFound();

  const { thesis, quote, position, notes, journal, news, trades, returnSince } = detail;
  const upside = thesis.targetPrice && quote ? thesis.targetPrice / quote.price - 1 : null;
  const distanceToInvalidation = position && thesis.stance === "long" ? null : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={thesis.title}
        subtitle={`${thesis.stance} · ${thesis.horizon} · filed ${fmtDate(thesis.createdAt)} · last updated ${fmtWhen(thesis.updatedAt)}`}
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/research", label: "Research" },
        ]}
        actions={
          <>
            <LabelBadge value={thesis.status} />
            <LabelBadge value={thesis.stance} />
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              conviction <Conviction n={thesis.conviction} />
            </span>
            {quote && (
              <Link href={`/markets/${encodeURIComponent(quote.instrument.symbol)}`} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
                {quote.instrument.symbol} hub →
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Name" value={quote?.instrument.symbol ?? "macro"} sub={quote?.instrument.name ?? "no instrument attached"} />
        <Stat label="Price" value={quote ? fmtNum(quote.price) : "—"} sub={quote ? fmtPct(quote.changePct) : ""} tone={(quote?.changePct ?? 0) >= 0 ? "up" : "down"} />
        <Stat label="Since thesis filed" value={returnSince !== null ? fmtPct(returnSince, 1) : "—"} tone={(returnSince ?? 0) >= 0 ? "up" : "down"} hint="Price move over the life of the idea" />
        <Stat label="Target upside" value={upside !== null ? fmtPct(upside, 1) : "—"} sub={thesis.targetPrice ? `target ${fmtNum(thesis.targetPrice)}` : "no target"} tone={(upside ?? 0) >= 0 ? "up" : "down"} />
        <Stat label="Position weight" value={position ? fmtPct(position.weight, 2) : "0%"} sub={position ? fmtMoney(position.marketValue, { compact: true }) : "not held"} tone={position && position.weight > 0.12 ? "warn" : "neutral"} />
        <Stat label="Coverage" value={`${news.length} stories`} sub={`${notes.length} notes · ${journal.length} updates`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Panel title="Thesis body" subtitle="Written reasoning — the thing that gets falsified, not re-narrated">
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-slate-300">{thesis.body}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded border border-rose-900/50 bg-rose-950/20 px-3 py-2">
                <div className="text-[10px] tracking-wider text-rose-300/80 uppercase">Invalidation</div>
                <div className="mt-0.5 text-[12px] text-rose-100">{thesis.invalidation ?? "Not specified — write it before the next add."}</div>
              </div>
              <div className="rounded border border-slate-800 px-3 py-2">
                <div className="text-[10px] tracking-wider text-slate-500 uppercase">Tags</div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {(thesis.tags || "").split(",").filter(Boolean).map((t) => (
                    <Badge key={t} tone="indigo">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {quote && (
            <Panel title="Price action since filing" subtitle={`${thesis.title.slice(0, 70)} — does the tape agree with the thesis?`}>
              <AreaChart data={quote.history.map((h) => h.close)} height={180} color={(returnSince ?? 0) >= 0 ? "#34d399" : "#fb7185"} />
            </Panel>
          )}

          <Panel title="Update timeline" subtitle="Conviction changes and review notes; each update also lands in the journal" dense>
            {journal.length === 0 && <Empty>No updates since filing. An untouched thesis is usually a stale one.</Empty>}
            <ul className="space-y-0 p-4">
              {journal.map((j) => (
                <li key={j.id} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={j.kind === "mistake" ? "rose" : j.kind === "review" ? "indigo" : "slate"}>{j.kind}</Badge>
                    <span className="text-[10.5px] text-slate-500">{fmtDate(j.decidedAt)}</span>
                    {j.reviewAt && <span className="text-[10.5px] text-slate-600">review {fmtDay(j.reviewAt)}</span>}
                  </div>
                  <p className="mt-1 text-[12.5px] text-slate-200">{j.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-slate-400">{j.body}</p>
                  {j.outcome && <p className="mt-0.5 text-[11px] text-emerald-300">Outcome: {j.outcome}</p>}
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="News on the name" subtitle="Live coverage vs. written thesis" dense>
              {news.length === 0 && <Empty>No linked coverage.</Empty>}
              <ul className="space-y-2 p-3 text-xs">
                {news.slice(0, 8).map((n) => (
                  <li key={n.news.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <Link href={`/news/${n.news.id}`} className="text-slate-300 hover:text-cyan-300">
                      {n.news.headline}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-slate-500">
                      <Badge tone={n.relation === "impacts" ? "rose" : "slate"}>{n.relation}</Badge>
                      <span>{n.news.source}</span>
                      <span>{fmtWhen(n.news.publishedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Supporting notes" subtitle="Memos, models and sources that support or contradict" dense>
              {notes.length === 0 && <Empty>No notes attached.</Empty>}
              <ul className="space-y-2 p-3 text-xs">
                {notes.slice(0, 8).map((n) => (
                  <li key={n.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <Badge tone="indigo">{n.kind}</Badge>
                    <Link href={`/research/notes/${n.id}`} className="mt-1 block text-slate-300 hover:text-cyan-300">
                      {n.title}
                    </Link>
                    <span className="text-[10.5px] text-slate-600">{fmtDate(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Executions on this name" subtitle="Did the trading follow the thesis?" dense>
            {trades.length === 0 && <Empty>No fills.</Empty>}
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
                {trades.map((t) => (
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
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Review this thesis" subtitle="Status, conviction, target, and next review — one control surface">
            <form action={updateThesis} className="space-y-2.5">
              <input type="hidden" name="thesisId" value={thesis.id} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Status</label>
                  <select name="status" className={inputCls} defaultValue={thesis.status}>
                    {["idea", "active", "trimmed", "closed", "invalidated"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Conviction</label>
                  <select name="conviction" className={inputCls} defaultValue={String(thesis.conviction)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Target</label>
                  <input name="targetPrice" type="number" step="any" defaultValue={thesis.targetPrice ?? ""} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Next review (days)</label>
                  <input name="reviewInDays" type="number" defaultValue="30" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Update note</label>
                <textarea name="update" rows={3} className={inputCls} placeholder="What did you learn, and does it change conviction?" />
              </div>
              <button className="w-full rounded bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-500">Save review + log update</button>
            </form>
          </Panel>

          <Panel title="Position context" subtitle="Exposure in the book for this name">
            {position ? (
              <>
                <KV k="Market value" v={fmtMoney(position.marketValue)} />
                <KV k="Weight" v={fmtPct(position.weight, 2)} tone={position.weight > 0.12 ? "text-amber-300" : undefined} />
                <KV k="Avg cost" v={fmtNum(position.avgCost)} />
                <KV k="Unrealised" v={`${fmtSigned(position.unrealized)} (${fmtPct(position.unrealizedPct, 1)})`} tone={toneClass(position.unrealized)} />
                <KV k="Day contribution" v={fmtSigned(position.dayContribution)} tone={toneClass(position.dayContribution)} />
                <KV k="Account" v={position.accountName} />
                {thesis.targetPrice && quote && <KV k="Distance to target" v={fmtPct(thesis.targetPrice / quote.price - 1, 1)} />}
                {distanceToInvalidation}
              </>
            ) : (
              <p className="text-xs text-slate-500">
                No position. This is a written idea only — the watchlist or alert layer decides when it becomes actionable.
              </p>
            )}
          </Panel>

          <Panel title="Add a note to this thesis">
            <form action={addNote} className="space-y-2">
              <input type="hidden" name="symbol" value={quote?.instrument.symbol ?? ""} />
              <input type="hidden" name="tags" value={(thesis.tags || "").split(",")[0] ?? ""} />
              <select name="kind" className={inputCls} defaultValue="memo">
                {["memo", "earnings", "model", "source", "call", "screen"].map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input name="title" required placeholder="Note title" className={inputCls} />
              <textarea name="body" rows={3} placeholder="Evidence, numbers, open questions" className={inputCls} />
              <input name="sourceUrl" placeholder="Source URL (optional)" className={inputCls} />
              <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">Attach note</button>
            </form>
          </Panel>

          <Panel title="Log a decision against this thesis">
            <form action={addJournalEntry} className="space-y-2">
              <input type="hidden" name="thesisId" value={thesis.id} />
              <input type="hidden" name="symbol" value={quote?.instrument.symbol ?? ""} />
              <input type="hidden" name="kind" value="decision" />
              <input name="title" required placeholder="Decision, in one line" className={inputCls} />
              <select name="decision" className={inputCls} defaultValue="hold">
                {["buy", "size-up", "hold", "trim", "size-down", "sell", "pass"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <textarea name="body" rows={3} placeholder="Reasoning and what would change your mind" className={inputCls} />
              <input name="reviewInDays" type="number" defaultValue="90" className={inputCls} />
              <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">Add to journal</button>
            </form>
          </Panel>

          <Panel title="Falsification watch">
            <KV k="Stance" v={thesis.stance} />
            <KV k="Horizon" v={thesis.horizon} />
            <KV k="Filed" v={fmtDate(thesis.createdAt)} />
            <KV k="Next review" v={thesis.reviewAt ? fmtDay(thesis.reviewAt) : "unscheduled"} tone={thesis.reviewAt && thesis.reviewAt.getTime() < Date.now() ? "text-amber-300" : undefined} />
            <KV k="Current price" v={quote ? fmtNum(quote.price) : "—"} />
            <KV k="1m move" v={quote ? fmtPct(quote.r1m, 1) : "—"} tone={quote ? toneClass(quote.r1m) : undefined} />
            <div className="mt-2">
              <Delta value={returnSince ?? 0} showValue valueText={`since filing`} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
