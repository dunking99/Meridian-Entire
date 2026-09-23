/**
 * Yahoo Finance client (unofficial public chart endpoint).
 * Falls back to a deterministic synthetic generator when the network is
 * unavailable so the dashboard always has a usable price archive.
 */

export type Bar = {
  day: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Quote = {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  currency: string;
  name?: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketTime?: number;
  synthetic: boolean;
};

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

/* ------------------------------------------------------------------ */
/* deterministic pseudo-random series (offline fallback)               */
/* ------------------------------------------------------------------ */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_PROFILE: Record<string, { price: number; vol: number; drift: number }> = {
  index: { price: 5200, vol: 0.011, drift: 0.00032 },
  sector: { price: 180, vol: 0.014, drift: 0.00028 },
  equity: { price: 210, vol: 0.022, drift: 0.00045 },
  etf: { price: 110, vol: 0.013, drift: 0.0003 },
  commodity: { price: 2350, vol: 0.016, drift: 0.00018 },
  fx: { price: 1.09, vol: 0.005, drift: 0.00002 },
  crypto: { price: 62000, vol: 0.038, drift: 0.0009 },
  bond: { price: 98, vol: 0.006, drift: 0.00008 },
  cash: { price: 1, vol: 0, drift: 0 },
};

export function syntheticBars(seedKey: string, days: number, assetClass = "equity"): Bar[] {
  const rnd = mulberry32(hash(seedKey));
  const profile = BASE_PROFILE[assetClass] ?? BASE_PROFILE.equity;
  const bars: Bar[] = [];
  let price = profile.price * (0.55 + rnd() * 0.5);
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const shock = (rnd() - 0.5) * 2 * profile.vol;
    price = Math.max(0.01, price * (1 + profile.drift + shock));
    const open = price * (1 + (rnd() - 0.5) * 0.004);
    const close = price;
    const high = Math.max(open, close) * (1 + rnd() * 0.006);
    const low = Math.min(open, close) * (1 - rnd() * 0.006);
    bars.push({
      day: d.toISOString().slice(0, 10),
      open: +(open).toFixed(4),
      high: +(high).toFixed(4),
      low: +(low).toFixed(4),
      close: +(close).toFixed(4),
      volume: Math.round(1_000_000 + rnd() * 9_000_000),
    });
  }
  return bars;
}

/* ------------------------------------------------------------------ */
/* network                                                             */
/* ------------------------------------------------------------------ */

async function getChart(symbol: string, range: string, interval: string): Promise<any | null> {
  for (const host of HOSTS) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (result) return result;
    } catch {
      /* try next host */
    }
  }
  return null;
}

export async function fetchHistory(symbol: string, range = "5y", assetClass = "equity"): Promise<{ bars: Bar[]; meta: any; synthetic: boolean }> {
  const interval = range === "1d" || range === "5d" ? "30m" : "1d";
  const result = await getChart(symbol, range, interval);
  if (result?.timestamp?.length) {
    const q = result.indicators?.quote?.[0] ?? {};
    const adj = result.indicators?.adjclose?.[0]?.adjclose as number[] | undefined;
    const bars: Bar[] = [];
    for (let i = 0; i < result.timestamp.length; i++) {
      const close = adj?.[i] ?? q.close?.[i];
      if (close == null) continue;
      const open = q.open?.[i] ?? close;
      const high = q.high?.[i] ?? close;
      const low = q.low?.[i] ?? close;
      const ts = new Date(result.timestamp[i] * 1000).toISOString().slice(0, 10);
      bars.push({
        day: ts,
        open: Number(open) || Number(close),
        high: Number(high) || Number(close),
        low: Number(low) || Number(close),
        close: Number(close),
        volume: Number(q.volume?.[i] ?? 0),
      });
    }
    if (bars.length) return { bars, meta: result.meta ?? {}, synthetic: false };
  }
  const days = rangeToDays(range);
  return { bars: syntheticBars(symbol, days, assetClass), meta: {}, synthetic: true };
}

function rangeToDays(range: string): number {
  const n = parseInt(range, 10);
  if (Number.isNaN(n)) return 1300;
  if (range.endsWith("y")) return n * 365;
  if (range.endsWith("mo")) return n * 30;
  if (range.endsWith("d")) return n;
  return 1300;
}

export async function fetchQuote(symbol: string, assetClass = "equity"): Promise<Quote> {
  const { bars, meta, synthetic } = await fetchHistory(symbol, "6mo", assetClass);
  if (!bars.length) {
    return { symbol, price: 0, previousClose: 0, change: 0, changePct: 0, currency: "USD", synthetic: true };
  }
  const price = Number(meta.regularMarketPrice ?? meta.previousClose ?? bars[bars.length - 1].close);
  const previousClose = Number(meta.chartPreviousClose ?? meta.previousClose ?? bars[bars.length - 2]?.close ?? price);
  const change = price - previousClose;
  return {
    symbol,
    price,
    previousClose,
    change,
    changePct: previousClose ? (change / previousClose) * 100 : 0,
    currency: meta.currency ?? "USD",
    name: meta.longName ?? meta.shortName,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    marketTime: meta.regularMarketTime,
    synthetic,
  };
}

export async function fetchQuotes(symbols: { symbol: string; yahooSymbol: string; assetClass: string; name: string }[]): Promise<Quote[]> {
  const out = await Promise.all(
    symbols.map(async (s) => {
      const q = await fetchQuote(s.yahooSymbol, s.assetClass);
      return { ...q, symbol: s.symbol, name: q.name ?? s.name };
    }),
  );
  return out;
}
