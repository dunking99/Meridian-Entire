import Link from "next/link";
import { db } from "@/db";
import { accounts, appMeta, links, newsItems, priceBars } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getPortfolio } from "@/lib/portfolio";
import { addAccount, evaluateAlerts, refreshMarketData, rerunEnrichment, resetWorkspace } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { Badge, KV, Panel, Stat, Td, Th } from "@/components/ui";
import { fmtDate, fmtMoney, fmtWhen } from "@/lib/format";

const inputCls = "w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-600";
const labelCls = "mb-1 block text-[10px] font-medium tracking-wider text-slate-500 uppercase";

export default async function SettingsPage() {
  const portfolio = await getPortfolio();
  const [meta, accountRows, counts] = await Promise.all([
    db.select().from(appMeta).orderBy(appMeta.key),
    db.select().from(accounts),
    db
      .select({
        bars: sql<number>`(select count(*) from ${priceBars})`,
        news: sql<number>`(select count(*) from ${newsItems})`,
        edges: sql<number>`(select count(*) from ${links})`,
      })
      .from(appMeta)
      .limit(1),
  ]);
  const stats = counts[0] ?? { bars: 0, news: 0, edges: 0 };
  const metaValue = (key: string) => meta.find((m) => m.key === key)?.value ?? "—";

  const pageMap: { href: string; label: string; what: string }[] = [
    { href: "/", label: "Today", what: "Cross-domain brief: tape ∩ book, action queue, attribution" },
    { href: "/portfolio", label: "Portfolio overview", what: "Positions, allocation, theme concentration, risk budget" },
    { href: "/portfolio/trades", label: "Trade log", what: "Blotter + fill history with rationale, cost basis and journal write-back" },
    { href: "/markets", label: "Markets overview", what: "Sector breadth, macro dashboard, filterable universe" },
    { href: "/markets/screener", label: "Screener", what: "Cross-sectional filters overlaid with holdings and theses" },
    { href: "/markets/calendar", label: "Catalyst calendar", what: "Dated events weighted by exposure" },
    { href: "/markets/[symbol]", label: "Instrument hub", what: "The centre of gravity: quote, position, thesis, news, notes, alerts, fills, related exposure" },
    { href: "/news", label: "News feed", what: "Relevance-ranked tape with scope filters (all / impacting / watch / saved)" },
    { href: "/news/[id]", label: "Story detail", what: "Book impact maths, detected entities, related coverage, actions" },
    { href: "/research", label: "Research cockpit", what: "Thesis register, conviction, review cadence, process debt, relevance engine" },
    { href: "/research/theses/[id]", label: "Thesis detail", what: "Body, invalidation, update timeline, supporting notes, executions" },
    { href: "/research/notes", label: "Notes library", what: "Memos, models, sources, screens — auto-tagged to instruments" },
    { href: "/research/notes/[id]", label: "Note detail", what: "Full note, auto-detected entities, linked theses" },
    { href: "/journal", label: "Journal", what: "Decisions, reviews, observations, mistakes with review dates" },
    { href: "/watchlists", label: "Watchlists", what: "Deferred decisions: reason, trigger price, thesis, fresh coverage" },
    { href: "/alerts", label: "Alerts", what: "Rule book, evaluator, fired-event log" },
    { href: "/search", label: "Search", what: "Global index across every entity type (also ⌘K)" },
    { href: "/settings", label: "Settings", what: "Accounts, data ops, domain map" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings & data ops"
        subtitle="Single-user workspace: accounts, ingestion, the linking engine and the schema map. There is no auth layer by design — the graph is the product."
        breadcrumb={[{ href: "/", label: "Today" }]}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Price bars stored" value={stats.bars.toLocaleString()} sub="synthetic provider feed" />
        <Stat label="News items" value={String(stats.news)} sub="ingested tape" />
        <Stat label="Graph edges" value={String(stats.edges)} sub="typed links between entities" />
        <Stat label="Instruments" value={String(portfolio.book.list.length)} sub={`${portfolio.positions.length} held`} />
        <Stat label="Accounts" value={String(accountRows.length)} sub={fmtMoney(portfolio.totals.cash, { compact: true })} />
        <Stat label="NAV" value={fmtMoney(portfolio.totals.nav, { compact: true })} sub="single-user book" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Data operations" subtitle="Each op is idempotent and revalidates the views it touches">
          <div className="grid gap-2 sm:grid-cols-2">
            <form action={refreshMarketData}>
              <button className="w-full rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-cyan-700">
                Refresh market data
                <span className="mt-0.5 block text-[10px] text-slate-500">regenerate 300 sessions per instrument</span>
              </button>
            </form>
            <form action={rerunEnrichment}>
              <button className="w-full rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-cyan-700">
                Re-run the link engine
                <span className="mt-0.5 block text-[10px] text-slate-500">rebuild news → instrument/thesis edges</span>
              </button>
            </form>
            <form action={evaluateAlerts}>
              <button className="w-full rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-cyan-700">
                Evaluate alert rules
                <span className="mt-0.5 block text-[10px] text-slate-500">append any newly breached rule</span>
              </button>
            </form>
            <form action={resetWorkspace}>
              <button className="w-full rounded border border-slate-700 px-3 py-2 text-xs text-rose-300 hover:border-rose-800">
                Reset & reseed workspace
                <span className="mt-0.5 block text-[10px] text-rose-400/70">truncate and rebuild the demo book</span>
              </button>
            </form>
          </div>
          <div className="mt-3">
            <KV k="Last ingest" v={metaValue("last_ingest_at") !== "—" ? fmtWhen(metaValue("last_ingest_at")) : "—"} />
            <KV k="Last enrichment" v={metaValue("last_enrichment_at") !== "—" ? fmtWhen(metaValue("last_enrichment_at")) : "—"} />
            <KV k="Auto-linked edges" v={metaValue("news_link_count")} />
            <KV k="Seed state" v={metaValue("seed_state")} />
            <KV k="Base currency" v={metaValue("base_currency")} />
            <KV k="Workspace" v={metaValue("owner")} />
          </div>
        </Panel>

        <Panel title="Accounts" subtitle="Sleeves drive allocation, cash and per-account attribution" dense>
          <table className="w-full">
            <thead>
              <tr>
                <Th>Account</Th>
                <Th>Broker</Th>
                <Th>Kind</Th>
                <Th align="right">Cash</Th>
                <Th align="right">Market value</Th>
                <Th align="right">NAV share</Th>
              </tr>
            </thead>
            <tbody>
              {portfolio.accounts.map((a) => (
                <tr key={a.id}>
                  <Td>
                    <span className="text-slate-200">{a.name}</span>
                  </Td>
                  <Td>{a.broker}</Td>
                  <Td>
                    <Badge tone="slate">{a.kind}</Badge>
                  </Td>
                  <Td align="right">{fmtMoney(a.cash, { compact: true })}</Td>
                  <Td align="right">{fmtMoney(a.marketValue, { compact: true })}</Td>
                  <Td align="right">{((a.nav / (portfolio.totals.nav || 1)) * 100).toFixed(1)}%</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <form action={addAccount} className="mt-3 space-y-2 border-t border-slate-800 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Name</label>
                <input name="name" required className={inputCls} placeholder="Taxable Intl" />
              </div>
              <div>
                <label className={labelCls}>Broker</label>
                <input name="broker" className={inputCls} placeholder="IBKR" />
              </div>
              <div>
                <label className={labelCls}>Kind</label>
                <select name="kind" className={inputCls} defaultValue="taxable">
                  {["taxable", "ira", "roth", "crypto", "taxable-intl"].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Cash</label>
                <input name="cash" type="number" step="any" className={inputCls} />
              </div>
            </div>
            <button className="w-full rounded bg-slate-700 px-2 py-1.5 text-xs text-slate-100 hover:bg-slate-600">Add account</button>
          </form>
        </Panel>
      </div>

      <Panel title="Domain map" subtitle="The page list is the architecture: each surface is a view over the same entity graph" dense>
        <table className="w-full">
          <thead>
            <tr>
              <Th>Route</Th>
              <Th>Surface</Th>
              <Th>What it answers</Th>
            </tr>
          </thead>
          <tbody>
            {pageMap.map((p) => (
              <tr key={p.href} className="hover:bg-slate-800/30">
                <Td>
                  <Link href={p.href.replace("[symbol]", "NVDA").replace("[id]", "1")} className="text-[11.5px] text-cyan-300 hover:text-cyan-200">
                    {p.href}
                  </Link>
                </Td>
                <Td>{p.label}</Td>
                <Td>
                  <span className="text-[11.5px] text-slate-400">{p.what}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Data model">
          <KV k="Core spine" v="instruments" />
          <KV k="Portfolio" v="accounts → positions → trades" />
          <KV k="Research" v="theses, notes, journal, screens" />
          <KV k="Tape" v="news_items, catalysts" />
          <KV k="Glue" v="links (typed, directed edges)" />
          <KV k="Time series" v="price_bars, portfolio_snapshots" />
        </Panel>
        <Panel title="Capabilities shipped">
          <KV k="Entity linking" v="symbol/name/alias matcher" />
          <KV k="Relevance scoring" v="match strength × exposure" />
          <KV k="Impact maths" v="exposure, %NAV, sector rollup" />
          <KV k="Risk budget" v="12% name cap, 35% theme cap" />
          <KV k="Cost basis" v="weighted average on every fill" />
          <KV k="Rule evaluator" v="price, move, keyword, staleness" />
        </Panel>
        <Panel title="Deliberate omissions">
          <KV k="Auth / multi-user" v="single-user by design" />
          <KV k="Order routing" v="read-only from brokers" />
          <KV k="Real-time streaming" v="daily bars, on-demand refresh" />
          <KV k="Tax lots / FIFO" v="weighted average only" />
          <KV k="Backtesting" v="journal-of-record instead" />
          <KV k="Options / derivatives" v="cash instruments only" />
          <div className="mt-2 text-[11px] text-slate-500">
            Snapshot generated {fmtDate(new Date())}. Swap the synthetic feed for a vendor key by replacing the provider in market-sim.
          </div>
        </Panel>
      </div>
    </div>
  );
}
