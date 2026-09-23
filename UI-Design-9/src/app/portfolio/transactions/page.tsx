import Link from "next/link";
import { Badge, Card, btnCls, inputCls } from "@/components/ui";
import { addTransaction, deleteTransaction } from "@/lib/actions";
import { dateShort, money, price, qty } from "@/lib/format";
import { getAllInstruments, getTransactions } from "@/lib/queries";

export const dynamic = "force-dynamic";

const typeColor = (t: string) => (t === "buy" ? "green" : t === "sell" ? "red" : t === "dividend" ? "blue" : "slate") as "green" | "red" | "blue" | "slate";

export default async function TransactionsPage() {
  const [rows, insts] = await Promise.all([getTransactions(), getAllInstruments()]);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Record transaction" className="h-fit">
        <form action={addTransaction} className="space-y-3 text-sm">
          <input type="hidden" name="redirectTo" value="/portfolio/transactions" />
          <div>
            <label className="mb-1 block text-xs text-slate-500">Type</label>
            <select name="type" className={inputCls} defaultValue="buy">
              {["buy", "sell", "dividend", "deposit", "withdrawal", "fee"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Symbol (blank for deposit/withdrawal)</label>
            <input name="symbol" list="symbols" className={inputCls} placeholder="AAPL" />
            <datalist id="symbols">{insts.filter((i) => i.assetClass !== "index").map((i) => <option key={i.id} value={i.symbol}>{i.name}</option>)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Quantity</label>
              <input name="quantity" type="number" step="any" className={inputCls} placeholder="10" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Price</label>
              <input name="price" type="number" step="any" className={inputCls} placeholder="150.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Cash amount (deposit/withdrawal)</label>
              <input name="amount" type="number" step="any" className={inputCls} placeholder="5000" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Fees</label>
              <input name="fees" type="number" step="any" className={inputCls} placeholder="0" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Date</label>
            <input name="tradedAt" type="date" className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Note (why?)</label>
            <input name="note" className={inputCls} placeholder="Adding on weakness after earnings" />
          </div>
          <button className={btnCls}>Add to ledger</button>
        </form>
      </Card>

      <Card title={`Ledger · ${rows.length} entries`} className="lg:col-span-2">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr className="[&>th]:pb-2 [&>th]:font-medium">
              <th>Date</th><th>Type</th><th>Instrument</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th><th>Note</th><th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ tx, instrument }) => {
              const total = Number(tx.quantity) * Number(tx.price);
              return (
                <tr key={tx.id} className="[&>td]:py-2">
                  <td className="whitespace-nowrap text-slate-600">{dateShort(tx.tradedAt)}</td>
                  <td><Badge color={typeColor(tx.type)}>{tx.type}</Badge></td>
                  <td>{instrument ? <Link href={`/markets/${instrument.symbol}`} className="font-mono hover:underline">{instrument.symbol}</Link> : <span className="text-slate-400">cash</span>}</td>
                  <td className="text-right tabular-nums">{instrument && tx.type !== "dividend" ? qty(Number(tx.quantity)) : "—"}</td>
                  <td className="text-right tabular-nums">{instrument && tx.type !== "dividend" ? price(Number(tx.price)) : "—"}</td>
                  <td className="text-right tabular-nums font-medium">{money(total)}</td>
                  <td className="max-w-[200px] truncate text-xs text-slate-500">{tx.note}</td>
                  <td className="text-right">
                    <form action={deleteTransaction}><input type="hidden" name="id" value={tx.id} /><button className="text-xs text-slate-400 hover:text-rose-600">✕</button></form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
