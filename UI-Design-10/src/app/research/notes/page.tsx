import Link from "next/link";
import { db } from "@/db";
import { instruments, notes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { addNote } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Chip, Empty, KV, Panel, Stat, Td, Th } from "@/components/ui";
import { fmtDate } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  const rows = await db
    .select({ note: notes, symbol: instruments.symbol, name: instruments.name })
    .from(notes)
    .leftJoin(instruments, eq(instruments.id, notes.instrumentId))
    .orderBy(desc(notes.createdAt));

  const kinds = [...new Set(rows.map((r) => r.note.kind))].sort();
  const filtered = sp.kind && sp.kind !== "all" ? rows.filter((r) => r.note.kind === sp.kind) : rows;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notes library"
        subtitle="Memos, earnings work, models, source files and screen logs. Notes attach to instruments and tag into theses, which is how a library becomes a coverage map."
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/research", label: "Research" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Notes" value={String(rows.length)} sub={`${kinds.length} kinds`} />
        <Stat label="Instrument-linked" value={String(rows.filter((r) => r.note.instrumentId).length)} sub={`${rows.filter((r) => !r.note.instrumentId).length} cross-cutting`} />
        <Stat label="With a source" value={String(rows.filter((r) => r.note.sourceUrl).length)} sub="primary research traceability" />
        <Stat label="This month" value={String(rows.filter((r) => r.note.createdAt.getTime() > Date.now() - 30 * 86_400_000).length)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/research/notes" className={`rounded-full border px-2.5 py-1 text-[11px] ${!sp.kind || sp.kind === "all" ? "border-cyan-700 bg-cyan-950/50 text-cyan-200" : "border-slate-700 text-slate-400"}`}>
          all
        </Link>
        {kinds.map((k) => (
          <Link
            key={k}
            href={`/research/notes?kind=${k}`}
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              sp.kind === k ? "border-indigo-700 bg-indigo-950/50 text-indigo-200" : "border-slate-800 text-slate-500 hover:border-slate-600"
            }`}
          >
            {k}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.4fr_1fr]">
        <Panel title={`${filtered.length} notes`} dense>
          {filtered.length === 0 ? (
            <Empty>Nothing here yet. Write the first note — the library only compounds if it starts.</Empty>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Note</Th>
                  <Th>Kind</Th>
                  <Th>Instrument</Th>
                  <Th>Tags</Th>
                  <Th>Written</Th>
                  <Th>Source</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.note.id} className="align-top hover:bg-slate-800/30">
                    <Td>
                      <Link href={`/research/notes/${r.note.id}`} className="block max-w-xl text-[12.5px] font-medium text-slate-100 hover:text-cyan-300">
                        {r.note.title}
                      </Link>
                      <span className="mt-0.5 line-clamp-2 block max-w-xl text-[11px] text-slate-500">{r.note.body}</span>
                    </Td>
                    <Td>
                      <Badge tone="indigo">{r.note.kind}</Badge>
                    </Td>
                    <Td>
                      {r.symbol ? (
                        <Link href={`/markets/${encodeURIComponent(r.symbol)}`} className="text-slate-200 hover:text-cyan-300">
                          {r.symbol}
                        </Link>
                      ) : (
                        <span className="text-slate-600">cross-cutting</span>
                      )}
                    </Td>
                    <Td>
                      <span className="text-[10.5px] text-slate-500">{r.note.tags}</span>
                    </Td>
                    <Td>{fmtDate(r.note.createdAt)}</Td>
                    <Td>
                      {r.note.sourceUrl ? (
                        <a href={r.note.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-cyan-300 hover:text-cyan-200">
                          link ↗
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="New note" subtitle="Attach to an instrument or leave it cross-cutting">
            <form action={addNote} className="space-y-2.5">
              <div>
                <label className={labelCls}>Kind</label>
                <select name="kind" className={inputCls} defaultValue="memo">
                  {["memo", "earnings", "model", "source", "call", "screen"].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Instrument (optional)</label>
                <input name="symbol" placeholder="TSM" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input name="title" required className={inputCls} placeholder="What this note establishes" />
              </div>
              <div>
                <label className={labelCls}>Body</label>
                <textarea name="body" rows={5} className={inputCls} placeholder="Evidence, numbers, open questions." />
              </div>
              <div>
                <label className={labelCls}>Tags</label>
                <input name="tags" className={inputCls} placeholder="ai-infra,earnings" />
              </div>
              <div>
                <label className={labelCls}>Source URL</label>
                <input name="sourceUrl" className={inputCls} placeholder="https://" />
              </div>
              <button className="w-full rounded bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500">Save note</button>
            </form>
          </Panel>

          <Panel title="Library shape">
            <KV k="Kinds in use" v={kinds.join(" · ")} />
            <KV k="Avg note age" v={`${Math.round(rows.reduce((a, r) => a + (Date.now() - r.note.createdAt.getTime()) / 86_400_000, 0) / Math.max(1, rows.length))}d`} />
            <KV k="Tagged to theses" v={`${rows.filter((r) => r.note.tags).length} notes`} />
            <KV k="Earliest" v={rows.length ? fmtDate(rows[rows.length - 1].note.createdAt) : "—"} />
            <div className="mt-3 flex flex-wrap gap-1">
              {[...new Set(rows.flatMap((r) => (r.note.tags || "").split(",").map((t) => t.trim()).filter(Boolean)))].slice(0, 12).map((t) => (
                <Chip key={t} tone="indigo" href={`/search?q=${encodeURIComponent(t)}`}>
                  {t}
                </Chip>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
