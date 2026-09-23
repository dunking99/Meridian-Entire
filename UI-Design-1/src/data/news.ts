export interface NewsItem {
  id: string;
  symbols: string[];
  source: string;
  headline: string;
  summary: string;
  /** hours ago */
  ago: number;
  sentiment: "positive" | "negative" | "neutral";
  impact: "high" | "medium" | "low";
  /** does this story carry a veto in the rebuild funnel */
  veto?: string;
}

const N = (
  id: string,
  symbols: string[],
  source: string,
  headline: string,
  summary: string,
  ago: number,
  sentiment: NewsItem["sentiment"],
  impact: NewsItem["impact"],
  veto?: string,
): NewsItem => ({ id, symbols, source, headline, summary, ago, sentiment, impact, veto });

export const NEWS: NewsItem[] = [
  N("nw1", ["NVDA", "TSM", "AVGO"], "Reuters", "Foundry lead times stretch again as accelerator orders run into 2027", "Advanced packaging capacity remains the binding constraint. Allocation is being set a year ahead, which favours incumbents with signed wafer agreements and squeezes second-tier buyers.", 3, "positive", "high"),
  N("nw2", ["NVDA"], "Bloomberg", "Custom silicon programmes at two hyperscalers move to volume production", "Internal accelerators are moving from pilot to production for inference workloads. Training demand is unaffected for now, but the mix shift is a medium-term margin question rather than a revenue one.", 9, "negative", "high"),
  N("nw3", ["MSFT"], "FT", "Enterprise AI seat attach rates beat internal targets in Q2", "Copilot attach is reported ahead of plan across large enterprise agreements, with renewals skewing to higher tiers. Consensus had assumed a slower ramp.", 14, "positive", "high"),
  N("nw4", ["AAPL"], "WSJ", "Services growth decelerates for a second consecutive quarter", "Regulatory pressure on app-store economics in two major regions is now visible in the run rate. Hardware replacement cycle assumptions look increasingly stretched.", 26, "negative", "medium"),
  N("nw5", ["AZN", "NOVOB", "LLY"], "Reuters", "Regulator signals faster review pathway for metabolic-disease filings", "A shortened review window would pull forward revenue recognition for several late-stage programmes across the sector.", 31, "positive", "medium"),
  N("nw6", ["SHEL", "BP"], "Bloomberg", "Brent slips below the level assumed in buyback guidance", "Sustained weakness would force a choice between the pace of repurchases and balance-sheet discipline. Management has previously prioritised the buyback.", 40, "negative", "high", "Buyback funding at risk below the assumed oil deck — fails the income-durability screen."),
  N("nw7", ["ASML", "TSM"], "Reuters", "Export-licence framework widened to cover additional tool classes", "The revised framework captures a further set of deposition and metrology tools. Near-term order book is protected by backlog; the 2027 picture is less clear.", 52, "negative", "high", "Regulatory overhang unresolved — deferred pending licence clarity."),
  N("nw8", ["LSEG"], "FT", "Data division signs multi-year distribution agreement", "A long-dated agreement extends the recurring revenue base and reduces the cyclicality argument against the shares.", 61, "positive", "medium"),
  N("nw9", ["TSM"], "Nikkei", "Advanced node capacity expansion brought forward by two quarters", "Capital intensity rises but the pull-forward reflects customer prepayment commitments rather than speculative build.", 74, "positive", "high"),
  N("nw10", ["SMT"], "Investors Chronicle", "Discount narrows to 6.1% after buyback acceleration", "The board has stepped up repurchases. The discount is now inside its three-year average, which removes part of the original entry argument.", 88, "neutral", "medium"),
  N("nw11", ["ARM"], "Bloomberg", "Royalty rate guidance raised on next-generation architecture", "Higher per-unit royalties on the newest architecture are flowing through sooner than modelled, though the installed-base transition remains multi-year.", 95, "positive", "medium"),
  N("nw12", ["IGLT"], "FT", "Gilt curve steepens as issuance schedule is revised upward", "Longer-dated supply pressure has pushed the 10-30y spread wider. Duration-heavy holdings carry more mark-to-market risk than the yield implies.", 110, "negative", "medium"),
  N("nw13", ["SGLN"], "Reuters", "Central-bank gold purchases hit a fourth straight record quarter", "Official-sector demand continues to absorb supply, underpinning the price independently of real-rate moves.", 126, "positive", "medium"),
  N("nw14", ["BRK.B"], "CNBC", "Cash pile reaches a new high as disposals outpace purchases", "The operating businesses remain resilient, but the cash balance implies the manager sees little of value at current prices.", 140, "neutral", "low"),
  N("nw15", ["GOOGL", "META"], "The Information", "Ad-market checks point to a stronger-than-expected quarter", "Channel checks across two large agency groups suggest digital budgets are holding up better than the macro data implies.", 18, "positive", "medium"),
  N("nw16", ["PLTR"], "Barron's", "Valuation multiple now three standard deviations above sector median", "Even bullish revenue scenarios require multiple compression to produce acceptable forward returns.", 47, "negative", "high", "Valuation outside mandate tolerance at entry."),
  N("nw17", ["MC", "RACE"], "Reuters", "Luxury demand in Asia stabilises after four soft quarters", "Sequential improvement is modest but broad-based. Inventory in the channel has normalised.", 66, "positive", "medium"),
  N("nw18", ["VWRP", "CSP1", "EQQQ"], "Morningstar", "Index concentration reaches a post-1970s extreme", "The top ten names now account for an unusually large share of global market capitalisation, which raises the effective single-stock risk inside supposedly diversified funds.", 22, "neutral", "high"),
  N("nw19", ["RR"], "FT", "Civil aerospace flying hours exceed pre-pandemic peak", "Aftermarket revenue is the operative line, and it is compounding faster than the order book implies.", 58, "positive", "medium"),
  N("nw20", ["MRNA"], "Reuters", "Pipeline rationalisation removes three late-stage programmes", "Cash preservation is sensible but the shrinking pipeline undermines the platform argument.", 130, "negative", "high", "Deteriorating fundamentals — excluded at diligence."),
];

export const newsFor = (symbol: string) => NEWS.filter((n) => n.symbols.includes(symbol));
