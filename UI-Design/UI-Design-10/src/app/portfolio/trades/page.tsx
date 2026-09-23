import Link from "next/link";
import { db } from "@/db";
import { accounts, theses } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { getTrades } from "@/lib/portfolio";
import { addTrade } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, Empty, KV, Panel, Stat, Td, Th } from "@/components/ui";
import { fmtDate, fmtMoney, fmtNum, fmtWhen } from "@/lib/format";

const inputCls =
  "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function TradesPage() {
  const [trades, accountRows, thesisRows] = await Promise.all([
    getTrades(200),
    db.select().from(accounts).orderBy(asc(accounts.id)),
    db.select({ id: theses.id, title: theses.title }).from(theses).orderBy(desc(theses.updatedAt)),
  ]);

  const buys = trades.filter((t) => t.side === "buy");
  const sells = trades.filter((t) => t.side === "sell");
  const gross = trades.reduce((a, t) => a + t.notional, 0);
  const fees = trades.reduce((a, t) => a + t.fees, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trade log"
        subtitle="Every fill carries the reason it was placed and the thesis it belongs to. Logging a fill also writes a journal entry and updates the position and cost basis."
        breadcrumb={[
          { href: "/", label: "Today" },
          { href: "/portfolio", label: "Portfolio" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Fills logged" value={String(trades.length)} sub={`${buys.length} buys / ${sells.length} sells`} />
        <Stat label="Gross traded" value={fmtMoney(gross, { compact: true })} />
        <Stat label="Fees" value={fmtMoney(fees)} />
        <Stat label="Avg fill size" value={fmtMoney(trades.length ? gross / trades.length : 0, { compact: true })} />
        <Stat label="With rationale" value={`${trades.filter((t) => t.rationale).length}/${trades.length}`} sub="process discipline" tone={trades.every((t) => t.rationale) ? "up" : "warn"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_2.2fr]">
        <Panel title="Blotter" subtitle="Writes trade → position → journal in one transaction">
          <form action={addTrade} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Symbol</label>
                <input name="symbol" required placeholder="AAPL" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Side</label>
                <select name="side" className={inputCls} defaultValue="buy">
                  <option value="buy">buy</option>
                  <option value="sell">sell</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Quantity</label>
                <input name="quantity" type="number" step="any" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Price</label>
                <input name="price" type="number" step="any" required className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Account</label>
                <select name="accountId" className={inputCls} defaultValue={accountRows[0]?.id}>
                  {accountRows.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.kind})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Thesis (links the fill to written reasoning)</label>
                <select name="thesisId" className={inputCls} defaultValue="">
                  <option value="">— none —</option>
                  {thesisRows.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title.slice(0, 60)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Rationale</label>
                <textarea name="rationale" rows={3} className={inputCls} placeholder="Why this fill, and what would make it wrong?" />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tags</label>
                <input name="tags" className={inputCls} placeholder="core, ai-infra" />
              </div>
            </div>
            <button type="submit" className="w-full rounded-md bg-cyan-600 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-500">
              Log fill + write journal entry
            </button>
          </form>
          <div className="mt-3">
            <KV k="Cost basis method" v="weighted average" />
            <KV k="Fees model" v="2bp of notional" />
            <KV k="Auto review date" v="+90 days" />
          </div>
        </Panel>

        <Panel title="Fill history" dense>
          {trades.length === 0 ? (
            <Empty>No fills yet — log the first one on the left.</Empty>
          ) : (
            <div className="max-h-[720px] overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Side</Th>
                    <Th>Instrument</Th>
                    <Th align="right">Qty</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">Notional</Th>
                    <Th>Account</Th>
                    <Th>Thesis</Th>
                    <Th>Rationale</Th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="align-top hover:bg-slate-800/30">
                      <Td>
                        <span className="text-[11px] text-slate-400">{fmtDate(t.executedAt)}</span>
                        <span className="block text-[10px] text-slate-600">{fmtWhen(t.executedAt)}</span>
                      </Td>
                      <Td>
                        <Badge tone={t.side === "buy" ? "emerald" : "rose"}>{t.side}</Badge>
                      </Td>
                      <Td>
                        <Link href={`/markets/${encodeURIComponent(t.symbol)}`} className="font-medium text-slate-100 hover:text-cyan-300">
                          {t.symbol}
                        </Link>
                        <span className="block text-[10px] text-slate-500">{t.tags || "—"}</span>
                      </Td>
                      <Td align="right">{fmtNum(t.quantity, t.quantity < 100 ? 2 : 0)}</Td>
                      <Td align="right">{fmtNum(t.price)}</Td>
                      <Td align="right">{fmtMoney(t.notional, { compact: true })}</Td>
                      <Td>
                        <span className="text-[11px] text-slate-400">{t.accountName}</span>
                      </Td>
                      <Td>
                        {t.thesisId ? (
                          <Link href={`/research/theses/${t.thesisId}`} className="text-[11px] text-indigo-300 hover:text-indigo-200">
                            thesis #{t.thesisId}
                          </Link>
                        ) : (
                          <span className="text-[11px] text-amber-300/80">unlinked</span>
                        )}
                      </Td>
                      <Td>
                        <span className="line-clamp-3 max-w-md text-[11px] text-slate-400">{t.rationale ?? "—"}</span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
