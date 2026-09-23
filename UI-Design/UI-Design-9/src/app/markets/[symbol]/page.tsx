import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Change, Empty, Sparkline, Stat, btnCls, btnGhost, inputCls, sentimentColor, stanceColor } from "@/components/ui";
import { addToWatchlist, addTransaction, createAlert, toggleAlert } from "@/lib/actions";
import { dateShort, money, pct, price, qty, relTime, tone } from "@/lib/format";
import { dayChange, getInstrumentContext } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function InstrumentPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ctx = await getInstrumentContext(decodeURIComponent(symbol));
  if (!ctx) notFound();
  const { instrument: i, history, news, notes, alerts, transactions, allWatchlists } = ctx;
  const c = dayChange(i);
  const closes = history.map((h) => Number(h.close));
  const first = closes[0] ?? Number(i.lastPrice);
  const ret90 = first ? ((Number(i.lastPrice) - first) / first) * 100 : 0;
  const hi = Math.max(...closes, Number(i.lastPrice));
  const lo = Math.min(...closes, Number(i.lastPrice));
  const p = i.position;
  const tradeable = i.assetClass !== "index";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-3xl font-semibold">{i.symbol}</h1>
            <Badge>{i.assetClass}</Badge>
            {i.sector && <Badge>{i.sector}</Badge>}
            {p && <Badge color="green">Held · {p.weight.toFixed(1)}%</Badge>}
            {i.watchlists.map((w) => <Badge key={w} color="blue">☆ {w}</Badge>)}
          </div>
          <p className="text-slate-500">{i.name} · {i.exchange}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums">{price(Number(i.lastPrice))}</div>
          <div className={`tabular-nums ${tone(c.pct)}`}>{c.abs > 0 ? "+" : ""}{price(c.abs)} ({pct(c.pct)}) today</div>
          <div className="text-xs text-slate-400">updated {relTime(i.priceUpdatedAt)}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500"><span>90 days</span><span className={tone(ret90)}>{pct(ret90)}</span></div>
          <Sparkline values={[...closes, Number(i.lastPrice)]} width={460} height={90} />
          <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Low {price(lo)}</span><span>High {price(hi)}</span></div>
        </div>
        {p ? (
          <>
            <Stat label="Your position" value={money(p.marketValue)} sub={`${qty(p.quantity)} @ ${price(p.avgCost)} avg`} />
            <Stat label="Unrealized P&L" value={money(p.unrealized)} sub={`${pct(p.unrealizedPct)} · ${money(p.dayChange)} today`} subTone={p.unrealized} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 md:col-span-2">
            Not held. {tradeable ? "Record a buy below to start tracking a position." : "Index / reference instrument."}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="News mentioning this instrument" action={<Link href="/news" className="text-xs text-slate-500">All news →</Link>}>
            {news.length === 0 && <Empty>No linked news yet.</Empty>}
            <ul className="divide-y divide-slate-100">
              {news.map((a) => (
                <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link href={`/news/${a.id}`} className="text-sm font-medium hover:underline">{a.title}</Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">{a.source} · {relTime(a.publishedAt)} <Badge color={sentimentColor(a.sentiment)}>{a.sentiment}</Badge></div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Research on this instrument" action={<Link href={`/research/new?symbols=${i.symbol}`} className="text-xs text-slate-500">+ New note</Link>}>
            {notes.length === 0 && <Empty>No thesis written yet. <Link href={`/research/new?symbols=${i.symbol}`} className="underline">Write one →</Link></Empty>}
            <ul className="divide-y divide-slate-100">
              {notes.map((nt) => (
                <li key={nt.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/research/${nt.id}`} className="text-sm font-medium hover:underline">{nt.title}</Link>
                    <Badge>{nt.kind}</Badge>
                    <Badge color={stanceColor(nt.stance)}>{nt.stance}</Badge>
                    {nt.status === "closed" && <Badge color="amber">closed</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{nt.body.replace(/[#*-]/g, "").slice(0, 200)}</p>
                </li>
              ))}
            </ul>
          </Card>

          {transactions.length > 0 && (
            <Card title="Your transaction history">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(({ tx }) => (
                    <tr key={tx.id} className="[&>td]:py-1.5">
                      <td className="text-slate-500">{dateShort(tx.tradedAt)}</td>
                      <td><Badge color={tx.type === "buy" ? "green" : tx.type === "sell" ? "red" : "blue"}>{tx.type}</Badge></td>
                      <td className="text-right tabular-nums">{tx.type === "dividend" ? money(Number(tx.price)) : `${qty(Number(tx.quantity))} @ ${price(Number(tx.price))}`}</td>
                      <td className="text-xs text-slate-500">{tx.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Alerts">
            {alerts.length === 0 && <p className="mb-3 text-xs text-slate-500">No alerts on {i.symbol}.</p>}
            <ul className="mb-3 space-y-1.5">
              {alerts.map((a) => (
                <li key={a.id} className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs ${a.firing && a.active ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}>
                  <span>{a.condition.replace("_", " ")} <b>{Number(a.threshold)}</b>{a.note && <span className="text-slate-500"> · {a.note}</span>}</span>
                  <form action={toggleAlert}><input type="hidden" name="id" value={a.id} /><button className="text-slate-500 hover:text-slate-900">{a.active ? "pause" : "resume"}</button></form>
                </li>
              ))}
            </ul>
            <form action={createAlert} className="space-y-2 text-sm">
              <input type="hidden" name="symbol" value={i.symbol} />
              <div className="grid grid-cols-2 gap-2">
                <select name="condition" className={inputCls}><option value="price_above">price above</option><option value="price_below">price below</option><option value="pct_move">% move ≥</option></select>
                <input name="threshold" type="number" step="any" required className={inputCls} placeholder="threshold" />
              </div>
              <input name="note" className={inputCls} placeholder="What will you do if it fires?" />
              <button className={btnGhost}>Add alert</button>
            </form>
          </Card>

          {tradeable && (
            <Card title="Quick trade entry">
              <form action={addTransaction} className="space-y-2 text-sm">
                <input type="hidden" name="symbol" value={i.symbol} />
                <input type="hidden" name="redirectTo" value={`/markets/${i.symbol}`} />
                <div className="grid grid-cols-3 gap-2">
                  <select name="type" className={inputCls}><option>buy</option><option>sell</option><option>dividend</option></select>
                  <input name="quantity" type="number" step="any" required className={inputCls} placeholder="qty" />
                  <input name="price" type="number" step="any" required className={inputCls} placeholder="price" defaultValue={Number(i.lastPrice).toFixed(2)} />
                </div>
                <input name="note" className={inputCls} placeholder="Reason (becomes part of your record)" />
                <button className={btnCls}>Record</button>
              </form>
            </Card>
          )}

          <Card title="Watchlists">
            <form action={addToWatchlist} className="flex gap-2 text-sm">
              <input type="hidden" name="symbol" value={i.symbol} />
              <select name="watchlistId" className={inputCls}>{allWatchlists.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
              <button className={btnGhost}>Add</button>
            </form>
          </Card>

          <Card title="Stats">
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-500">Prev close</dt><dd className="text-right tabular-nums">{price(Number(i.prevClose))}</dd>
              <dt className="text-slate-500">90d high</dt><dd className="text-right tabular-nums">{price(hi)}</dd>
              <dt className="text-slate-500">90d low</dt><dd className="text-right tabular-nums">{price(lo)}</dd>
              <dt className="text-slate-500">90d return</dt><dd className={`text-right tabular-nums ${tone(ret90)}`}>{pct(ret90)}</dd>
              <dt className="text-slate-500">Currency</dt><dd className="text-right">{i.currency}</dd>
              {p && (<><dt className="text-slate-500">Position vs avg</dt><dd className="text-right"><Change pctValue={p.unrealizedPct} /></dd></>)}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
