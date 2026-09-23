import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { instruments, links, newsItems, theses, type Instrument, type NewsItem } from "@/db/schema";

/**
 * The linking layer. One text-matching engine powers:
 *  - news -> instrument mentions (headline weighted higher than body)
 *  - notes / theses -> instruments (auto-tagging)
 *  - ad-hoc "what does this article touch in my book?" analysis
 *  - relevance tiering against current positions + watchlists
 */

export type MatchBasis = "headline-symbol" | "body-symbol" | "name" | "alias";

export type InstrumentMatch = {
  instrument: Instrument;
  score: number;
  basis: MatchBasis;
  matchedText: string;
};

export type PortfolioContext = Map<number, { marketValue: number; weight: number; symbol: string }>;

const SHORT_SYMBOL_MAX = 3;

function symbolPattern(symbol: string) {
  const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9.])${escaped}([^A-Za-z0-9]|$)`, "g");
}

function nameTokens(name: string) {
  const stop = new Set(["inc", "inc.", "corp", "corp.", "corporation", "company", "co", "co.", "plc", "ltd", "ltd.", "holdings", "group", "the", "trust", "fund", "etf", "class", "shares"]);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 .&-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
}

/** Rank instruments referenced by a chunk of text. */
export function matchInstruments(text: string, universe: Instrument[], headline?: string): InstrumentMatch[] {
  if (!text && !headline) return [];
  const body = text ?? "";
  const head = headline ?? "";
  const out = new Map<number, InstrumentMatch>();

  for (const inst of universe) {
    let score = 0;
    let basis: MatchBasis = "alias";
    let matchedText = inst.symbol;

    const isShort = inst.symbol.length <= SHORT_SYMBOL_MAX && /^[A-Z.]+$/.test(inst.symbol);
    const symbolsToTry = [...new Set([inst.symbol, inst.symbol.replace(".", "")])];

    for (const sym of symbolsToTry) {
      if (isShort) {
        if (symbolPattern(sym).test(head)) {
          score += 6;
          basis = "headline-symbol";
          matchedText = sym;
        } else if (symbolPattern(sym).test(body)) {
          score += 3;
          basis = score > 3 ? basis : "body-symbol";
          matchedText = sym;
        }
      } else {
        const re = new RegExp(`(^|[^A-Za-z0-9.])${sym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9]|$)`, "i");
        if (re.test(head)) {
          score += 6;
          basis = "headline-symbol";
          matchedText = sym;
        } else if (re.test(body)) {
          score += 3;
          basis = score > 3 ? basis : "body-symbol";
          matchedText = sym;
        }
      }
    }

    const lowerBody = body.toLowerCase();
    const lowerHead = head.toLowerCase();
    if (lowerBody.includes(inst.name.toLowerCase()) || lowerHead.includes(inst.name.toLowerCase())) {
      const inHead = lowerHead.includes(inst.name.toLowerCase());
      score += inHead ? 4 : 2;
      if (score <= 2) basis = "name";
      matchedText = inst.name;
    } else {
      for (const token of nameTokens(inst.name)) {
        const inHead = lowerHead.includes(token);
        if (inHead || lowerBody.includes(token)) {
          score += inHead ? 3 : 1;
          if (inHead && score <= 5) {
            basis = "name";
            matchedText = token;
          }
          break;
        }
      }
    }

    for (const alias of (inst.aliases ?? "").split(",").map((a) => a.trim()).filter(Boolean)) {
      if (alias.length < 3) continue;
      const lower = alias.toLowerCase();
      const inHead = lowerHead.includes(lower);
      if (inHead || lowerBody.includes(lower)) {
        score += inHead ? 3 : 2;
        if (score <= 5 && basis !== "headline-symbol") {
          basis = "alias";
          matchedText = alias;
        }
      }
    }

    if (score > 0) out.set(inst.id, { instrument: inst, score, basis, matchedText });
  }

  return [...out.values()].sort((a, b) => b.score - a.score);
}

export type RelevanceTier = "act" | "monitor" | "fyi";

export type NewsRelevance = {
  news: NewsItem;
  mentions: (InstrumentMatch & { weight: number; exposureValue: number; basis: MatchBasis })[];
  heldMentions: number;
  watchMentions: number;
  exposureValue: number;
  exposurePct: number;
  topSector: string | null;
  score: number;
  tier: RelevanceTier;
};

export function tierFor(score: number): RelevanceTier {
  if (score >= 60) return "act";
  if (score >= 30) return "monitor";
  return "fyi";
}

export function rankNews(
  news: NewsItem,
  universe: Instrument[],
  ctx: PortfolioContext,
  watchIds: Set<number>,
): NewsRelevance {
  const matches = matchInstruments(news.summary, universe, news.headline);
  let exposureValue = 0;
  let heldMentions = 0;
  let watchMentions = 0;
  const sectorMap = new Map<string, number>();

  const mentions = matches.map((m) => {
    const pos = ctx.get(m.instrument.id);
    const weight = pos?.weight ?? 0;
    if (pos) {
      exposureValue += pos.marketValue;
      heldMentions += 1;
      const sector = m.instrument.sector ?? "Other";
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + pos.marketValue);
    }
    if (watchIds.has(m.instrument.id)) watchMentions += 1;
    return { ...m, weight, exposureValue: pos?.marketValue ?? 0 };
  });

  const nav = [...ctx.values()].reduce((a, p) => a + p.marketValue, 0) || 1;
  const exposurePct = exposureValue / nav;
  const topMention = mentions[0];
  let score = topMention?.score ?? 0;
  if (heldMentions) score += 14 + 22 * Math.min(1, exposurePct / 0.08);
  if (watchMentions) score += 6;
  if (news.kind === "filing") score += 4;
  if (Math.abs(news.sentiment) > 0.6) score += 4;

  const topSector = [...sectorMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return { news, mentions, heldMentions, watchMentions, exposureValue, exposurePct, topSector, score, tier: tierFor(score) };
}

/** Rebuilds the auto-generated edges for every news item (idempotent). */
export async function rebuildNewsLinks() {
  const [universe, news, allTheses] = await Promise.all([
    db.select().from(instruments),
    db.select().from(newsItems),
    db.select().from(theses),
  ]);

  const rows: { fromKind: string; fromId: number; toKind: string; toId: number; relation: string; weight: number }[] = [];

  for (const item of news) {
    const matches = matchInstruments(item.summary, universe, item.headline);
    for (const m of matches) {
      const inHeadline =
        m.basis === "headline-symbol" || item.headline.toLowerCase().includes(m.matchedText.toLowerCase());
      rows.push({
        fromKind: "news",
        fromId: item.id,
        toKind: "instrument",
        toId: m.instrument.id,
        relation: inHeadline ? "impacts" : "mentions",
        weight: m.score,
      });
    }
    const matchedIds = new Set(matches.map((m) => m.instrument.id));
    for (const t of allTheses) {
      if (t.instrumentId && matchedIds.has(t.instrumentId)) {
        rows.push({ fromKind: "news", fromId: item.id, toKind: "thesis", toId: t.id, relation: "related", weight: 1 });
      }
    }
  }

  await db.delete(links).where(and(eq(links.fromKind, "news"), inArray(links.relation, ["mentions", "impacts", "related"])));
  for (let i = 0; i < rows.length; i += 500) {
    if (rows.slice(i, i + 500).length) await db.insert(links).values(rows.slice(i, i + 500));
  }
  return rows.length;
}

/** Generic text analysis used by the research assistant + note auto-tagging. */
export async function analyseText(text: string, headline?: string) {
  const universe = await db.select().from(instruments);
  const matches = matchInstruments(text, universe, headline);
  return matches;
}
