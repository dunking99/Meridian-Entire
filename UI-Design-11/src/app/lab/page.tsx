import LabClient from "@/components/LabClient";
import { Card, PageHeader, Stat } from "@/components/ui";
import { db } from "@/db";
import { instruments } from "@/db/schema";
import { getCoverage } from "@/lib/portfolio";
import { fmtNumber } from "@/lib/format";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function LabPage() {
  const [rows, coverage] = await Promise.all([
    db.select().from(instruments).where(eq(instruments.active, true)),
    getCoverage(),
  ]);

  const deepest = [...coverage].sort((a, b) => b.days - a.days)[0];

  return (
    <div>
      <PageHeader
        eyebrow="Page 10 · Sandbox"
        title="Strategy Lab"
        blurb="Build an allocation, set a contribution plan, and run it against the archive you have actually accumulated — then compare it to the lazy benchmarks."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Backtest engine" value="Daily close" sub="No survivorship edits, no slippage" />
        <Stat label="Deepest history" value={deepest ? `${fmtNumber(deepest.days, 0)} days` : "—"} sub={deepest ? `${deepest.symbol} · from ${deepest.first}` : "—"} />
        <Stat label="Instruments" value={fmtNumber(rows.length, 0)} sub="Available to allocate to" />
      </div>

      <LabClient universe={rows.map((r) => ({ symbol: r.symbol, name: r.name, assetClass: r.assetClass }))} />

      <Card title="Method notes" className="mt-4">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-400">
          <li>Contributions are invested at the close of the first trading day of each month at the target weights.</li>
          <li>With annual rebalancing on, units are reset to target weights on the first trading day of each new year.</li>
          <li>Dividends are approximated through the adjusted-close series, consistent with how the archive is stored.</li>
          <li>Every number here is derived from your own local price history — the lab gets better the longer Meridian runs.</li>
        </ul>
      </Card>
    </div>
  );
}
