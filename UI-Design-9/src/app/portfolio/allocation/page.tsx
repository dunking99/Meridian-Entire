import Link from "next/link";
import { Card } from "@/components/ui";
import { money } from "@/lib/format";
import { getPortfolioSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

const COLORS = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#0ea5e9", "#10b981", "#f59e0b", "#e11d48", "#8b5cf6"];

function Bars({ groups }: { groups: { key: string; value: number; weight: number }[] }) {
  return (
    <div>
      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {groups.map((g, i) => (
          <div key={g.key} style={{ width: `${g.weight}%`, background: COLORS[i % COLORS.length] }} title={`${g.key} ${g.weight.toFixed(1)}%`} />
        ))}
      </div>
      <ul className="space-y-1.5 text-sm">
        {groups.map((g, i) => (
          <li key={g.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 capitalize">{g.key}</span>
            <span className="tabular-nums text-slate-500">{money(g.value, { compact: true })}</span>
            <span className="w-14 text-right tabular-nums font-medium">{g.weight.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AllocationPage() {
  const s = await getPortfolioSummary();
  const top5 = s.positions.slice(0, 5).reduce((a, p) => a + p.weight, 0);
  const largest = s.positions[0];
  const concentrationFlags = [
    { label: "Largest single position", value: `${largest?.instrument.symbol} · ${largest?.weight.toFixed(1)}%`, warn: (largest?.weight ?? 0) > 10 },
    { label: "Top 5 concentration", value: `${top5.toFixed(1)}%`, warn: top5 > 50 },
    {
      label: "Tech + Semis",
      value: `${s.bySector.filter((g) => ["Technology", "Semiconductors"].includes(g.key)).reduce((a, g) => a + g.weight, 0).toFixed(1)}%`,
      warn: s.bySector.filter((g) => ["Technology", "Semiconductors"].includes(g.key)).reduce((a, g) => a + g.weight, 0) > 40,
    },
    { label: "Crypto", value: `${(s.byAssetClass.find((g) => g.key === "crypto")?.weight ?? 0).toFixed(1)}%`, warn: (s.byAssetClass.find((g) => g.key === "crypto")?.weight ?? 0) > 10 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="By asset class"><Bars groups={s.byAssetClass} /></Card>
      <Card title="By sector"><Bars groups={s.bySector} /></Card>
      <Card title="Concentration checks">
        <ul className="space-y-2 text-sm">
          {concentrationFlags.map((f) => (
            <li key={f.label} className={`flex items-center justify-between rounded-md border px-3 py-2 ${f.warn ? "border-amber-300 bg-amber-50" : "border-slate-100"}`}>
              <span className="text-slate-700">{f.label}</span>
              <span className={`tabular-nums font-medium ${f.warn ? "text-amber-800" : ""}`}>{f.value}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Thresholds are simple rules of thumb (10% single name, 50% top-5, 40% tech, 10% crypto). Record rebalancing decisions as a <Link href="/research/new?kind=journal" className="underline">journal note</Link>.
        </p>
      </Card>
    </div>
  );
}
