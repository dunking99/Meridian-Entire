import Link from "next/link";
import { getPortfolio, getTrades } from "@/lib/portfolio";
import { PageHeader } from "@/components/shell";
import { AreaChart, Badge, BarRow, Delta, Empty, KV, Panel, Sparkline, Stat, Td, Th } from "@/components/ui";
import { daysUntil, fmtDate, fmtMoney, fmtNum, fmtPct, fmtSigned, fmtWhen, toneClass } from "@/lib/format";

export default async function PortfolioPage() {
  const [portfolio, trades] = await Promise.all([getPortfolio(), getTrades(8)]);
  const t = portfolio.totals;

  const themeMap = new Map<string, number>();
  for (const p of portfolio.positions) {
    for (const theme of (p.instrument.themes ?? "").split(",").filter(Boolean)) {
      themeMap.set(theme, (themeMap.get(theme) ?? 0) + p.marketValue);
    }
  }
  const themes = [...themeMap.entries()]
    .map(([label, value]) => ({ label, value, weight: t.nav ? value / t.nav : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const sectorMax = Math.max(...portfolio.bySector.map((s) => s.value), 1);
  const themeMax = Math.max(...themes.map((s) => s.value), 1);
  const breaches = [
    ...portfolio.positions.filter((p) => p.weight > 0.12).map((p) => `${p.instrument.symbol} at ${fmtPct(p.weight, 1)} breaks the 12% single-name cap`),
    ...themes.filter((th) => th.weight > 0.35).map((th) => `Theme "${th.label}" at ${fmtPct(th.weight, 1)} breaks the 35% theme cap`),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Portfolio"
        subtitle="Positions, attribution and the concentration budget — each row opens the instrument hub, where the thesis, notes, news and alerts for that name live."
        breadcrumb={[{ href: "/", label: "Today" }]}
        actions={
          <Link href="/portfolio/trades" className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 hover:border-slate-500">
            Trade log & blotter →
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="NAV" value={fmtMoney(t.nav)} sub={`${fmtMoney(t.marketValue)} invested`} />
        <Stat label="Cash" value={fmtMoney(t.cash)} sub={fmtPct(t.cash / (t.nav || 1), 1)} />
        <Stat label="Cost basis" value={fmtMoney(t.costBasis)} />
        <Stat label="Unrealised" value={fmtSigned(t.unrealized)} sub={fmtPct(t.unrealizedPct, 1)} tone={t.unrealized >= 0 ? "up" : "down"} />
        <Stat label="Day P/L" value={fmtSigned(t.dayChange)} sub={fmtPct(t.dayPct)} tone={t.dayChange >= 0 ? "up" : "down"} />
        <Stat label="Largest weight" value={fmtPct(t.largestWeight, 1)} sub={`top sector ${fmtPct(t.topSectorWeight, 1)}`} tone={t.largestWeight > 0.12 ? "warn" : "neutral"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Net asset value" subtitle={portfolio.navSeries.length ? `${fmtDate(portfolio.navSeries[0].d)} → ${fmtDate(portfolio.navSeries[portfolio.navSeries.length - 1].d)} · dashed = benchmark` : undefined}>
          <AreaChart data={portfolio.navSeries.map((s) => s.total)} compare={portfolio.navSeries.map((s) => s.benchmark)} height={200} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            {[
              ["1M", portfolio.history.r1m],
              ["3M", portfolio.history.r3m],
              ["6M", portfolio.history.r6m],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded border border-slate-800 px-2 py-1.5">
                <div className="text-slate-500">{label as string}</div>
                <div className={`tabular-nums ${toneClass(value as number)}`}>{fmtPct(value as number, 1)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Accounts" subtitle="Cash per sleeve, not just aggregate">
          <table className="w-full text-xs">
            <tbody>
              {portfolio.accounts.map((a) => (
                <tr key={a.id} className="border-b border-slate-800/60 last:border-0">
                  <Td>
                    <div className="text-slate-200">{a.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {a.broker} · {a.kind}
                    </div>
                  </Td>
                  <Td align="right">{fmtMoney(a.marketValue, { compact: true })}</Td>
                  <Td align="right">{fmtMoney(a.cash, { compact: true })}</Td>
                  <Td align="right">{fmtPct(a.nav / (t.nav || 1), 1)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <div className="mb-1 text-[10px] tracking-wider text-slate-500 uppercase">Concentration budget</div>
            {breaches.length === 0 ? (
              <p className="text-xs text-emerald-300">All names inside 12% cap and themes inside 35% cap.</p>
            ) : (
              breaches.map((b) => (
                <p key={b} className="text-xs text-amber-300">
                  ⚠ {b}
                </p>
              ))
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Positions"
        subtitle="Value, weight and today's dollar contribution — the input to the risk budget, not a separate screen"
        right={<span className="text-slate-500">{portfolio.positions.length} open</span>}
        dense
      >
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th>Instrument</Th>
                <Th>Account</Th>
                <Th align="right">Qty</Th>
                <Th align="right">Avg cost</Th>
                <Th align="right">Price</Th>
                <Th align="right">1D</Th>
                <Th align="right">30d</Th>
                <Th align="right">Value</Th>
                <Th>Weight</Th>
                <Th align="right">Day P/L</Th>
                <Th align="right">Unrealised</Th>
                <Th>Thesis</Th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((p) => (
                <tr key={p.positionId} className="hover:bg-slate-800/30">
                  <Td>
                    <Link href={`/markets/${encodeURIComponent(p.instrument.symbol)}`} className="block">
                      <span className="font-semibold text-slate-100 hover:text-cyan-300">{p.instrument.symbol}</span>
                      <span className="block text-[10.5px] text-slate-500">{p.instrument.name}</span>
                    </Link>
                  </Td>
                  <Td>
                    <span className="text-[11px] text-slate-400">{p.accountName}</span>
                  </Td>
                  <Td align="right">{fmtNum(p.quantity, p.quantity < 100 ? 2 : 0)}</Td>
                  <Td align="right">{fmtNum(p.avgCost)}</Td>
                  <Td align="right">{fmtNum(p.price)}</Td>
                  <Td align="right">
                    <Delta value={p.quote?.changePct ?? 0} />
                  </Td>
                  <Td align="right">
                    <Sparkline data={p.quote?.spark ?? []} width={70} height={20} />
                  </Td>
                  <Td align="right">{fmtMoney(p.marketValue, { compact: true })}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                        <span className="block h-full rounded-full bg-cyan-500/70" style={{ width: `${Math.min(100, p.weight * 400)}%` }} />
                      </span>
                      <span className="tabular-nums text-[11px] text-slate-400">{fmtPct(p.weight, 1)}</span>
                    </div>
                  </Td>
                  <Td align="right">
                    <span className={toneClass(p.dayContribution)}>{fmtSigned(p.dayContribution, 0)}</span>
                  </Td>
                  <Td align="right">
                    <span className={toneClass(p.unrealized)}>{fmtSigned(p.unrealized, 0)}</span>
                    <span className={`ml-1 text-[10px] ${toneClass(p.unrealized)}`}>{fmtPct(p.unrealizedPct, 0)}</span>
                  </Td>
                  <Td>
                    {p.thesisId ? (
                      <Link href={`/research/theses/${p.thesisId}`} className="text-[11px] text-indigo-300 hover:text-indigo-200">
                        thesis
                      </Link>
                    ) : (
                      <span className="text-[11px] text-amber-300/80">no thesis</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="By sector">
          <div className="space-y-2">
            {portfolio.bySector.slice(0, 7).map((s) => (
              <BarRow key={s.label} label={s.label} value={s.value} max={sectorMax} right={`${fmtPct(s.weight, 1)} · ${fmtPct(s.r1m, 0)} 1m`} />
            ))}
          </div>
        </Panel>
        <Panel title="By theme" subtitle="Overlapping themes are where concentration actually hides">
          <div className="space-y-2">
            {themes.map((th) => (
              <BarRow key={th.label} label={th.label} value={th.value} max={themeMax} tone={th.weight > 0.35 ? "emerald" : "cyan"} right={fmtPct(th.weight, 1)} />
            ))}
          </div>
        </Panel>
        <Panel title="By asset class">
          <div className="space-y-2">
            {portfolio.byAssetClass.map((a) => (
              <BarRow
                key={a.label}
                label={a.label}
                value={a.value}
                max={Math.max(...portfolio.byAssetClass.map((x) => x.value), 1)}
                right={`${fmtPct(a.weight, 1)} · ${fmtPct(a.r1m, 0)} 1m`}
              />
            ))}
            <KV k="Cash" v={fmtMoney(t.cash)} />
          </div>
        </Panel>
        <Panel title="Latest fills" right={<Link href="/portfolio/trades" className="hover:text-slate-200">All →</Link>}>
          {trades.length === 0 && <Empty>No trades logged yet.</Empty>}
          <ul className="space-y-2 text-xs">
            {trades.map((tr) => (
              <li key={tr.id} className="border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Badge tone={tr.side === "buy" ? "emerald" : "rose"}>{tr.side}</Badge>
                    <Link href={`/markets/${encodeURIComponent(tr.symbol)}`} className="font-medium text-slate-200 hover:text-cyan-300">
                      {tr.symbol}
                    </Link>
                  </span>
                  <span className="tabular-nums text-slate-400">{fmtMoney(tr.notional, { compact: true })}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{tr.rationale}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  {fmtWhen(tr.executedAt)} · {tr.accountName} · review by {fmtDate(new Date(tr.executedAt.getTime() + 90 * 86_400_000))} ({daysUntil(new Date(tr.executedAt.getTime() + 90 * 86_400_000))}d)
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
