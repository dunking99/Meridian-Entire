import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm } from "@/components/note-form";
import { Badge, Card, Change, Empty, TickerChip, sentimentColor, stanceColor } from "@/components/ui";
import { dateShort, money, price, relTime } from "@/lib/format";
import { getNote } from "@/lib/queries";

export const dynamic = "force-dynamic";

function renderBody(body: string) {
  return body.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} className="mt-4 mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={i} className="mt-4 mb-1 text-lg font-semibold">{line.slice(2)}</h2>;
    if (line.startsWith("- ")) return <li key={i} className="ml-5 list-disc">{line.slice(2)}</li>;
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i}>{line}</p>;
  });
}

export default async function NotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const data = await getNote(Number(id));
  if (!data) notFound();
  const { note, news } = data;
  const held = note.instruments.filter((i) => i.position);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <Link href="/research" className="text-xs text-slate-500 hover:underline">← Research</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{note.title}</h1>
            <Badge>{note.kind}</Badge>
            <Badge color={stanceColor(note.stance)}>{note.stance}</Badge>
            {note.status === "closed" && <Badge color="amber">closed</Badge>}
          </div>
          <div className="mt-1 text-xs text-slate-500">Created {dateShort(note.createdAt)} · updated {relTime(note.updatedAt)} · <Link href={edit ? `/research/${note.id}` : `/research/${note.id}?edit=1`} className="underline">{edit ? "view" : "edit"}</Link></div>
        </div>
        {edit ? (
          <Card><NoteForm note={note} defaultSymbols={note.instruments.map((i) => i.symbol).join(", ")} /></Card>
        ) : (
          <Card><div className="text-[15px] leading-relaxed text-slate-800">{renderBody(note.body)}</div></Card>
        )}
        <Card title="Recent news on linked instruments">
          {news.length === 0 && <Empty>No linked news.</Empty>}
          <ul className="divide-y divide-slate-100">
            {news.map((a) => (
              <li key={a.id} className="py-2 first:pt-0 last:pb-0">
                <Link href={`/news/${a.id}`} className="text-sm font-medium hover:underline">{a.title}</Link>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">{a.source} · {relTime(a.publishedAt)} <Badge color={sentimentColor(a.sentiment)}>{a.sentiment}</Badge></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title="Linked instruments">
          {note.instruments.length === 0 && <Empty>No instruments linked.</Empty>}
          <ul className="divide-y divide-slate-100 text-sm">
            {note.instruments.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2">
                <div><TickerChip inst={i} /><div className="mt-0.5 text-xs text-slate-500">{i.name}</div></div>
                <div className="text-right tabular-nums"><div>{price(Number(i.lastPrice))}</div>{i.position && <div className="text-xs"><Change pctValue={i.position.unrealizedPct} /> vs cost</div>}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Thesis vs. position">
          {held.length === 0 ? (
            <p className="text-sm text-slate-500">You don&apos;t hold any of these. {note.stance === "bullish" && "Bullish but not positioned — intentional?"}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {held.map((i) => {
                const p = i.position!;
                const conflict = (note.stance === "bearish" && p.quantity > 0) || (note.status === "closed" && p.quantity > 0);
                return (
                  <li key={i.id} className={`rounded-md border px-3 py-2 ${conflict ? "border-amber-300 bg-amber-50" : "border-slate-100"}`}>
                    <div className="flex justify-between"><span className="font-mono font-medium">{i.symbol}</span><span className="tabular-nums">{money(p.marketValue)} · {p.weight.toFixed(1)}%</span></div>
                    {conflict && <div className="mt-1 text-xs text-amber-800">{note.status === "closed" ? "Thesis closed but position still open." : "Bearish note while holding a position."}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
