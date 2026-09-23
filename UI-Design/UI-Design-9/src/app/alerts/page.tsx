import { Badge, Card, Empty, PageHeader, TickerChip, btnCls, inputCls } from "@/components/ui";
import { createAlert, deleteAlert, toggleAlert } from "@/lib/actions";
import { pct, price } from "@/lib/format";
import { getAlerts, getAllInstruments } from "@/lib/queries";

export const dynamic = "force-dynamic";

const condLabel: Record<string, string> = { price_above: "Price ≥", price_below: "Price ≤", pct_move: "Day move ≥" };

export default async function AlertsPage() {
  const [alerts, insts] = await Promise.all([getAlerts(), getAllInstruments()]);
  const firing = alerts.filter((a) => a.active && a.firing);
  const watching = alerts.filter((a) => a.active && !a.firing);
  const paused = alerts.filter((a) => !a.active);

  const Row = ({ a }: { a: (typeof alerts)[number] }) => (
    <li className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${a.firing && a.active ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"}`}>
      <TickerChip inst={a.instrument} />
      <span className="text-slate-700">{condLabel[a.condition]} <b>{a.condition === "pct_move" ? `${Number(a.threshold)}%` : price(Number(a.threshold))}</b></span>
      <span className="text-xs text-slate-500">now {price(Number(a.instrument.lastPrice))} · {a.condition === "pct_move" ? `${a.distancePct >= 0 ? "" : ""}${pct(a.distancePct)} vs threshold` : `${pct(a.distancePct)} from level`}</span>
      {a.note && <span className="ml-auto max-w-[260px] truncate text-xs text-slate-500">→ {a.note}</span>}
      <div className={`${a.note ? "" : "ml-auto"} flex gap-2`}>
        <form action={toggleAlert}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-slate-500 hover:text-slate-900">{a.active ? "pause" : "resume"}</button></form>
        <form action={deleteAlert}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-slate-400 hover:text-rose-600">✕</button></form>
      </div>
    </li>
  );

  return (
    <div>
      <PageHeader title="Alerts" subtitle="Evaluated against latest quotes on every load. Each alert carries a pre-committed action so you decide calmly, in advance." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={<span>Firing <Badge color="red">{firing.length}</Badge></span>}>
            {firing.length === 0 ? <Empty>Nothing firing.</Empty> : <ul className="space-y-2">{firing.map((a) => <Row key={a.id} a={a} />)}</ul>}
          </Card>
          <Card title={<span>Watching <Badge>{watching.length}</Badge></span>}>
            {watching.length === 0 ? <Empty>No active alerts.</Empty> : <ul className="space-y-2">{watching.map((a) => <Row key={a.id} a={a} />)}</ul>}
          </Card>
          {paused.length > 0 && <Card title={<span>Paused <Badge>{paused.length}</Badge></span>}><ul className="space-y-2 opacity-70">{paused.map((a) => <Row key={a.id} a={a} />)}</ul></Card>}
        </div>
        <Card title="New alert" className="h-fit">
          <form action={createAlert} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Symbol</label>
              <input name="symbol" list="symbols" required className={`${inputCls} font-mono uppercase`} placeholder="NVDA" />
              <datalist id="symbols">{insts.map((i) => <option key={i.id} value={i.symbol}>{i.name}</option>)}</datalist>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Condition</label>
                <select name="condition" className={inputCls}><option value="price_above">price above</option><option value="price_below">price below</option><option value="pct_move">day move ≥ %</option></select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Threshold</label>
                <input name="threshold" type="number" step="any" required className={inputCls} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Planned action</label>
              <input name="note" className={inputCls} placeholder="Trim 10 shares / reassess thesis / start position" />
            </div>
            <button className={btnCls}>Create alert</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
