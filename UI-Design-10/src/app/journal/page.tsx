import Link from "next/link";
import { getJournalView } from "@/lib/queries";
import { addJournalEntry } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Empty, KV, LabelBadge, Panel, Stat } from "@/components/ui";
import { fmtDate, fmtDay, fmtWhen } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  const { entries, theses } = await getJournalView();
  const filtered = sp.kind && sp.kind !== "all" ? entries.filter((e) => e.entry.kind === sp.kind) : entries;

  const openReviews = entries.filter((e) => e.entry.reviewAt && e.entry.reviewAt.getTime() > Date.now());
  const overdue = entries.filter((e) => e.entry.reviewAt && e.entry.reviewAt.getTime() < Date.now() && !e.entry.outcome);
  const kinds = ["all", "decision", "review", "observation", "mistake"];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Decision journal"
        subtitle="The audit trail between research and capital. Every trade logged elsewhere writes here too, so the book always has a reason attached."
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/research", label: "Research" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Entries" value={String(entries.length)} sub={`${entries.filter((e) => e.entry.kind === "decision").length} decisions`} />
        <Stat label="Mistakes logged" value={String(entries.filter((e) => e.entry.kind === "mistake").length)} sub="process learning, not shame" tone="warn" />
        <Stat label="Overdue reviews" value={String(overdue.length)} tone={overdue.length ? "warn" : "up"} />
        <Stat label="Scheduled reviews" value={String(openReviews.length)} sub="future checkpoints" />
      </div>

      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <Link
            key={k}
            href={k === "all" ? "/journal" : `/journal?kind=${k}`}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              (sp.kind ?? "all") === k ? "border-cyan-700 bg-cyan-950/50 text-cyan-200" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}
          >
            {k}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.4fr_1fr]">
        <Panel title={`${filtered.length} entries`} subtitle="Newest first; each entry links to the instrument and thesis it belongs to" dense>
          {filtered.length === 0 ? (
            <Empty>Nothing logged in this category.</Empty>
          ) : (
            <ul className="divide-y divide-slate-800/70">
              {filtered.map((e) => (
                <li key={e.entry.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={e.entry.kind === "mistake" ? "rose" : e.entry.kind === "review" ? "indigo" : "slate"}>{e.entry.kind}</Badge>
                        {e.entry.decision && <LabelBadge value={e.entry.decision} />}
                        {e.symbol && (
                          <Link href={`/markets/${encodeURIComponent(e.symbol)}`} className="text-[12px] font-medium text-slate-200 hover:text-cyan-300">
                            {e.symbol}
                          </Link>
                        )}
                        {e.entry.thesisId && e.thesisTitle && (
                          <Link href={`/research/theses/${e.entry.thesisId}`} className="text-[11px] text-indigo-300 hover:text-indigo-200">
                            {e.thesisTitle.slice(0, 48)}
                          </Link>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-slate-100">{e.entry.title}</p>
                      <p className="mt-1 text-[12px] text-slate-400">{e.entry.body}</p>
                      {e.entry.outcome && (
                        <p className="mt-1.5 rounded border border-emerald-900/60 bg-emerald-950/20 px-2 py-1 text-[11.5px] text-emerald-200">
                          Outcome: {e.entry.outcome}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-slate-500">
                      {fmtDate(e.entry.decidedAt)}
                      <span className="block text-[10px] text-slate-600">{fmtWhen(e.entry.decidedAt)}</span>
                      {e.entry.reviewAt && (
                        <span className={`mt-1 block text-[10px] ${e.entry.reviewAt.getTime() < Date.now() ? "text-amber-300" : "text-slate-500"}`}>
                          review {fmtDay(e.entry.reviewAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Log an entry" subtitle="Decisions, reviews, observations, mistakes">
            <form action={addJournalEntry} className="space-y-2.5">
              <div>
                <label className={labelCls}>Kind</label>
                <select name="kind" className={inputCls} defaultValue="decision">
                  {["decision", "review", "observation", "mistake"].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input name="title" required className={inputCls} placeholder="One line that will make sense in a year" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Instrument</label>
                  <input name="symbol" placeholder="CASH" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Decision</label>
                  <select name="decision" className={inputCls} defaultValue="hold">
                    {["buy", "size-up", "hold", "trim", "size-down", "sell", "pass"].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Thesis</label>
                <select name="thesisId" className={inputCls} defaultValue="">
                  <option value="">— none —</option>
                  {theses.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title.slice(0, 60)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Reasoning</label>
                <textarea name="body" rows={5} className={inputCls} placeholder="What you decided, why, and what would change your mind." />
              </div>
              <div>
                <label className={labelCls}>Review in (days)</label>
                <input name="reviewInDays" type="number" defaultValue="90" className={inputCls} />
              </div>
              <button className="w-full rounded bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500">Write entry</button>
            </form>
          </Panel>

          <Panel title="Discipline scoreboard">
            <KV k="Entries with a review date" v={`${entries.filter((e) => e.entry.reviewAt).length}/${entries.length}`} />
            <KV k="Reviewed with an outcome" v={String(entries.filter((e) => e.entry.outcome).length)} tone="text-emerald-400" />
            <KV k="Mistake entries" v={String(entries.filter((e) => e.entry.kind === "mistake").length)} tone="text-amber-300" />
            <KV k="Decisions per month" v={(entries.length / 6).toFixed(1)} />
            <p className="mt-2 text-[11px] text-slate-500">
              The point of the journal is not record-keeping: it is that a decided-but-unreviewed action is indistinguishable from a lucky one.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
