// Mock portfolio data for Meridian

export interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  assetClass: 'Equity' | 'ETF' | 'Bond' | 'Crypto' | 'Cash';
  sector: string;
  inceptionDate: string;
}

export interface PerformancePoint {
  date: string;
  value: number;
  label?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Buy' | 'Sell' | 'Dividend' | 'Deposit' | 'Withdrawal';
  ticker: string;
  quantity?: number;
  price: number;
  total: number;
  fee?: number;
}

export interface PortfolioData {
  cash: number;
  cashCurrency: string;
  holdings: Holding[];
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  performanceHistory: PerformancePoint[];
  transactions: Transaction[];
  assetAllocation: { assetClass: string; value: number; percent: number }[];
  sectorAllocation: { sector: string; value: number; percent: number }[];
  inceptionDate: string;
}

// Generate realistic performance history (1 year of daily data)
function generatePerformanceHistory(startValue: number, volatility: number, trend: number): PerformancePoint[] {
  const points: PerformancePoint[] = [];
  const startDate = new Date('2025-02-15');
  let value = startValue;
  const days = 252; // ~1 year of trading days

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Random walk with drift
    const dailyReturn = (Math.random() - 0.48) * volatility + trend / days;
    value = value * (1 + dailyReturn);

    // Add some notable events
    if (i === 50) value *= 0.97; // Minor dip
    if (i === 120) value *= 1.03; // Rally
    if (i === 180) value *= 0.98; // Correction
    if (i === 220) value *= 1.02; // Recovery

    points.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }

  return points;
}

// Current date for "today" reference


export const portfolioData: PortfolioData = {
  cash: 47832.50,
  cashCurrency: 'USD',
  holdings: [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      quantity: 125,
      averageCost: 48.32,
      currentPrice: 138.71,
      value: 17338.75,
      pnl: 11271.08,
      pnlPercent: 187.0,
      dayChange: 2.45,
      dayChangePercent: 1.80,
      assetClass: 'Equity',
      sector: 'Technology',
      inceptionDate: '2023-03-15',
    },
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      quantity: 85,
      averageCost: 162.45,
      currentPrice: 178.52,
      value: 15174.20,
      pnl: 1373.73,
      pnlPercent: 9.9,
      dayChange: -1.23,
      dayChangePercent: -0.69,
      assetClass: 'Equity',
      sector: 'Technology',
      inceptionDate: '2024-01-22',
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      quantity: 42,
      averageCost: 348.20,
      currentPrice: 421.85,
      value: 17517.70,
      pnl: 3088.70,
      pnlPercent: 21.1,
      dayChange: 4.12,
      dayChangePercent: 0.99,
      assetClass: 'Equity',
      sector: 'Technology',
      inceptionDate: '2024-06-10',
    },
    {
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      quantity: 60,
      averageCost: 138.90,
      currentPrice: 189.44,
      value: 11366.40,
      pnl: 3032.40,
      pnlPercent: 36.4,
      dayChange: 1.88,
      dayChangePercent: 1.00,
      assetClass: 'Equity',
      sector: 'Technology',
      inceptionDate: '2024-09-05',
    },
    {
      ticker: 'AMZN',
      name: 'Amazon.com, Inc.',
      quantity: 55,
      averageCost: 176.50,
      currentPrice: 241.75,
      value: 13296.25,
      pnl: 3588.75,
      pnlPercent: 36.9,
      dayChange: 3.25,
      dayChangePercent: 1.37,
      assetClass: 'Equity',
      sector: 'Consumer Cyclical',
      inceptionDate: '2024-11-18',
    },
    {
      ticker: 'VTI',
      name: 'Vanguard Total Stock Market ETF',
      quantity: 40,
      averageCost: 245.30,
      currentPrice: 274.82,
      value: 10992.80,
      pnl: 1180.80,
      pnlPercent: 12.0,
      dayChange: 0.72,
      dayChangePercent: 0.26,
      assetClass: 'ETF',
      sector: 'Diversifed',
      inceptionDate: '2024-04-20',
    },
    {
      ticker: 'BTC',
      name: 'Bitcoin',
      quantity: 0.38,
      averageCost: 42000,
      currentPrice: 67450,
      value: 25631.00,
      pnl: 9601.00,
      pnlPercent: 59.6,
      dayChange: 1245.50,
      dayChangePercent: 1.87,
      assetClass: 'Crypto',
      sector: 'Cryptocurrency',
      inceptionDate: '2024-02-28',
    },
    {
      ticker: 'JPM',
      name: 'JPMorgan Chase & Co.',
      quantity: 35,
      averageCost: 172.40,
      currentPrice: 208.90,
      value: 7311.50,
      pnl: 1282.50,
      pnlPercent: 21.2,
      dayChange: -0.55,
      dayChangePercent: -0.26,
      assetClass: 'Equity',
      sector: 'Financial',
      inceptionDate: '2025-01-12',
    },
    {
      ticker: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      quantity: 20,
      averageCost: 485.60,
      currentPrice: 541.28,
      value: 10825.60,
      pnl: 1113.60,
      pnlPercent: 11.5,
      dayChange: 0.58,
      dayChangePercent: 0.11,
      assetClass: 'ETF',
      sector: 'Diversifed',
      inceptionDate: '2025-03-22',
    },
    {
      ticker: 'NFLX',
      name: 'Netflix, Inc.',
      quantity: 25,
      averageCost: 625.80,
      currentPrice: 785.40,
      value: 19635.00,
      pnl: 4015.00,
      pnlPercent: 25.5,
      dayChange: 5.60,
      dayChangePercent: 0.72,
      assetClass: 'Equity',
      sector: 'Technology',
      inceptionDate: '2025-05-15',
    },
  ],
  totalValue: 139694.20,
  totalCost: 95987.45,
  totalPnl: 43706.75,
  totalPnlPercent: 45.5,
  dailyChange: 14502.80,
  dailyChangePercent: 0.12,
  performanceHistory: generatePerformanceHistory(95987, 0.012, 0.25),
  transactions: [
    { id: 't1', date: '2026-02-18', type: 'Buy', ticker: 'NVDA', quantity: 10, price: 135.20, total: 1352.00, fee: 0 },
    { id: 't2', date: '2026-02-15', type: 'Dividend', ticker: 'AAPL', quantity: undefined, price: 0.25, total: 21.25, fee: 0 },
    { id: 't3', date: '2026-02-10', type: 'Buy', ticker: 'BTC', quantity: 0.05, price: 65200, total: 3260.00, fee: 15 },
    { id: 't4', date: '2026-02-05', type: 'Sell', ticker: 'TSLA', quantity: 15, price: 248.50, total: 3727.50, fee: 0 },
    { id: 't5', date: '2026-01-28', type: 'Deposit', ticker: 'CASH', quantity: undefined, price: 0, total: 10000, fee: 0 },
    { id: 't6', date: '2026-01-20', type: 'Buy', ticker: 'NFLX', quantity: 5, price: 720.40, total: 3602.00, fee: 0 },
    { id: 't7', date: '2026-01-15', type: 'Dividend', ticker: 'MSFT', quantity: undefined, price: 0.80, total: 33.60, fee: 0 },
    { id: 't8', date: '2026-01-08', type: 'Buy', ticker: 'VOO', quantity: 5, price: 525.30, total: 2626.50, fee: 0 },
  ],
  assetAllocation: [
    { assetClass: 'Equity', value: 84239.80, percent: 60.3 },
    { assetClass: 'ETF', value: 21818.40, percent: 15.6 },
    { assetClass: 'Crypto', value: 25631.00, percent: 18.3 },
    { assetClass: 'Cash', value: 47832.50, percent: 34.2 },
  ],
  sectorAllocation: [
    { sector: 'Technology', value: 63532.05, percent: 45.5 },
    { sector: 'Diversifed', value: 21818.40, percent: 15.6 },
    { sector: 'Consumer Cyclical', value: 13296.25, percent: 9.5 },
    { sector: 'Financial', value: 7311.50, percent: 5.2 },
    { sector: 'Cryptocurrency', value: 25631.00, percent: 18.3 },
    { sector: 'Cash', value: 47832.50, percent: 34.2 },
  ],
  inceptionDate: '2023-03-15',
};

// Recalculate percentages to account for cash being counted
// Total invested: sum of holdings only
const investedValue = portfolioData.holdings.reduce((sum, h) => sum + h.value, 0);
const grandTotal = investedValue + portfolioData.cash;

// Update allocation percentages based on grand total
portfolioData.assetAllocation = [
  { assetClass: 'Equity', value: 84239.80, percent: Math.round((84239.80 / grandTotal) * 1000) / 10 },
  { assetClass: 'ETF', value: 21818.40, percent: Math.round((21818.40 / grandTotal) * 1000) / 10 },
  { assetClass: 'Crypto', value: 25631.00, percent: Math.round((25631.00 / grandTotal) * 1000) / 10 },
  { assetClass: 'Cash', value: portfolioData.cash, percent: Math.round((portfolioData.cash / grandTotal) * 1000) / 10 },
];

portfolioData.sectorAllocation = [
  { sector: 'Technology', value: 63532.05, percent: Math.round((63532.05 / grandTotal) * 1000) / 10 },
  { sector: 'Diversifed', value: 21818.40, percent: Math.round((21818.40 / grandTotal) * 1000) / 10 },
  { sector: 'Consumer Cyclical', value: 13296.25, percent: Math.round((13296.25 / grandTotal) * 1000) / 10 },
  { sector: 'Financial', value: 7311.50, percent: Math.round((7311.50 / grandTotal) * 1000) / 10 },
  { sector: 'Cryptocurrency', value: 25631.00, percent: Math.round((25631.00 / grandTotal) * 1000) / 10 },
  { sector: 'Cash', value: portfolioData.cash, percent: Math.round((portfolioData.cash / grandTotal) * 1000) / 10 },
];

export default portfolioData;
