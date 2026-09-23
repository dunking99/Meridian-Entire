import TargetEditor from "@/components/TargetEditor";
import { Donut } from "@/components/charts";
import { Badge, Card, Empty, PageHeader, Stat, Td, Th } from "@/components/ui";
import { computePortfolio, getSetting } from "@/lib/portfolio";
import { BUCKETS, DEFAULT_TARGETS, bucketOf } from "@/lib/buckets";
import { fmtCurrency, signClass } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AllocationPage() {
  const [summary, targets, band] = await Promise.all([
    computePortfolio(),
    getSetting<Record<string, number>>("targets", DEFAULT_TARGETS),
    getSetting<number>("driftBand", 2),
  ]);

  const buckets = BUCKETS.map((b) => ({ ...b, value: 0 }));
  const bucketMap = new Map(buckets.map((b) => [b.label, b]));
  for (const p of summary.positions) {
    const b = bucketMap.get(bucketOf(p));
    if (b) b.value += p.marketValue;
  }
  const cashBucket = bucketMap.get("Cash")!;
  cashBucket.value = summary.cash;

  const total = summary.totalValue || 1;
  const rows = buckets.map((b) => {
    const actualPct = (b.value / total) * 100;
    const targetPct = targets[b.label] ?? 0;
    const drift = actualPct - targetPct;
    const targetValue = (targetPct / 100) * total;
    return { ...b, actualPct, targetPct, drift, deltaValue: targetValue - b.value };
  });

  const maxDrift = Math.max(...rows.map((r) => Math.abs(r.drift)));
  const actions = rows
    .filter((r) => Math.abs(r.drift) > band)
    .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue));

  const sectorRows = Object.entries(
    summary.positions.reduce<Record<string, number>>((acc, p) => {
      acc[p.sector] = (acc[p.sector] ?? 0) + p.marketValue;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const regionRows = Object.entries(
    summary.positions.reduce<Record<string, number>>((acc, p) => {
      acc[p.region] = (acc[p.region] ?? 0) + p.marketValue;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const ccyRows = Object.entries(
    summary.positions.reduce<Record<string, number>>((acc, p) => {
      acc[p.currency] = (acc[p.currency] ?? 0) + p.marketValue;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <PageHeader
        eyebrow="Page 04 · Structure"
        title="Allocation"
        blurb="Where the money actually sits versus where you said it should sit — and the exact trades that close the gap."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Invested" value={fmtCurrency(summary.marketValue)} sub={`${((summary.marketValue / total) * 100).toFixed(1)}% deployed`} />
        <Stat label="Cash" value={fmtCurrency(summary.cash)} sub={`${((summary.cash / total) * 100).toFixed(1)}% dry powder`} />
        <Stat
          label="Max drift"
          value={`${maxDrift.toFixed(1)}%`}
          sub={`Against a ${band}% tolerance band`}
          tone={maxDrift > band ? "neg" : "pos"}
        />
        <Stat label="Rebalance trades" value={String(actions.length)} sub="Buckets outside tolerance" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Actual vs target" subtitle="Share of total net worth" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <Th>Bucket</Th>
                  <Th className="text-right">Value</Th>
                  <Th className="text-right">Actual</Th>
                  <Th className="text-right">Target</Th>
                  <Th className="text-right">Drift</Th>
                  <Th className="w-40">Weight</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-slate-900/60 last:border-0">
                    <Td>
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />
                        <span className="text-slate-200">{r.label}</span>
                        {Math.abs(r.drift) > band && <Badge tone={r.drift > 0 ? "amber" : "sky"}>{r.drift > 0 ? "over" : "under"}</Badge>}
                      </span>
                    </Td>
                    <Td className="text-right tabular-nums">{fmtCurrency(r.value, "USD", 0)}</Td>
                    <Td className="text-right tabular-nums text-slate-100">{r.actualPct.toFixed(1)}%</Td>
                    <Td className="text-right tabular-nums text-slate-500">{r.targetPct.toFixed(0)}%</Td>
                    <Td className={`text-right tabular-nums ${signClass(-r.drift)}`}>
                      {r.drift > 0 ? "+" : ""}
                      {r.drift.toFixed(1)}%
                    </Td>
                    <Td>
                      <div className="flex h-2 overflow-hidden rounded bg-slate-800">
                        <div style={{ width: `${Math.min(100, r.actualPct)}%`, background: r.color }} />
                      </div>
                      <div className="mt-1 h-0.5 w-full bg-slate-700/60" style={{ marginLeft: 0 }}>
                        <div className="h-0.5 bg-slate-400" style={{ width: `${Math.min(100, r.targetPct)}%` }} />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Current mix">
          <div className="flex flex-col items-center gap-4">
            <Donut
              data={rows.filter((r) => r.value > 0).map((r) => ({ label: r.label, value: r.value, color: r.color }))}
              size={168}
              centerLabel={fmtCurrency(summary.totalValue, "USD", 0)}
              centerSub="net worth"
            />
            <div className="w-full space-y-1.5">
              {rows.filter((r) => r.value > 0).map((r) => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{r.label}</span>
                  <span className="tabular-nums text-slate-300">{r.actualPct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Rebalance plan" subtitle={`Buckets more than ${band}% away from target`} className="xl:col-span-2">
          {actions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <Th>Action</Th>
                    <Th>Bucket</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="text-right">Move</Th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr key={a.label} className="border-b border-slate-900/60 last:border-0">
                      <Td>
                        <Badge tone={a.deltaValue > 0 ? "emerald" : "rose"}>{a.deltaValue > 0 ? "Buy" : "Trim"}</Badge>
                      </Td>
                      <Td className="text-slate-200">{a.label}</Td>
                      <Td className="text-right tabular-nums">{fmtCurrency(Math.abs(a.deltaValue), "USD", 0)}</Td>
                      <Td className="text-right tabular-nums text-slate-500">
                        {a.actualPct.toFixed(1)}% → {a.targetPct.toFixed(0)}%
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-500">
                Meridian works at bucket level: once you know a bucket needs {fmtCurrency(Math.abs(actions[0].deltaValue), "USD", 0)} more, pick the
                specific ETF on the Portfolio page to express it.
              </p>
            </div>
          ) : (
            <Empty>Everything is inside tolerance. No trades needed.</Empty>
          )}
        </Card>

        <Card title="Target policy" subtitle="Edit to reshape the plan">
          <TargetEditor buckets={BUCKETS} targets={targets} band={band} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <BreakdownCard title="By sector" rows={sectorRows} total={summary.marketValue} />
        <BreakdownCard title="By region" rows={regionRows} total={summary.marketValue} />
        <BreakdownCard title="By currency" rows={ccyRows} total={summary.marketValue} />
      </div>
    </div>
  );
}

function BreakdownCard({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  return (
    <Card title={title}>
      {rows.length ? (
        <ul className="space-y-1.5">
          {rows.map(([label, value]) => (
            <li key={label} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-400">{label}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-slate-500">{fmtCurrency(value, "USD", 0)}</span>
                <span className="w-10 text-right tabular-nums text-slate-200">{((value / (total || 1)) * 100).toFixed(1)}%</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Nothing to show.</Empty>
      )}
    </Card>
  );
}
