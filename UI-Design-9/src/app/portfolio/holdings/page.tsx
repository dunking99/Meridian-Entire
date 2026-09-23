import Link from "next/link";
import { Badge, Card, Change } from "@/components/ui";
import { money, price, qty } from "@/lib/format";
import { getNewsFeed, getNotes, getPortfolioSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HoldingsPage() {
  const [s, news, notes] = await Promise.all([getPortfolioSummary(), getNewsFeed("holdings"), getNotes()]);
  const recentNewsIds = new Set(news.filter((a) => Date.now() - +new Date(a.publishedAt) < 3 * 86400e3).flatMap((a) => a.instruments.map((i) => i.id)));
  const noteIds = new Set(notes.flatMap((nt) => nt.instruments.map((i) => i.id)));

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr className="[&>th]:pb-2 [&>th]:font-medium">
              <th>Instrument</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Avg cost</th>
              <th className="text-right">Price</th>
              <th className="text-right">Value</th>
              <th className="text-right">Weight</th>
              <th className="text-right">Unrealized</th>
              <th className="text-right">Today</th>
              <th className="text-right">Realized</th>
              <th className="text-right">Divs</th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {s.positions.map((p) => (
              <tr key={p.instrument.id} className="[&>td]:py-2">
                <td>
                  <Link href={`/markets/${p.instrument.symbol}`} className="font-mono font-medium hover:underline">{p.instrument.symbol}</Link>
                  <div className="text-xs text-slate-500">{p.instrument.name}</div>
                </td>
                <td className="text-right tabular-nums">{qty(p.quantity)}</td>
                <td className="text-right tabular-nums">{price(p.avgCost)}</td>
                <td className="text-right tabular-nums">{price(Number(p.instrument.lastPrice))}</td>
                <td className="text-right tabular-nums font-medium">{money(p.marketValue)}</td>
                <td className="text-right tabular-nums">{p.weight.toFixed(1)}%</td>
                <td className="text-right"><Change abs={p.unrealized} pctValue={p.unrealizedPct} /></td>
                <td className="text-right"><Change abs={p.dayChange} pctValue={p.dayChangePct} /></td>
                <td className="text-right tabular-nums text-slate-600">{p.realized ? money(p.realized) : "—"}</td>
                <td className="text-right tabular-nums text-slate-600">{p.dividends ? money(p.dividends) : "—"}</td>
                <td>
                  <div className="flex gap-1">
                    {recentNewsIds.has(p.instrument.id) && <Badge color="blue">news</Badge>}
                    {noteIds.has(p.instrument.id) ? <Badge color="violet">thesis</Badge> : <Badge color="amber">no thesis</Badge>}
                  </div>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-200 font-medium [&>td]:py-2">
              <td>Cash</td>
              <td colSpan={3} />
              <td className="text-right tabular-nums">{money(s.cash)}</td>
              <td className="text-right tabular-nums">{((s.cash / s.totalValue) * 100).toFixed(1)}%</td>
              <td colSpan={5} />
            </tr>
            <tr className="font-semibold [&>td]:py-2">
              <td>Total</td>
              <td colSpan={3} />
              <td className="text-right tabular-nums">{money(s.totalValue)}</td>
              <td className="text-right tabular-nums">100%</td>
              <td className="text-right"><Change abs={s.unrealized} pctValue={s.unrealizedPct} /></td>
              <td className="text-right"><Change abs={s.dayChange} pctValue={s.dayChangePct} /></td>
              <td className="text-right tabular-nums">{money(s.realized)}</td>
              <td className="text-right tabular-nums">{money(s.dividends)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
