import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoteDetail } from "@/lib/queries";
import { analyseText } from "@/lib/enrich";
import { PageHeader } from "@/components/shell";
import { Badge, Chip, Delta, Empty, KV, LabelBadge, Panel, Sparkline, Stat } from "@/components/ui";
import { fmtDate, fmtNum, fmtPct } from "@/lib/format";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getNoteDetail(Number(id));
  if (!detail) notFound();
  const { note, quote, linkedNotes, linkedTheses } = detail;
  const mentioned = await analyseText(`${note.title}. ${note.body}`);

  return (
    <div className="space-y-4">
      <PageHeader
        title={note.title}
        subtitle={`${note.kind} note · written ${fmtDate(note.createdAt)}${note.tags ? ` · ${note.tags}` : ""}`}
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/research", label: "Research" },
          { href: "/research/notes", label: "Notes" },
        ]}
        actions={
          <>
            <Badge tone="indigo">{note.kind}</Badge>
            {note.sourceUrl && (
              <a href={note.sourceUrl} target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-cyan-300 hover:border-cyan-700">
                Open source ↗
              </a>
            )}
            {quote && (
              <Link href={`/markets/${encodeURIComponent(quote.instrument.symbol)}`} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
                {quote.instrument.symbol} hub →
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Attachment" value={quote?.instrument.symbol ?? "cross-cutting"} sub={quote?.instrument.name ?? "no instrument"} />
        <Stat label="Detected mentions" value={String(mentioned.length)} sub="auto-tagged entities" tone={mentioned.length ? "neutral" : "warn"} />
        <Stat label="Linked theses" value={String(linkedTheses.length)} sub={linkedTheses[0]?.status ?? "—"} />
        <Stat label="Related notes" value={String(linkedNotes.length)} sub="same instrument" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.2fr_1fr]">
        <div className="space-y-4">
          <Panel title="Note">
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-slate-300">{note.body}</p>
            <div className="mt-4 flex flex-wrap gap-1">
              {(note.tags || "")
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t) => (
                  <Chip key={t} tone="indigo" href={`/search?q=${encodeURIComponent(t)}`}>
                    {t}
                  </Chip>
                ))}
            </div>
          </Panel>

          <Panel title="Auto-tagged entities" subtitle="The same matcher that links the news tape, run over this note — coverage maps itself" dense>
            {mentioned.length === 0 ? (
              <Empty>No tracked instrument referenced in this note.</Empty>
            ) : (
              <table className="w-full text-xs">
                <tbody>
                  {mentioned.map((m) => (
                    <tr key={m.instrument.id} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-4 py-2">
                        <Link href={`/markets/${encodeURIComponent(m.instrument.symbol)}`} className="font-medium text-slate-100 hover:text-cyan-300">
                          {m.instrument.symbol}
                        </Link>
                        <span className="ml-2 text-[10.5px] text-slate-500">{m.instrument.name}</span>
                      </td>
                      <td className="px-4 py-2">
                        <Badge tone={m.basis === "headline-symbol" ? "rose" : m.basis === "body-symbol" ? "amber" : "slate"}>{m.basis}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-400">score {m.score}</td>
                      <td className="px-4 py-2 text-right">
                        {quote && m.instrument.id === quote.instrument.id ? <Badge tone="emerald">this note's name</Badge> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Linked theses" subtitle="Notes that support or contradict a written thesis">
              {linkedTheses.length === 0 && <Empty>Not attached to a thesis yet.</Empty>}
              <ul className="space-y-2 text-xs">
                {linkedTheses.map((t) => (
                  <li key={t.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <LabelBadge value={t.status} />
                    <Link href={`/research/theses/${t.id}`} className="mt-1 block text-slate-200 hover:text-cyan-300">
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Related notes" subtitle="Everything else written on the same name">
              {linkedNotes.length === 0 && <Empty>No other notes on this name.</Empty>}
              <ul className="space-y-2 text-xs">
                {linkedNotes.map((n) => (
                  <li key={n.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                    <Badge tone="indigo">{n.kind}</Badge>
                    <Link href={`/research/notes/${n.id}`} className="mt-1 block text-slate-200 hover:text-cyan-300">
                      {n.title}
                    </Link>
                    <span className="text-[10.5px] text-slate-600">{fmtDate(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <div className="space-y-4">
          {quote && (
            <Panel title="Instrument context" subtitle={quote.instrument.name}>
              <div className="flex items-center justify-between">
                <span className="tabular-nums text-lg text-slate-100">{fmtNum(quote.price)}</span>
                <Delta value={quote.changePct} />
              </div>
              <Sparkline data={quote.spark} width={240} height={44} className="mt-2 w-full" />
              <div className="mt-2">
                <KV k="1M" v={fmtPct(quote.r1m, 1)} tone={quote.r1m >= 0 ? "text-emerald-400" : "text-rose-400"} />
                <KV k="3M" v={fmtPct(quote.r3m, 1)} tone={quote.r3m >= 0 ? "text-emerald-400" : "text-rose-400"} />
                <KV k="YTD" v={fmtPct(quote.ytd, 1)} />
                <KV k="Sector" v={quote.instrument.sector ?? "—"} />
                <KV k="Themes" v={(quote.instrument.themes ?? "").split(",").filter(Boolean).join(" · ")} />
              </div>
            </Panel>
          )}

          <Panel title="Note metadata">
            <KV k="Kind" v={note.kind} />
            <KV k="Written" v={fmtDate(note.createdAt)} />
            <KV k="Instrument id" v={note.instrumentId ? `#${note.instrumentId}` : "none"} />
            <KV k="Tags" v={note.tags || "—"} />
            <KV k="Source" v={note.sourceUrl ? "primary source attached" : "no source"} tone={note.sourceUrl ? "text-emerald-400" : "text-amber-300"} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
