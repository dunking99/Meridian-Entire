import Link from "next/link";
import { globalSearch } from "@/lib/queries";
import { PageHeader } from "@/components/shell";
import { Badge, Empty, LabelBadge, Panel, Stat } from "@/components/ui";
import { fmtDate, fmtNum, fmtWhen } from "@/lib/format";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const results = await globalSearch(q);
  const total =
    results.instruments.length +
    results.news.length +
    results.notes.length +
    results.theses.length +
    results.trades.length +
    results.journal.length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Search"
        subtitle="One query across every domain — instruments, news, notes, theses, fills and journal entries. Press ⌘K anywhere for the same index in a palette."
        breadcrumb={[{ href: "/", label: "Today" }]}
        actions={
          <form method="get" className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              autoFocus
              placeholder="ticker, theme, phrase, tag"
              className="w-72 rounded border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600"
            />
            <button className="rounded bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500">Search</button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Total hits" value={String(total)} sub={q ? `for “${q}”` : "enter a query"} />
        <Stat label="Instruments" value={String(results.instruments.length)} />
        <Stat label="News" value={String(results.news.length)} />
        <Stat label="Notes" value={String(results.notes.length)} />
        <Stat label="Theses" value={String(results.theses.length)} />
        <Stat label="Trades + journal" value={String(results.trades.length + results.journal.length)} />
      </div>

      {!q && <Empty>Try a ticker (NVDA), a theme (ai-infra), or a phrase ("capacity").</Empty>}

      {q && total === 0 && <Empty>Nothing matched. Search is literal — try a shorter fragment.</Empty>}

      <div className="grid gap-4 xl:grid-cols-2">
        {results.instruments.length > 0 && (
          <Panel title="Instruments" subtitle="Symbol, name, theme and alias all indexed">
            {results.instruments.map((i) => (
              <Link key={i.id} href={`/markets/${encodeURIComponent(i.symbol)}`} className="block border-b border-slate-800/60 py-2 last:border-0 hover:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-100">{i.symbol}</span>
                  <span className="text-[10.5px] text-slate-500">
                    {i.assetClass} · {i.sector}
                  </span>
                </div>
                <span className="text-[11.5px] text-slate-400">{i.name}</span>
                <div className="mt-1 flex gap-1">
                  {(i.themes ?? "")
                    .split(",")
                    .filter(Boolean)
                    .map((t) => (
                      <Badge key={t} tone="indigo">
                        {t}
                      </Badge>
                    ))}
                </div>
              </Link>
            ))}
          </Panel>
        )}

        {results.theses.length > 0 && (
          <Panel title="Theses">
            {results.theses.map((t) => (
              <Link key={t.id} href={`/research/theses/${t.id}`} className="block border-b border-slate-800/60 py-2 last:border-0 hover:bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <LabelBadge value={t.status} />
                  <LabelBadge value={t.stance} />
                  <span className="text-[10.5px] text-slate-500">conviction {t.conviction}/5</span>
                </div>
                <span className="mt-1 block text-[12.5px] text-slate-200">{t.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] text-slate-500">{t.body}</span>
              </Link>
            ))}
          </Panel>
        )}

        {results.news.length > 0 && (
          <Panel title="News">
            {results.news.map((n) => (
              <Link key={n.id} href={`/news/${n.id}`} className="block border-b border-slate-800/60 py-2 last:border-0 hover:bg-slate-800/30">
                <span className="block text-[12.5px] text-slate-200">{n.headline}</span>
                <span className="text-[10.5px] text-slate-500">
                  {n.source} · {fmtWhen(n.publishedAt)} · {n.kind}
                </span>
              </Link>
            ))}
          </Panel>
        )}

        {results.notes.length > 0 && (
          <Panel title="Notes">
            {results.notes.map((n) => (
              <Link key={n.id} href={`/research/notes/${n.id}`} className="block border-b border-slate-800/60 py-2 last:border-0 hover:bg-slate-800/30">
                <div className="flex items-center gap-2">
                  <Badge tone="indigo">{n.kind}</Badge>
                  <span className="text-[10.5px] text-slate-500">{fmtDate(n.createdAt)}</span>
                </div>
                <span className="mt-1 block text-[12.5px] text-slate-200">{n.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] text-slate-500">{n.body}</span>
              </Link>
            ))}
          </Panel>
        )}

        {results.trades.length > 0 && (
          <Panel title="Fills">
            {results.trades.map((t) => (
              <div key={t.trade.id} className="border-b border-slate-800/60 py-2 last:border-0 text-[11.5px]">
                <div className="flex items-center gap-2">
                  <Badge tone={t.trade.side === "buy" ? "emerald" : "rose"}>{t.trade.side}</Badge>
                  <Link href={`/markets/${encodeURIComponent(t.symbol)}`} className="text-slate-200 hover:text-cyan-300">
                    {t.symbol}
                  </Link>
                  <span className="text-slate-500">
                    {fmtNum(t.trade.quantity, 2)} @ {fmtNum(t.trade.price)}
                  </span>
                  <span className="text-slate-600">{fmtDate(t.trade.executedAt)}</span>
                </div>
                <p className="mt-0.5 text-slate-400">{t.trade.rationale}</p>
              </div>
            ))}
          </Panel>
        )}

        {results.journal.length > 0 && (
          <Panel title="Journal">
            {results.journal.map((j) => (
              <div key={j.id} className="border-b border-slate-800/60 py-2 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge tone={j.kind === "mistake" ? "rose" : j.kind === "review" ? "indigo" : "slate"}>{j.kind}</Badge>
                  <span className="text-[10.5px] text-slate-500">{fmtDate(j.decidedAt)}</span>
                </div>
                <span className="mt-1 block text-[12.5px] text-slate-200">{j.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-[11px] text-slate-500">{j.body}</span>
              </div>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
