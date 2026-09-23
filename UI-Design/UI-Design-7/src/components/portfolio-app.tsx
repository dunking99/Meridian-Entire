"use client";

import Link from "next/link";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Bookmark, ChevronDown, ChevronRight,
  CircleDollarSign, Compass, Download, Filter, Gauge, Layers, LayoutGrid, LineChart, Menu, MoreHorizontal,
  Newspaper, PieChart, Plus, RefreshCw, Scale, Search, Settings, Shield, Sliders, Sparkles, Target,
  TrendingUp, Wallet, X, Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  activities, attribution, benchmark, exposure, flows, holdings, performance, portfolio, proposals, ticker,
} from "@/lib/portfolio-data";

type Section = "holdings" | "xray" | "performance" | "analysis" | "allocate" | "rebuild";
type Range = keyof typeof performance;

const sections: { id: Section; label: string }[] = [
  { id: "holdings", label: "Holdings" },
  { id: "xray", label: "X-Ray" },
  { id: "performance", label: "Performance" },
  { id: "analysis", label: "Analysis" },
  { id: "allocate", label: "Allocate" },
  { id: "rebuild", label: "Rebuild" },
];

const cx = (...v: (string | false | undefined)[]) => v.filter(Boolean).join(" ");
const gbp = (n: number, d = 0) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const sign = (n: number) => (n >= 0 ? "+" : "−");
const pct = (n: number) => `${sign(n)}${Math.abs(n).toFixed(2)}%`;
const dir = (n: number) => (n >= 0 ? "pos" : "neg");

/* ---------- brand + chrome ---------- */

function Logo({ small }: { small?: boolean }) {
  return (
    <div className={cx("brand", small && "brand-sm")}>
      <span className="brand-mark"><i /><i /><i /></span>
      <span className="brand-text"><b>MERIDIAN</b><small>Trading Intelligence</small></span>
    </div>
  );
}

function Topbar({ menu }: { menu: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn menu-btn" onClick={menu} aria-label="Open menu"><Menu size={18} /></button>
        <Logo />
      </div>
      <div className="topbar-right">
        <button className="search"><Search size={15} /><span>Search markets, holdings…</span><kbd>⌘K</kbd></button>
        <div className="live-badge"><span className="live-dot" /> LIVE<em>· 2s ago</em></div>
        <span className="topbar-date">Sat, 19 Sept 2026</span>
        <button className="icon-btn" aria-label="Notifications"><Bell size={17} /><i className="badge-dot" /></button>
      </div>
    </header>
  );
}

function TickerTape() {
  const items = [...ticker, ...ticker];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.map((t, i) => (
          <span className="ticker-item" key={i}>
            <b>{t.name}</b>
            <span className="mono">{t.value}</span>
            <span className={cx("mono", dir(t.change))}>{pct(t.change)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const groups: { title: string; items: { label: string; icon: typeof Compass; active?: boolean }[] }[] = [
    {
      title: "Intelligence",
      items: [
        { label: "Briefing", icon: Compass },
        { label: "What Changed", icon: Zap },
        { label: "Alerts", icon: Bell },
        { label: "Risk", icon: Shield },
        { label: "Research", icon: Bookmark },
      ],
    },
    {
      title: "Investing",
      items: [
        { label: "Portfolio", icon: Wallet, active: true },
        { label: "Watchlist", icon: LayoutGrid },
        { label: "Screener", icon: Filter },
      ],
    },
    {
      title: "Markets",
      items: [
        { label: "Markets", icon: TrendingUp },
        { label: "News", icon: Newspaper },
        { label: "Reports", icon: LineChart },
      ],
    },
  ];
  return (
    <aside className={cx("sidebar", open && "sidebar-open")}>
      <button className="icon-btn mobile-close" onClick={close} aria-label="Close menu"><X size={18} /></button>
      <nav className="side-nav">
        {groups.map((g) => (
          <div className="nav-group" key={g.title}>
            <p className="nav-title">{g.title}</p>
            {g.items.map((it) => (
              <Link key={it.label} href={it.active ? "/portfolio" : "#"} className={cx("nav-link", it.active && "active")}>
                <it.icon size={17} strokeWidth={1.9} />
                <span>{it.label}</span>
                {it.active && <ChevronRight size={14} className="nav-caret" />}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <Link href="#" className="nav-link"><Settings size={17} strokeWidth={1.9} /><span>Settings</span></Link>
        <div className="user"><span className="avatar">AM</span><span className="user-text"><b>Alex Morgan</b><small>Personal</small></span><MoreHorizontal size={16} /></div>
      </div>
    </aside>
  );
}

function PageHead({ section, add }: { section: Section; add: () => void }) {
  return (
    <div className="page-head">
      <div className="page-head-top">
        <div>
          <div className="crumb">PORTFOLIO <span>/</span> ALL ACCOUNTS</div>
          <h1>Portfolio</h1>
        </div>
        <div className="head-actions">
          <button className="btn ghost"><Download size={15} /> Export</button>
          <button className="btn accent" onClick={add}><Plus size={15} /> Add position</button>
        </div>
      </div>
      <nav className="tabs" aria-label="Portfolio sections">
        {sections.map((s) => (
          <Link key={s.id} href={s.id === "holdings" ? "/portfolio" : `/portfolio/${s.id}`} className={cx("tab", section === s.id && "active")}>
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/* ---------- metrics ---------- */

function MetricStrip() {
  return (
    <section className="metrics">
      <div className="metric hero">
        <span className="metric-label">Total value</span>
        <strong className="mono">{gbp(portfolio.value)}</strong>
        <span className={cx("metric-chip mono", dir(portfolio.dayChange))}>
          {portfolio.dayChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {gbp(Math.abs(portfolio.dayChange))} ({pct(portfolio.dayPct)}) today
        </span>
      </div>
      <div className="metric">
        <span className="metric-label">Net invested</span>
        <strong className="mono">{gbp(portfolio.invested)}</strong>
        <small>Since {portfolio.inception}</small>
      </div>
      <div className="metric">
        <span className="metric-label">Total return</span>
        <strong className="mono pos">+{gbp(portfolio.totalReturn)}</strong>
        <small className="pos">{pct(portfolio.returnPct)} money-weighted</small>
      </div>
      <div className="metric">
        <span className="metric-label">Annualised</span>
        <strong className="mono pos">{pct(portfolio.annualised)}</strong>
        <small>over {portfolio.annualisedYears}y · vs {pct(portfolio.benchmarkReturn)} bmk</small>
      </div>
      <div className="metric">
        <span className="metric-label">Cash</span>
        <strong className="mono">{gbp(portfolio.cash)}</strong>
        <small>4.3% of portfolio</small>
      </div>
    </section>
  );
}

/* ---------- chart ---------- */

function smooth(data: number[], w: number, h: number, pad = 6) {
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, pad + (h - pad * 2) * (1 - (v - min) / span)] as const);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return { d, last: pts[pts.length - 1] };
}

function PerformanceChart({ tall }: { tall?: boolean }) {
  const [range, setRange] = useState<Range>("1Y");
  const [mode, setMode] = useState<"value" | "return">("value");
  const W = 720, H = tall ? 300 : 230;
  const data = performance[range], comp = benchmark[range];
  const port = smooth(data, W, H), bench = smooth(comp, W, H);
  const gain = ((data[data.length - 1] - data[0]) / data[0]) * 100;
  const benchGain = ((comp[comp.length - 1] - comp[0]) / comp[0]) * 100;
  const up = gain >= 0;
  const stroke = up ? "var(--pos)" : "var(--neg)";
  return (
    <div className="card chart-card">
      <div className="chart-top">
        <div className="seg">
          <button className={mode === "value" ? "on" : ""} onClick={() => setMode("value")}>£ Value</button>
          <button className={mode === "return" ? "on" : ""} onClick={() => setMode("return")}>% Return</button>
        </div>
        <div className="seg ranges">
          {(["1M", "3M", "YTD", "1Y", "ALL"] as Range[]).map((r) => (
            <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div className="chart-summary">
        <div>
          <strong className="mono">{mode === "value" ? gbp(portfolio.value) : pct(gain)}</strong>
          <span className={cx("mono", dir(gain))}>{up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{pct(gain)}</span>
        </div>
        <div className="legend">
          <span><i className="k-port" style={{ background: stroke }} />Portfolio</span>
          <span><i className="k-bench" />S&amp;P 500</span>
        </div>
      </div>
      <div className="chart-plot">
        <div className="y-axis mono"><span>£440k</span><span>£400k</span><span>£360k</span><span>£320k</span></div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Portfolio value over ${range}`}>
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="1" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.12, 0.37, 0.62, 0.87].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="grid" />)}
          <path d={`${port.d} L${W},${H} L0,${H} Z`} fill="url(#fill)" />
          <path d={bench.d} className="bench-line" />
          <path d={port.d} fill="none" stroke={stroke} strokeWidth={2.4} vectorEffect="non-scaling-stroke" />
          <circle cx={port.last[0]} cy={port.last[1]} r={4} fill={stroke} />
          <circle cx={port.last[0]} cy={port.last[1]} r={8} fill={stroke} opacity={0.18} />
        </svg>
      </div>
      <div className="x-axis mono"><span>Jun</span><span>Aug</span><span>Oct</span><span>Dec</span><span>Feb</span><span>Apr</span></div>
      <div className="chart-foot">
        <span>Money-weighted <b className={dir(gain)}>{pct(gain)}</b></span>
        <span>S&amp;P 500 <b className="mono">{pct(benchGain)}</b></span>
        <span>Alpha <b className={dir(gain - benchGain)}>{pct(gain - benchGain)}</b></span>
      </div>
    </div>
  );
}

/* ---------- allocation donut ---------- */

function Donut() {
  const parts = [
    { label: "Equity", pct: 68.4, color: "var(--pos)" },
    { label: "Funds / ETFs", pct: 22.9, color: "#6ea8fe" },
    { label: "Bonds", pct: 6.6, color: "#c79a5b" },
    { label: "Cash", pct: 2.1, color: "#59657a" },
  ];
  let acc = 0;
  const grad = parts.map((p) => { const a = acc; acc += p.pct; return `${p.color} ${a}% ${acc}%`; }).join(",");
  return (
    <div className="card donut-card">
      <div className="card-head"><h3>By asset type</h3><Link className="card-link" href="/portfolio/xray">Look-through <ArrowRight size={14} /></Link></div>
      <div className="donut-body">
        <div className="donut" style={{ background: `conic-gradient(${grad})` }}>
          <div className="donut-hole"><strong className="mono">4</strong><span>classes</span></div>
        </div>
        <div className="donut-legend">
          {parts.map((p) => (
            <div key={p.label}><span><i style={{ background: p.color }} />{p.label}</span><b className="mono">{p.pct}%</b></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- holdings table ---------- */

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const { d } = smooth(data, 84, 26, 3);
  return <svg className="spark" viewBox="0 0 84 26" preserveAspectRatio="none"><path d={d} fill="none" stroke={up ? "var(--pos)" : "var(--neg)"} strokeWidth={1.6} vectorEffect="non-scaling-stroke" /></svg>;
}

function HoldingsTable({ compact }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"value" | "returnPct" | "day">("value");
  const rows = useMemo(() => {
    const f = holdings.filter((h) => `${h.symbol} ${h.name}`.toLowerCase().includes(q.toLowerCase()));
    return [...f].sort((a, b) => b[sort] - a[sort]);
  }, [q, sort]);
  const list = compact ? rows.slice(0, 5) : rows;
  return (
    <div className="card holdings">
      <div className="card-head">
        <h3>Holdings <em className="mono">{holdings.length}</em></h3>
        {compact ? (
          <Link className="card-link" href="/portfolio">View all <ArrowRight size={14} /></Link>
        ) : (
          <div className="table-tools">
            <label className="finder"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" /></label>
            <button className="btn ghost sm"><RefreshCw size={13} /> Refresh</button>
            <button className="btn accent sm"><Plus size={13} /> Add</button>
          </div>
        )}
      </div>
      <div className="table-scroll">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="l">Holding</th>
              <th>Qty</th>
              <th>Price</th>
              <th onClick={() => setSort("value")} className={cx("sortable", sort === "value" && "sorted")}>Value</th>
              <th onClick={() => setSort("returnPct")} className={cx("sortable", sort === "returnPct" && "sorted")}>P&amp;L</th>
              <th onClick={() => setSort("day")} className={cx("sortable", sort === "day" && "sorted")}>Today</th>
              <th>Weight</th>
              <th className="trend-col">Trend</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((h) => (
              <tr key={h.symbol}>
                <td className="l">
                  <span className="tkr" style={{ background: `${h.color}22`, color: h.color }}>{h.symbol.slice(0, 2)}</span>
                  <span className="name"><b>{h.symbol}</b><small>{h.name}</small></span>
                </td>
                <td className="mono">{h.quantity.toLocaleString()}</td>
                <td className="mono">{gbp(h.price, 2)}</td>
                <td className="mono strong">{gbp(h.value)}</td>
                <td className="mono">
                  <b className={dir(h.returnPct)}>{pct(h.returnPct)}</b>
                  <small className={dir(h.pnl)}>{sign(h.pnl)}{gbp(Math.abs(h.pnl))}</small>
                </td>
                <td className={cx("mono", dir(h.day))}>{pct(h.day)}</td>
                <td>
                  <span className="wbar"><i style={{ width: `${(h.weight / 16) * 100}%`, background: h.color }} /></span>
                  <span className="mono wnum">{h.weight}%</span>
                </td>
                <td className="trend-col"><Spark data={h.spark} up={h.returnPct >= 0} /></td>
                <td><button className="row-more" aria-label="More"><MoreHorizontal size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- insight bar ---------- */

function InsightBar() {
  return (
    <div className="insight-bar">
      <div className="insight-main">
        <span className="insight-ic"><Sparkles size={16} /></span>
        <div>
          <b>Your technology exposure is higher than it looks.</b>
          <small>Funds add another 6.8% — true tech exposure is 31.6%, above your 25% target.</small>
        </div>
      </div>
      <Link className="btn ghost sm" href="/portfolio/xray">See X-Ray <ArrowRight size={14} /></Link>
    </div>
  );
}

/* ---------- section: holdings (overview) ---------- */

function HoldingsView() {
  return (
    <>
      <MetricStrip />
      <div className="split-2">
        <PerformanceChart />
        <Donut />
      </div>
      <InsightBar />
      <HoldingsTable />
    </>
  );
}

/* ---------- section: X-Ray ---------- */

function XRayView() {
  const max = 35;
  return (
    <>
      <div className="sub-head">
        <div><h2>Look-through X-Ray</h2><p>See past funds and ETFs to the businesses you actually own.</p></div>
        <span className="pill"><Layers size={13} /> 1,842 underlying securities</span>
      </div>
      <div className="stat-row">
        <div className="card stat"><span>True tech exposure</span><strong className="mono">31.6%</strong><small className="neg">6.8% hidden inside funds</small></div>
        <div className="card stat"><span>Largest single name</span><strong className="mono">16.2%</strong><small>Microsoft, after fund holdings</small></div>
        <div className="card stat"><span>Geography</span><strong className="mono">79 / 21</strong><small>US / International split</small></div>
        <div className="card stat"><span>Overlap flag</span><strong className="mono pos">Moderate</strong><small>2 funds share 41% of names</small></div>
      </div>
      <div className="split-wide">
        <div className="card padded">
          <div className="card-head"><h3>Sector exposure — direct vs. look-through</h3>
            <div className="legend"><span><i className="k-direct" />Direct</span><span><i className="k-look" />Inside funds</span></div>
          </div>
          <div className="xray-bars">
            {exposure.map((e) => (
              <div className="xray-row" key={e.label}>
                <b>{e.label}</b>
                <div className="dbar">
                  <i className="look" style={{ width: `${(e.lookthrough / max) * 100}%`, background: `${e.color}44` }} />
                  <i className="direct" style={{ width: `${(e.direct / max) * 100}%`, background: e.color }} />
                </div>
                <span className="mono">{e.lookthrough}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card padded">
          <div className="card-head"><h3>Top underlying names</h3></div>
          {[
            { s: "MSFT", n: "Microsoft", v: 16.2, x: "+1.4% via VTI" },
            { s: "AVGO", n: "Broadcom", v: 10.4, x: "+0.4% via VTI" },
            { s: "AAPL", n: "Apple", v: 2.8, x: "Entirely via funds" },
            { s: "NVDA", n: "NVIDIA", v: 2.3, x: "Entirely via funds" },
            { s: "AMZN", n: "Amazon", v: 1.7, x: "Entirely via funds" },
          ].map((a, i) => (
            <div className="ul-row" key={a.s}>
              <span className="rank mono">{i + 1}</span>
              <span className="name"><b>{a.s}</b><small>{a.n}</small></span>
              <span className="ul-v"><b className="mono">{a.v}%</b><small>{a.x}</small></span>
            </div>
          ))}
          <div className="note"><Sparkles size={15} /><span>Microsoft is your largest true economic exposure at 16.2% once funds are unpacked.</span></div>
        </div>
      </div>
    </>
  );
}

/* ---------- section: performance ---------- */

function PerformanceView() {
  return (
    <>
      <div className="sub-head"><div><h2>Performance</h2><p>Returns adjusted for exactly when you added and withdrew money.</p></div></div>
      <MetricStrip />
      <PerformanceChart tall />
      <div className="split-wide">
        <div className="card padded">
          <div className="card-head"><h3>Return drivers</h3><span className="muted-tag">Trailing 1 year</span></div>
          <div className="attrib">
            {attribution.map((a) => {
              const w = (Math.abs(a.value) / 4.5) * 100;
              return (
                <div className="attrib-row" key={a.label}>
                  <span className="name"><b>{a.label}</b><small>{a.note}</small></span>
                  <div className="attrib-track"><i className={dir(a.value)} style={{ width: `${w}%` }} /></div>
                  <b className={cx("mono", dir(a.value))}>{pct(a.value)}</b>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card padded method">
          <span className="method-ic"><Gauge size={18} /></span>
          <span className="metric-label">Your actual return</span>
          <strong className="mono pos">{pct(portfolio.returnPct)}</strong>
          <small>Money-weighted (accounts for cash timing)</small>
          <div className="method-rows">
            <div><span>Time-weighted</span><b className="mono">+8.21%</b></div>
            <div><span>S&amp;P 500</span><b className="mono">{pct(portfolio.benchmarkReturn)}</b></div>
            <div><span>Outperformance</span><b className="mono pos">+2.58%</b></div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- section: analysis ---------- */

function AnalysisView() {
  const risk = [
    { label: "Volatility", value: "12.4%", note: "annualised", w: 62 },
    { label: "Max drawdown", value: "−9.1%", note: "last 12m", w: 41, neg: true },
    { label: "Sharpe", value: "1.31", note: "risk-adjusted", w: 74 },
    { label: "Beta vs S&P", value: "0.94", note: "market sensitivity", w: 55 },
  ];
  return (
    <>
      <div className="sub-head"><div><h2>Analysis</h2><p>How healthy and resilient the portfolio is right now.</p></div>
        <span className="pill pos"><Shield size={13} /> Health 82 / 100</span>
      </div>
      <div className="stat-row">
        {risk.map((r) => (
          <div className="card stat" key={r.label}>
            <span>{r.label}</span>
            <strong className={cx("mono", r.neg && "neg")}>{r.value}</strong>
            <div className="mini-track"><i className={r.neg ? "neg" : "pos"} style={{ width: `${r.w}%` }} /></div>
            <small>{r.note}</small>
          </div>
        ))}
      </div>
      <div className="split-wide">
        <div className="card padded">
          <div className="card-head"><h3>What&apos;s driving returns</h3><span className="muted-tag">Contribution to +8.72%</span></div>
          <div className="attrib">
            {attribution.map((a) => {
              const w = (Math.abs(a.value) / 4.5) * 100;
              return (
                <div className="attrib-row" key={a.label}>
                  <span className="name"><b>{a.label}</b><small>{a.note}</small></span>
                  <div className="attrib-track"><i className={dir(a.value)} style={{ width: `${w}%` }} /></div>
                  <b className={cx("mono", dir(a.value))}>{pct(a.value)}</b>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card padded">
          <div className="card-head"><h3>Flags to review</h3></div>
          {[
            { t: "Concentration", d: "Top 3 holdings are 41% of the book.", lvl: "warn" },
            { t: "Tech overweight", d: "31.6% true exposure vs 25% target.", lvl: "warn" },
            { t: "Cash drag", d: "Cash at 4.3% is within comfortable range.", lvl: "ok" },
            { t: "Diversification", d: "8 holdings across 6 sectors.", lvl: "ok" },
          ].map((f) => (
            <div className="flag-row" key={f.t}>
              <span className={cx("flag-dot", f.lvl)} />
              <div><b>{f.t}</b><small>{f.d}</small></div>
            </div>
          ))}
          <Link className="btn ghost sm full" href="/portfolio/rebuild">Open Rebuild to fix flags <ArrowRight size={14} /></Link>
        </div>
      </div>
    </>
  );
}

/* ---------- section: allocate ---------- */

function AllocateView() {
  const [amount, setAmount] = useState(10000);
  const scale = amount / 10000;
  const targets = [
    { label: "Intl equity (VXUS)", weight: 34, color: "#6ea8fe" },
    { label: "US aggregate bonds (BND)", weight: 28, color: "#c79a5b" },
    { label: "Total US market (VTI)", weight: 22, color: "var(--pos)" },
    { label: "Health care (LLY)", weight: 16, color: "#c76b9a" },
  ];
  return (
    <>
      <div className="sub-head"><div><h2>Allocate new money</h2><p>Where fresh cash should go to move you toward target — without selling.</p></div></div>
      <div className="allocate-hero card">
        <div className="hero-copy">
          <span className="method-ic"><Target size={18} /></span>
          <div><b>Top-up plan</b><small>Directing new cash to your most underweight sleeves keeps turnover and tax at zero.</small></div>
        </div>
        <label className="amount-field">
          <span>Amount to invest</span>
          <div className="amount-input"><em>£</em><input value={amount.toLocaleString()} onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)} aria-label="Amount to invest" /></div>
        </label>
      </div>
      <div className="split-wide">
        <div className="card padded">
          <div className="card-head"><h3>Suggested split</h3><span className="muted-tag mono">{gbp(amount)} total</span></div>
          {targets.map((t) => (
            <div className="alloc-row" key={t.label}>
              <span className="name"><b>{t.label}</b></span>
              <div className="alloc-track"><i style={{ width: `${t.weight}%`, background: t.color }} /></div>
              <span className="mono wnum">{t.weight}%</span>
              <b className="mono strong">{gbp(Math.round((amount * t.weight) / 100))}</b>
            </div>
          ))}
          <div className="note pos-note"><Shield size={15} /><span>No holdings sold · estimated tax impact £0 · closes 2 of 2 underweights.</span></div>
        </div>
        <div className="card padded">
          <div className="card-head"><h3>Effect on drift</h3></div>
          {[
            { l: "Intl equity", from: 8.8, to: 10.4 },
            { l: "Fixed income", from: 6.6, to: 7.6 },
            { l: "Single-stock", from: 44.9, to: 43.1 },
            { l: "Cash", from: 4.3, to: 2.0 },
          ].map((d) => (
            <div className="drift-row" key={d.l}>
              <span>{d.l}</span>
              <span className="drift-vals mono"><small>{d.from}%</small><ArrowRight size={12} /><b className="pos">{(d.to * scale > 0 ? d.to : d.to).toFixed(1)}%</b></span>
            </div>
          ))}
          <button className="btn accent full">Stage {gbp(amount)} buy <ArrowRight size={15} /></button>
        </div>
      </div>
    </>
  );
}

/* ---------- section: rebuild ---------- */

function RebuildView() {
  return (
    <>
      <div className="sub-head"><div><h2>Rebuild proposal</h2><p>A concrete set of trades to bring the book back to target, with the reasoning.</p></div>
        <span className="pill"><Sliders size={13} /> Draft · 4 trades</span>
      </div>
      <div className="split-wide">
        <div className="card rebuild-list">
          <div className="card-head"><h3>Proposed trades</h3><span className="muted-tag mono">Net £0 · self-funding</span></div>
          <div className="table-scroll">
            <table className="grid-table trades">
              <thead><tr><th className="l">Action</th><th className="l">Holding</th><th>Amount</th><th>Weight</th><th className="l">Why</th></tr></thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.symbol}>
                    <td className="l"><span className={cx("trade-tag", p.action === "Trim" ? "sell" : "buy")}>{p.action}</span></td>
                    <td className="l"><span className="name"><b>{p.symbol}</b><small>{p.name}</small></span></td>
                    <td className="mono strong">{gbp(p.amount)}</td>
                    <td><span className="drift-vals mono"><small>{p.before}%</small><ArrowRight size={11} /><b>{p.after}%</b></span></td>
                    <td className="l reason">{p.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rebuild-foot">
            <span><Shield size={15} /> No target breaches after trades · est. tax ~£420</span>
            <button className="btn accent">Review orders <ArrowRight size={15} /></button>
          </div>
        </div>
        <div className="side-stack">
          <div className="card padded">
            <div className="card-head"><h3>Expected impact</h3></div>
            {[
              { l: "Single-stock concentration", from: "44.9%", to: "42.1%" },
              { l: "Intl equity", from: "8.8%", to: "10.4%" },
              { l: "Fixed income", from: "6.6%", to: "7.6%" },
              { l: "Est. tax impact", from: "", to: "~£420" },
            ].map((d) => (
              <div className="impact-row" key={d.l}>
                <small>{d.l}</small>
                <b className="mono">{d.from && <><span className="muted">{d.from}</span><ArrowRight size={11} /></>}<span className="pos">{d.to}</span></b>
              </div>
            ))}
          </div>
          <div className="card padded rationale">
            <div className="card-head"><h3>Why this plan</h3></div>
            <p>Your largest positions have drifted above their bands after a strong run. These trades trim the overweights and rotate into underweight sleeves, keeping realised gains — and tax — low.</p>
          </div>
        </div>
      </div>
      <ActivityCard />
    </>
  );
}

function ActivityCard() {
  return (
    <div className="card activity">
      <div className="card-head"><h3>Recent activity &amp; cash flow</h3><Link className="card-link" href="#">Full history <ArrowRight size={14} /></Link></div>
      <div className="activity-grid">
        <div className="activity-list">
          {activities.map((a) => (
            <div className="act-row" key={a.date + a.symbol}>
              <span className={cx("act-ic", a.type.toLowerCase())}>
                {a.type === "Buy" ? <ArrowDownRight size={15} /> : a.type === "Sell" ? <ArrowUpRight size={15} /> : <CircleDollarSign size={15} />}
              </span>
              <div className="name"><b>{a.type} · {a.symbol}</b><small>{a.detail}</small></div>
              <div className="act-amt"><b className={cx("mono", a.amount >= 0 && "pos")}>{a.amount >= 0 ? "+" : "−"}{gbp(Math.abs(a.amount))}</b><small>{a.date}</small></div>
            </div>
          ))}
        </div>
        <div className="flows">
          <div className="flow-head"><span>Net added</span><strong className="mono pos">+{gbp(33000)}</strong></div>
          <div className="flow-viz"><i className="in" style={{ width: "78%" }} /><i className="out" style={{ width: "22%" }} /></div>
          <div className="flow-legend"><span><i className="d-in" />In {gbp(36500)}</span><span><i className="d-out" />Out {gbp(3500)}</span></div>
          {flows.slice(0, 4).map((f) => (
            <div className="flow-row" key={f.date}>
              <div className="name"><b>{f.type}</b><small>{f.date}</small></div>
              <b className={cx("mono", f.amount >= 0 && "pos")}>{f.amount >= 0 ? "+" : "−"}{gbp(Math.abs(f.amount))}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- modal ---------- */

function AddModal({ close }: { close: () => void }) {
  return (
    <div className="modal-back" onMouseDown={close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head"><div><span className="metric-label">New activity</span><h2>Add position</h2></div><button className="icon-btn" onClick={close}><X size={18} /></button></div>
        <div className="seg type-seg"><button className="on"><ArrowDownRight size={15} /> Buy</button><button><ArrowUpRight size={15} /> Sell</button><button><CircleDollarSign size={15} /> Cash</button></div>
        <label className="field"><span>Security</span><div className="field-input"><Search size={15} /><input placeholder="Search symbol or name" autoFocus /></div></label>
        <div className="field-row">
          <label className="field"><span>Quantity</span><div className="field-input"><input placeholder="0" /></div></label>
          <label className="field"><span>Price</span><div className="field-input"><input placeholder="£0.00" /></div></label>
        </div>
        <label className="field"><span>Account</span><div className="field-input"><select><option>Individual ··4812</option><option>ISA ··9924</option></select><ChevronDown size={15} /></div></label>
        <div className="modal-foot"><button className="btn ghost" onClick={close}>Cancel</button><button className="btn accent" onClick={close}>Add position</button></div>
      </div>
    </div>
  );
}

/* ---------- shell ---------- */

export default function PortfolioApp({ section }: { section: Section }) {
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const view =
    section === "holdings" ? <HoldingsView /> :
    section === "xray" ? <XRayView /> :
    section === "performance" ? <PerformanceView /> :
    section === "analysis" ? <AnalysisView /> :
    section === "allocate" ? <AllocateView /> :
    <RebuildView />;
  return (
    <div className="app">
      <Topbar menu={() => setMenu(true)} />
      <TickerTape />
      <div className="body">
        <Sidebar open={menu} close={() => setMenu(false)} />
        {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Close navigation" />}
        <main className="content">
          <PageHead section={section} add={() => setModal(true)} />
          {view}
          <footer className="foot"><Logo small /><span>Prices delayed up to 15 min · For personal use</span><span className="mono">v1.0</span></footer>
        </main>
      </div>
      {modal && <AddModal close={() => setModal(false)} />}
    </div>
  );
}
