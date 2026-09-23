import Link from "next/link";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { getAlertsView } from "@/lib/queries";
import { getPortfolio } from "@/lib/portfolio";
import { createAlert, evaluateAlerts, toggleAlert } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Empty, KV, Panel, Stat, Td, Th } from "@/components/ui";
import { fmtNum, fmtPct, fmtWhen, toneClass } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function AlertsPage() {
  const portfolio = await getPortfolio();
  const { alerts: rules, events } = await getAlertsView(portfolio);
  const [lastCheck] = await db.select().from(alerts).limit(1);

  const armed = rules.filter((r) => r.state === "armed");
  const breached = rules.filter((r) => r.state === "breached");
  const recent = events.filter((e) => Date.now() - e.firedAt.getTime() < 7 * 86_400_000);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alerts & rules"
        subtitle="Rules are evaluated against the same data the pages render, so an alert is a saved question rather than a separate service. Every breach is a decision prompt, not a notification."
        breadcrumb={[{ href: "/", label: "Today" }]}
        actions={
          <form action={evaluateAlerts}>
            <button className="rounded-md bg-cyan-600 px-2.5 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-cyan-500">Evaluate all rules now</button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Rules armed" value={String(armed.length)} sub={`${rules.length} total`} />
        <Stat label="Breached" value={String(breached.length)} tone={breached.length ? "warn" : "up"} sub="require an action or a waiver" />
        <Stat label="Events in 7 days" value={String(recent.length)} sub={`${events.length} retained`} />
        <Stat label="Keyword watches" value={String(rules.filter((r) => r.alert.kind === "news_keyword").length)} sub="tape-driven rules" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.4fr_1fr]">
        <div className="space-y-4">
          <Panel title="Rule book" subtitle="Price, move, keyword and thesis-review rules — all evaluated on demand" dense>
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Rule</Th>
                    <Th>Name</Th>
                    <Th align="right">Threshold</Th>
                    <Th align="right">Current</Th>
                    <Th align="right">Distance</Th>
                    <Th>Last fired</Th>
                    <Th>State</Th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.alert.id} className="align-top hover:bg-slate-800/30">
                      <Td>
                        <span className="text-slate-200">{r.alert.kind.replace(/_/g, " ")}</span>
                        <span className="block text-[11px] text-slate-500">{r.alert.note}</span>
                        {r.alert.keyword && <Badge tone="cyan">“{r.alert.keyword}”</Badge>}
                      </Td>
                      <Td>
                        {r.symbol !== "—" ? (
                          <Link href={`/markets/${encodeURIComponent(r.symbol)}`} className="text-slate-200 hover:text-cyan-300">
                            {r.symbol}
                          </Link>
                        ) : (
                          <span className="text-slate-500">portfolio-wide</span>
                        )}
                        <span className="block text-[10.5px] text-slate-600">{r.name}</span>
                      </Td>
                      <Td align="right">{r.alert.threshold !== null ? fmtNum(r.alert.threshold) : "—"}</Td>
                      <Td align="right">{r.current !== null ? fmtNum(r.current, r.alert.kind === "pct_move" ? 4 : 2) : "—"}</Td>
                      <Td align="right">
                        {r.distance !== null && r.alert.kind !== "thesis_review" ? (
                          <span className={toneClass(-Math.abs(r.distance))}>{fmtPct(r.distance, 1)}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </Td>
                      <Td>{r.lastEvent ? fmtWhen(r.lastEvent.firedAt) : <span className="text-slate-600">never</span>}</Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <Badge tone={r.state === "breached" ? "rose" : r.state === "armed" ? "emerald" : "slate"}>{r.state}</Badge>
                          <form action={toggleAlert}>
                            <input type="hidden" name="alertId" value={r.alert.id} />
                            <button className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-slate-500">
                              {r.alert.active ? "pause" : "arm"}
                            </button>
                          </form>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Event log" subtitle="What fired, when, and against which threshold" dense>
            {events.length === 0 ? (
              <Empty>No events recorded yet. Run the evaluator against the current tape.</Empty>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Instrument</Th>
                    <Th>Message</Th>
                    <Th align="right">Value</Th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/30">
                      <Td>{fmtWhen(e.firedAt)}</Td>
                      <Td>
                        {e.symbol !== "—" ? (
                          <Link href={`/markets/${encodeURIComponent(e.symbol)}`} className="text-slate-200 hover:text-cyan-300">
                            {e.symbol}
                          </Link>
                        ) : (
                          <span className="text-slate-500">portfolio</span>
                        )}
                      </Td>
                      <Td>
                        <span className="text-[11.5px] text-slate-300">{e.message}</span>
                      </Td>
                      <Td align="right">{fmtNum(e.value, 2)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="New rule" subtitle="Price, percentage move, keyword watch or thesis-review nag">
            <form action={createAlert} className="space-y-2.5">
              <div>
                <label className={labelCls}>Kind</label>
                <select name="kind" className={inputCls} defaultValue="price_below">
                  {["price_below", "price_above", "pct_move", "news_keyword", "thesis_review", "earnings"].map((k) => (
                    <option key={k} value={k}>
                      {k.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Instrument (blank = portfolio-wide)</label>
                <input name="symbol" placeholder="NVDA" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Threshold</label>
                <input name="threshold" type="number" step="any" placeholder="104.0 / 0.07" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Keyword (news rules)</label>
                <input name="keyword" placeholder="guidance cut" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Note</label>
                <input name="note" placeholder="What action does a breach imply?" className={inputCls} />
              </div>
              <button className="w-full rounded bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-500">Arm rule</button>
            </form>
          </Panel>

          <Panel title="Rule design guide">
            <KV k="Price rules" v="pre-committed add/trim levels" />
            <KV k="Move rules" v="volatility checks on sized positions" />
            <KV k="Keyword rules" v="tape surveillance on language you care about" />
            <KV k="Thesis-review rules" v="staleness nagging" />
            <KV k="Coverage" v={`${rules.length} rules over ${new Set(rules.map((r) => r.symbol)).size} instruments`} />
            <p className="mt-2 text-[11px] text-slate-500">
              Every breach links back to the instrument hub, so a fired rule lands you next to the position, thesis and coverage for that name.
            </p>
          </Panel>

          <Panel title="Alert quality">
            <KV k="Rules that fired in 30d" v={String(events.filter((e) => Date.now() - e.firedAt.getTime() < 30 * 86_400_000).length)} />
            <KV k="Rules that never fired" v={String(rules.filter((r) => !r.lastEvent).length)} tone="text-amber-300" />
            <KV k="Paused rules" v={String(rules.filter((r) => r.state === "paused").length)} />
            <KV k="Last evaluator sample" v={lastCheck ? fmtWhen(lastCheck.createdAt) : "—"} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
