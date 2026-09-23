import Link from "next/link";
import { Badge, Card, Empty, PageHeader, btnCls, btnGhost, inputCls } from "@/components/ui";
import { addToWatchlist, createWatchlist, removeFromWatchlist } from "@/lib/actions";
import { pct, price, tone } from "@/lib/format";
import { dayChange, getAllInstruments, getWatchlists } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function WatchlistsPage() {
  const [lists, insts] = await Promise.all([getWatchlists(), getAllInstruments()]);
  return (
    <div>
      <PageHeader
        title="Watchlists"
        subtitle="Candidates and reference instruments. Items already in your portfolio are flagged so watchlists stay about what you don't own yet."
        actions={
          <form action={createWatchlist} className="flex gap-2">
            <input name="name" className={inputCls} placeholder="New watchlist name" required />
            <button className={btnCls}>Create</button>
          </form>
        }
      />
      <datalist id="symbols">{insts.map((i) => <option key={i.id} value={i.symbol}>{i.name}</option>)}</datalist>
      <div className="grid gap-6 lg:grid-cols-2">
        {lists.map((wl) => (
          <Card key={wl.id} title={`${wl.name} · ${wl.items.length}`}>
            {wl.items.length === 0 && <Empty>Empty list.</Empty>}
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {wl.items.map((it) => {
                  const c = dayChange(it.instrument);
                  return (
                    <tr key={it.instrumentId} className="[&>td]:py-2">
                      <td>
                        <Link href={`/markets/${it.instrument.symbol}`} className="font-mono font-medium hover:underline">{it.instrument.symbol}</Link>
                        <div className="text-xs text-slate-500">{it.instrument.name}</div>
                      </td>
                      <td className="max-w-[220px] text-xs text-slate-500">{it.note}</td>
                      <td>{it.instrument.position && <Badge color="green">held {it.instrument.position.weight.toFixed(1)}%</Badge>}</td>
                      <td className="text-right tabular-nums">{price(Number(it.instrument.lastPrice))}</td>
                      <td className={`text-right tabular-nums ${tone(c.pct)}`}>{pct(c.pct)}</td>
                      <td className="text-right">
                        <form action={removeFromWatchlist}>
                          <input type="hidden" name="watchlistId" value={wl.id} />
                          <input type="hidden" name="instrumentId" value={it.instrumentId} />
                          <button className="text-xs text-slate-400 hover:text-rose-600">✕</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <form action={addToWatchlist} className="mt-3 flex gap-2 border-t border-slate-100 pt-3 text-sm">
              <input type="hidden" name="watchlistId" value={wl.id} />
              <input name="symbol" list="symbols" className={inputCls} placeholder="Symbol" required />
              <input name="note" className={inputCls} placeholder="Why watching / entry condition" />
              <button className={btnGhost}>Add</button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
