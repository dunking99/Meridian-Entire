"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Menu,
  MoreHorizontal,
  Newspaper,
  PieChart,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type View = "Overview" | "Holdings" | "Exposure" | "Activity" | "Plan";
type Period = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Portfolio", icon: BriefcaseBusiness, active: true },
  { label: "Markets", icon: LineChart },
  { label: "Research", icon: GraduationCap },
  { label: "News", icon: Newspaper },
];

const periodPaths: Record<Period, { line: string; fill: string; end: string; change: string }> = {
  "1D": {
    line: "M2 121 C18 116 26 123 40 111 C53 99 64 109 77 93 C89 79 104 88 119 72 C130 60 141 75 155 57 C169 39 181 48 194 25 C206 10 222 24 238 11",
    fill: "M2 121 C18 116 26 123 40 111 C53 99 64 109 77 93 C89 79 104 88 119 72 C130 60 141 75 155 57 C169 39 181 48 194 25 C206 10 222 24 238 11 L238 155 L2 155 Z",
    end: "$284,920",
    change: "+$1,246.68",
  },
  "1W": {
    line: "M2 119 C14 97 27 105 40 97 C57 85 62 110 78 88 C93 67 102 84 116 74 C133 61 136 77 151 59 C169 41 176 65 192 40 C205 22 221 29 238 15",
    fill: "M2 119 C14 97 27 105 40 97 C57 85 62 110 78 88 C93 67 102 84 116 74 C133 61 136 77 151 59 C169 41 176 65 192 40 C205 22 221 29 238 15 L238 155 L2 155 Z",
    end: "$284,920",
    change: "+$3,886.23",
  },
  "1M": {
    line: "M2 124 C13 109 24 112 35 106 C51 96 60 111 72 90 C83 70 95 83 108 64 C124 42 136 70 149 54 C160 41 167 58 179 42 C192 21 207 37 221 23 C227 16 233 19 238 13",
    fill: "M2 124 C13 109 24 112 35 106 C51 96 60 111 72 90 C83 70 95 83 108 64 C124 42 136 70 149 54 C160 41 167 58 179 42 C192 21 207 37 221 23 C227 16 233 19 238 13 L238 155 L2 155 Z",
    end: "$284,920",
    change: "+$8,140.37",
  },
  "3M": {
    line: "M2 132 C12 126 20 133 32 118 C44 100 53 116 66 98 C81 79 91 90 103 72 C113 56 126 78 140 61 C154 42 167 51 180 38 C193 24 205 41 218 23 C227 11 233 16 238 9",
    fill: "M2 132 C12 126 20 133 32 118 C44 100 53 116 66 98 C81 79 91 90 103 72 C113 56 126 78 140 61 C154 42 167 51 180 38 C193 24 205 41 218 23 C227 11 233 16 238 9 L238 155 L2 155 Z",
    end: "$284,920",
    change: "+$19,425.06",
  },
  "1Y": {
    line: "M2 136 C12 140 19 129 31 133 C43 137 55 105 66 110 C80 115 84 92 99 99 C111 105 116 73 131 82 C144 91 151 64 164 66 C180 69 180 43 194 47 C207 51 211 25 223 31 C230 35 234 16 238 10",
    fill: "M2 136 C12 140 19 129 31 133 C43 137 55 105 66 110 C80 115 84 92 99 99 C111 105 116 73 131 82 C144 91 151 64 164 66 C180 69 180 43 194 47 C207 51 211 25 223 31 C230 35 234 16 238 10 L238 155 L2 155 Z",
    end: "$284,920",
    change: "+$47,220.48",
  },
  ALL: {
    line: "M2 146 C11 144 17 139 26 142 C39 146 44 122 56 128 C72 137 77 107 88 111 C105 118 105 91 119 96 C132 99 136 65 149 72 C161 80 166 47 180 51 C193 55 198 24 210 35 C219 43 225 19 238 10",
    fill: "M2 146 C11 144 17 139 26 142 C39 146 44 122 56 128 C72 137 77 107 88 111 C105 118 105 91 119 96 C132 99 136 65 149 72 C161 80 166 47 180 51 C193 55 198 24 210 35 C219 43 225 19 238 10 L238 155 L2 155 Z",
    end: "$284,920",
    change: "+$84,920.48",
  },
};

const holdings = [
  { ticker: "MSFT", name: "Microsoft", color: "#6475e5", shares: "84.21", price: "$423.85", value: "$35,687", day: "+1.18%", total: "+34.6%", allocation: "12.5%" },
  { ticker: "VOO", name: "Vanguard S&P 500", color: "#c4438e", shares: "61.00", price: "$531.64", value: "$32,430", day: "+0.58%", total: "+21.3%", allocation: "11.4%" },
  { ticker: "NVDA", name: "NVIDIA", color: "#79a243", shares: "256.00", price: "$141.44", value: "$36,209", day: "+2.47%", total: "+63.1%", allocation: "12.7%" },
  { ticker: "BRK.B", name: "Berkshire Hathaway", color: "#5d8d8c", shares: "68.00", price: "$489.15", value: "$33,262", day: "+0.41%", total: "+15.7%", allocation: "11.7%" },
  { ticker: "AVGO", name: "Broadcom", color: "#e09e38", shares: "144.00", price: "$247.01", value: "$35,569", day: "+1.36%", total: "+39.8%", allocation: "12.5%" },
  { ticker: "VXUS", name: "Vanguard International", color: "#9074d6", shares: "390.00", price: "$64.38", value: "$25,108", day: "−0.28%", total: "+10.4%", allocation: "8.8%" },
];

const activities = [
  { date: "Today", icon: TrendingUp, color: "mint", title: "Portfolio updated", note: "Market close · +$1,246.68", amount: "+0.44%" },
  { date: "May 28", icon: ArrowDownRight, color: "rose", title: "Bought 6.2 shares of VOO", note: "at $529.10 · Core portfolio", amount: "−$3,280" },
  { date: "May 21", icon: CircleDollarSign, color: "blue", title: "Cash contribution", note: "From checking account", amount: "+$8,000" },
  { date: "May 15", icon: ArrowUpRight, color: "violet", title: "Dividend received", note: "MSFT · 84.21 shares", amount: "+$63.16" },
];

function formatNumber(value: string) {
  return value;
}

function MiniIcon({ ticker, color }: { ticker: string; color: string }) {
  return <div className="ticker-icon" style={{ backgroundColor: color }}>{ticker === "BRK.B" ? "B" : ticker.slice(0, 1)}</div>;
}

function PerformanceChart({ period }: { period: Period }) {
  const chart = periodPaths[period];
  return (
    <div className="performance-chart" aria-label={`Portfolio performance for ${period}`}>
      <div className="chart-y-label y-top">$290k</div>
      <div className="chart-y-label y-middle">$270k</div>
      <div className="chart-y-label y-bottom">$250k</div>
      <div className="chart-grid grid-one" />
      <div className="chart-grid grid-two" />
      <div className="chart-grid grid-three" />
      <svg viewBox="0 0 240 155" preserveAspectRatio="none" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="portfolioShade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#98dfc5" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#98dfc5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={chart.fill} fill="url(#portfolioShade)" />
        <path d={chart.line} fill="none" stroke="#35a47b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        <circle cx="238" cy={period === "ALL" ? "10" : "13"} r="4" fill="#35a47b" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="chart-labels"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span></div>
    </div>
  );
}

function Overview({ period, setPeriod, onPlan }: { period: Period; setPeriod: (p: Period) => void; onPlan: () => void }) {
  const chart = periodPaths[period];
  return (
    <>
      <section className="top-summary">
        <div className="summary-copy">
          <div className="eyebrow"><span className="pulse-dot" /> Portfolio value</div>
          <div className="value-row"><h1>$284,920<span>.48</span></h1><button className="eye-button" aria-label="Hide value"><svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 6s2.8-4.5 8-4.5S17 6 17 6s-2.8 4.5-8 4.5S1 6 1 6Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.5"/></svg></button></div>
          <div className="value-change positive"><TrendingUp size={15} /><strong>{chart.change}</strong><span>(+19.44%)</span><span className="period-detail">{period === "1D" ? "today" : `this ${period.toLowerCase()}`}</span></div>
          <div className="benchmark-line"><span>vs. S&amp;P 500</span><strong>+3.12%</strong><span>ahead</span><span className="benchmark-dot">•</span><span>Annualized return <strong>13.8%</strong></span></div>
        </div>
        <div className="summary-actions">
          <button className="outline-button"><CalendarDays size={16} /> May 30, 2025 <ChevronDown size={15} /></button>
          <button className="primary-button" onClick={onPlan}><Sparkles size={16} /> Review plan</button>
        </div>
      </section>

      <section className="performance-card card">
        <div className="card-topline">
          <div>
            <div className="section-kicker">PERFORMANCE</div>
            <div className="performance-heading"><strong>{chart.end}</strong><span className="live-pill"><span />LIVE</span></div>
          </div>
          <div className="performance-right"><div className="return-chip"><span>Time-weighted return</span><strong>+19.44%</strong></div><button className="more-button" aria-label="More chart options"><MoreHorizontal size={20} /></button></div>
        </div>
        <PerformanceChart period={period} />
        <div className="chart-foot">
          <div className="range-pills">{(["1D", "1W", "1M", "3M", "1Y", "ALL"] as Period[]).map((item) => <button className={period === item ? "range-active" : ""} key={item} onClick={() => setPeriod(item)}>{item}</button>)}</div>
          <div className="benchmark-key"><span className="portfolio-key" />Portfolio <span className="benchmark-key-line" />S&amp;P 500</div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="return-card card">
          <div className="card-header"><div><div className="section-kicker">RETURN DRIVERS</div><h2>What moved this week</h2></div><button className="text-button">Detail <ChevronRight size={15} /></button></div>
          <div className="drivers-list">
            <div className="driver-row"><MiniIcon ticker="NVDA" color="#79a243" /><div className="driver-main"><strong>NVIDIA</strong><span>Semiconductors</span></div><div className="driver-bar"><span style={{ width: "82%" }} /></div><div className="driver-return positive">+$1,742</div></div>
            <div className="driver-row"><MiniIcon ticker="AVGO" color="#e09e38" /><div className="driver-main"><strong>Broadcom</strong><span>Semiconductors</span></div><div className="driver-bar"><span style={{ width: "61%" }} /></div><div className="driver-return positive">+$892</div></div>
            <div className="driver-row"><MiniIcon ticker="VXUS" color="#9074d6" /><div className="driver-main"><strong>VXUS</strong><span>International</span></div><div className="driver-bar negative-bar"><span style={{ width: "33%" }} /></div><div className="driver-return negative">−$118</div></div>
          </div>
          <div className="drivers-foot"><span><span className="good-dot" />5 gainers</span><span><span className="muted-dot" />2 decliners</span><strong>Net <span className="positive">+$2,516</span></strong></div>
        </div>
        <div className="cash-card card">
          <div className="section-kicker">AVAILABLE TO INVEST</div>
          <div className="cash-balance"><strong>$18,492</strong><span>6.5% of portfolio</span></div>
          <div className="cash-meter"><span /></div>
          <p>Cash is above your 3% target. Your plan has <strong>one suggested move.</strong></p>
          <button className="cash-plan" onClick={onPlan}>View recommendation <ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="holdings-preview card">
        <div className="card-header"><div><div className="section-kicker">YOUR POSITIONS</div><h2>Largest holdings</h2></div><button className="text-button">View all positions <ChevronRight size={15} /></button></div>
        <div className="holding-table preview-table">
          <div className="table-row table-head"><div>Holding</div><div>Value</div><div>Today</div><div>Total return</div><div>Weight</div></div>
          {holdings.slice(0, 4).map((holding) => <div className="table-row" key={holding.ticker}><div className="holding-name"><MiniIcon ticker={holding.ticker} color={holding.color} /><div><strong>{holding.ticker}</strong><span>{holding.name}</span></div></div><div className="value-cell">{holding.value}</div><div className={`return-cell ${holding.day.startsWith("−") ? "negative" : "positive"}`}>{holding.day}</div><div className="return-cell positive">{holding.total}</div><div className="weight-cell"><span><i style={{ width: holding.allocation }} /></span>{holding.allocation}</div></div>)}
        </div>
      </section>
    </>
  );
}

function Holdings({ search }: { search: string }) {
  const filtered = holdings.filter((h) => `${h.ticker} ${h.name}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="page-section">
    <div className="section-page-title"><div><div className="section-kicker">PORTFOLIO INVENTORY</div><h1>Holdings <span>{holdings.length}</span></h1><p>Every position, sorted by current market value.</p></div><button className="primary-button"><Plus size={17} /> Add holding</button></div>
    <div className="holdings-stats"><div className="stat-box"><span>Invested</span><strong>$266,428</strong><small>93.5% of portfolio</small></div><div className="stat-box"><span>Unrealized gain</span><strong className="positive">+$52,614</strong><small>on current positions</small></div><div className="stat-box"><span>Dividend yield</span><strong>1.21%</strong><small>$3,226 / year est.</small></div><div className="stat-box"><span>Cost basis</span><strong>$213,814</strong><small>excl. cash</small></div></div>
    <div className="all-holdings card"><div className="holdings-toolbar"><h2>Positions</h2><div><button className="filter-button"><SlidersHorizontal size={15} /> Filters</button><button className="filter-button"><FileText size={15} /> Export</button></div></div><div className="holding-table"><div className="table-row table-head all-head"><div>Holding <ChevronDown size={13} /></div><div>Shares</div><div>Price</div><div>Market value</div><div>Day</div><div>Total return</div><div>Weight</div></div>{filtered.map((holding) => <div className="table-row all-row" key={holding.ticker}><div className="holding-name"><MiniIcon ticker={holding.ticker} color={holding.color} /><div><strong>{holding.ticker}</strong><span>{holding.name}</span></div></div><div>{holding.shares}</div><div>{holding.price}</div><div className="value-cell">{holding.value}</div><div className={`return-cell ${holding.day.startsWith("−") ? "negative" : "positive"}`}>{holding.day}</div><div className="return-cell positive">{holding.total}</div><div className="weight-cell"><span><i style={{ width: holding.allocation }} /></span>{holding.allocation}</div></div>)}{filtered.length === 0 && <div className="empty-state">No holdings match “{search}”.</div>}</div></div>
  </section>;
}

function Exposure() {
  const regions = [["United States", "67.4%", "#4e766e"], ["Developed ex-US", "15.6%", "#9ebfa6"], ["Emerging markets", "5.7%", "#d1d7af"], ["Cash", "6.5%", "#d9ad72"], ["Other", "4.8%", "#dfdfd8"]];
  const sectors = [["Information technology", "32.8%", "#4e766e"], ["Financials", "14.6%", "#75a591"], ["Health care", "11.2%", "#a5c5aa"], ["Industrials", "9.8%", "#c9d3ad"], ["Consumer discretionary", "8.7%", "#dedcae"], ["Other", "22.9%", "#e8e8e0"]];
  return <section className="page-section"><div className="section-page-title"><div><div className="section-kicker">LOOK-THROUGH VIEW</div><h1>True exposure</h1><p>Underlying holdings, including what your funds own.</p></div><button className="outline-button"><ShieldCheck size={16} /> Updated May 30</button></div>
    <div className="exposure-lead card"><div><span className="insight-mark"><Sparkles size={17} /></span><div><div className="section-kicker">MERIDIAN INSIGHT</div><h2>You own more mega-cap tech than it appears.</h2><p>Fund look-through adds 7.2% to your direct technology allocation, primarily through VOO.</p></div></div><button className="text-button">See methodology <ChevronRight size={15} /></button></div>
    <div className="exposure-grid"><div className="card allocation-card"><div className="card-header"><div><div className="section-kicker">BY REGION</div><h2>Geographic exposure</h2></div><Globe2 size={19} className="faint-icon" /></div><div className="donut-row"><div className="donut region-donut"><span><strong>67%</strong><small>US</small></span></div><div className="legend-list">{regions.map(([name,value,color]) => <div key={name}><i style={{ background: color }} /><span>{name}</span><strong>{value}</strong></div>)}</div></div></div><div className="card allocation-card"><div className="card-header"><div><div className="section-kicker">BY SECTOR</div><h2>Economic exposure</h2></div><Building2 size={19} className="faint-icon" /></div><div className="stacked-bars">{sectors.map(([name,value,color]) => <div className="exposure-bar" key={name}><div><span>{name}</span><strong>{value}</strong></div><i><b style={{ width: value, background: color }} /></i></div>)}</div></div></div>
    <div className="concentration card"><div className="card-header"><div><div className="section-kicker">CONCENTRATION CHECK</div><h2>Single-stock exposure</h2></div><span className="balanced-pill"><Check size={13} /> In range</span></div><div className="concentration-grid"><div><strong>12.7%</strong><span>Largest holding · NVIDIA</span></div><div><strong>25.2%</strong><span>Top 2 positions</span></div><div><strong>54.8%</strong><span>Top 5 positions</span></div><p><ShieldCheck size={18} /> Your largest position is within your 15% risk limit. You’re moderately concentrated in semiconductors at 18.9%.</p></div></div>
  </section>;
}

function Activity() {
  return <section className="page-section"><div className="section-page-title"><div><div className="section-kicker">PORTFOLIO JOURNAL</div><h1>Activity</h1><p>A clean record of money movements, trades, and income.</p></div><button className="primary-button"><Plus size={17} /> Record activity</button></div><div className="activity-layout"><div className="activity-feed card"><div className="holdings-toolbar"><h2>Recent activity</h2><button className="filter-button"><SlidersHorizontal size={15} /> All activity <ChevronDown size={14} /></button></div><div className="activity-list">{activities.map((item) => { const Icon = item.icon; return <div className="activity-item" key={item.title}><div className={`activity-icon ${item.color}`}><Icon size={17} /></div><div className="activity-info"><span>{item.date}</span><strong>{item.title}</strong><small>{item.note}</small></div><strong className={item.amount.startsWith("−") ? "" : "positive"}>{item.amount}</strong></div>; })}</div><button className="load-more">Load more activity</button></div><aside className="activity-side"><div className="cashflow-card card"><div className="section-kicker">CASH FLOW · YTD</div><h2>$14,800 <span>net added</span></h2><div className="cashflow-bars"><i style={{ height: "32%" }} /><i style={{ height: "47%" }} /><i style={{ height: "26%" }} /><i style={{ height: "72%" }} /><i style={{ height: "48%" }} /><i style={{ height: "93%" }} /></div><div className="bar-months"><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span></div></div><div className="tax-card card"><div className="section-kicker">TAXABLE ACCOUNT</div><h2>Tax picture</h2><div><span>Realized gains</span><strong>$1,286</strong></div><div><span>Qualified dividends</span><strong>$406</strong></div><button className="text-button">View tax lots <ChevronRight size={15} /></button></div></aside></div></section>;
}

function Plan() {
  return <section className="page-section"><div className="section-page-title"><div><div className="section-kicker">THE NEXT BEST MOVE</div><h1>Investment plan</h1><p>Ideas grounded in your targets, cash balance, and current exposure.</p></div><span className="updated-badge"><Clock3 size={14} /> Refreshed today</span></div><div className="plan-hero card"><div className="plan-copy"><div className="plan-spark"><Zap size={19} /></div><span className="section-kicker">ONE CLEAR OPPORTUNITY</span><h2>Put $10,000 of cash to work in your global allocation.</h2><p>This brings cash closer to your 3% target while strengthening your developed international exposure — your biggest allocation gap.</p><div className="plan-tags"><span><Globe2 size={14} /> International equity</span><span><Target size={14} /> Aligns with target</span></div></div><div className="plan-score"><span>PLAN FIT</span><strong>91<small>/100</small></strong><em>High confidence</em></div></div><div className="recommendation-grid"><div className="recommendation card"><div className="card-header"><div><div className="section-kicker">PROPOSED TRADE</div><h2>Add to VXUS</h2></div><MiniIcon ticker="VXUS" color="#9074d6" /></div><div className="trade-amount"><strong>$10,000</strong><span>Buy ~155.3 shares</span></div><div className="trade-details"><div><span>Current allocation</span><strong>8.8%</strong></div><div><span>After trade</span><strong className="positive">12.3%</strong></div><div><span>Target range</span><strong>12–18%</strong></div></div><button className="primary-button full-button">Review trade <ArrowRight size={16} /></button></div><div className="reasons card"><div className="section-kicker">WHY THIS, WHY NOW</div><h2>Designed around your portfolio</h2><ul><li><Check size={16} /> Closes <strong>43%</strong> of your international equity allocation gap.</li><li><Check size={16} /> Reduces cash drag without changing stock/bond risk.</li><li><Check size={16} /> Keeps semiconductor exposure under your 20% guardrail.</li></ul><div className="risk-note"><ShieldCheck size={17} /><span><strong>Before you act</strong> · This is an allocation suggestion, not tax or investment advice.</span></div></div></div><div className="target-tracker card"><div className="card-header"><div><div className="section-kicker">ALLOCATION PROGRESS</div><h2>Portfolio targets</h2></div><button className="text-button">Edit targets <Settings2 size={15} /></button></div><div className="target-rows"><div><span>US equity</span><i><b style={{ width: "66%" }} /></i><strong>66% <small>of 65–75%</small></strong></div><div><span>International equity</span><i><b className="under" style={{ width: "21%" }} /></i><strong>16% <small>of 25–30%</small></strong></div><div><span>Cash</span><i><b className="cash-fill" style={{ width: "27%" }} /></i><strong>6.5% <small>of 3–5%</small></strong></div></div></div></section>;
}

export default function HomePage() {
  const [activeView, setActiveView] = useState<View>("Overview");
  const [period, setPeriod] = useState<Period>("1Y");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState("");
  const currentTitle = activeView === "Overview" ? "Portfolio" : activeView;
  const total = useMemo(() => activeView === "Holdings" ? "6 positions" : activeView === "Exposure" ? "Look-through allocation" : activeView === "Activity" ? "Transactions & cash flow" : activeView === "Plan" ? "Personalized recommendations" : "North Star · Taxable", [activeView]);
  const changeView = (view: View) => { setActiveView(view); setSearch(""); setDrawerOpen(false); };
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  return <div className="app-shell">
    <aside className={`sidebar ${drawerOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><span /><span /><span /></div><span>meridian</span></div>
      <nav className="main-nav">{nav.map((item) => { const Icon = item.icon; const isPortfolio = item.label === "Portfolio"; return <button key={item.label} onClick={() => isPortfolio && changeView("Overview")} className={`${item.active ? "nav-active" : ""} ${!isPortfolio ? "coming-soon" : ""}`}><Icon size={18} /><span>{item.label}</span>{!isPortfolio && <i>soon</i>}</button>; })}</nav>
      <div className="sidebar-bottom"><button><Bell size={18} /><span>Notifications</span><b>3</b></button><button><Settings2 size={18} /><span>Settings</span></button><div className="account-row"><div className="avatar">EL</div><div><strong>Elena Lin</strong><span>Personal account</span></div><ChevronDown size={15} /></div></div>
    </aside>
    {drawerOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
    <main className="main-content">
      <header className="app-header"><div className="mobile-brand"><button onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Menu size={21} /></button><span className="brand-mark small"><span /><span /><span /></span></div><div className="crumb"><span>Portfolio</span><ChevronRight size={15} /><strong>{currentTitle}</strong></div><div className="header-actions"><button className="icon-button search-button" aria-label="Search"><Search size={18} /></button><div className="header-divider" /><button className="help-button">?</button><div className="avatar header-avatar">EL</div></div></header>
      <div className="content-wrap">
        <section className="intro-row"><div><p className="welcome">Good afternoon, Elena <span>✦</span></p><p className="portfolio-subtitle">{total}</p></div><div className="search-holder"><Search size={17} /><input value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value && activeView !== "Holdings") setActiveView("Holdings"); }} placeholder="Search holdings" /></div><button className="add-button" onClick={() => setAddOpen(true)}><Plus size={17} /> Add</button></section>
        <div className="portfolio-tabs" role="tablist">{(["Overview", "Holdings", "Exposure", "Activity", "Plan"] as View[]).map((view) => <button role="tab" aria-selected={activeView === view} className={activeView === view ? "active-tab" : ""} key={view} onClick={() => changeView(view)}>{view}{view === "Plan" && <span className="new-label">1</span>}</button>)}</div>
        {activeView === "Overview" && <Overview period={period} setPeriod={setPeriod} onPlan={() => changeView("Plan")} />}
        {activeView === "Holdings" && <Holdings search={search} />}
        {activeView === "Exposure" && <Exposure />}
        {activeView === "Activity" && <Activity />}
        {activeView === "Plan" && <Plan />}
      </div>
    </main>
    {addOpen && <div className="modal-backdrop" onMouseDown={() => setAddOpen(false)}><div className="add-modal" role="dialog" aria-modal="true" aria-label="Add portfolio activity" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setAddOpen(false)} aria-label="Close"><X size={18} /></button><div className="modal-icon"><Plus size={21} /></div><div className="section-kicker">PORTFOLIO ACTIVITY</div><h2>Add to your portfolio</h2><p>Keep your balance and performance history current.</p><div className="add-options"><button onClick={() => { setAddOpen(false); showToast("Contribution recorded — your cash balance is updated."); }}><CircleDollarSign size={18} /><span><strong>Record contribution</strong><small>Money added or withdrawn</small></span><ChevronRight size={17} /></button><button onClick={() => { setAddOpen(false); showToast("Trade flow opened — select a holding to continue."); }}><TrendingUp size={18} /><span><strong>Record a trade</strong><small>Buy, sell, or add a new holding</small></span><ChevronRight size={17} /></button></div></div></div>}
    {toast && <div className="toast"><Check size={17} /> {toast}</div>}
  </div>;
}
