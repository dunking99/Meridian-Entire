import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Change, Empty, TickerChip, sentimentColor, btnGhost } from "@/components/ui";
import { toggleSaveArticle } from "@/lib/actions";
import { dateShort, money, price } from "@/lib/format";
import { getArticle } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getArticle(Number(id));
  if (!data) notFound();
  const { article: a, relatedNotes } = data;
  const held = a.instruments.filter((i) => i.position);
  const watched = a.instruments.filter((i) => !i.position && i.watchlists.length);
  const other = a.instruments.filter((i) => !i.position && !i.watchlists.length);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <Link href="/news" className="text-xs text-slate-500 hover:underline">← News</Link>
          <h1 className="mt-2 text-2xl font-semibold leading-tight">{a.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{a.source}</span>·<span>{dateShort(a.publishedAt)}</span>
            <Badge color={sentimentColor(a.sentiment)}>{a.sentiment}</Badge>
            <form action={toggleSaveArticle}><input type="hidden" name="id" value={a.id} /><button className={btnGhost}>{a.saved ? "★ Saved" : "☆ Save"}</button></form>
          </div>
        </div>
        <Card><p className="text-[15px] leading-relaxed text-slate-800">{a.summary}</p>{a.url && <a href={a.url} className="mt-3 inline-block text-sm text-sky-700 underline">Read original →</a>}</Card>

        <Card title="Related research" action={<Link href={`/research/new?symbols=${a.instruments.map((i) => i.symbol).join(",")}&title=${encodeURIComponent("Re: " + a.title)}`} className="text-xs text-slate-500">+ Note about this</Link>}>
          {relatedNotes.length === 0 && <Empty>No notes on these instruments yet.</Empty>}
          <ul className="space-y-2">
            {relatedNotes.map((nt) => (
              <li key={nt.id} className="flex items-center gap-2 text-sm">
                <Link href={`/research/${nt.id}`} className="font-medium hover:underline">{nt.title}</Link>
                <Badge>{nt.kind}</Badge><Badge color={nt.stance === "bullish" ? "green" : nt.stance === "bearish" ? "red" : "slate"}>{nt.stance}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Portfolio impact">
          {held.length === 0 ? (
            <p className="text-sm text-slate-500">This story doesn&apos;t touch any current holding.</p>
          ) : (
            <>
              <div className="mb-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
                Touches <b>{held.length}</b> holding{held.length > 1 && "s"} · <b>{a.portfolioExposure.toFixed(1)}%</b> of portfolio · {money(held.reduce((s, i) => s + i.position!.marketValue, 0))}
              </div>
              <ul className="divide-y divide-slate-100 text-sm">
                {held.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-2">
                    <div><TickerChip inst={i} /><div className="mt-0.5 text-xs text-slate-500">{i.name}</div></div>
                    <div className="text-right">
                      <div className="tabular-nums">{money(i.position!.marketValue)}</div>
                      <div className="text-xs"><Change pctValue={i.position!.dayChangePct} /> today</div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        {watched.length > 0 && (
          <Card title="On your watchlists">
            <ul className="space-y-1.5 text-sm">{watched.map((i) => <li key={i.id} className="flex items-center justify-between"><TickerChip inst={i} /><span className="text-xs text-slate-500">{i.watchlists.join(", ")} · {price(Number(i.lastPrice))}</span></li>)}</ul>
          </Card>
        )}
        {other.length > 0 && (
          <Card title="Also mentioned"><div className="flex flex-wrap gap-1">{other.map((i) => <TickerChip key={i.id} inst={i} />)}</div></Card>
        )}
      </div>
    </div>
  );
}
