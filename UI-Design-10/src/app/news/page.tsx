import Link from "next/link";
import { getNewsFeed } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { toggleNewsFlags } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Chip, Empty, ExposurePill, Panel, Stat, TierBadge } from "@/components/ui";
import { fmtPct, fmtWhen } from "@/lib/format";

const SCOPES: { key: string; label: string; hint: string }[] = [
  { key: "all", label: "All coverage", hint: "Everything ingested, relevance-ranked" },
  { key: "mine", label: "Impacting my book", hint: "Story mentions a position" },
  { key: "watch", label: "Holdings + watchlist", hint: "Positions or radar names" },
  { key: "saved", label: "Saved", hint: "Reading list" },
];

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; kind?: string; source?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const portfolio = await getPortfolio();
  const scope = (sp.scope as "all" | "mine" | "watch" | "saved") ?? "all";
  const feed = await getNewsFeed(portfolio, { scope, kind: sp.kind, source: sp.source, q: sp.q });

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { scope, kind: sp.kind, source: sp.source, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v && v !== "all") params.set(k, v);
    const qs = params.toString();
    return `/news${qs ? `?${qs}` : ""}`;
  };

  const kinds = ["all", "news", "earnings", "macro", "filing", "rumor", "transcript"];

  return (
    <div className="space-y-4">
      <PageHeader
        title="News"
        subtitle="Every story is matched against the universe, then scored against what I hold. Relevance, not chronology, sets the order — and nothing is filtered out, only tiered."
        breadcrumb={[{ href: "/", label: "Today" }]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Stories in view" value={String(feed.counts.total)} sub={sp.q ? `matching "${sp.q}"` : "latest window"} />
        <Stat label="Touching a name I own or watch" value={String(feed.counts.impactful)} tone={feed.counts.impactful ? "warn" : "up"} />
        <Stat label="Saved" value={String(feed.counts.saved)} sub="reading list" />
        <Stat label="Sources" value={String(feed.sources.length)} sub={sp.source && sp.source !== "all" ? `filtered: ${sp.source}` : "all wires"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SCOPES.map((s) => (
          <Link
            key={s.key}
            href={buildHref({ scope: s.key === "all" ? undefined : s.key })}
            title={s.hint}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              scope === s.key ? "border-cyan-700 bg-cyan-950/50 text-cyan-200" : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-800" />
        {kinds.map((k) => (
          <Link
            key={k}
            href={buildHref({ kind: k === "all" ? undefined : k })}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              (sp.kind ?? "all") === k ? "border-indigo-700 bg-indigo-950/50 text-indigo-200" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}
          >
            {k}
          </Link>
        ))}
        <form method="get" className="ml-auto flex items-center gap-2">
          {scope !== "all" && <input type="hidden" name="scope" value={scope} />}
          {sp.source && <input type="hidden" name="source" value={sp.source} />}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search headlines + bodies"
            className="rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyan-600"
          />
          <button className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 hover:bg-slate-600">Search</button>
        </form>
      </div>

      <Panel
        title={`${feed.items.length} stories`}
        subtitle="Tier = symbol match strength × my exposure. ACT means a name I own moved on a headline mention."
        right={<span className="text-slate-500">sources: {feed.sources.join(" · ")}</span>}
      >
        {feed.items.length === 0 && <Empty>Nothing matches these filters.</Empty>}
        <ul className="divide-y divide-slate-800/70">
          {feed.items.map((item) => (
            <li key={item.news.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/news/${item.news.id}`} className="text-[13.5px] font-medium text-slate-100 hover:text-cyan-300">
                      {item.news.headline}
                    </Link>
                    {item.heldMentions > 0 && <Badge tone="emerald">affects {item.heldMentions} holding{item.heldMentions > 1 ? "s" : ""}</Badge>}
                    {item.watchMentions > item.heldMentions && <Badge tone="cyan">watchlist name</Badge>}
                    {item.linkCounts.thesis > 0 && <Badge tone="indigo">{item.linkCounts.thesis} thesis link</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-slate-400">{item.news.summary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>{item.news.source}</span>
                    <span>·</span>
                    <span>{fmtWhen(item.news.publishedAt)}</span>
                    <Badge tone={item.news.kind === "macro" ? "cyan" : item.news.kind === "filing" ? "amber" : "slate"}>{item.news.kind}</Badge>
                    <Badge tone={item.news.sentiment > 0.2 ? "emerald" : item.news.sentiment < -0.2 ? "rose" : "slate"}>
                      sentiment {item.news.sentiment.toFixed(2)}
                    </Badge>
                    {item.mentions.slice(0, 5).map((m) => (
                      <Chip key={m.instrument.id} href={`/markets/${encodeURIComponent(m.instrument.symbol)}`} tone={m.weight > 0 ? "cyan" : "slate"}>
                        {m.instrument.symbol}
                        {m.weight > 0 ? ` · held ${fmtPct(m.weight, 1)}` : ""}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <TierBadge tier={item.tier} />
                  {item.heldMentions > 0 && <ExposurePill value={item.exposureValue} pct={item.exposurePct} />}
                  {item.topSector && <span className="text-[10px] text-slate-500">{item.topSector} exposure</span>}
                  <form action={toggleNewsFlags}>
                    <input type="hidden" name="newsId" value={item.news.id} />
                    <input type="hidden" name="field" value="saved" />
                    <button className={`rounded border px-1.5 py-0.5 text-[10px] ${item.saved ? "border-amber-700 text-amber-300" : "border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                      {item.saved ? "saved" : "save"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
