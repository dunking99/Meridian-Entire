import { useMemo, useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Button, Field, Modal, inputCls } from "../components/ui";
import { UNIVERSE, type Wrapper } from "../data/universe";
import { fmtMoney } from "../lib/format";
import { cn } from "../utils/cn";

const WRAPPERS: Wrapper[] = ["ISA", "SIPP", "GIA", "LISA"];
const ACCOUNTS = ["iWeb ISA", "AJ Bell ISA", "Vanguard SIPP", "Fidelity SIPP", "IG Dealing"];

export function AddPositionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPosition, portfolio } = usePortfolio();
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [wrapper, setWrapper] = useState<Wrapper>("ISA");
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [target, setTarget] = useState("");

  const held = new Set(portfolio.positions.map((p) => p.symbol));
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return UNIVERSE.filter((a) => a.bars > 0 && (!q || a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))).slice(0, 7);
  }, [query]);

  const chosen = UNIVERSE.find((a) => a.symbol === symbol);
  const qtyN = parseFloat(qty) || 0;
  const priceN = parseFloat(price) || chosen?.price || 0;
  const cost = qtyN * priceN;
  const valid = !!chosen && qtyN > 0 && priceN > 0;

  const reset = () => {
    setQuery("");
    setSymbol(null);
    setQty("");
    setPrice("");
    setTarget("");
  };

  const submit = () => {
    if (!valid || !chosen) return;
    addPosition({ symbol: chosen.symbol, qty: qtyN, avgPrice: priceN, wrapper, account, date, targetPct: target ? parseFloat(target) : undefined });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add position"
      subtitle="Records a holding at your entry price. The cost is drawn from the cash balance, so every derived figure stays reconciled."
      width="max-w-xl"
    >
      <div className="space-y-3.5">
        <Field label="Instrument" hint="Search the tracked universe by ticker or name">
          <input
            className={inputCls}
            placeholder="e.g. GOOGL, Alphabet, gilts…"
            value={symbol ? `${chosen?.symbol} — ${chosen?.name}` : query}
            onChange={(e) => {
              setSymbol(null);
              setQuery(e.target.value);
            }}
          />
        </Field>

        {!symbol && (
          <div className="max-h-[188px] space-y-1 overflow-y-auto rounded-lg border border-white/[0.07] bg-black/25 p-1.5">
            {results.map((a) => (
              <button
                key={a.symbol}
                onClick={() => {
                  setSymbol(a.symbol);
                  setPrice(a.price.toFixed(2));
                }}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition hover:bg-white/[0.06]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="num w-[58px] shrink-0 text-[11.5px] font-semibold text-zinc-100">{a.symbol}</span>
                  <span className="truncate text-[11px] text-zinc-500">{a.name}</span>
                  {held.has(a.symbol) && <Badge tone="info">held</Badge>}
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <Badge tone="ghost">{a.type}</Badge>
                  <span className="num text-[11px] text-zinc-300">{fmtMoney(a.price)}</span>
                </div>
              </button>
            ))}
            {results.length === 0 && <div className="px-2.5 py-3 text-center text-[11px] text-zinc-600">Nothing matches that search.</div>}
          </div>
        )}

        {chosen && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Units">
                <input className={cn(inputCls, "num")} placeholder="0" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} />
              </Field>
              <Field label="Average price" hint={`Live price ${fmtMoney(chosen.price)}`}>
                <input className={cn(inputCls, "num")} value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} />
              </Field>
              <Field label="Wrapper">
                <select className={inputCls} value={wrapper} onChange={(e) => setWrapper(e.target.value as Wrapper)}>
                  {WRAPPERS.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </Field>
              <Field label="Account">
                <select className={inputCls} value={account} onChange={(e) => setAccount(e.target.value)}>
                  {ACCOUNTS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Opened on">
                <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Target weight" hint="Optional — used by Allocate">
                <input className={cn(inputCls, "num")} placeholder="%" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} />
              </Field>
            </div>

            <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="grid grid-cols-3 gap-3">
                <Summary label="Book cost" value={fmtMoney(cost, { dp: 0 })} />
                <Summary label="Market value" value={fmtMoney(qtyN * chosen.price, { dp: 0 })} />
                <Summary
                  label="Immediate P&L"
                  value={fmtMoney(qtyN * chosen.price - cost, { dp: 0, sign: true })}
                  tone={qtyN * chosen.price - cost >= 0 ? "up" : "down"}
                />
              </div>
              <div className="mt-2.5 border-t border-white/[0.06] pt-2 text-[10px] leading-relaxed text-zinc-600">
                Cash after purchase {fmtMoney(portfolio.cash - cost, { dp: 0 })}
                {portfolio.cash - cost < 0 && <span className="ml-1 text-amber-400">— this would overdraw the recorded cash balance.</span>}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-3.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!valid}>
            Add position
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div>
      <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">{label}</div>
      <div className={cn("num mt-1 text-[13px] font-semibold", tone === "up" ? "text-emerald-400" : tone === "down" ? "text-rose-400" : "text-zinc-100")}>{value}</div>
    </div>
  );
}
