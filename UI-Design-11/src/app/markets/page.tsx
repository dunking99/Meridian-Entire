import { BarChart, Sparkline } from "@/components/charts";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { boardQuotes, type QuoteRow } from "@/lib/market-data";
import { BOARDS, SECTOR_COLORS } from "@/lib/universe";
import { fmtNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const dp = (q: QuoteRow) => (q.assetClass === "fx" ? 4 : q.price > 1000 ? 2 : q.price > 10 ? 2 : 4);

export default async function MarketsPage() {
  const boards = await boardQuotes();
  const byKey = new Map(boards.map((b) => [b.board, b.quotes]));
  const sectorQuotes = [...(byKey.get("sectors") ?? [])].sort((a, b) => b.changePct - a.changePct);

  return (
    <div>
      <PageHeader
        eyebrow="Page 05 · Macro tape"
        title="Markets"
        blurb="Indices, commodities, FX and the S&P 500 sector complex in one pass — the context your portfolio is being priced in."
      />

      {BOARDS.map((board) => {
        const quotes = byKey.get(board.key) ?? [];
        if (!quotes.length) return null;
        const advancers = quotes.filter((q) => q.changePct > 0).length;
        return (
          <Card
            key={board.key}
            title={board.label}
            subtitle={board.blurb}
            className="mb-4"
            right={
              <span className="text-xs text-slate-500">
                <span className="text-emerald-400">{advancers}▲</span> / <span className="text-rose-400">{quotes.length - advancers}▼</span>
              </span>
            }
          >
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {quotes.map((q) => (
                <QuoteTile key={q.symbol} q={q} />
              ))}
            </div>
          </Card>
        );
      })}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Sector performance" subtitle="Today's move across the S&P 500 sector SPDRs">
          {sectorQuotes.length ? (
            <BarChart
              data={sectorQuotes.map((q) => ({ label: q.symbol, value: q.changePct }))}
              height={220}
              color="#6366f1"
              formatValue={(n) => `${n.toFixed(2)}%`}
            />
          ) : (
            <Empty>No sector quotes.</Empty>
          )}
        </Card>

        <Card title="Sector detail" subtitle="Sorted by daily change">
          <div className="grid gap-2 sm:grid-cols-2">
            {sectorQuotes.map((q) => (
              <div key={q.symbol} className="flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: SECTOR_COLORS[q.name.replace(" Select Sector", "")] ?? "#64748b" }} />
                  {q.symbol}
                </span>
                <span className="flex items-center gap-2 text-xs tabular-nums">
                  <span className="text-slate-400">{fmtNumber(q.price, 2)}</span>
                  <span className={q.changePct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {q.changePct >= 0 ? "+" : ""}
                    {q.changePct.toFixed(2)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <p className="mt-4 text-[11px] text-slate-600">
        Quotes are fetched live from Yahoo Finance on each page load; the daily archive behind them is written by the sync job on the Data &amp; Settings page.
      </p>
    </div>
  );
}

function QuoteTile({ q }: { q: QuoteRow }) {
  const up = q.changePct >= 0;
  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
            {q.symbol}
            <Badge tone={q.assetClass === "fx" ? "sky" : q.assetClass === "commodity" ? "amber" : "slate"}>{q.currency}</Badge>
          </p>
          <p className="truncate text-[11px] text-slate-500">{q.name}</p>
        </div>
        {q.synthetic && <Badge tone="violet">model</Badge>}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tabular-nums text-slate-100">{fmtNumber(q.price, dp(q))}</p>
          <p className={`text-[11px] tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>
            {up ? "▲" : "▼"} {Math.abs(q.change).toFixed(dp(q))} ({Math.abs(q.changePct).toFixed(2)}%)
          </p>
        </div>
        <Sparkline data={q.spark.length > 2 ? q.spark : [q.previousClose, q.price]} width={78} height={28} />
      </div>
      {q.fiftyTwoWeekHigh && q.fiftyTwoWeekLow ? (
        <div className="mt-2">
          <div className="h-1 rounded bg-slate-800">
            <div
              className="h-1 rounded bg-indigo-500/70"
              style={{
                width: `${Math.max(2, Math.min(100, ((q.price - q.fiftyTwoWeekLow) / (q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow || 1)) * 100))}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] tabular-nums text-slate-600">
            <span>52w {fmtNumber(q.fiftyTwoWeekLow, dp(q))}</span>
            <span>{fmtNumber(q.fiftyTwoWeekHigh, dp(q))}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
