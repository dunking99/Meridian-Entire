import Link from "next/link";
import { Badge, Card, Change, Empty, Stat, TickerChip, sentimentColor } from "@/components/ui";
import { money, pct, price, relTime, tone } from "@/lib/format";
import { dayChange, getAlerts, getMarketsOverview, getNewsFeed, getNotes, getPortfolioSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [summary, news, alerts, notes, markets] = await Promise.all([
    getPortfolioSummary(),
    getNewsFeed("holdings"),
    getAlerts(),
    getNotes(),
    getMarketsOverview(),
  ]);
  const firing = alerts.filter((a) => a.active && a.firing);
  const movers = [...summary.positions].sort((a, b) => Math.abs(b.dayChange) - Math.abs(a.dayChange)).slice(0, 5);
  const indices = markets.indices.filter((i) => ["SPX", "NDX", "VIX", "US10Y", "BTC", "USOIL"].includes(i.symbol));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-slate-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · what matters to your book right now
        </p>
      </div>

      {/* Macro strip */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {indices.map((i) => {
          const c = dayChange(i);
          return (
            <Link key={i.id} href={`/markets/${i.symbol}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-slate-400">
              <div className="text-[11px] font-medium text-slate-500">{i.symbol}</div>
              <div className="text-sm font-semibold tabular-nums">{price(Number(i.lastPrice))}</div>
              <div className={`text-xs tabular-nums ${tone(c.pct)}`}>{pct(c.pct)}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Portfolio value" value={money(summary.totalValue)} sub={`${pct(summary.dayChangePct)} today · ${money(summary.dayChange)}`} subTone={summary.dayChange} />
        <Stat label="Unrealized P&L" value={money(summary.unrealized)} sub={pct(summary.unrealizedPct)} subTone={summary.unrealized} />
        <Stat label="Cash" value={money(summary.cash)} sub={`${((summary.cash / summary.totalValue) * 100).toFixed(1)}% of portfolio`} />
        <Stat label="Alerts firing" value={String(firing.length)} sub={`${alerts.filter((a) => a.active).length} active`} subTone={firing.length ? -1 : 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="News touching your holdings" action={<Link href="/news?filter=holdings" className="text-xs text-slate-500 hover:text-slate-900">All →</Link>}>
            {news.length === 0 && <Empty>No news linked to current holdings.</Empty>}
            <ul className="divide-y divide-slate-100">
              {news.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link href={`/news/${a.id}`} className="font-medium text-slate-900 hover:underline">
                      {a.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span>{a.source}</span>·<span>{relTime(a.publishedAt)}</span>
                      <Badge color={sentimentColor(a.sentiment)}>{a.sentiment}</Badge>
                      {a.instruments.map((i) => (
                        <TickerChip key={i.id} inst={i} />
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-slate-500">exposure</div>
                    <div className="text-sm font-semibold tabular-nums">{a.portfolioExposure.toFixed(1)}%</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Biggest movers in your book" action={<Link href="/portfolio/holdings" className="text-xs text-slate-500 hover:text-slate-900">Holdings →</Link>}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {movers.map((p) => (
                  <tr key={p.instrument.id}>
                    <td className="py-2">
                      <Link href={`/markets/${p.instrument.symbol}`} className="font-mono font-medium hover:underline">
                        {p.instrument.symbol}
                      </Link>
                      <span className="ml-2 text-slate-500">{p.instrument.name}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{price(Number(p.instrument.lastPrice))}</td>
                    <td className="py-2 text-right">
                      <Change abs={p.dayChange} pctValue={p.dayChangePct} />
                    </td>
                    <td className="py-2 text-right text-slate-500 tabular-nums">{p.weight.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Alerts firing" action={<Link href="/alerts" className="text-xs text-slate-500 hover:text-slate-900">Manage →</Link>}>
            {firing.length === 0 && <Empty>Nothing firing. {alerts.filter((a) => a.active).length} active alerts are being watched.</Empty>}
            <ul className="space-y-2">
              {firing.map((a) => (
                <li key={a.id} className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <TickerChip inst={a.instrument} />
                    <span className="text-xs text-rose-700">
                      {a.condition.replace("_", " ")} {Number(a.threshold)}
                    </span>
                  </div>
                  {a.note && <div className="mt-1 text-xs text-rose-800">→ {a.note}</div>}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Recent research" action={<Link href="/research" className="text-xs text-slate-500 hover:text-slate-900">All →</Link>}>
            <ul className="space-y-3">
              {notes.slice(0, 4).map((nt) => (
                <li key={nt.id}>
                  <Link href={`/research/${nt.id}`} className="text-sm font-medium hover:underline">
                    {nt.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    <Badge>{nt.kind}</Badge>
                    {nt.instruments.slice(0, 3).map((i) => (
                      <TickerChip key={i.id} inst={i} showWeight={false} />
                    ))}
                    <span>· {relTime(nt.updatedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Allocation">
            <ul className="space-y-1.5">
              {summary.byAssetClass.map((g) => (
                <li key={g.key} className="text-xs">
                  <div className="flex justify-between">
                    <span className="capitalize text-slate-700">{g.key}</span>
                    <span className="tabular-nums text-slate-500">{g.weight.toFixed(1)}%</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded bg-slate-100">
                    <div className="h-1.5 rounded bg-slate-800" style={{ width: `${g.weight}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
