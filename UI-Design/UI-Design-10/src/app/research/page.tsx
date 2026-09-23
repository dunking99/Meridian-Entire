import Link from "next/link";
import { getResearchOverview } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { upsertThesis } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { EnrichPanel } from "@/components/enrich-panel";
import { Badge, Conviction, Delta, Empty, KV, LabelBadge, Panel, Stat, Td, Th } from "@/components/ui";
import { fmtDate, fmtDay, fmtMoney, fmtNum, fmtPct, toneClass } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function ResearchPage() {
  const portfolio = await getPortfolio();
  const overview = await getResearchOverview(portfolio);

  const active = overview.theses.filter((t) => t.thesis.status === "active");
  const ideas = overview.theses.filter((t) => t.thesis.status === "idea");
  const closed = overview.theses.filter((t) => ["closed", "invalidated"].includes(t.thesis.status));
  const overdue = overview.theses.filter((t) => (t.overdueDays ?? -1) >= 0);
  const orphans = portfolio.positions.filter((p) => !p.thesisId);
  const avgConviction = overview.theses.length ? overview.theses.reduce((a, t) => a + t.thesis.conviction, 0) / overview.theses.length : 0;
  const coveredWeight = portfolio.positions.filter((p) => p.thesisId).reduce((a, p) => a + p.weight, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Research cockpit"
        subtitle="Theses are the unit of work, not tickers. Each thesis carries stance, conviction, target, and the condition that would prove it wrong."
        breadcrumb={[{ href: "/", label: "Today" }]}
        actions={
          <>
            <Link href="/research/notes" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
              Notes library →
            </Link>
            <Link href="/journal" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
              Journal →
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Active theses" value={String(active.length)} sub={`${ideas.length} ideas · ${closed.length} closed`} />
        <Stat label="Avg conviction" value={avgConviction.toFixed(1)} sub="out of 5" />
        <Stat label="Reviews overdue" value={String(overdue.length)} tone={overdue.length ? "warn" : "up"} sub="theses past review date" />
        <Stat label="Positions w/o thesis" value={String(orphans.length)} tone={orphans.length ? "warn" : "up"} sub="process debt" />
        <Stat label="NAV covered by theses" value={fmtPct(coveredWeight, 1)} sub={`${portfolio.positions.filter((p) => p.thesisId).length}/${portfolio.positions.length} positions`} />
        <Stat label="Notes written" value={String(overview.notes.length)} sub={`${Object.keys(overview.noteCounts).length} kinds`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.4fr_1fr]">
        <Panel
          title="Thesis register"
          subtitle="Stance, conviction, target upside, and what the market has done since the idea was written"
          dense
        >
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Thesis</Th>
                  <Th>Stance</Th>
                  <Th>Name</Th>
                  <Th align="right">Weight</Th>
                  <Th align="right">Since idea</Th>
                  <Th align="right">Upside</Th>
                  <Th align="right">News</Th>
                  <Th>Review</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {overview.theses.map((t) => (
                  <tr key={t.thesis.id} className="align-top hover:bg-slate-800/30">
                    <Td>
                      <Link href={`/research/theses/${t.thesis.id}`} className="block max-w-md text-[12.5px] font-medium text-slate-100 hover:text-cyan-300">
                        {t.thesis.title}
                      </Link>
                      <span className="mt-0.5 flex items-center gap-2">
                        <Conviction n={t.thesis.conviction} />
                        <span className="text-[10.5px] text-slate-500">{t.thesis.tags}</span>
                      </span>
                    </Td>
                    <Td>
                      <LabelBadge value={t.thesis.stance} />
                    </Td>
                    <Td>
                      {t.quote ? (
                        <Link href={`/markets/${encodeURIComponent(t.quote.instrument.symbol)}`} className="text-slate-200 hover:text-cyan-300">
                          {t.quote.instrument.symbol}
                        </Link>
                      ) : (
                        <span className="text-slate-500">macro</span>
                      )}
                    </Td>
                    <Td align="right">{t.position ? fmtPct(t.position.weight, 1) : <span className="text-slate-600">—</span>}</Td>
                    <Td align="right">
                      {t.sinceIdea !== null ? <Delta value={t.sinceIdea} /> : "—"}
                    </Td>
                    <Td align="right">{t.upside !== null ? fmtPct(t.upside, 0) : "—"}</Td>
                    <Td align="right">
                      {t.statCount > 0 ? <Badge tone="cyan">{t.statCount}</Badge> : <span className="text-slate-600">0</span>}
                    </Td>
                    <Td>
                      {t.thesis.reviewAt ? (
                        <span className={t.overdueDays !== null && t.overdueDays >= 0 ? "text-amber-300" : "text-slate-500"}>
                          {fmtDay(t.thesis.reviewAt)}
                          {t.overdueDays !== null ? <span className="block text-[10px]">{t.overdueDays >= 0 ? `+${t.overdueDays}d overdue` : `in ${Math.abs(t.overdueDays)}d`}</span> : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <LabelBadge value={t.thesis.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="New thesis" subtitle="Write the invalidation before the position">
            <form action={upsertThesis} className="space-y-2.5">
              <div>
                <label className={labelCls}>Title</label>
                <input name="title" required placeholder="Why this will work, in one sentence" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Instrument</label>
                  <input name="symbol" placeholder="VRT" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Stance</label>
                  <select name="stance" className={inputCls} defaultValue="long">
                    {["long", "short", "avoid", "macro"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Conviction (1-5)</label>
                  <input name="conviction" type="number" min="1" max="5" defaultValue="3" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select name="status" className={inputCls} defaultValue="idea">
                    {["idea", "active", "trimmed", "closed", "invalidated"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Target price</label>
                  <input name="targetPrice" type="number" step="any" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Horizon</label>
                  <input name="horizon" defaultValue="12m" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Invalidation</label>
                <input name="invalidation" className={inputCls} placeholder="What proves this wrong?" />
              </div>
              <div>
                <label className={labelCls}>Body</label>
                <textarea name="body" rows={4} className={inputCls} placeholder="Mechanism, evidence, what you are underwriting." />
              </div>
              <div>
                <label className={labelCls}>Tags</label>
                <input name="tags" className={inputCls} placeholder="ai-infra,core" />
              </div>
              <button className="w-full rounded bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-indigo-500">File thesis</button>
            </form>
          </Panel>

          <EnrichPanel />

          <Panel title="Process debt" subtitle="Things to fix, ranked by weight at risk">
            {orphans.length === 0 ? (
              <p className="text-xs text-emerald-300">Every position has a thesis attached.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {orphans
                  .sort((a, b) => b.weight - a.weight)
                  .map((p) => (
                    <li key={p.positionId} className="flex items-center justify-between gap-2">
                      <Link href={`/markets/${encodeURIComponent(p.instrument.symbol)}`} className="text-slate-300 hover:text-cyan-300">
                        {p.instrument.symbol}
                      </Link>
                      <span className="text-amber-300">{fmtPct(p.weight, 1)} unowned thesis</span>
                    </li>
                  ))}
              </ul>
            )}
            {overdue.length > 0 && (
              <div className="mt-3 border-t border-slate-800 pt-2">
                <div className="mb-1 text-[10px] tracking-wider text-slate-500 uppercase">Overdue reviews</div>
                {overdue.map((t) => (
                  <Link key={t.thesis.id} href={`/research/theses/${t.thesis.id}`} className="block text-[11px] text-slate-400 hover:text-cyan-300">
                    {t.thesis.title.slice(0, 60)} · +{t.overdueDays}d
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Latest notes" right={<Link href="/research/notes" className="hover:text-slate-200">All →</Link>}>
            <ul className="space-y-2 text-xs">
              {overview.notes.slice(0, 5).map((n) => (
                <li key={n.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Badge tone="indigo">{n.kind}</Badge>
                    <span className="text-[10px] text-slate-500">{fmtDate(n.createdAt)}</span>
                  </div>
                  <Link href={`/research/notes/${n.id}`} className="mt-1 block text-slate-300 hover:text-cyan-300">
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Research counters">
            <KV k="Theses active" v={String(active.length)} />
            <KV k="Avg target upside" v={fmtPct(
              overview.theses.filter((t) => t.upside !== null).reduce((a, t) => a + (t.upside ?? 0), 0) /
                Math.max(1, overview.theses.filter((t) => t.upside !== null).length),
              1,
            )} />
            <KV k="Names under coverage" v={String(overview.theses.filter((t) => t.thesis.instrumentId).length)} />
            <KV k="Notes by kind" v={Object.entries(overview.noteCounts).map(([k, v]) => `${k} ${v}`).join(" · ")} />
            <KV k="Latest target change" v={overview.theses[0] ? `${fmtNum(overview.theses[0].thesis.targetPrice ?? 0)} · ${overview.theses[0].thesis.title.slice(0, 24)}…` : "—"} />
            <KV k="Book NAV" v={fmtMoney(portfolio.totals.nav)} />
          </Panel>
        </div>
      </div>

      <Panel title="Thesis ↔ news stream" subtitle="Where research meets the tape: every story touching a live thesis" dense>
        <table className="w-full">
          <thead>
            <tr>
              <Th>Thesis</Th>
              <Th>Latest stories mentioning the name</Th>
              <Th align="right">Coverage</Th>
            </tr>
          </thead>
          <tbody>
            {overview.theses
              .filter((t) => t.thesisNews.length > 0)
              .map((t) => (
                <tr key={t.thesis.id} className="align-top hover:bg-slate-800/30">
                  <Td>
                    <Link href={`/research/theses/${t.thesis.id}`} className="text-slate-200 hover:text-cyan-300">
                      {t.thesis.title.slice(0, 58)}
                    </Link>
                    <span className="mt-0.5 block">
                      <LabelBadge value={t.thesis.status} />
                    </span>
                  </Td>
                  <Td>
                    <ul className="space-y-1">
                      {t.thesisNews.map((n) => (
                        <li key={n.news.id} className="flex items-center gap-2">
                          <Badge tone={n.relation === "impacts" ? "rose" : "slate"}>{n.relation}</Badge>
                          <Link href={`/news/${n.news.id}`} className="text-[11.5px] text-slate-300 hover:text-cyan-300">
                            {n.news.headline.slice(0, 92)}
                          </Link>
                          <span className="text-[10px] text-slate-600">{n.news.source}</span>
                        </li>
                      ))}
                    </ul>
                  </Td>
                  <Td align="right">{t.statCount} stories</Td>
                </tr>
              ))}
            {overview.theses.filter((t) => t.thesisNews.length > 0).length === 0 && (
              <tr>
                <Td>
                  <Empty>No live thesis currently has fresh coverage.</Empty>
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
