import Link from "next/link";
import { Badge, Card, Empty, PageHeader, TickerChip, btnCls, stanceColor } from "@/components/ui";
import { relTime } from "@/lib/format";
import { getNotes } from "@/lib/queries";

export const dynamic = "force-dynamic";

const KINDS = ["all", "thesis", "memo", "earnings", "journal"];

export default async function ResearchPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind = "all" } = await searchParams;
  const notes = await getNotes(kind === "all" ? undefined : kind);
  const stale = notes.filter((nt) => nt.kind === "thesis" && nt.status === "open" && Date.now() - +new Date(nt.updatedAt) > 90 * 86400e3);

  return (
    <div>
      <PageHeader
        title="Research"
        subtitle="Theses, memos, earnings notes and journal entries — each linked to instruments so they surface on ticker, news and portfolio pages."
        actions={<Link href="/research/new" className={btnCls}>+ New note</Link>}
      />
      <div className="mb-4 flex gap-1">
        {KINDS.map((k) => (
          <Link key={k} href={`/research?kind=${k}`} className={`rounded-full px-3 py-1 text-sm capitalize ${kind === k ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"}`}>{k}</Link>
        ))}
      </div>
      {stale.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {stale.length} open thesis {stale.length > 1 ? "notes haven't" : "note hasn't"} been reviewed in 90+ days: {stale.map((s) => <Link key={s.id} href={`/research/${s.id}`} className="underline mr-1">{s.title}</Link>)}
        </div>
      )}
      <Card>
        {notes.length === 0 && <Empty>No notes yet.</Empty>}
        <ul className="divide-y divide-slate-100">
          {notes.map((nt) => (
            <li key={nt.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/research/${nt.id}`} className="font-medium hover:underline">{nt.title}</Link>
                  <Badge>{nt.kind}</Badge>
                  <Badge color={stanceColor(nt.stance)}>{nt.stance}</Badge>
                  {nt.status === "closed" && <Badge color="amber">closed</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{nt.body.replace(/[#*\-\n]/g, " ").slice(0, 160)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">{nt.instruments.map((i) => <TickerChip key={i.id} inst={i} />)}</div>
              </div>
              <div className="shrink-0 text-right text-xs text-slate-400">updated {relTime(nt.updatedAt)}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
