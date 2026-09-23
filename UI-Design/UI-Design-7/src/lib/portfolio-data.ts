export type Holding = {
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  value: number;
  weight: number;
  day: number;
  returnPct: number;
  pnl: number;
  color: string;
  spark: number[];
};

export const portfolio = {
  value: 428640.82,
  invested: 402150,
  cash: 18420.34,
  dayChange: 1842.16,
  dayPct: 0.43,
  totalReturn: 26490.82,
  returnPct: 8.72,
  benchmarkReturn: 6.14,
  annualised: 9.4,
  annualisedYears: 6.2,
  inception: "Apr 2022",
};

export const ticker = [
  { name: "FTSE 100", value: "8,412.30", change: -0.27 },
  { name: "S&P 500", value: "5,638.94", change: 0.31 },
  { name: "Nasdaq", value: "18,472.57", change: 0.54 },
  { name: "EuroStoxx 50", value: "5,236.20", change: -0.37 },
  { name: "Nikkei 225", value: "39,894.54", change: 0.42 },
  { name: "Gold", value: "$2,424.90", change: 0.57 },
  { name: "Brent", value: "$79.29", change: -0.64 },
  { name: "GBP/USD", value: "1.2793", change: 0.12 },
  { name: "US 10Y", value: "4.21%", change: -0.03 },
  { name: "VIX", value: "14.81", change: -4.08 },
  { name: "BTC", value: "$61,204", change: 1.86 },
];

export const holdings: Holding[] = [
  { symbol: "MSFT", name: "Microsoft", type: "Equity", quantity: 148, price: 428.74, value: 63453.52, weight: 14.8, day: 0.84, returnPct: 24.6, pnl: 12524, color: "#5575c7", spark: [32,35,34,38,40,39,44,43,47,48] },
  { symbol: "VTI", name: "Vanguard Total Stock Market", type: "ETF", quantity: 224.6, price: 272.12, value: 61118.15, weight: 14.3, day: 0.32, returnPct: 13.8, pnl: 7411, color: "#8c6fbd", spark: [31,32,34,33,36,37,39,39,41,43] },
  { symbol: "BRK.B", name: "Berkshire Hathaway", type: "Equity", quantity: 118, price: 438.91, value: 51791.38, weight: 12.1, day: -0.18, returnPct: 18.2, pnl: 7978, color: "#277b72", spark: [28,30,31,34,33,36,37,40,39,41] },
  { symbol: "AVGO", name: "Broadcom", type: "Equity", quantity: 242, price: 176.48, value: 42708.16, weight: 10.0, day: 1.24, returnPct: 31.4, pnl: 10203, color: "#cb7257", spark: [24,25,29,27,32,34,33,38,41,45] },
  { symbol: "VXUS", name: "Vanguard Total Intl Stock", type: "ETF", quantity: 604, price: 62.14, value: 37528.56, weight: 8.8, day: 0.11, returnPct: 5.7, pnl: 2024, color: "#d2a43c", spark: [34,33,35,34,36,35,37,38,37,39] },
  { symbol: "LLY", name: "Eli Lilly", type: "Equity", quantity: 39, price: 784.21, value: 30584.19, weight: 7.1, day: -0.72, returnPct: 42.3, pnl: 9093, color: "#c65a78", spark: [22,25,28,31,30,35,39,42,40,44] },
  { symbol: "BND", name: "Vanguard Total Bond Market", type: "ETF", quantity: 389, price: 72.83, value: 28337.87, weight: 6.6, day: 0.06, returnPct: 1.8, pnl: 501, color: "#6696a6", spark: [36,35,35,34,35,36,35,36,37,37] },
  { symbol: "COST", name: "Costco Wholesale", type: "Equity", quantity: 28, price: 889.31, value: 24900.68, weight: 5.8, day: 0.51, returnPct: 16.9, pnl: 3601, color: "#9b7b57", spark: [29,30,32,31,35,34,37,39,38,41] },
];

export const performance = {
  "1M": [392,395,393,399,402,404,401,407,411,409,414,418,415,421,424,429],
  "3M": [371,376,382,379,388,394,391,401,406,403,412,417,415,422,429],
  "YTD": [354,360,367,363,372,381,388,384,396,402,408,405,416,421,429],
  "1Y": [329,337,343,351,348,362,371,379,375,391,402,397,411,419,429],
  "ALL": [248,262,257,281,294,289,312,328,321,349,367,359,388,405,429],
};

export const benchmark = {
  "1M": [392,394,394,397,399,402,401,404,407,408,410,413,415,418,421],
  "3M": [371,375,378,380,384,389,391,395,399,402,406,409,412,416,421],
  "YTD": [354,358,362,366,371,376,381,386,391,396,400,405,410,416,421],
  "1Y": [329,335,341,347,353,359,365,372,379,386,393,400,406,414,421],
  "ALL": [248,257,268,279,291,304,317,331,345,359,373,387,399,411,421],
};

export const attribution = [
  { label: "Information technology", value: 4.18, note: "MSFT · AVGO · VTI" },
  { label: "Health care", value: 1.32, note: "LLY · VTI" },
  { label: "Financials", value: 0.91, note: "BRK.B · VTI" },
  { label: "Consumer", value: 0.54, note: "COST · VTI" },
  { label: "International equities", value: 0.36, note: "VXUS" },
  { label: "Fixed income", value: -0.21, note: "BND" },
];

export const exposure = [
  { label: "Technology", direct: 24.8, lookthrough: 31.6, color: "#5677c8" },
  { label: "Financials", direct: 12.1, lookthrough: 16.4, color: "#8b6fbd" },
  { label: "Health care", direct: 7.1, lookthrough: 11.2, color: "#c55c7b" },
  { label: "Consumer", direct: 5.8, lookthrough: 10.7, color: "#d29d3e" },
  { label: "Industrials", direct: 0, lookthrough: 7.4, color: "#4b968d" },
  { label: "Other", direct: 27.9, lookthrough: 18.4, color: "#9ba3ad" },
  { label: "Cash", direct: 4.3, lookthrough: 4.3, color: "#d8d4cb" },
];

export const flows = [
  { date: "Jan 03, 2025", type: "Deposit", amount: 12000, account: "Individual ··4812" },
  { date: "Oct 18, 2024", type: "Withdrawal", amount: -3500, account: "Individual ··4812" },
  { date: "Aug 02, 2024", type: "Deposit", amount: 8000, account: "Roth IRA ··9924" },
  { date: "Apr 15, 2024", type: "Deposit", amount: 6500, account: "Roth IRA ··9924" },
  { date: "Jan 05, 2024", type: "Deposit", amount: 10000, account: "Individual ··4812" },
];

export const activities = [
  { date: "Today, 09:42", type: "Dividend", title: "Microsoft", symbol: "MSFT", amount: 124.32, detail: "Cash dividend · $0.84/share" },
  { date: "Yesterday", type: "Buy", title: "Vanguard Total Intl Stock", symbol: "VXUS", amount: -3107.00, detail: "50 shares · $62.14" },
  { date: "May 20", type: "Dividend", title: "Vanguard Total Bond Market", symbol: "BND", amount: 84.77, detail: "Monthly distribution" },
  { date: "May 16", type: "Sell", title: "Apple", symbol: "AAPL", amount: 4682.50, detail: "25 shares · $187.30" },
  { date: "May 14", type: "Buy", title: "Broadcom", symbol: "AVGO", amount: -3529.60, detail: "20 shares · $176.48" },
];

export const proposals = [
  { action: "Buy", symbol: "VXUS", name: "Intl equity", amount: 7200, before: 8.8, after: 10.4, reason: "Close regional underweight" },
  { action: "Buy", symbol: "BND", name: "US aggregate bonds", amount: 4800, before: 6.6, after: 7.6, reason: "Improve downside resilience" },
  { action: "Trim", symbol: "MSFT", name: "Microsoft", amount: 6800, before: 14.8, after: 13.1, reason: "Reduce single-name concentration" },
  { action: "Trim", symbol: "AVGO", name: "Broadcom", amount: 3100, before: 10.0, after: 9.2, reason: "Harvest gains above target band" },
];
