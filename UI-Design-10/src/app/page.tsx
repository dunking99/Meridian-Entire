import Link from "next/link";
import { getTodayBrief } from "@/lib/queries";
import { PageHeader } from "@/components/shell";
import { AreaChart, Badge, Chip, Delta, ExposurePill, KV, Panel, Sparkline, Stat, TierBadge } from "@/components/ui";
import { fmtDate, fmtDay, fmtMoney, fmtNum, fmtPct, fmtSigned, fmtWhen, toneClass } from "@/lib/format";

export default async function TodayPage() {
  const brief = await getTodayBrief();
  const { portfolio } = brief;
  const t = portfolio.totals;
  const series = portfolio.navSeries;
  const periodReturn = series.length > 1 ? series[series.length - 1].total / series[0].total - 1 : 0;
  const benchReturn = series.length > 1 && series[0].benchmark ? series[series.length - 1].benchmark / series[0].benchmark - 1 : 0;
  const holdingsQuotes = portfolio.positions.map((p) => p.quote).filter((q): q is NonNullable<typeof q> => !!q);
  const adv = holdingsQuotes.filter((q) => q.changePct > 0).length;
  const dec = holdingsQuotes.filter((q) => q.changePct < 0).length;
  const ingestedAt = brief.meta.find((m) => m.key === "last_ingest_at")?.value;
  const linkCount = brief.meta.find((m) => m.key === "news_link_count")?.value;

  const contributors = brief.contributors.slice(0, 5);
  const detractors = [...brief.contributors].reverse().slice(0, 5);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Today"
        subtitle="One screen that answers: what changed, what does it touch in my book, and what do I owe myself an answer on."
        actions={
          <>
            <Chip tone="cyan">Data as of {ingestedAt ? fmtWhen(ingestedAt) : "—"}</Chip>
            <Chip tone="indigo">{linkCount ? `${linkCount} auto-linked edges` : "link engine idle"}</Chip>
            <Link href="/portfolio" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
              Open portfolio →
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Net asset value" value={fmtMoney(t.nav)} sub={`${t.positions} positions · ${fmtPct(t.cash / (t.nav || 1), 1)} cash`} />
        <Stat label="Day P/L" value={fmtSigned(t.dayChange)} sub={fmtPct(t.dayPct)} tone={t.dayChange >= 0 ? "up" : "down"} />
        <Stat label="Unrealised" value={fmtSigned(t.unrealized)} sub={`${fmtPct(t.unrealizedPct, 1)} vs cost`} tone={t.unrealized >= 0 ? "up" : "down"} />
        <Stat label="Period return" value={fmtPct(periodReturn, 1)} sub={`vs benchmark ${fmtPct(benchReturn, 1)}`} tone={periodReturn >= benchReturn ? "up" : "down"} />
        <Stat label="Breadth today" value={`${adv} up / ${dec} down`} sub={`largest weight ${fmtPct(t.largestWeight, 1)}`} />
        <Stat
          label="Open loops"
          value={`${brief.alerts.length + brief.research.theses.filter((x) => (x.overdueDays ?? -1) >= 0).length} actions`}
          sub={`${brief.alerts.length} breached rules`}
          tone={brief.alerts.length ? "warn" : "neutral"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel
            title="Tape ∩ book"
            subtitle="Auto-ranked by whether the story touches something I own or watch — symbol match in headline, then exposure weight."
            right={<Link href="/news" className="hover:text-slate-200">Full feed →</Link>}
          >
            <ul className="divide-y divide-slate-800/70">
              {brief.feed.map((item) => (
                <li key={item.news.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/news/${item.news.id}`} className="text-[13.5px] font-medium text-slate-100 hover:text-cyan-300">
                        {item.news.headline}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{item.news.source}</span>
                        <span>·</span>
                        <span>{fmtWhen(item.news.publishedAt)}</span>
                        <Badge tone={item.news.sentiment > 0.2 ? "emerald" : item.news.sentiment < -0.2 ? "rose" : "slate"}>
                          sentiment {item.news.sentiment.toFixed(2)}
                        </Badge>
                        {item.mentions.slice(0, 4).map((m) => (
                          <Chip key={m.instrument.id} href={`/markets/${encodeURIComponent(m.instrument.symbol)}`} tone={m.weight > 0 ? "cyan" : "slate"}>
                            {m.instrument.symbol}
                            {m.weight > 0 ? ` · ${fmtPct(m.weight, 1)}` : ""}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <TierBadge tier={item.tier} />
                      {item.heldMentions > 0 && <ExposurePill value={item.exposureValue} pct={item.exposurePct} />}
                      {item.linkCounts.thesis > 0 && <Badge tone="indigo">{item.linkCounts.thesis} thesis hit</Badge>}
                    </div>
                  </div>
                </li>
              ))}
              {brief.feed.length === 0 && <li className="py-4 text-center text-xs text-slate-500">No stories currently touch a holding or watchlist name.</li>}
            </ul>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Action queue" subtitle="Rules breached, theses overdue, events inside 14 days">
              <div className="space-y-3 text-xs">
                <div>
                  <div className="mb-1 text-[10px] tracking-wider text-rose-300/80 uppercase">Alert rules breached</div>
                  {brief.alerts.length === 0 && <p className="text-slate-500">Nothing breached.</p>}
                  {brief.alerts.map((a) => (
                    <div key={a.alert.id} className="flex items-baseline justify-between gap-2 border-b border-slate-800/60 py-1.5 last:border-0">
                      <span className="text-slate-300">
                        <span className="font-semibold text-rose-300">{a.symbol}</span> {a.alert.note}
                      </span>
                      <span className="tabular-nums text-slate-500">{a.current !== null ? fmtNum(a.current, 2) : "—"}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-1 text-[10px] tracking-wider text-amber-300/80 uppercase">Thesis reviews overdue</div>
                  {brief.research.theses.filter((x) => (x.overdueDays ?? -1) >= 0).length === 0 && <p className="text-slate-500">All theses inside their review window.</p>}
                  {brief.research.theses
                    .filter((x) => (x.overdueDays ?? -1) >= 0)
                    .slice(0, 5)
                    .map((x) => (
                      <div key={x.thesis.id} className="flex items-baseline justify-between gap-2 border-b border-slate-800/60 py-1.5 last:border-0">
                        <Link href={`/research/theses/${x.thesis.id}`} className="truncate text-slate-300 hover:text-cyan-300">
                          {x.thesis.title}
                        </Link>
                        <span className="shrink-0 text-amber-300">+{x.overdueDays}d</span>
                      </div>
                    ))}
                </div>
                <div>
                  <div className="mb-1 text-[10px] tracking-wider text-slate-400 uppercase">Catalysts ≤ 14 days</div>
                  {brief.calendar.slice(0, 6).map((c) => (
                    <div key={c.id} className="flex items-baseline justify-between gap-2 border-b border-slate-800/60 py-1.5 last:border-0">
                      <span className="truncate text-slate-300">
                        {c.symbol ? <span className="font-semibold text-slate-100">{c.symbol} </span> : null}
                        {c.title}
                      </span>
                      <span className="shrink-0 text-slate-500">
                        {fmtDay(c.eventDate)} · {c.daysOut}d{c.weight ? ` · ${fmtPct(c.weight, 1)}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Portfolio tape" subtitle={series.length ? `${fmtDate(series[0].d)} → ${fmtDate(series[series.length - 1].d)}` : undefined}>
              <AreaChart data={series.map((s) => s.total)} compare={series.map((s) => s.benchmark)} height={150} />
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border border-slate-800 px-2 py-1.5">
                  <div className="text-slate-500">1M</div>
                  <div className={`tabular-nums ${toneClass(portfolio.history.r1m)}`}>{fmtPct(portfolio.history.r1m, 1)}</div>
                </div>
                <div className="rounded border border-slate-800 px-2 py-1.5">
                  <div className="text-slate-500">3M</div>
                  <div className={`tabular-nums ${toneClass(portfolio.history.r3m)}`}>{fmtPct(portfolio.history.r3m, 1)}</div>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Attribution today" subtitle="Ranked by dollar contribution, not percentage move">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="mb-1 text-[10px] tracking-wider text-emerald-300/80 uppercase">Helped</div>
                {contributors.map((p) => (
                  <div key={p.positionId} className="flex items-baseline justify-between gap-2 border-b border-slate-800/60 py-1.5 last:border-0">
                    <Link href={`/markets/${encodeURIComponent(p.instrument.symbol)}`} className="font-medium text-slate-200 hover:text-cyan-300">
                      {p.instrument.symbol}
                    </Link>
                    <span className={`tabular-nums ${toneClass(p.dayContribution)}`}>{fmtSigned(p.dayContribution, 0)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="mb-1 text-[10px] tracking-wider text-rose-300/80 uppercase">Hurt</div>
                {detractors.map((p) => (
                  <div key={p.positionId} className="flex items-baseline justify-between gap-2 border-b border-slate-800/60 py-1.5 last:border-0">
                    <Link href={`/markets/${encodeURIComponent(p.instrument.symbol)}`} className="font-medium text-slate-200 hover:text-cyan-300">
                      {p.instrument.symbol}
                    </Link>
                    <span className={`tabular-nums ${toneClass(p.dayContribution)}`}>{fmtSigned(p.dayContribution, 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Book vs tape" subtitle="My exposure against the market reads I own for macro context">
            <div className="grid grid-cols-2 gap-2">
              {brief.marketQuotes.map((q) => (
                <Link key={q.instrument.symbol} href={`/markets/${encodeURIComponent(q.instrument.symbol)}`} className="rounded border border-slate-800 px-2 py-1.5 hover:border-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-300">{q.instrument.symbol}</span>
                    <Delta value={q.changePct} />
                  </div>
                  <Sparkline data={q.spark} width={120} height={22} className="mt-1 w-full" />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Recent decisions" subtitle="Journal is the connective tissue between research and trades" right={<Link href="/journal" className="hover:text-slate-200">All →</Link>}>
            <ul className="space-y-2.5 text-xs">
              {brief.journal.map((j) => (
                <li key={j.entry.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Badge tone={j.entry.kind === "mistake" ? "rose" : j.entry.kind === "review" ? "indigo" : "slate"}>{j.entry.kind}</Badge>
                    {j.symbol && <span className="font-medium text-slate-300">{j.symbol}</span>}
                    <span className="text-[10px] text-slate-500">{fmtWhen(j.entry.decidedAt)}</span>
                  </div>
                  <p className="mt-1 text-slate-300">{j.entry.title}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Coverage" subtitle="How much of the book is linked to written reasoning">
            <KV k="Positions with a thesis" v={<span className="tabular-nums">{portfolio.positions.filter((p) => p.thesisId).length} / {portfolio.positions.length}</span>} />
            <KV k="Positions with a news link" v={<span className="tabular-nums">{new Set(brief.feed.flatMap((f) => f.mentions.map((m) => m.instrument.id))).size} names in today's tape</span>} />
            <KV k="Open alert rules" v={<span className="tabular-nums">{brief.alerts.length} breached</span>} tone="text-amber-300" />
            <KV k="Journal entries" v={<span className="tabular-nums">{brief.journal.length} latest</span>} />
            <KV k="Top sector weight" v={<span className="tabular-nums">{fmtPct(t.topSectorWeight, 1)}</span>} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
