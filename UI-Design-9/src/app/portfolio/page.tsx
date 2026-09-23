import Link from "next/link";
import { Card, Change, Stat, TickerChip } from "@/components/ui";
import { money, pct, relTime } from "@/lib/format";
import { getNewsFeed, getNotes, getPortfolioSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PortfolioOverview() {
  const [s, news, notes] = await Promise.all([getPortfolioSummary(), getNewsFeed("holdings"), getNotes()]);
  const totalReturn = s.unrealized + s.realized + s.dividends;
  const top = s.positions.slice(0, 5);
  const heldIds = new Set(s.positions.map((p) => p.instrument.id));
  const thesisCoverage = s.positions.map((p) => ({
    p,
    notes: notes.filter((nt) => nt.instruments.some((i) => i.id === p.instrument.id)),
  }));
  const uncovered = thesisCoverage.filter((c) => c.notes.length === 0 && c.p.weight >= 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-5">
        <Stat label="Total value" value={money(s.totalValue)} sub={`${pct(s.dayChangePct)} today`} subTone={s.dayChange} />
        <Stat label="Total return" value={money(totalReturn)} sub={`${pct(s.netContributions ? (totalReturn / s.netContributions) * 100 : 0)} on contributions`} subTone={totalReturn} />
        <Stat label="Unrealized" value={money(s.unrealized)} sub={pct(s.unrealizedPct)} subTone={s.unrealized} />
        <Stat label="Realized + dividends" value={money(s.realized + s.dividends)} sub={`${money(s.dividends)} dividends`} subTone={s.realized + s.dividends} />
        <Stat label="Cash" value={money(s.cash)} sub={`${s.positions.length} positions`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Top positions" className="lg:col-span-2" action={<Link href="/portfolio/holdings" className="text-xs text-slate-500">All holdings →</Link>}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Instrument</th>
                <th className="pb-2 text-right font-medium">Value</th>
                <th className="pb-2 text-right font-medium">Weight</th>
                <th className="pb-2 text-right font-medium">Unrealized</th>
                <th className="pb-2 text-right font-medium">Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top.map((p) => (
                <tr key={p.instrument.id}>
                  <td className="py-2">
                    <Link href={`/markets/${p.instrument.symbol}`} className="font-mono font-medium hover:underline">{p.instrument.symbol}</Link>
                    <span className="ml-2 text-slate-500">{p.instrument.name}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{money(p.marketValue)}</td>
                  <td className="py-2 text-right tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 rounded bg-slate-100"><div className="h-1.5 rounded bg-slate-700" style={{ width: `${Math.min(100, p.weight * 4)}%` }} /></div>
                      {p.weight.toFixed(1)}%
                    </div>
                  </td>
                  <td className="py-2 text-right"><Change abs={p.unrealized} pctValue={p.unrealizedPct} /></td>
                  <td className="py-2 text-right"><Change pctValue={p.dayChangePct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-6">
          <Card title="Asset classes">
            <ul className="space-y-1.5 text-sm">
              {s.byAssetClass.map((g) => (
                <li key={g.key} className="flex items-center justify-between">
                  <span className="capitalize">{g.key}</span>
                  <span className="tabular-nums text-slate-600">{money(g.value, { compact: true })} · {g.weight.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Thesis coverage">
            <p className="mb-2 text-xs text-slate-500">Positions ≥3% with no research note attached.</p>
            {uncovered.length === 0 ? (
              <div className="text-sm text-emerald-700">Every meaningful position has a written thesis.</div>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {uncovered.map((c) => (
                  <li key={c.p.instrument.id}>
                    <Link href={`/research/new?symbols=${c.p.instrument.symbol}`} className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 font-mono text-xs text-amber-800 hover:bg-amber-100">
                      {c.p.instrument.symbol} · write note
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Latest news on your holdings" action={<Link href="/news?filter=holdings" className="text-xs text-slate-500">All →</Link>}>
        <ul className="grid gap-3 md:grid-cols-2">
          {news.slice(0, 4).map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-100 p-3">
              <Link href={`/news/${a.id}`} className="text-sm font-medium hover:underline">{a.title}</Link>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                {a.source} · {relTime(a.publishedAt)}
                {a.instruments.filter((i) => heldIds.has(i.id)).map((i) => <TickerChip key={i.id} inst={i} />)}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
