import { useMemo, useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Bar, Button, Card, CardHeader, Field, Info, inputCls } from "../components/ui";
import { buildCandidates, generatePlan, type AllocMode, type Plan } from "../engine/allocate";
import { fmtMoney, fmtNum } from "../lib/format";
import { cn } from "../utils/cn";

export function AllocateTab() {
  const { portfolio: p, openHolding } = usePortfolio();
  const [mode, setMode] = useState<AllocMode>("auto");
  const [wide, setWide] = useState(false);
  const [amount, setAmount] = useState(String(Math.round(p.cash)));
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(() => buildCandidates(p, wide), [p, wide]);
  const amt = Math.max(0, parseFloat(amount) || 0);

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      setPlan(generatePlan(p, mode, amt, wide, candidates));
      setBusy(false);
    }, 420);
  };

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------- controls */}
      <Card>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div>
            <CardHeader
              title="Allocation engine"
              subtitle="Decide where new cash should go. Nothing here is executed — it produces a plan you can act on manually."
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                onClick={() => setMode("auto")}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  mode === "auto" ? "border-teal-400/40 bg-teal-400/[0.07]" : "border-white/[0.07] bg-white/[0.015] hover:border-white/15",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-zinc-100">Auto</span>
                  {mode === "auto" && <Badge tone="up">selected</Badge>}
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-zinc-500">
                  Scores holdings and the watchlist against bull/bear signals, precedent studies, the screener composite and each name's marginal
                  contribution to portfolio risk.
                </p>
              </button>
              <button
                onClick={() => setMode("targets")}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  mode === "targets" ? "border-teal-400/40 bg-teal-400/[0.07]" : "border-white/[0.07] bg-white/[0.015] hover:border-white/15",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-zinc-100">My targets</span>
                  {mode === "targets" && <Badge tone="up">selected</Badge>}
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-zinc-500">
                  Ignores signals entirely. Splits the cash toward whichever holdings sit furthest below the target weight you set, measured
                  post-contribution.
                </p>
              </button>
            </div>

            {mode === "auto" && (
              <label className="mt-2.5 flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015] p-2.5 transition hover:border-white/12">
                <input type="checkbox" checked={wide} onChange={(e) => setWide(e.target.checked)} className="mt-0.5 accent-teal-400" />
                <div>
                  <div className="text-[11px] font-medium text-zinc-200">Widen the search to the whole tracked universe</div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">
                    Off: only what you hold or watch ({candidates.length} candidates). On: every investable instrument Meridian tracks, including
                    names you have never looked at.
                  </div>
                </div>
              </label>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3.5">
            <Field label="Amount to allocate" hint={`Defaults to your cash balance of ${fmtMoney(p.cash, { dp: 0 })}`}>
              <div className="relative">
                <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-zinc-500">£</span>
                <input className={cn(inputCls, "num pl-5 text-[15px]")} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
              </div>
            </Field>
            <div className="mt-2 flex gap-1.5">
              {[0.25, 0.5, 1].map((f) => (
                <button
                  key={f}
                  onClick={() => setAmount(String(Math.round(p.cash * f)))}
                  className="flex-1 rounded-md border border-white/[0.07] py-1 text-[10px] text-zinc-400 transition hover:border-teal-400/30 hover:text-teal-300"
                >
                  {f === 1 ? "All cash" : `${f * 100}%`}
                </button>
              ))}
            </div>
            <Button variant="primary" className="mt-3 w-full" onClick={run} disabled={busy || amt <= 0}>
              {busy ? "Scoring candidates…" : "Generate plan"}
            </Button>
            <div className="mt-2.5 space-y-1 border-t border-white/[0.06] pt-2.5 text-[10px] text-zinc-600">
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="text-zinc-400">{mode === "auto" ? `Auto${wide ? " · wide" : ""}` : "My targets"}</span>
              </div>
              <div className="flex justify-between">
                <span>Candidates</span>
                <span className="num text-zinc-400">{candidates.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash after plan</span>
                <span className="num text-zinc-400">{fmtMoney(Math.max(0, p.cash - amt), { dp: 0 })}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* --------------------------------------------------- candidate list */}
      {!plan && (
        <Card>
          <CardHeader
            title="Candidates before generating"
            subtitle="Ranked by conviction tilt — conviction adjusted for the bull/bear tally and how often comparable setups resolved higher"
            right={<Badge tone="ghost">{candidates.length} in scope</Badge>}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["#", "Symbol", "Source", "Conviction", "Tilt", "Bull/Bear", "Precedent", "Screener", "Risk add", "Weight"].map((h, i) => (
                    <th key={h} className={cn("px-2.5 py-2 text-[9.5px] font-semibold tracking-wider text-zinc-500 uppercase", i <= 2 ? "text-left" : "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 14).map((c, i) => (
                  <tr
                    key={c.symbol}
                    onClick={() => c.held && openHolding(c.symbol)}
                    className={cn("border-b border-white/[0.03] transition last:border-0", c.held && "cursor-pointer hover:bg-white/[0.03]")}
                  >
                    <td className="num px-2.5 py-2 text-[10px] text-zinc-600">{i + 1}</td>
                    <td className="px-2.5 py-2">
                      <div className="num text-[11.5px] font-semibold text-zinc-100">{c.symbol}</div>
                      <div className="max-w-[170px] truncate text-[10px] text-zinc-600">{c.name}</div>
                    </td>
                    <td className="px-2.5 py-2">
                      <Badge tone={c.source === "Holding" ? "info" : c.source === "Watchlist" ? "neutral" : "ghost"}>{c.source}</Badge>
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[11px] text-zinc-300">{c.conviction.toFixed(1)}</td>
                    <td className={cn("num px-2.5 py-2 text-right text-[11px] font-medium", c.tilt >= 7 ? "text-emerald-400" : c.tilt >= 5.5 ? "text-zinc-200" : "text-amber-400")}>
                      {c.tilt.toFixed(2)}
                    </td>
                    <td className="px-2.5 py-2 text-right text-[10.5px]">
                      <span className="text-emerald-400">{c.bull}</span>
                      <span className="text-zinc-600"> / </span>
                      <span className="text-rose-400">{c.bear}</span>
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[10.5px] text-zinc-400">{c.precedent}%</td>
                    <td className="num px-2.5 py-2 text-right text-[10.5px] text-zinc-400">{c.screener}</td>
                    <td className="px-2.5 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <Bar pct={Math.abs(c.riskContribution) * 100} tone={c.riskContribution > 0.6 ? "rose" : "sky"} height="h-1" className="w-8" />
                        <span className="num w-7 text-right text-[10px] text-zinc-500">{(c.riskContribution * 100).toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="num px-2.5 py-2 text-right text-[10.5px] text-zinc-400">{c.weight > 0 ? `${c.weight.toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------ plan */}
      {plan && (
        <>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader
                title="Proposed allocation"
                subtitle={`${fmtMoney(plan.deployed, { dp: 0 })} across ${plan.allocations.length} lines${plan.residual > 1 ? ` · ${fmtMoney(plan.residual, { dp: 0 })} left as cash` : ""}`}
                right={
                  <div className="flex gap-1.5">
                    <Badge tone="ai">{plan.mode === "auto" ? `Auto${plan.wide ? " · wide" : ""}` : "Targets"}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => setPlan(null)}>
                      Reset
                    </Button>
                  </div>
                }
              />
              <div className="space-y-2">
                {plan.allocations.map((a, i) => (
                  <div key={a.symbol} className="rounded-lg border border-white/[0.07] bg-white/[0.015] p-3 transition hover:border-teal-400/25">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-teal-400/12 text-[10px] font-bold text-teal-300">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <button onClick={() => openHolding(a.symbol)} className="num text-[12px] font-semibold text-zinc-100 hover:text-teal-300">
                            {a.symbol}
                          </button>
                          <span className="ml-2 text-[10.5px] text-zinc-500">{a.name}</span>
                          <p className="mt-1 text-[10.5px] leading-relaxed text-zinc-500">{a.rationale}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="num text-[14px] font-semibold text-teal-300">{fmtMoney(a.amount, { dp: 0 })}</div>
                        <div className="num text-[10px] text-zinc-600">{fmtNum(a.units, 2)} units @ {fmtMoney(a.price)}</div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2.5">
                      <span className="num w-10 text-right text-[10px] text-zinc-600">{a.oldWeight.toFixed(1)}%</span>
                      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-zinc-600" style={{ width: `${(a.oldWeight / 26) * 100}%` }} />
                        <div
                          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400"
                          style={{ left: `${(a.oldWeight / 26) * 100}%`, width: `${((a.newWeight - a.oldWeight) / 26) * 100}%` }}
                        />
                      </div>
                      <span className="num w-10 text-[10px] font-medium text-teal-300">{a.newWeight.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {plan.notes.map((n, i) => (
                <p key={i} className="mt-2.5 text-[10.5px] leading-relaxed text-zinc-600">
                  {n}
                </p>
              ))}
            </Card>

            <div className="space-y-3">
              <Card>
                <CardHeader
                  title="Considered but not funded"
                  subtitle="Every candidate that did not make the cut, and why"
                  right={<Badge tone="ghost">{plan.rejected.length}</Badge>}
                />
                <div className="max-h-[330px] space-y-1.5 overflow-y-auto pr-1">
                  {plan.rejected.slice(0, 20).map((r) => (
                    <div key={r.symbol} className="rounded-lg border border-white/[0.05] bg-white/[0.012] p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="num text-[11px] font-semibold text-zinc-300">{r.symbol}</span>
                        <span className="max-w-[130px] truncate text-[10px] text-zinc-600">{r.name}</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{r.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-violet-400/15">
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      Statistical alternative
                      <Info text="Long-only maximum-Sharpe weights from the covariance matrix of the candidate set. Shown as a second opinion: it optimises against the past and knows nothing about your conviction, tax position or the news." />
                    </span>
                  }
                  subtitle={`Max-Sharpe weights · ex-ante Sharpe ${plan.statSharpe.toFixed(2)}`}
                  right={<Badge tone="ai">not a recommendation</Badge>}
                />
                <div className="space-y-1">
                  {plan.statistical.slice(0, 9).map((s) => (
                    <div key={s.symbol} className="group relative overflow-hidden rounded-md px-2 py-1.5">
                      <div className="absolute inset-y-0 left-0 rounded-md bg-violet-400 opacity-[0.12]" style={{ width: `${(s.weight / (plan.statistical[0]?.weight || 1)) * 100}%` }} />
                      <div className="relative flex items-center justify-between">
                        <span className="num text-[11px] font-medium text-zinc-200">{s.symbol}</span>
                        <span className="flex items-center gap-3">
                          <span className="num text-[10px] text-zinc-500">{fmtMoney(s.amount, { dp: 0 })}</span>
                          <span className="num w-11 text-right text-[11px] font-medium text-violet-300">{s.weight.toFixed(1)}%</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 border-t border-white/[0.06] pt-2 text-[10px] leading-relaxed text-zinc-600">
                  Mean-variance output is highly sensitive to the estimation window. Treat large divergences from the ranked plan above as a prompt to
                  check your assumptions, not as an instruction.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
