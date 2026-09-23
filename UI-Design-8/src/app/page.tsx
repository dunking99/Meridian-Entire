"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Check,
  ChevronRight,
  FileText,
  Globe,
  Info,
  LineChart,
  Menu,
  Moon,
  Newspaper,
  PieChart,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Donut, HBar, PerformanceChart, Spark, WeightBar } from "@/components/charts";
import {
  FX_GBPUSD,
  HOLDINGS,
  LOOKTHROUGH,
  MONTHLY,
  PORTFOLIO,
  PROPOSED_TRADES,
  REGIONS,
  SECTORS,
  TAPE,
  TARGETS,
  buildHistory,
  ccy,
  gbp,
  num,
  pct,
  type Holding,
} from "@/lib/portfolio";

type Tab = "Holdings" | "X-Ray" | "Performance" | "Analysis" | "Allocate" | "Rebuild";
type Range = "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "MAX";
type Mode = "value" | "return";
type AllocView = "Holdings" | "Region" | "Sector" | "Type";

const TABS: { id: Tab; hint: string }[] = [
  { id: "Holdings", hint: "Positions" },
  { id: "X-Ray", hint: "True exposure" },
  { id: "Performance", hint: "Returns" },
  { id: "Analysis", hint: "Drivers & risk" },
  { id: "Allocate", hint: "New money" },
  { id: "Rebuild", hint: "Proposed plan" },
];

const RANGES: Range[] = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "MAX"];

export default function PortfolioPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState<Tab>("Holdings");
  const [range, setRange] = useState<Range>("3M");
  const [mode, setMode] = useState<Mode>("value");
  const [showBench, setShowBench] = useState(true);
  const [allocView, setAllocView] = useState<AllocView>("Holdings");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "add" | "cash">(null);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState(5000);
  const [cash, setCash] = useState(PORTFOLIO.cash);
  const [holdings, setHoldings] = useState<Holding[]>(HOLDINGS);
  const [seconds, setSeconds] = useState(PORTFOLIO.updatedSeconds);
  const [newTicker, setNewTicker] = useState("");
  const [newQty, setNewQty] = useState("");
  const [cashInput, setCashInput] = useState("1850");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("meridian-theme") : null;
    if (saved === "dark" || saved === "light") setTheme(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("meridian-theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => (s >= 300 ? 68 : s + 7)), 7000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    // Try to load persisted holdings; fall back silently to seed data.
    fetch("/api/portfolio")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.holdings?.length) setHoldings(j.holdings);
        if (typeof j?.cash === "number") setCash(j.cash);
      })
      .catch(() => {});
  }, []);

  const history = useMemo(() => buildHistory(range), [range]);
  const rangeChange = useMemo(() => {
    if (history.length < 2) return { gbp: 0, pct: 0 };
    const a = history[0].value;
    const b = history[history.length - 1].value;
    return { gbp: b - a, pct: ((b - a) / a) * 100 };
  }, [history]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return holdings;
    return holdings.filter((h) => `${h.name} ${h.ticker} ${h.exchange}`.toLowerCase().includes(q));
  }, [holdings, search]);

  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.valueGbp, 0) + cash, [holdings, cash]);

  const allocSlices = useMemo(() => {
    if (allocView === "Holdings") return holdings.slice(0, 5).map((h) => ({ pct: h.weight, color: h.color }));
    if (allocView === "Region") return REGIONS.map((r) => ({ pct: r.pct, color: r.color }));
    if (allocView === "Sector") return SECTORS.slice(0, 6).map((s) => ({ pct: s.pct, color: s.color }));
    return [
      { pct: 50.6, color: "#0f766e" },
      { pct: 21.1, color: "#2f5af6" },
      { pct: 17.8, color: "#7c3aed" },
      { pct: 10.6, color: "#b45309" },
    ];
  }, [allocView, holdings]);

  const sim = useMemo(() => {
    // Distribute new money to the most underweight targets
    const gaps = TARGETS.map((t) => ({ ...t, gap: Math.max(0, t.target - t.actual) }));
    const totalGap = gaps.reduce((s, g) => s + g.gap, 0) || 1;
    return gaps.map((g) => ({ ...g, amount: Math.round((g.gap / totalGap) * investAmount) }));
  }, [investAmount]);

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2600);
  };

  const saveHolding = () => {
    if (!newTicker.trim() || !newQty.trim()) {
      showToast("Add a ticker and quantity to continue.");
      return;
    }
    fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: newTicker.trim().toUpperCase(), qty: Number(newQty) || 1 }),
    }).catch(() => {});
    setModal(null);
    setNewTicker("");
    setNewQty("");
    showToast(`${newTicker.trim().toUpperCase() || "Holding"} added — prices will attach shortly.`);
  };

  const saveCash = () => {
    const v = Math.max(0, Math.round(Number(cashInput) || 0));
    setCash(v);
    fetch("/api/portfolio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cash: v }),
    }).catch(() => {});
    setModal(null);
    showToast(v === 0 ? "Cash set to £0 — fully invested." : `Cash updated to ${gbp(v)}.`);
  };

  const dayUp = PORTFOLIO.dayGain >= 0;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-row">
          <div className="brand-logo">◈</div>
          <div>
            <div className="brand-name">MERIDIAN</div>
            <div className="brand-sub">TRADING INTELLIGENCE</div>
          </div>
        </div>
        <button className="search-btn" onClick={() => showToast("Search is scoped to this demo — try the holdings filter.")}>
          <Search size={15} /> <span>Search…</span> <kbd>⌘K</kbd>
        </button>
        <div className="nav-section">Workspace</div>
        <div className="nav-list">
          <button className="nav-item" onClick={() => showToast("Briefing lives outside this portfolio demo.")}>
            <Sparkles size={17} /> <span>Briefing</span>
          </button>
          <button className="nav-item active">
            <Briefcase size={17} /> <span>Portfolio</span>
          </button>
        </div>
        <div className="nav-section">Markets</div>
        <div className="nav-list">
          <button className="nav-item" onClick={() => showToast("Markets lives outside this portfolio demo.")}>
            <LineChart size={17} /> <span>Markets</span>
          </button>
          <button className="nav-item" onClick={() => showToast("News lives outside this portfolio demo.")}>
            <Newspaper size={17} /> <span>News</span>
          </button>
          <button className="nav-item" onClick={() => showToast("Watchlist lives outside this portfolio demo.")}>
            <Bookmark size={17} /> <span>Watchlist</span>
          </button>
          <button className="nav-item" onClick={() => showToast("Screener lives outside this portfolio demo.")}>
            <SlidersHorizontal size={17} /> <span>Screener</span>
          </button>
        </div>
        <div className="nav-section">Insight</div>
        <div className="nav-list">
          <button className="nav-item" onClick={() => showToast("Research lives outside this portfolio demo.")}>
            <BookOpen size={17} /> <span>Research</span>
          </button>
          <button className="nav-item" onClick={() => setTab("Analysis")}>
            <ShieldCheck size={17} /> <span>Risk</span>
          </button>
          <button className="nav-item" onClick={() => showToast("No new alerts. ASML +3% is already in today's move.")}>
            <Bell size={17} /> <span>Alerts</span> <span className="badge">3</span>
          </button>
          <button className="nav-item" onClick={() => showToast("Reports lives outside this portfolio demo.")}>
            <FileText size={17} /> <span>Reports</span>
          </button>
        </div>
        <div className="sidebar-foot">
          <button className="nav-item" onClick={() => showToast("Settings live outside this demo.")}>
            <Settings size={17} /> <span>Settings</span>
          </button>
          <div className="user-row">
            <div className="user-avatar">YO</div>
            <div>
              <strong>You</strong>
              <span>Personal · GBP base</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
            <Menu size={18} />
          </button>
          <div className="crumbs">
            <span>Portfolio</span> <ChevronRight size={14} /> <strong>{tab}</strong>
          </div>
          <span className="live-pill">
            <i /> LIVE · {seconds}s ago
          </span>
          <div className="topbar-right">
            <span className="tnum">Sat 19 Sep 2026</span>
            <div className="theme-toggle" role="group" aria-label="Theme">
              <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")} aria-label="Light">
                <Sun size={15} />
              </button>
              <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")} aria-label="Dark">
                <Moon size={15} />
              </button>
            </div>
          </div>
        </header>

        <div className="ticker-wrap">
          <div className="ticker" aria-label="Market snapshot">
            {TAPE.map((t) => (
              <div className="tape-item" key={t.label}>
                <span className="tl">{t.label}</span>
                <span className="tv">{t.value}</span>
                <span className={`tc ${t.change >= 0 ? "up" : "down"}`}>
                  {t.change >= 0 ? "+" : "−"}
                  {Math.abs(t.change).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <main className="content">
          <div className="portfolio-head">
            <div className="ph-left">
              <div className="eyebrow">
                Meridian Portfolio <span style={{ opacity: 0.4 }}>·</span> {holdings.length} holdings <span style={{ opacity: 0.4 }}>·</span> £/$ {num(FX_GBPUSD, 4)}
              </div>
              <h1>Calm view of £37k at work</h1>
              <p>One number that matters, then the story behind it — no terminal noise.</p>
            </div>
            <div className="ph-actions">
              <button className="btn btn-ghost" onClick={() => setModal("cash")}>
                <Wallet size={16} /> Edit cash
              </button>
              <button className="btn btn-primary" onClick={() => setModal("add")}>
                <Plus size={16} /> Add holding
              </button>
            </div>
          </div>

          <div className="ptabs" role="tablist" aria-label="Portfolio sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`ptab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
                title={t.hint}
              >
                {t.id}
                {t.id === "Holdings" && <span className="count">{holdings.length}</span>}
                {t.id === "Rebuild" && <span className="count">3</span>}
              </button>
            ))}
          </div>

          {tab === "Holdings" && (
            <>
              <section className="hero">
                <div className="card hero-main">
                  <div className="hero-label">Total value</div>
                  <div className="hero-value tnum">{gbp(totalValue)}</div>
                  <div className="hero-deltas">
                    <span className={`delta-pill ${dayUp ? "today-up" : "down"}`}>
                      {dayUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {gbp(PORTFOLIO.dayGain, { sign: true })} <small>today · {pct(PORTFOLIO.dayPct)}</small>
                    </span>
                    <span className="delta-pill total">
                      <TrendingUp size={14} /> {gbp(PORTFOLIO.totalGain, { sign: true })} <small>all-time · {pct(PORTFOLIO.totalGainPct, 1)}</small>
                    </span>
                    <span className="delta-pill" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
                      {pct(rangeChange.pct)} <small>this {range.toLowerCase()}</small>
                    </span>
                  </div>
                  <div className="hero-foot">
                    <span>
                      <strong className="tnum">{gbp(PORTFOLIO.contributions)}</strong> put in
                    </span>
                    <span>
                      <strong className="tnum">+{PORTFOLIO.annualised.toFixed(1)}%</strong> a year · {PORTFOLIO.years}y
                    </span>
                    <span className="bench-inline">
                      <span className="live-pill" style={{ padding: "2px 8px" }}>
                        +4.1pp
                      </span>
                      ahead of FTSE All-World
                    </span>
                  </div>
                </div>
                <div className="card hero-side">
                  <div className="stat-row">
                    <span className="sk">Invested</span>
                    <span className="sv tnum">
                      {gbp(PORTFOLIO.invested)} <small>· 100%</small>
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="sk">
                      Cash{" "}
                      <button className="link-btn" onClick={() => setModal("cash")}>
                        Edit
                      </button>
                    </span>
                    <span className="sv tnum">
                      {gbp(cash)}
                      {cash === 0 && <span className="cash-zero">Fully invested</span>}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="sk">
                      Contributions <Info size={13} />
                    </span>
                    <span className="sv tnum">{gbp(PORTFOLIO.contributions)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="sk">Annualised return</span>
                    <span className="sv tnum up">+{PORTFOLIO.annualised.toFixed(1)}%</span>
                  </div>
                </div>
              </section>

              <section className="grid-2">
                <div className="card panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-title">Growth over time</div>
                      <div className="panel-sub">
                        {mode === "value" ? "Portfolio value in pounds" : "Cumulative return"} · {range} · vs FTSE All-World
                      </div>
                    </div>
                    <div className="seg" role="group" aria-label="Chart mode">
                      <button className={mode === "value" ? "on" : ""} onClick={() => setMode("value")}>
                        £ Value
                      </button>
                      <button className={mode === "return" ? "on" : ""} onClick={() => setMode("return")}>
                        % Return
                      </button>
                    </div>
                  </div>
                  <PerformanceChart data={history} mode={mode} showBenchmark={showBench} />
                  <div className="range-row">
                    <div className="ranges">
                      {RANGES.map((r) => (
                        <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <label className="bench-toggle">
                      <button
                        className={`switch ${showBench ? "on" : ""}`}
                        onClick={() => setShowBench(!showBench)}
                        aria-label="Toggle benchmark"
                      >
                        <i />
                      </button>
                      Benchmark
                    </label>
                  </div>
                  <div className="chart-note">
                    <Info size={13} /> History rebuilt from today&apos;s weights. Cash excluded. US holdings at £/$ {num(FX_GBPUSD, 4)}.
                  </div>
                </div>

                <div className="card panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-title">Where it sits</div>
                      <div className="panel-sub">Allocation at a glance — detail in X-Ray</div>
                    </div>
                    <PieChart size={18} color="var(--faint)" />
                  </div>
                  <div className="alloc-tabs">
                    {(["Holdings", "Region", "Sector", "Type"] as AllocView[]).map((v) => (
                      <button key={v} className={allocView === v ? "on" : ""} onClick={() => setAllocView(v)}>
                        {v}
                      </button>
                    ))}
                  </div>
                  {allocView === "Holdings" && (
                    <>
                      <div className="alloc-top">
                        <Donut slices={allocSlices} />
                        <div className="alloc-legend">
                          {holdings.slice(0, 3).map((h) => (
                            <div key={h.id}>
                              <i style={{ background: h.color }} /> <span>{h.ticker}</span> <strong className="tnum">{h.weight.toFixed(1)}%</strong>
                            </div>
                          ))}
                          <div>
                            <i style={{ background: "var(--track)" }} /> <span>Other 4</span>{" "}
                            <strong className="tnum">{(100 - holdings.slice(0, 3).reduce((s, h) => s + h.weight, 0)).toFixed(1)}%</strong>
                          </div>
                        </div>
                      </div>
                      {holdings.slice(0, 4).map((h) => (
                        <HBar key={h.id} label={h.ticker} pct={h.weight} value={gbp(h.valueGbp)} color={h.color} />
                      ))}
                    </>
                  )}
                  {allocView === "Region" && REGIONS.map((r) => <HBar key={r.label} label={r.label} pct={r.pct} value={gbp(r.value)} color={r.color} />)}
                  {allocView === "Sector" &&
                    SECTORS.slice(0, 5).map((s) => <HBar key={s.label} label={s.label} pct={s.pct} color={s.color} />)}
                  {allocView === "Type" && (
                    <>
                      <HBar label="Direct equities" pct={50.6} value={gbp(18846)} color="#0f766e" />
                      <HBar label="US ETF (VOO)" pct={21.1} value={gbp(7860)} color="#2f5af6" />
                      <HBar label="Active fund" pct={17.8} value={gbp(6615)} color="#7c3aed" />
                      <HBar label="Gold ETC" pct={10.6} value={gbp(3950)} color="#b45309" />
                    </>
                  )}
                  <button className="xray-link btn-ghost btn" style={{ width: "100%", textAlign: "left" }} onClick={() => setTab("X-Ray")}>
                    <span>
                      <strong>Funds hide true exposure →</strong>
                      <span>VOO + BG Discovery hold 580 stocks. See through them.</span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </section>

              <section className="card holdings-card">
                <div className="holdings-head">
                  <div>
                    <h2>Holdings</h2>
                    <p>Sorted by value · Click a row for cost, notes and actions</p>
                  </div>
                  <div className="table-tools">
                    <div className="search-inline">
                      <Search size={14} />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter holdings…" />
                    </div>
                    <button className="btn btn-ghost" style={{ height: 34 }} onClick={() => showToast("Names are already clean — no refresh needed.")}>
                      Refresh
                    </button>
                  </div>
                </div>
                <table className="htab">
                  <thead>
                    <tr>
                      <th>Holding</th>
                      <th className="num">Price</th>
                      <th className="num">Position</th>
                      <th className="num">Value</th>
                      <th className="num">Gain</th>
                      <th className="num">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((h) => (
                      <Fragment key={h.id}>
                        <tr
                          className={expanded === h.id ? "expanded" : ""}
                          onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <div className="holding-cell">
                              <div className="lettermark" style={{ background: h.color }}>
                                {h.ticker.slice(0, h.ticker.length > 3 ? 2 : 4)}
                              </div>
                              <div>
                                <strong>{h.name}</strong>
                                <div className="sub">
                                  <span className="ticker-chip">{h.ticker}</span>
                                  <span>{h.exchange}</span>
                                  <span className="type-chip">{h.type}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="num">
                            <div className="price-cell">
                              <strong className="tnum">
                                {ccy(h.price, h.priceCcy)}
                                <span className="ccy">{h.priceCcy}</span>
                              </strong>
                              <span className={`day ${h.dayPct >= 0 ? "up" : "down"}`}>{pct(h.dayPct)} today</span>
                            </div>
                          </td>
                          <td className="num">
                            <div className="pos-cell">
                              <strong>
                                {h.qty} × {ccy(h.avgCost, h.avgCcy)}
                              </strong>
                              {gbp(h.costGbp)} cost
                            </div>
                          </td>
                          <td className="num">
                            <strong className="tnum" style={{ fontSize: 14 }}>
                              {gbp(h.valueGbp)}
                            </strong>
                          </td>
                          <td className="num">
                            <span className={`gain-pill ${h.gainGbp >= 0 ? "g-up" : "g-down"}`}>
                              <strong>{gbp(h.gainGbp, { sign: true })}</strong>
                              <span>{pct(h.gainPct, 1)}</span>
                            </span>
                          </td>
                          <td className="num">
                            <WeightBar pct={h.weight} color={h.color} />
                          </td>
                        </tr>
                        {expanded === h.id && (
                          <tr key={`${h.id}-x`} className="row-expand">
                            <td colSpan={6}>
                              <div className="expand-box">
                                <div className="eb">
                                  <span>Why it&apos;s held</span>
                                  <p>{h.note}</p>
                                </div>
                                <div className="eb">
                                  <span>Detail</span>
                                  <p>
                                    <strong>{h.sector}</strong> · {h.region} · Day {gbp(h.dayGbp, { sign: true })} (
                                    {pct(h.dayPct)})
                                  </p>
                                </div>
                                <div className="eb">
                                  <span>Actions</span>
                                  <p style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                    <button
                                      className="btn"
                                      style={{ height: 32, fontSize: 12 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        showToast(`Trade ticket for ${h.ticker} opened.`);
                                      }}
                                    >
                                      Trade
                                    </button>
                                    <button
                                      className="btn btn-ghost"
                                      style={{ height: 32, fontSize: 12 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTab("X-Ray");
                                      }}
                                    >
                                      See in X-Ray
                                    </button>
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
                <div className="table-foot">
                  <span>Prices delayed 15 min · US holdings converted at £/$ {num(FX_GBPUSD, 4)} · Gain after FX</span>
                  <span className="tnum">
                    {filtered.length} of {holdings.length} · {gbp(holdings.reduce((s, h) => s + h.valueGbp, 0))} invested
                  </span>
                </div>
              </section>

              <div className="design-note">
                <Info size={16} style={{ flex: "0 0 auto", marginTop: 1 }} />
                <span>
                  <strong style={{ color: "var(--ink)" }}>What changed vs your screenshots, and why:</strong> sentence-case sans
                  replaces all-mono shouting · one hero number replaces four equal boxes (your Total = Invested duplication is gone) ·
                  blue value-line replaces alarming red (red is now only for losses) · human dates replace 2026-06-23 · allocation bars
                  replace the 2-slice donut that wasted 40% of the row · holdings collapse 7 numeric columns into 4 scannable groups with
                  currency badges and FX note.
                </span>
              </div>
            </>
          )}

          {tab === "X-Ray" && (
            <>
              <div className="insight-banner">
                <div className="ib-icon">
                  <Zap size={18} />
                </div>
                <div>
                  <strong>You own more US mega-cap tech than it looks — 52.6% true US, not 34%</strong>
                  <p>
                    VOO quietly adds 6.9% Microsoft, 4.6% Apple and 3.9% Nvidia on top of your direct stocks. Your “diversified” 7
                    holdings behave like ~60% US large-cap growth.
                  </p>
                </div>
              </div>
              <section className="grid-2">
                <div className="card panel">
                  <div className="panel-title">True geography (look-through)</div>
                  <div className="panel-sub">Funds unwrapped to where revenue actually lives</div>
                  <div style={{ marginTop: 14 }}>
                    {REGIONS.map((r) => (
                      <HBar key={r.label} label={r.label} pct={r.pct} value={gbp(r.value)} color={r.color} />
                    ))}
                  </div>
                  <div className="flag ok">
                    <Check size={15} /> US overweight is intentional — you benchmark to global equities and accept the tilt.
                  </div>
                </div>
                <div className="card panel">
                  <div className="panel-title">True sectors (look-through)</div>
                  <div className="panel-sub">Technology is a third of every pound</div>
                  <div style={{ marginTop: 14 }}>
                    {SECTORS.map((s) => (
                      <HBar key={s.label} label={s.label} pct={s.pct} color={s.color} />
                    ))}
                  </div>
                  <div className="flag warn">
                    <Info size={15} /> Tech 33.6% + rates-sensitive growth 14.8% = near half the book moves together.
                  </div>
                </div>
              </section>
              <section className="grid-2">
                <div className="card panel">
                  <div className="panel-title">Top underlying exposures</div>
                  <div className="panel-sub">Direct + via VOO / BG Discovery combined</div>
                  <div style={{ marginTop: 8 }}>
                    {LOOKTHROUGH.map((l) => (
                      <div className="look-row" key={l.label}>
                        <i style={{ background: l.color }} />
                        <div className="ll">
                          <strong>{l.label}</strong>
                          <span>{l.detail}</span>
                        </div>
                        <strong className="pct tnum">{l.pct.toFixed(1)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card panel">
                  <div className="panel-title">Fund X-Ray</div>
                  <div className="panel-sub">What your two pooled vehicles actually hold</div>
                  <div className="kv">
                    <span>VOO · 503 stocks · 0.03% fee</span>
                    <strong>Top 10 = 34% of VOO</strong>
                  </div>
                  <div className="kv">
                    <span>BG Discovery · ~78 stocks · 0.72% fee</span>
                    <strong>Top 10 = 22% of fund</strong>
                  </div>
                  <div className="kv">
                    <span>Overlap VOO ∩ BG Discovery</span>
                    <strong>~6 stocks · negligible</strong>
                  </div>
                  <div className="kv">
                    <span>Overlap direct ∩ funds</span>
                    <strong>MSFT counted twice</strong>
                  </div>
                  <div className="panel-title" style={{ marginTop: 16 }}>
                    Concentration checks
                  </div>
                  <div className="kv">
                    <span>Largest single name · ASML</span>
                    <strong className="tnum">17.1% look-through</strong>
                  </div>
                  <div className="kv">
                    <span>Top 3 names</span>
                    <strong className="tnum">35.4%</strong>
                  </div>
                  <div className="kv">
                    <span>USD currency exposure</span>
                    <strong className="tnum">≈ 62%</strong>
                  </div>
                  <div className="flag warn">
                    <Info size={15} /> Single-stock guardrail is 20% — ASML is close. Rebuild trims it to 13.4%.
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === "Performance" && (
            <>
              <section className="perf-stats">
                <div className="card pstat">
                  <span>Total return</span>
                  <strong className="up">+56.8%</strong>
                  <small className="tnum">{gbp(13507, { sign: true })} on {gbp(23764)} in</small>
                </div>
                <div className="card pstat">
                  <span>Annualised · 6.2y</span>
                  <strong>+7.5%</strong>
                  <small>Time-weighted · dividends reinvested</small>
                </div>
                <div className="card pstat">
                  <span>Best 12 months</span>
                  <strong className="up">+18.4%</strong>
                  <small>To Nov 2025 · ASML + VOO drove it</small>
                </div>
                <div className="card pstat">
                  <span>Max drawdown</span>
                  <strong className="down">−8.2%</strong>
                  <small>Jul → Aug 2026 · recovered in 5 weeks</small>
                </div>
              </section>
              <section className="grid-2">
                <div className="card panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-title">Return vs benchmark</div>
                      <div className="panel-sub">Cumulative growth of £10,000</div>
                    </div>
                    <div className="seg">
                      {(["1Y", "3Y", "MAX"] as Range[]).map((r) => (
                        <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <PerformanceChart data={history} mode="return" showBenchmark={true} />
                  <div className="chart-note">
                    <Info size={13} /> You +56.8% · FTSE All-World +38.2% · S&P 500 +51.6% over the same span.
                  </div>
                </div>
                <div className="card panel">
                  <div className="panel-title">Who earned it</div>
                  <div className="panel-sub">Contribution to the £13,507 gain</div>
                  <div style={{ marginTop: 10 }}>
                    {[...holdings]
                      .sort((a, b) => b.gainGbp - a.gainGbp)
                      .map((h) => (
                        <div className="contrib-row" key={h.id}>
                          <span>
                            <strong>{h.ticker}</strong> <span style={{ color: "var(--muted)" }}>· {pct(h.gainPct, 1)}</span>
                          </span>
                          <div className="contrib-track">
                            <div
                              className="contrib-fill"
                              style={{ width: `${(h.gainGbp / 13507) * 100 * 2.4}%`, background: h.color }}
                            />
                          </div>
                          <strong className="tnum" style={{ textAlign: "right" }}>
                            {gbp(h.gainGbp, { sign: true })}
                          </strong>
                        </div>
                      ))}
                  </div>
                  <div className="chart-note">
                    <Info size={13} /> ASML alone is 27% of lifetime gain from 11% of lifetime cost — concentration paid, so far.
                  </div>
                </div>
              </section>
              <section className="card panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">Monthly returns</div>
                    <div className="panel-sub">Green months pay for red ones — 26 of 33 positive</div>
                  </div>
                </div>
                <div className="heatmap-wrap">
                  <div className="heatmap">
                    <div className="hm-row" style={{ color: "var(--faint)", fontSize: 10 }}>
                      <span />
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <span key={m} style={{ textAlign: "center" }}>
                          {m}
                        </span>
                      ))}
                    </div>
                    {MONTHLY.map((row, ri) => (
                      <div className="hm-row" key={ri}>
                        <span className="yr">{row[0].m}</span>
                        {row.slice(1).map((c, ci) => {
                          if (c.v == null) return <span key={ci} className="hm-cell empty">—</span>;
                          const cls = c.v >= 2 ? "pos-3" : c.v >= 0.8 ? "pos-2" : c.v >= 0 ? "pos-1" : c.v >= -1 ? "neg-1" : "neg-2";
                          return (
                            <span key={ci} className={`hm-cell ${cls}`}>
                              {c.v > 0 ? "+" : ""}
                              {c.v.toFixed(1)}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === "Analysis" && (
            <section className="analysis-grid">
              <div className="card panel">
                <div className="panel-title">What&apos;s driving the return</div>
                <div className="panel-sub">Ranked by contribution to gain · last 12 months in brackets</div>
                <div style={{ marginTop: 12 }}>
                  {[...holdings]
                    .sort((a, b) => b.gainGbp - a.gainGbp)
                    .map((h, i) => (
                      <div
                        key={h.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "34px 1fr auto",
                          gap: 10,
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom: i === holdings.length - 1 ? 0 : "1px solid var(--border)",
                        }}
                      >
                        <div className="lettermark" style={{ background: h.color, width: 32, height: 32, fontSize: 11 }}>
                          {h.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <strong style={{ fontSize: 13 }}>{h.name}</strong>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
                            {h.weight.toFixed(1)}% weight · {pct(h.gainPct, 1)} lifetime
                          </div>
                          <div className="contrib-track" style={{ marginTop: 6 }}>
                            <div
                              className="contrib-fill"
                              style={{ width: `${Math.min(100, (h.gainGbp / 3584) * 100)}%`, background: h.color }}
                            />
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong className="tnum up">{gbp(h.gainGbp, { sign: true })}</strong>
                          <div>
                            <Spark points={[3, 5, 4, 7, 6, 9, 8, 11]} up={h.dayPct >= 0} />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
                <div className="card panel">
                  <div className="panel-title">Risk snapshot</div>
                  <div className="panel-sub">Medium-high growth · equity-only</div>
                  <div className="risk-meter">
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Cautious</span>
                    <div className="rm-track">
                      <i style={{ width: "68%", background: "linear-gradient(90deg,#34d399,#f59e0b,#ef4444)" }} />
                    </div>
                    <strong style={{ fontSize: 12 }}>6.8/10</strong>
                  </div>
                  <div className="kv">
                    <span>Volatility (1y)</span>
                    <strong>14.2%</strong>
                  </div>
                  <div className="kv">
                    <span>Sharpe ratio</span>
                    <strong>0.62</strong>
                  </div>
                  <div className="kv">
                    <span>Beta vs world</span>
                    <strong>1.08</strong>
                  </div>
                  <div className="kv">
                    <span>Dividend yield</span>
                    <strong className="tnum">1.1% · ~£412/y</strong>
                  </div>
                </div>
                <div className="card panel">
                  <div className="panel-title">Watch list</div>
                  <div className="flag warn">
                    <Info size={15} /> ASML at 16.8% — a 20% chip downturn costs ~£1,250. Trim is proposed in Rebuild.
                  </div>
                  <div className="flag warn">
                    <Globe size={15} /> 62% in USD — a 10% sterling rally shaves ~£2,300 off headline value.
                  </div>
                  <div className="flag ok">
                    <Check size={15} /> No single fund gate risk · all holdings daily-dealing · no leverage.
                  </div>
                </div>
              </div>
            </section>
          )}

          {tab === "Allocate" && (
            <section className="alloc-sim">
              <div className="card panel">
                <div className="panel-title">Targets vs reality</div>
                <div className="panel-sub">Black marker is target · bar is actual</div>
                <div style={{ marginTop: 12 }}>
                  {TARGETS.map((t) => (
                    <div className="target-row" key={t.label}>
                      <span>{t.label}</span>
                      <div className="target-bar">
                        <div className="actual" style={{ width: `${(t.actual / 50) * 100}%`, background: t.color }} />
                        <div className="marker" style={{ left: `${(t.target / 50) * 100}%` }} />
                      </div>
                      <strong className="tnum">
                        {t.actual.toFixed(1)}% <span style={{ color: "var(--faint)", fontWeight: 500 }}>/ {t.target}%</span>
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="flag warn">
                  <Target size={15} /> Biggest gap: global core 21.1% vs 45% target (−23.9pp). Every new pound should lean there until
                  the gap halves.
                </div>
              </div>
              <div className="card panel">
                <div className="panel-title">Where should new money go?</div>
                <div className="panel-sub">Pick an amount — we split it by largest gaps first</div>
                <div className="amount-btns">
                  {[1000, 2500, 5000, 10000].map((a) => (
                    <button key={a} className={investAmount === a ? "on" : ""} onClick={() => setInvestAmount(a)}>
                      {gbp(a)}
                    </button>
                  ))}
                </div>
                <div className="sim-result">
                  {sim
                    .filter((s) => s.amount > 0)
                    .sort((a, b) => b.amount - a.amount)
                    .map((s) => (
                      <div className="sim-row" key={s.label}>
                        <i style={{ background: s.color }} />
                        <span>{s.label}</span>
                        <strong>{gbp(s.amount)}</strong>
                      </div>
                    ))}
                </div>
                <div className="chart-note">
                  <Info size={13} /> {gbp(investAmount)} closes ~{(investAmount / 37271) * 100 < 10 ? ((investAmount / 37271) * 100).toFixed(1) : "9+"}% of the
                  total gap without selling anything. Rebuild handles the rest via trims.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => showToast(`Plan saved — ${gbp(investAmount)} split across ${sim.filter((s) => s.amount > 0).length} buckets.`)}>
                    Save this split
                  </button>
                  <button className="btn" onClick={() => setTab("Rebuild")}>
                    Compare to Rebuild <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === "Rebuild" && (
            <section className="rebuild-grid">
              <div className="card panel">
                <div className="panel-title">Proposed adjustment</div>
                <div className="panel-sub">Small, reversible · 2 trades + a cash buffer · ~£8 dealing costs</div>
                <div className="before-after">
                  <div className="ba-col">
                    <h4>Before</h4>
                    <div className="ba-row">
                      <span>ASML</span>
                      <strong>16.8%</strong>
                    </div>
                    <div className="ba-row">
                      <span>Global core</span>
                      <strong>21.1%</strong>
                    </div>
                    <div className="ba-row">
                      <span>Cash</span>
                      <strong>0%</strong>
                    </div>
                    <div className="ba-row">
                      <span>US exposure</span>
                      <strong>52.6%</strong>
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--faint)" />
                  <div className="ba-col" style={{ borderColor: "var(--gain)", background: "var(--gain-soft)" }}>
                    <h4>After</h4>
                    <div className="ba-row">
                      <span>ASML</span>
                      <strong>13.4%</strong>
                    </div>
                    <div className="ba-row">
                      <span>Global core</span>
                      <strong>27.5%</strong>
                    </div>
                    <div className="ba-row">
                      <span>Cash</span>
                      <strong>5.0%</strong>
                    </div>
                    <div className="ba-row">
                      <span>US exposure</span>
                      <strong>49.1%</strong>
                    </div>
                  </div>
                </div>
                <div className="kv">
                  <span>Concentration risk</span>
                  <strong className="up">−18% single-name risk</strong>
                </div>
                <div className="kv">
                  <span>Expected volatility</span>
                  <strong>14.2% → 13.4%</strong>
                </div>
                <div className="kv">
                  <span>Yield</span>
                  <strong>1.1% → 1.3%</strong>
                </div>
                <div className="insight-banner" style={{ margin: "12px 0 0" }}>
                  <div className="ib-icon">
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <strong>Why now?</strong>
                    <p>
                      ASML is up 133% and near your 20% guardrail. Banking a third of the gain into the underweight core restores
                      balance without a view on chips.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                {PROPOSED_TRADES.map((t, i) => (
                  <div className="trade-card" key={i}>
                    <div className="th">
                      <span className={`action-chip ${t.action.toLowerCase()}`}>{t.action}</span>
                      <strong style={{ fontSize: 13 }}>{t.holding}</strong>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 650 }}>{t.detail}</div>
                    <p>{t.why}</p>
                    <span className="impact">{t.impact}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => showToast("Plan approved — draft trades saved for review.")}>
                    <Check size={16} /> Approve plan
                  </button>
                  <button className="btn" onClick={() => showToast("Editing mode — drag the After weights (demo).")}>
                    Edit
                  </button>
                </div>
                <div className="chart-note">
                  <Info size={13} /> Not advice. Check bed-and-breakfasting, US withholding tax and dealing spreads before trading.
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {modal && (
        <div className="modal-back" onMouseDown={() => setModal(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="icon-btn modal-x" onClick={() => setModal(null)} aria-label="Close">
              <X size={16} />
            </button>
            {modal === "add" ? (
              <>
                <h2>Add a holding</h2>
                <p>It joins the table instantly. Prices attach on the next refresh.</p>
                <div className="field">
                  <label>Ticker or name</label>
                  <input value={newTicker} onChange={(e) => setNewTicker(e.target.value)} placeholder="e.g. VUSA, REL, SGLN" />
                </div>
                <div className="field">
                  <label>Quantity</label>
                  <input value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="e.g. 25" inputMode="decimal" />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveHolding}>
                    Add holding
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Edit cash</h2>
                <p>Cash is currently {gbp(cash)}. Your target buffer is 5% (~{gbp(1864)}).</p>
                <div className="field">
                  <label>Cash balance (£)</label>
                  <input value={cashInput} onChange={(e) => setCashInput(e.target.value)} inputMode="decimal" />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveCash}>
                    Save cash
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={16} /> {toast}
        </div>
      )}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 25 }}
        />
      )}
    </div>
  );
}
