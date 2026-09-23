import Link from "next/link";
import { Card, PageHeader, TickerChip } from "@/components/ui";
import { pct, price, tone } from "@/lib/format";
import { dayChange, getMarketsOverview, type TaggedInstrument } from "@/lib/queries";

export const dynamic = "force-dynamic";

function Row({ i }: { i: TaggedInstrument }) {
  const c = dayChange(i);
  return (
    <tr className="[&>td]:py-1.5">
      <td><TickerChip inst={i} /></td>
      <td className="text-xs text-slate-500">{i.name}</td>
      <td className="text-right tabular-nums">{price(Number(i.lastPrice))}</td>
      <td className={`text-right tabular-nums ${tone(c.pct)}`}>{pct(c.pct)}</td>
    </tr>
  );
}

export default async function MarketsPage() {
  const m = await getMarketsOverview();
  const heldCount = m.all.filter((i) => i.position).length;
  return (
    <div>
      <PageHeader title="Markets" subtitle={`Tracking ${m.all.length} instruments · ${heldCount} held · chips show portfolio weight or ☆ if watchlisted`} />
      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
        {m.indices.map((i) => {
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
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Top gainers"><table className="w-full text-sm"><tbody className="divide-y divide-slate-100">{m.gainers.map((i) => <Row key={i.id} i={i} />)}</tbody></table></Card>
        <Card title="Top losers"><table className="w-full text-sm"><tbody className="divide-y divide-slate-100">{m.losers.map((i) => <Row key={i.id} i={i} />)}</tbody></table></Card>
        <Card title="Sector heat">
          <ul className="space-y-1.5 text-sm">
            {m.sectors.map((s) => (
              <li key={s.sector} className="flex items-center gap-2">
                <span className="flex-1">{s.sector}</span>
                <div className="h-2 w-24 rounded bg-slate-100">
                  <div className={`h-2 rounded ${s.avgPct >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${Math.min(100, Math.abs(s.avgPct) * 20)}%` }} />
                </div>
                <span className={`w-16 text-right tabular-nums ${tone(s.avgPct)}`}>{pct(s.avgPct)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card title="All instruments" className="mt-6">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500"><tr className="[&>th]:pb-2 [&>th]:font-medium"><th>Symbol</th><th>Name</th><th>Class</th><th>Sector</th><th className="text-right">Price</th><th className="text-right">Today</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {m.all.map((i) => {
              const c = dayChange(i);
              return (
                <tr key={i.id} className="[&>td]:py-1.5">
                  <td><TickerChip inst={i} /></td>
                  <td>{i.name}</td>
                  <td className="capitalize text-slate-500">{i.assetClass}</td>
                  <td className="text-slate-500">{i.sector}</td>
                  <td className="text-right tabular-nums">{price(Number(i.lastPrice))}</td>
                  <td className={`text-right tabular-nums ${tone(c.pct)}`}>{pct(c.pct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
