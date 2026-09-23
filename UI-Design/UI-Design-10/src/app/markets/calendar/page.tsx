import Link from "next/link";
import { getCalendarView } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { addCatalyst } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Delta, Empty, KV, Panel, Stat, Td, Th } from "@/components/ui";
import { fmtDay, fmtNum, fmtPct } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function CalendarPage() {
  const portfolio = await getPortfolio();
  const events = await getCalendarView(portfolio);

  const upcoming = events.filter((e) => e.daysOut >= 0);
  const weeks = new Map<string, typeof events>();
  for (const e of upcoming) {
    const bucketWeek = Math.floor(e.daysOut / 7);
    const label = bucketWeek === 0 ? "This week" : bucketWeek === 1 ? "Next week" : `In ${bucketWeek + 1} weeks`;
    weeks.set(label, [...(weeks.get(label) ?? []), e]);
  }

  const tiedToPositions = upcoming.filter((e) => e.held);
  const coverageWeight = tiedToPositions.reduce((a, e) => a + e.weight, 0);
  const byKind = upcoming.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }), {});

  return (
    <div className="space-y-4">
      <PageHeader
        title="Catalyst calendar"
        subtitle="Dated events, ranked by whether they hit a position, a watchlist name, or a thesis. Macro prints sit beside earnings because both move the same theses."
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/markets", label: "Markets" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Events ahead" value={String(upcoming.length)} sub={`${events.length - upcoming.length} past`} />
        <Stat label="Tied to holdings" value={String(tiedToPositions.length)} sub={`${fmtPct(coverageWeight, 0)} of NAV in the path`} tone="warn" />
        <Stat label="Earnings" value={String(byKind.earnings ?? 0)} sub={`${byKind.macro ?? 0} macro prints`} />
        <Stat label="Highest importance" value={String(upcoming.filter((e) => e.importance >= 3).length)} sub="noise filter: read these" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.4fr_1fr]">
        <div className="space-y-4">
          {[...weeks.entries()].map(([label, list]) => (
            <Panel key={label} title={label} subtitle={`${list.length} events`} dense>
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Event</Th>
                    <Th>Kind</Th>
                    <Th align="right">Exposure</Th>
                    <Th align="right">Price / 1D</Th>
                    <Th>Why it matters</Th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((e) => (
                    <tr key={e.id} className="align-top hover:bg-slate-800/30">
                      <Td>
                        {fmtDay(e.eventDate)}
                        <span className="block text-[10px] text-slate-500">
                          {e.daysOut === 0 ? "today" : `${e.daysOut}d`}
                        </span>
                      </Td>
                      <Td>
                        {e.symbol ? (
                          <Link href={`/markets/${encodeURIComponent(e.symbol)}`} className="font-medium text-slate-100 hover:text-cyan-300">
                            {e.symbol}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Macro</span>
                        )}
                        <span className="block text-[11px] text-slate-400">{e.title}</span>
                      </Td>
                      <Td>
                        <Badge tone={e.kind === "earnings" ? "indigo" : e.kind === "macro" ? "cyan" : "slate"}>{e.kind}</Badge>
                        {e.importance >= 3 && <Badge tone="rose">high</Badge>}
                      </Td>
                      <Td align="right">
                        {e.held ? <Badge tone="emerald">{fmtPct(e.weight, 1)}</Badge> : e.watched ? <Badge tone="cyan">watch</Badge> : <span className="text-[10.5px] text-slate-600">none</span>}
                      </Td>
                      <Td align="right">
                        {e.quote ? (
                          <>
                            {fmtNum(e.quote.price)}
                            <span className="mt-0.5 block">
                              <Delta value={e.quote.changePct} />
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td>
                        <span className="max-w-md text-[11px] text-slate-400">{e.note}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          ))}
          {upcoming.length === 0 && <Empty>No upcoming events recorded.</Empty>}
        </div>

        <div className="space-y-4">
          <Panel title="Add catalyst" subtitle="Anything with a date belongs here, including your own review dates">
            <form action={addCatalyst} className="space-y-2.5">
              <div>
                <label className={labelCls}>Symbol (blank = macro)</label>
                <input name="symbol" placeholder="AVGO" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input name="title" required placeholder="Q3 earnings" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Date</label>
                  <input name="eventDate" type="date" required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kind</label>
                  <select name="kind" className={inputCls} defaultValue="earnings">
                    {["earnings", "macro", "investor-day", "ex-div", "conference"].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Importance</label>
                <select name="importance" className={inputCls} defaultValue="3">
                  <option value="3">3 — must read</option>
                  <option value="2">2 — normal</option>
                  <option value="1">1 — low</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Why it matters</label>
                <textarea name="note" rows={3} className={inputCls} placeholder="What would this event change in a thesis?" />
              </div>
              <button className="w-full rounded bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500">Add event</button>
            </form>
          </Panel>

          <Panel title="Load in the next two weeks" subtitle="Concentration of scheduled risk">
            <KV k="Events in 14 days" v={String(upcoming.filter((e) => e.daysOut <= 14).length)} />
            <KV k="Overlapping with holdings" v={String(upcoming.filter((e) => e.daysOut <= 14 && e.held).length)} />
            <KV k="Macro prints" v={String(upcoming.filter((e) => e.kind === "macro").length)} />
            <div className="mt-2 space-y-1">
              {upcoming
                .filter((e) => e.daysOut <= 14 && e.held)
                .slice(0, 6)
                .map((e) => (
                  <p key={e.id} className="text-[11px] text-slate-400">
                    <span className="text-slate-300">{e.symbol}</span> {fmtDay(e.eventDate)} · {fmtPct(e.weight, 1)} of NAV
                  </p>
                ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
