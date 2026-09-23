import Link from "next/link";
import { Badge, Card, Empty, PageHeader, TickerChip, sentimentColor } from "@/components/ui";
import { toggleSaveArticle } from "@/lib/actions";
import { relTime } from "@/lib/format";
import { getNewsFeed } from "@/lib/queries";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "holdings", label: "My holdings" },
  { key: "watchlist", label: "Watchlist" },
  { key: "saved", label: "Saved" },
] as const;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const f = (FILTERS.some((x) => x.key === filter) ? filter : "all") as (typeof FILTERS)[number]["key"];
  const items = await getNewsFeed(f);
  const exposureSorted = f === "holdings" ? [...items].sort((a, b) => b.portfolioExposure - a.portfolioExposure) : items;

  return (
    <div>
      <PageHeader title="News" subtitle="Every story is tagged to instruments; the feed is ranked and filtered by how it intersects your book." />
      <div className="mb-4 flex gap-1">
        {FILTERS.map((x) => (
          <Link key={x.key} href={`/news?filter=${x.key}`} className={`rounded-full px-3 py-1 text-sm ${f === x.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"}`}>
            {x.label}
          </Link>
        ))}
        {f === "holdings" && <span className="ml-2 self-center text-xs text-slate-500">sorted by portfolio exposure</span>}
      </div>
      <Card>
        {exposureSorted.length === 0 && <Empty>No stories match this filter.</Empty>}
        <ul className="divide-y divide-slate-100">
          {exposureSorted.map((a) => (
            <li key={a.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
              <div className="w-16 shrink-0 pt-0.5 text-xs text-slate-400">{relTime(a.publishedAt)}</div>
              <div className="min-w-0 flex-1">
                <Link href={`/news/${a.id}`} className="font-medium hover:underline">{a.title}</Link>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{a.summary}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>{a.source}</span>
                  <Badge color={sentimentColor(a.sentiment)}>{a.sentiment}</Badge>
                  {a.instruments.map((i) => <TickerChip key={i.id} inst={i} />)}
                </div>
              </div>
              <div className="flex w-24 shrink-0 flex-col items-end gap-1">
                {a.touchesHoldings ? (
                  <><span className="text-[10px] uppercase tracking-wide text-slate-400">exposure</span><span className="text-sm font-semibold tabular-nums text-emerald-700">{a.portfolioExposure.toFixed(1)}%</span></>
                ) : a.touchesWatchlist ? (
                  <Badge color="blue">watching</Badge>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
                <form action={toggleSaveArticle}><input type="hidden" name="id" value={a.id} /><button className={`text-xs ${a.saved ? "text-amber-600" : "text-slate-400 hover:text-slate-700"}`}>{a.saved ? "★ saved" : "☆ save"}</button></form>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
