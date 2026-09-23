import { useMemo, useState } from "react";
import { TRANSACTIONS, REALIZED_YTD, REALIZED_LTM, HOLDINGS, TOTAL_VALUE, type TxType } from "@/data/portfolio";
import { useApp } from "@/app/state";
import { Panel, PanelHead, Label, Pill } from "@/components/ui/Primitives";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { fmtUSD0, fmtUSD, fmtDate, clsTone, MONTHS, fmtCompact } from "@/lib/format";
import { cn } from "@/utils/cn";
import { IconSearch, IconDownload } from "@/components/ui/icons";
import { exportLedger } from "@/lib/csv";

const TYPES: (TxType | "All")[] = ["All", "Buy", "Sell", "Dividend", "Deposit", "Withdrawal", "Fee", "Interest"];

const TYPE_TONE: Record<string, string> = {
  Buy: "bg-up/10 text-up ring-up/20",
  Sell: "bg-down/10 text-down ring-down/20",
  Dividend: "bg-gold/10 text-gold ring-gold/20",
  Deposit: "bg-azure/10 text-azure ring-azure/20",
  Withdrawal: "bg-violet/10 text-violet ring-violet/20",
  Fee: "bg-ink-800 text-mist-400 ring-ink-700",
  Interest: "bg-acc/10 text-acc ring-acc/20",
};

export function Activity() {
  const { setFocus } = useApp();
  const [type, setType] = useState<TxType | "All">("All");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      TRANSACTIONS.filter((t) => {
        if (type !== "All" && t.type !== type) return false;
        if (q) {
          const ql = q.toLowerCase();
          return (
            (t.ticker ?? "").toLowerCase().includes(ql) ||
            t.type.toLowerCase().includes(ql) ||
            (t.note ?? "").toLowerCase().includes(ql) ||
            t.account.toLowerCase().includes(ql)
          );
        }
        return true;
      }),
    [type, q],
  );

  const flows = useMemo(() => {
    const map = new Map<string, number>();
    TRANSACTIONS.filter((t) => t.type === "Deposit" || t.type === "Withdrawal").forEach((t) => {
      const k = t.date.slice(0, 7);
      map.set(k, (map.get(k) ?? 0) + t.amount);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, []);
  const maxFlow = Math.max(...flows.map((f) => Math.abs(f[1])), 1);

  const closed = TRANSACTIONS.filter((t) => t.realized !== undefined);
  const wins = closed.filter((t) => (t.realized ?? 0) > 0).length;
  const fees = TRANSACTIONS.filter((t) => t.type === "Fee").reduce((a, t) => a + Math.abs(t.amount), 0);
  const interest = TRANSACTIONS.filter((t) => t.type === "Interest" || t.type === "Dividend").reduce(
    (a, t) => a + t.amount,
    0,
  );
  const traded = TRANSACTIONS.filter((t) => t.type === "Buy" || t.type === "Sell").reduce(
    (a, t) => a + Math.abs(t.amount),
    0,
  );
  const shortLots = HOLDINGS.flatMap((h) =>
    h.lots.filter((l) => (Date.now() - new Date(l.date).getTime()) / 86400000 < 365),
  ).length;

  return (
    <div className="animate-rise mx-auto max-w-[1500px]">
      <PageHeader
        title="Activity"
        sub="Every trade, dividend, transfer and fee, with realised results and the tax picture that follows from them."
        right={
          <Button onClick={exportLedger}>
            <IconDownload size={13} /> Export ledger
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { k: "Realised P&L · YTD", v: `${REALIZED_YTD >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(REALIZED_YTD))}`, s: "2 closed trades", tone: clsTone(REALIZED_YTD) },
          { k: "Realised P&L · LTM", v: `${REALIZED_LTM >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(REALIZED_LTM))}`, s: `${closed.length} closed trades`, tone: clsTone(REALIZED_LTM) },
          { k: "Income received", v: fmtUSD0(interest), s: "dividends + interest" },
          { k: "Fees & costs", v: fmtUSD0(fees), s: `${((fees / TOTAL_VALUE) * 10000).toFixed(1)}bp of book` },
          { k: "Turnover", v: `${((traded / TOTAL_VALUE) * 100).toFixed(0)}%`, s: "trailing twelve months" },
        ].map((s) => (
          <Panel key={s.k} className="py-3">
            <Label>{s.k}</Label>
            <div className={cn("tnum mt-1 text-[16px] font-semibold text-mist-100", s.tone)}>{s.v}</div>
            <div className="mt-0.5 text-[10px] text-mist-500">{s.s}</div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* cash flows */}
        <Panel className="xl:col-span-8">
          <PanelHead title="Capital flows" sub="Deposits and withdrawals by month" />
          <div className="mt-5 flex items-center gap-2" style={{ height: 150 }}>
            {flows.map(([k, v]) => {
              const h = (Math.abs(v) / maxFlow) * 46;
              return (
                <div key={k} className="group relative flex h-full flex-1 flex-col items-center justify-center">
                  <div className="flex h-1/2 w-full items-end justify-center">
                    {v > 0 && <div className="w-full rounded-t-[3px] bg-azure/60 transition-all group-hover:bg-azure" style={{ height: `${h * 2}%` }} />}
                  </div>
                  <div className="h-px w-full bg-ink-700" />
                  <div className="flex h-1/2 w-full items-start justify-center">
                    {v < 0 && <div className="w-full rounded-b-[3px] bg-violet/60 transition-all group-hover:bg-violet" style={{ height: `${h * 2}%` }} />}
                  </div>
                  <span className="absolute -bottom-5 text-[9px] text-mist-500">{MONTHS[Number(k.slice(5, 7)) - 1][0]}</span>
                  <div className="pointer-events-none absolute -top-2 z-10 whitespace-nowrap rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="tnum text-mist-100">{fmtUSD0(v)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-800 pt-3 text-[10.5px] text-mist-500">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm bg-azure/70" /> Deposits
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-sm bg-violet/70" /> Withdrawals
            </span>
            <span className="ml-auto">
              Net contributed over the window{" "}
              <span className="tnum text-mist-300">{fmtUSD0(flows.reduce((a, f) => a + f[1], 0))}</span>
            </span>
          </div>
        </Panel>

        {/* trade stats */}
        <div className="space-y-3 xl:col-span-4">
          <Panel>
            <PanelHead title="Execution quality" sub="Closed trades over the last twelve months" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { k: "Closed trades", v: String(closed.length) },
                { k: "Win rate", v: `${Math.round((wins / closed.length) * 100)}%` },
                { k: "Avg hold", v: "17 mo" },
                { k: "Largest win", v: fmtCompact(Math.max(...closed.map((c) => c.realized ?? 0))) },
              ].map((m) => (
                <div key={m.k} className="rounded-lg border border-ink-800 bg-ink-880 px-3 py-2.5">
                  <Label>{m.k}</Label>
                  <div className="tnum mt-1 text-[15px] font-semibold text-mist-100">{m.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-ink-800 pt-3">
              {closed.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-[11px]">
                  <span className="w-12 font-medium text-mist-200">{c.ticker}</span>
                  <span className="flex-1 truncate text-mist-500">{c.note}</span>
                  <span className={cn("tnum font-medium", clsTone(c.realized ?? 0))}>
                    {(c.realized ?? 0) >= 0 ? "+" : "−"}
                    {fmtCompact(Math.abs(c.realized ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Tax position" sub="Estimated, current calendar year" />
            <div className="mt-3 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-mist-400">Short-term realised</span>
                <span className="tnum text-[12px] font-medium text-mist-100">{fmtUSD0(-2012)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-mist-400">Long-term realised</span>
                <span className="tnum text-[12px] font-medium text-mist-100">{fmtUSD0(-1066)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-mist-400">Harvestable losses</span>
                <span className="tnum text-[12px] font-medium text-down">
                  {fmtUSD0(HOLDINGS.filter((h) => h.unrealized < 0).reduce((a, h) => a + h.unrealized, 0))}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink-800 pt-2.5">
                <span className="text-[11px] text-mist-400">Estimated liability</span>
                <span className="tnum text-[13px] font-semibold text-mist-100">$0</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Pill tone="gold">{shortLots} short-term lots</Pill>
              <Pill tone="up">{HOLDINGS.flatMap((h) => h.lots).length - shortLots} long-term</Pill>
            </div>
          </Panel>
        </div>

        {/* ledger */}
        <Panel className="xl:col-span-12" flush>
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-800 px-5 py-3.5">
            <PanelHead title="Ledger" sub={`${rows.length} entries`} />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-ink-750 bg-ink-900 px-2.5 py-1.5">
                <IconSearch size={13} className="text-mist-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search entries…"
                  className="w-36 bg-transparent text-[11.5px] text-mist-100 outline-none placeholder:text-mist-500"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors",
                      t === type ? "bg-ink-700 text-mist-100" : "text-mist-500 hover:text-mist-200",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto px-2 py-1">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-ink-850 text-[9.5px] uppercase tracking-wider text-mist-500">
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Instrument</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-left font-medium">Account</th>
                  <th className="px-3 py-2 text-right font-medium">Realised</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => t.ticker && setFocus(t.ticker)}
                    className={cn(
                      "border-b border-ink-850 last:border-0",
                      t.ticker && "cursor-pointer hover:bg-ink-850/60",
                    )}
                  >
                    <td className="tnum px-3 py-2.5 text-[11px] text-mist-400">{fmtDate(t.date)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                          TYPE_TONE[t.type],
                        )}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] font-medium text-mist-100">{t.ticker ?? "—"}</span>
                        {t.note && (
                          <span className="hidden max-w-[260px] truncate text-[10.5px] text-mist-500 lg:block">
                            {t.note}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-[11px] text-mist-300">{t.qty ?? "—"}</td>
                    <td className="tnum px-3 py-2.5 text-right text-[11px] text-mist-300">
                      {t.price ? fmtUSD(t.price) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-mist-500">{t.account}</td>
                    <td className={cn("tnum px-3 py-2.5 text-right text-[11px]", clsTone(t.realized ?? 0))}>
                      {t.realized !== undefined
                        ? `${t.realized >= 0 ? "+" : "−"}${fmtUSD0(Math.abs(t.realized))}`
                        : "—"}
                    </td>
                    <td className={cn("tnum px-3 py-2.5 text-right text-[11.5px] font-medium", clsTone(t.amount))}>
                      {t.amount >= 0 ? "+" : "−"}
                      {fmtUSD0(Math.abs(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
