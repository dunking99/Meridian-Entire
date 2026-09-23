import DataClient from "@/components/DataClient";
import { PageHeader, Stat } from "@/components/ui";
import { db } from "@/db";
import { instruments, syncLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { countRows } from "@/lib/bootstrap";
import { getCoverage, getSetting, getSnapshots } from "@/lib/portfolio";
import { fmtNumber, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const [coverage, logs, meta, snapshots, rf, txnCount, snapCount] = await Promise.all([
    getCoverage(),
    db.select().from(syncLog).orderBy(desc(syncLog.startedAt)).limit(12),
    db.select().from(instruments),
    getSnapshots(1),
    getSetting<number>("riskFreeRate", 0.04),
    countRows("transactions"),
    countRows("portfolio_snapshots"),
  ]);

  const metaMap = new Map(meta.map((m) => [m.symbol, m]));
  const totalRows = coverage.reduce((a, c) => a + c.days, 0);
  const sparse = coverage.filter((c) => c.days < 200).length;
  const last = logs[0];

  return (
    <div>
      <PageHeader
        eyebrow="Page 11 · Infrastructure"
        title="Data & Settings"
        blurb="The unglamorous page that makes the other ten possible: what is stored, how fresh it is, and how to extend the universe."
        right={
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Last ingest</p>
            <p className="text-sm text-slate-200">{relativeTime(last?.finishedAt ?? last?.startedAt ?? null)}</p>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Price rows" value={fmtNumber(totalRows, 0)} sub={`${coverage.length} symbols archived`} />
        <Stat label="Ledger rows" value={fmtNumber(txnCount, 0)} sub="Transactions of all kinds" />
        <Stat label="Snapshots" value={fmtNumber(snapCount, 0)} sub={snapshots[0] ? `Latest ${snapshots[0].day}` : "None written yet"} />
        <Stat label="Thin coverage" value={fmtNumber(sparse, 0)} sub="Symbols under 200 days" tone={sparse > 0 ? "neg" : "pos"} />
      </div>

      <DataClient
        coverage={coverage.map((c) => ({
          symbol: c.symbol,
          name: metaMap.get(c.symbol)?.name ?? c.symbol,
          days: c.days,
          first: c.first,
          last: c.last,
        }))}
        logs={logs.map((l) => ({
          id: l.id,
          startedAt: new Date(l.startedAt).toISOString(),
          finishedAt: l.finishedAt ? new Date(l.finishedAt).toISOString() : null,
          status: l.status,
          source: l.source,
          symbolsRequested: l.symbolsRequested,
          symbolsUpdated: l.symbolsUpdated,
          rowsWritten: l.rowsWritten,
          message: l.message,
        }))}
        riskFreeRate={rf}
      />
    </div>
  );
}
