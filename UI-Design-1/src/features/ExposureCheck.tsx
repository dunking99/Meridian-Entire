import { useMemo, useState } from "react";
import { usePortfolio } from "../state/store";
import { Badge, Card, CardHeader } from "../components/ui";
import { NEWS } from "../data/news";
import { fmtMoney } from "../lib/format";
import { cn } from "../utils/cn";

/**
 * The cross-referencing layer: every story in the news feed is checked against
 * what the portfolio actually owns — including exposure reached through funds.
 */
export function ExposureCheck() {
  const { xray, portfolio: p, openHolding } = usePortfolio();
  const [expanded, setExpanded] = useState(false);

  const matched = useMemo(() => {
    const byCompany = new Map(xray.companies.map((c) => [c.symbol, c]));
    const held = new Set(p.positions.map((x) => x.symbol));
    const posWeight = new Map(p.positions.map((x) => [x.symbol, (x.value / (p.holdingsValue || 1)) * 100]));
    return NEWS.map((n) => {
      const routes = new Map<string, number>();
      let exposure = 0;
      const touched: { symbol: string; weight: number; direct: boolean; via: string[] }[] = [];
      for (const s of n.symbols) {
        const heldDirect = held.has(s);
        const c = byCompany.get(s);
        if (!c && !heldDirect) continue;
        // a company reached through funds uses its look-through weight; a fund you
        // hold outright (index concentration stories, say) uses the position weight
        const w = c?.weight ?? posWeight.get(s) ?? 0;
        exposure += w;
        touched.push({
          symbol: s,
          weight: w,
          direct: heldDirect,
          via: c ? c.sources.map((x) => x.via) : ["Direct"],
        });
        for (const src of c?.sources ?? []) routes.set(src.via, (routes.get(src.via) ?? 0) + src.weight);
      }
      return { news: n, exposure, touched, routes: [...routes.entries()].sort((a, b) => b[1] - a[1]) };
    })
      .filter((m) => m.exposure > 0.05)
      .sort((a, b) => b.exposure * (b.news.impact === "high" ? 2 : 1) - a.exposure * (a.news.impact === "high" ? 2 : 1));
  }, [xray, p.positions]);

  if (!matched.length) return null;
  const shown = matched.slice(0, expanded ? 8 : 3);
  const totalTouched = matched.slice(0, 8).reduce((a, m) => a + m.exposure, 0);

  return (
    <Card>
      <CardHeader
        title="News checked against your book"
        subtitle={`${matched.length} live stories touch exposure you actually hold — directly or through a fund. Ranked by weight behind the story, not by how loud it is.`}
        right={
          <div className="flex items-center gap-2">
            <Badge tone="ai">cross-referenced</Badge>
            <button onClick={() => setExpanded((e) => !e)} className="text-[10px] text-teal-300/80 transition hover:text-teal-200">
              {expanded ? "Show less" : "Show more"}
            </button>
          </div>
        }
      />
      <div className="space-y-2">
        {shown.map((m) => (
          <div key={m.news.id} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 transition hover:border-white/[0.13]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone={m.news.sentiment === "positive" ? "up" : m.news.sentiment === "negative" ? "down" : "neutral"}>{m.news.sentiment}</Badge>
                  {m.news.impact === "high" && <Badge tone="warn">high impact</Badge>}
                  <span className="text-[10px] text-zinc-600">{m.news.source}</span>
                  <span className="text-[10px] text-zinc-700">· {m.news.ago}h ago</span>
                </div>
                <h4 className="text-[12px] leading-snug font-semibold text-zinc-100">{m.news.headline}</h4>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {m.touched.map((t) => (
                    <button
                      key={t.symbol}
                      onClick={() => (t.direct ? openHolding(t.symbol, "updates") : undefined)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] transition",
                        t.direct
                          ? "cursor-pointer border-sky-400/25 bg-sky-400/[0.07] text-sky-200 hover:border-sky-400/50"
                          : "cursor-default border-white/[0.08] bg-white/[0.02] text-zinc-400",
                      )}
                    >
                      <span className="num font-medium">{t.symbol}</span>
                      <span className="num text-zinc-500">{t.weight.toFixed(2)}%</span>
                      {!t.direct && <span className="text-[9px] text-zinc-600">via {t.via.slice(0, 2).join("/")}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="shrink-0 sm:w-[128px] sm:text-right">
                <div className="text-[9.5px] tracking-wider text-zinc-500 uppercase">Exposure touched</div>
                <div
                  className={cn(
                    "num mt-1 text-[19px] leading-none font-semibold",
                    m.exposure > 8 ? "text-amber-300" : m.exposure > 3 ? "text-zinc-100" : "text-zinc-400",
                  )}
                >
                  {m.exposure.toFixed(2)}%
                </div>
                <div className="num mt-1 text-[10px] text-zinc-600">{fmtMoney((m.exposure / 100) * p.holdingsValue, { compact: true })}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2.5 border-t border-white/[0.06] pt-2 text-[10px] leading-relaxed text-zinc-600">
        Combined, the stories above sit behind {totalTouched.toFixed(1)}% of invested value. Exposure is measured look-through, so a story about a
        company you do not hold directly still registers if it sits inside one of your funds.
      </p>
    </Card>
  );
}
