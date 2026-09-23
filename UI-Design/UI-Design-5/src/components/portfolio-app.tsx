"use client";

import Link from "next/link";
import {
  Activity, ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, BookOpen, BriefcaseBusiness,
  CalendarDays, Check, ChevronDown, CircleDollarSign, Compass, Download, Eye, FileText,
  Filter, Landmark, Layers3, LayoutDashboard, Lightbulb, ListFilter, Menu, MoreHorizontal,
  Newspaper, PanelLeftClose, PieChart, Plus, Search, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Target, TrendingUp, Upload, WalletCards, X
} from "lucide-react";
import { useMemo, useState } from "react";
import { activities, attribution, benchmark, exposure, flows, holdings, performance, portfolio, proposals } from "@/lib/portfolio-data";

type Section = "overview" | "holdings" | "performance" | "exposure" | "plan" | "activity";
type Range = keyof typeof performance;

const sections: { id: Section; label: string; icon: typeof PieChart }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "holdings", label: "Holdings", icon: ListFilter },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "exposure", label: "Exposure", icon: Layers3 },
  { id: "plan", label: "Plan", icon: Target },
  { id: "activity", label: "Activity", icon: Activity },
];

const fmt = (n: number, digits = 0) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
const cx = (...v: (string | false | undefined)[]) => v.filter(Boolean).join(" ");

function Logo() {
  return <div className="brand"><span className="brand-mark"><i /><i /><i /></span><span>meridian</span></div>;
}

function AppSidebar({ open, close }: { open: boolean; close: () => void }) {
  const global = [
    { label: "Home", icon: Compass }, { label: "Portfolio", icon: BriefcaseBusiness, active: true },
    { label: "Markets", icon: TrendingUp }, { label: "News", icon: Newspaper }, { label: "Research", icon: BookOpen },
  ];
  return <aside className={cx("sidebar", open && "sidebar-open")}>
    <div className="sidebar-head"><Logo /><button aria-label="Close menu" onClick={close} className="mobile-close"><X size={18} /></button></div>
    <nav className="global-nav">
      <p className="nav-kicker">Workspace</p>
      {global.map(item => <Link key={item.label} href={item.active ? "/portfolio" : "#"} className={cx("global-link", item.active && "active")}><item.icon size={18} strokeWidth={1.8}/><span>{item.label}</span>{item.active && <span className="nav-dot" />}</Link>)}
    </nav>
    <div className="watchlist-mini">
      <div className="mini-head"><span>Watchlist</span><Plus size={15}/></div>
      <div><b>NVDA</b><span className="up">+1.82%</span></div>
      <div><b>TSM</b><span className="down">−0.46%</span></div>
      <div><b>SPY</b><span className="up">+0.31%</span></div>
    </div>
    <div className="sidebar-bottom">
      <Link href="#" className="global-link"><Settings size={18}/><span>Settings</span></Link>
      <div className="user"><span className="avatar">AM</span><span><b>Alex Morgan</b><small>Personal workspace</small></span><MoreHorizontal size={17}/></div>
    </div>
  </aside>;
}

function Topbar({ menu }: { menu: () => void }) {
  return <header className="topbar">
    <button className="menu-button" onClick={menu} aria-label="Open menu"><Menu size={20}/></button>
    <div className="mobile-logo"><Logo /></div>
    <button className="search"><Search size={17}/><span>Search Meridian</span><kbd>⌘ K</kbd></button>
    <div className="top-actions"><button className="as-of"><span className="live-dot"/> Markets open</button><button className="icon-btn" aria-label="Notifications"><Bell size={18}/><i/></button><button className="icon-btn" aria-label="Toggle sidebar"><PanelLeftClose size={18}/></button></div>
  </header>;
}

function PortfolioHeader({ section, addTransaction }: { section: Section; addTransaction: () => void }) {
  return <>
    <div className="portfolio-heading">
      <div><div className="eyebrow"><span>PORTFOLIO</span><span>/</span><span>ALL ACCOUNTS</span></div><h1>My Portfolio</h1><p>Individual ··4812 <span>+</span> Roth IRA ··9924</p></div>
      <div className="heading-actions"><button className="btn secondary"><Download size={16}/> Export</button><button onClick={addTransaction} className="btn primary"><Plus size={16}/> Add transaction</button></div>
    </div>
    <nav className="section-tabs" aria-label="Portfolio sections">{sections.map(s => <Link key={s.id} href={s.id === "overview" ? "/portfolio" : `/portfolio/${s.id}`} className={cx(section === s.id && "active")}><s.icon size={15}/>{s.label}</Link>)}</nav>
  </>;
}

function MetricStrip() {
  return <section className="metric-strip">
    <div className="metric primary-metric"><span>Total value <Eye size={14}/></span><strong>{fmt(portfolio.value, 2)}</strong><small><b className="up">+{fmt(portfolio.dayChange, 2)} (+{portfolio.dayPct}%)</b> today</small></div>
    <div className="metric"><span>Net contributions</span><strong>{fmt(portfolio.invested)}</strong><small>Since {portfolio.inception}</small></div>
    <div className="metric"><span>Investment return</span><strong className="up">+{fmt(portfolio.totalReturn)}</strong><small><b className="up">+{portfolio.returnPct}%</b> money-weighted</small></div>
    <div className="metric"><span>Cash available</span><strong>{fmt(portfolio.cash, 2)}</strong><small>4.3% of portfolio</small></div>
  </section>;
}

function linePath(data: number[], width = 700, height = 240) {
  const min = Math.min(...data) - 5, max = Math.max(...data) + 5;
  return data.map((v, i) => `${i ? "L" : "M"}${(i / (data.length - 1)) * width},${height - ((v - min) / (max - min)) * height}`).join(" ");
}

function PerformanceChart({ compact = false }: { compact?: boolean }) {
  const [range, setRange] = useState<Range>("1Y");
  const data = performance[range], comp = benchmark[range];
  const first = data[0], last = data[data.length - 1];
  const gain = ((last - first) / first * 100).toFixed(2);
  const benchmarkGain = ((comp[comp.length - 1] - comp[0]) / comp[0] * 100).toFixed(2);
  return <div className={cx("card chart-card", compact && "compact-chart")}>
    <div className="card-title"><div><span>PERFORMANCE</span><h2>Portfolio value</h2></div><div className="range-tabs">{(["1M","3M","YTD","1Y","ALL"] as Range[]).map(r => <button key={r} onClick={() => setRange(r)} className={range === r ? "active" : ""}>{r}</button>)}</div></div>
    <div className="chart-summary"><div><strong>{fmt(portfolio.value, 2)}</strong><span className="up">+{gain}%</span></div><div className="legend"><span><i className="portfolio-line"/>Portfolio</span><span><i className="benchmark-line"/>S&amp;P 500</span></div></div>
    <div className="line-chart">
      <div className="axis-labels"><span>$440k</span><span>$400k</span><span>$360k</span><span>$320k</span></div>
      <svg viewBox="0 0 700 240" preserveAspectRatio="none" role="img" aria-label={`Portfolio performance for ${range}`}>
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#287b6f" stopOpacity=".19"/><stop offset="1" stopColor="#287b6f" stopOpacity="0"/></linearGradient></defs>
        {[30,90,150,210].map(y => <line key={y} x1="0" x2="700" y1={y} y2={y} className="gridline"/>)}
        <path d={`${linePath(data)} L700,240 L0,240 Z`} fill="url(#chartFill)" />
        <path d={linePath(comp)} className="benchmark-path" />
        <path d={linePath(data)} className="portfolio-path" />
        <circle cx="700" cy={linePath(data).match(/,([^, ]+)$/)?.[1] || 0} r="4" className="end-dot"/>
      </svg>
      <div className="date-axis"><span>Jun</span><span>Sep</span><span>Dec</span><span>Mar</span><span>May</span></div>
    </div>
    <div className="chart-footer"><span>Money-weighted return <b className="up">+{gain}%</b></span><span>S&amp;P 500 <b>+{benchmarkGain}%</b></span><span>Alpha <b className="up">+{(Number(gain)-Number(benchmarkGain)).toFixed(2)}%</b></span></div>
  </div>;
}

function AllocationCard() {
  const segments = [31.6,16.4,11.2,10.7,7.4,18.4,4.3];
  let total = 0;
  const gradient = segments.map((s,i) => { const start=total; total+=s; return `${exposure[i].color} ${start}% ${total}%`; }).join(",");
  return <div className="card allocation-card"><div className="card-title"><div><span>LOOK-THROUGH</span><h2>Underlying allocation</h2></div><Link href="/portfolio/exposure">Explore <ArrowRight size={15}/></Link></div>
    <div className="donut-wrap"><div className="donut" style={{background:`conic-gradient(${gradient})`}}><div><strong>95.7%</strong><span>invested</span></div></div></div>
    <div className="alloc-legend">{exposure.slice(0,5).map(e => <div key={e.label}><span><i style={{background:e.color}}/>{e.label}</span><b>{e.lookthrough}%</b></div>)}</div>
    <div className="lookthrough-note"><Layers3 size={17}/><span><b>Look-through enabled</b><small>Includes 1,842 underlying securities</small></span></div>
  </div>;
}

function Sparkline({ data, up = true }: { data: number[]; up?: boolean }) {
  return <svg className="spark" viewBox="0 0 90 28" preserveAspectRatio="none"><path d={linePath(data,90,25)} className={up ? "spark-up" : "spark-down"}/></svg>;
}

function HoldingsTable({ full = false }: { full?: boolean }) {
  const [query,setQuery] = useState("");
  const [asset,setAsset] = useState("All assets");
  const visible = useMemo(() => holdings.filter(h => (asset === "All assets" || h.type === asset) && `${h.symbol} ${h.name}`.toLowerCase().includes(query.toLowerCase())),[query,asset]);
  const rows = full ? visible : visible.slice(0,5);
  return <div className="card holdings-card">
    <div className="card-title holdings-title"><div><span>POSITIONS</span><h2>Holdings <em>{holdings.length}</em></h2></div>{full ? <div className="table-tools"><label><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search holdings"/></label><button onClick={()=>setAsset(asset === "All assets" ? "ETF" : asset === "ETF" ? "Equity" : "All assets")}><Filter size={15}/>{asset}<ChevronDown size={14}/></button></div> : <Link href="/portfolio/holdings">View all <ArrowRight size={15}/></Link>}</div>
    <div className="table-scroll"><table className="holdings-table"><thead><tr><th>Holding</th><th>Price</th>{full && <th>Quantity</th>}<th>Market value</th><th>Weight</th><th>Today</th><th>Total return</th><th></th></tr></thead><tbody>{rows.map(h => <tr key={h.symbol}><td><span className="ticker" style={{background:`${h.color}18`,color:h.color}}>{h.symbol.slice(0,2)}</span><span><b>{h.symbol}</b><small>{h.name}</small></span></td><td><b>{fmt(h.price,2)}</b><small className={h.day >= 0 ? "up":"down"}>{h.day >= 0?"+":""}{h.day}%</small></td>{full && <td>{h.quantity.toLocaleString()}</td>}<td><b>{fmt(h.value,2)}</b><small><Sparkline data={h.spark} up={h.returnPct > 0}/></small></td><td><span className="weight-bar"><i style={{width:`${h.weight/16*100}%`,background:h.color}}/></span>{h.weight}%</td><td className={h.day >= 0 ? "up":"down"}>{h.day >= 0?"+":""}{h.day}%</td><td><b className={h.returnPct >= 0?"up":"down"}>+{h.returnPct}%</b><small className="up">+{fmt(h.pnl)}</small></td><td><button className="more"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table></div>
    {full && <div className="table-total"><span>8 holdings · Cash excluded</span><span>Total securities <b>{fmt(portfolio.value-portfolio.cash,2)}</b></span></div>}
  </div>;
}

function InsightRail() {
  return <div className="insight-stack">
    <div className="card insight-card accent"><div className="insight-icon"><Sparkles size={17}/></div><span>PORTFOLIO INSIGHT</span><h3>Your technology exposure is higher than it looks.</h3><p>Funds add another 6.8%, bringing true exposure to 31.6%.</p><Link href="/portfolio/exposure">Review exposure <ArrowRight size={15}/></Link></div>
    <div className="card driver-card"><div className="card-title"><div><span>RETURN DRIVERS</span><h2>What moved</h2></div><span className="period">1 year</span></div>{attribution.slice(0,4).map(a=><div className="driver" key={a.label}><span><b>{a.label}</b><small>{a.note}</small></span><span className={a.value>=0?"up":"down"}>{a.value>=0?"+":""}{a.value}%</span></div>)}<Link href="/portfolio/performance">View attribution <ArrowRight size={15}/></Link></div>
  </div>;
}

function Overview() { return <><MetricStrip/><div className="overview-grid"><PerformanceChart/><AllocationCard/></div><div className="content-grid"><HoldingsTable/><InsightRail/></div><div className="signal-row"><div><span className="signal-icon"><ShieldCheck size={20}/></span><span><b>Portfolio health</b><small>Well diversified, with 2 items worth reviewing</small></span></div><span className="health-score">82 <small>/ 100</small></span><Link href="/portfolio/plan">Review plan <ArrowRight size={15}/></Link></div></>; }

function HoldingsPage() { return <><div className="page-intro"><div><h2>Holdings</h2><p>Every position across your connected accounts.</p></div><div className="inline-stats"><span><small>Securities</small><b>{fmt(portfolio.value-portfolio.cash)}</b></span><span><small>Today</small><b className="up">+{fmt(portfolio.dayChange)}</b></span></div></div><HoldingsTable full/><div className="mini-grid"><div className="card cash-card"><span className="cash-icon"><CircleDollarSign size={20}/></span><div><small>UNINVESTED CASH</small><h3>{fmt(portfolio.cash,2)}</h3><p>Enough to cover 4.3% of your portfolio.</p></div><Link href="/portfolio/plan">Put cash to work <ArrowRight size={15}/></Link></div><div className="card concentration"><div className="card-title"><div><span>CONCENTRATION</span><h2>Top positions</h2></div></div>{holdings.slice(0,3).map(h=><div key={h.symbol}><span>{h.symbol}</span><i><b style={{width:`${h.weight*4}%`,background:h.color}}/></i><strong>{h.weight}%</strong></div>)}</div></div></>; }

function AttributionPanel() { const max=4.5; return <div className="card attribution-card"><div className="card-title"><div><span>ATTRIBUTION</span><h2>Return drivers</h2></div><button className="plain-select">By sector <ChevronDown size={14}/></button></div><p>Contribution to your {portfolio.returnPct}% investment return</p><div className="attribution-list">{attribution.map(a=><div key={a.label}><span><b>{a.label}</b><small>{a.note}</small></span><div className="attrib-bar"><i className={a.value>=0?"positive":"negative"} style={{width:`${Math.abs(a.value)/max*100}%`}}/></div><strong className={a.value>=0?"up":"down"}>{a.value>=0?"+":""}{a.value}%</strong></div>)}</div></div>; }

function PerformancePage() { return <><div className="page-intro"><div><h2>Performance</h2><p>Returns adjusted for the timing of your deposits and withdrawals.</p></div><button className="btn secondary"><CalendarDays size={16}/> Apr 2022 — Today</button></div><MetricStrip/><PerformanceChart/><div className="performance-grid"><AttributionPanel/><div className="card return-method"><div className="method-icon"><TrendingUp size={21}/></div><span>YOUR ACTUAL RETURN</span><strong>+{portfolio.returnPct}%</strong><small>Money-weighted return</small><p>This is the return you personally earned, accounting for exactly when money entered and left the portfolio.</p><div><span>Time-weighted</span><b>+8.21%</b></div><div><span>S&amp;P 500</span><b>+{portfolio.benchmarkReturn}%</b></div><div><span>Outperformance</span><b className="up">+2.58%</b></div></div></div></>; }

function ExposurePage() { const max=35; return <><div className="page-intro"><div><h2>True exposure</h2><p>See through funds and ETFs to the businesses you actually own.</p></div><button className="btn secondary"><Layers3 size={16}/> Look-through on</button></div><div className="exposure-summary"><div className="card"><small>UNDERLYING SECURITIES</small><strong>1,842</strong><span>Across 4 pooled investments</span></div><div className="card"><small>LARGEST SECTOR</small><strong>31.6%</strong><span>Technology · 6.8% hidden in funds</span></div><div className="card"><small>GEOGRAPHY</small><strong>79 / 21</strong><span>United States / International</span></div></div><div className="exposure-grid"><div className="card exposure-bars"><div className="card-title"><div><span>SECTOR EXPOSURE</span><h2>Direct vs. look-through</h2></div><div className="legend"><span><i className="direct-key"/>Direct</span><span><i className="look-key"/>Inside funds</span></div></div>{exposure.map(e=><div className="exposure-row" key={e.label}><b>{e.label}</b><div className="double-bar"><i style={{width:`${e.lookthrough/max*100}%`,background:`${e.color}36`}}/><i style={{width:`${e.direct/max*100}%`,background:e.color}}/></div><span>{e.lookthrough}%</span></div>)}</div><div className="card overlap-card"><div className="card-title"><div><span>HIDDEN OVERLAP</span><h2>Top underlying names</h2></div></div>{[{n:"Microsoft",s:"MSFT",v:16.2,x:"+1.4% via VTI"},{n:"Broadcom",s:"AVGO",v:10.4,x:"+0.4% via VTI"},{n:"Apple",s:"AAPL",v:2.8,x:"Entirely through funds"},{n:"NVIDIA",s:"NVDA",v:2.3,x:"Entirely through funds"},{n:"Amazon",s:"AMZN",v:1.7,x:"Entirely through funds"}].map((a,i)=><div className="overlap-row" key={a.s}><span className="rank">{i+1}</span><span><b>{a.s}</b><small>{a.n}</small></span><span><b>{a.v}%</b><small>{a.x}</small></span></div>)}<div className="overlap-alert"><Lightbulb size={17}/><span>Microsoft is your largest economic exposure, at 16.2% after fund holdings.</span></div></div></div></>; }

function PlanPage() { const [cash,setCash]=useState(10000); const scale=cash/10000; return <><div className="page-intro"><div><h2>Portfolio plan</h2><p>Turn your goals and current exposures into a clear next move.</p></div><span className="plan-status"><Check size={14}/> Draft proposal</span></div><div className="plan-hero"><div><span className="plan-spark"><Sparkles size={20}/></span><span><small>MERIDIAN PLAN</small><h2>Put new cash to work while reducing concentration.</h2><p>This plan moves you closer to your target allocation without creating unnecessary turnover.</p></span></div><div className="fund-input"><label>Amount to invest</label><span>$ <input value={cash} onChange={e=>setCash(Number(e.target.value.replace(/\D/g,"")) || 0)} aria-label="Amount to invest"/></span></div></div><div className="plan-grid"><div className="card trade-plan"><div className="card-title"><div><span>PROPOSED CHANGES</span><h2>4 trades</h2></div><span className="est">Estimated net cash <b>{fmt(cash)}</b></span></div>{proposals.map(p=><div className="trade-row" key={p.symbol}><span className={cx("trade-action",p.action==="Trim"&&"trim")}>{p.action}</span><span><b>{p.symbol}</b><small>{p.name}</small></span><strong>{fmt(p.amount*scale)}</strong><span className="allocation-change"><small>{p.before}%</small><ArrowRight size={14}/><b>{p.after}%</b></span><span className="trade-reason">{p.reason}</span></div>)}<div className="trade-footer"><span><ShieldCheck size={17}/> No target allocation breaches after trades</span><button className="btn primary">Review orders <ArrowRight size={16}/></button></div></div><div className="plan-side"><div className="card impact-card"><span>EXPECTED IMPACT</span><div><small>Single-stock concentration</small><b>44.9% <ArrowRight size={13}/> <em>42.1%</em></b></div><div><small>International equity</small><b>8.8% <ArrowRight size={13}/> <em>10.4%</em></b></div><div><small>Fixed income</small><b>6.6% <ArrowRight size={13}/> <em>7.6%</em></b></div><div><small>Estimated tax impact</small><b>~$420</b></div></div><div className="card rationale"><Lightbulb size={18}/><div><b>Why this plan?</b><p>Your largest positions have outgrown their bands. New cash covers most of the rebalance, keeping realized gains low.</p></div></div></div></div></>; }

function ActivityPage() { const [tab,setTab]=useState("All activity"); return <><div className="page-intro"><div><h2>Activity & cash flows</h2><p>Trades, income, and the money moving in and out of your portfolio.</p></div><button className="btn secondary"><Upload size={16}/> Import statement</button></div><div className="activity-grid"><div className="card activity-card"><div className="activity-tabs">{["All activity","Trades","Income","Cash flows"].map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?"active":""}>{t}</button>)}</div><div className="activity-date">MAY 2025</div>{activities.filter(a=>tab==="All activity" || tab==="Trades"&&["Buy","Sell"].includes(a.type) || tab==="Income"&&a.type==="Dividend").map(a=><div className="activity-row" key={a.date+a.symbol}><span className={cx("activity-icon",a.type.toLowerCase())}>{a.type==="Buy"?<ArrowDownLeft size={17}/>:a.type==="Sell"?<ArrowUpRight size={17}/>:<CircleDollarSign size={17}/>}</span><span><b>{a.type} · {a.symbol}</b><small>{a.title} · {a.detail}</small></span><span><b className={a.amount>=0?"up":""}>{a.amount>=0?"+":""}{fmt(a.amount,2)}</b><small>{a.date}</small></span></div>)}</div><div className="card flows-card"><div className="card-title"><div><span>CASH FLOWS</span><h2>Money in & out</h2></div><button className="more"><MoreHorizontal size={17}/></button></div><div className="flow-total"><span><small>Net added</small><strong>+{fmt(33000)}</strong></span><div className="flow-viz"><i className="inflow" style={{width:"78%"}}/><i className="outflow" style={{width:"22%"}}/></div><div><span><i className="dot in"/>Added <b>{fmt(36500)}</b></span><span><i className="dot out"/>Withdrawn <b>{fmt(3500)}</b></span></div></div>{flows.map(f=><div className="flow-row" key={f.date}><span className={f.amount>0?"flow-icon in":"flow-icon out"}>{f.amount>0?<ArrowDownLeft size={16}/>:<ArrowUpRight size={16}/>}</span><span><b>{f.type}</b><small>{f.date} · {f.account}</small></span><b className={f.amount>0?"up":""}>{f.amount>0?"+":""}{fmt(f.amount)}</b></div>)}</div></div></>; }

function TransactionModal({ close }: { close:()=>void }) { return <div className="modal-backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><small>NEW ACTIVITY</small><h2>Add transaction</h2></div><button onClick={close}><X size={19}/></button></div><div className="transaction-types"><button className="active"><ArrowDownLeft size={17}/>Buy</button><button><ArrowUpRight size={17}/>Sell</button><button><CircleDollarSign size={17}/>Cash</button></div><label className="field">Security<span><Search size={16}/><input placeholder="Search by symbol or name" autoFocus/></span></label><div className="field-row"><label className="field">Quantity<span><input placeholder="0"/></span></label><label className="field">Price<span><input placeholder="$0.00"/></span></label></div><label className="field">Account<span><select><option>Individual ··4812</option><option>Roth IRA ··9924</option></select></span></label><div className="modal-actions"><button onClick={close} className="btn secondary">Cancel</button><button onClick={close} className="btn primary">Add transaction</button></div></div></div>; }

export default function PortfolioApp({ section }: { section: Section }) {
  const [menu,setMenu]=useState(false); const [modal,setModal]=useState(false);
  const content = section === "overview" ? <Overview/> : section === "holdings" ? <HoldingsPage/> : section === "performance" ? <PerformancePage/> : section === "exposure" ? <ExposurePage/> : section === "plan" ? <PlanPage/> : <ActivityPage/>;
  return <div className="app-shell"><AppSidebar open={menu} close={()=>setMenu(false)}/>{menu&&<button className="mobile-scrim" onClick={()=>setMenu(false)} aria-label="Close navigation"/>}<div className="main-shell"><Topbar menu={()=>setMenu(true)}/><main><PortfolioHeader section={section} addTransaction={()=>setModal(true)}/>{content}<footer><Logo/><span>Data refreshed just now · Prices may be delayed</span><span>Meridian v1.0</span></footer></main></div>{modal&&<TransactionModal close={()=>setModal(false)}/>}</div>;
}
