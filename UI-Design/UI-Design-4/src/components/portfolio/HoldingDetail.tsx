import { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency } from '../../utils/format';

interface HoldingDetailProps {
  ticker: string;
}

// Generate some price history for the holding
function generatePriceHistory(basePrice: number, volatility: number): { date: string; price: number }[] {
  const points: { date: string; price: number }[] = [];
  const start = new Date('2025-02-20');
  let price = basePrice * 0.85; // Start lower to show growth

  for (let i = 0; i < 180; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dailyReturn = (Math.random() - 0.49) * volatility;
    if (Math.random() < 0.01) {
      // Random event
      price *= 1 + (Math.random() - 0.5) * 0.04;
    } else {
      price *= 1 + dailyReturn;
    }

    points.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
    });
  }

  return points.filter((p) => {
    const d = new Date(p.date);
    return d >= new Date('2025-02-20') && d <= new Date('2026-02-20');
  });
}

const HOLDING_COLORS: Record<string, string> = {
  NVDA: '#76b900',
  AAPL: '#555555',
  MSFT: '#00a4ef',
  GOOGL: '#4285f4',
  AMZN: '#ff9900',
  VTI: '#4d789e',
  BTC: '#f7931a',
  JPM: '#005EB8',
  VOO: '#4d789e',
  NFLX: '#E50914',
};

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length || !label) return null;
  const price = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-lg">
      <p className="text-xs text-muted mb-1">{new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      <p className="text-sm font-semibold text-foreground font-mono-nums">{formatCurrency(price)}</p>
    </div>
  );
};

export default function HoldingDetail({ ticker }: HoldingDetailProps) {
  const holding = portfolioData.holdings.find((h) => h.ticker === ticker);
  const [period, setPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');

  if (!holding) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted">
        Holding not found
      </div>
    );
  }

  const priceHistory = useMemo(
    () => generatePriceHistory(holding.currentPrice, 0.02),
    [holding]
  );

  const periodDays: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  const filteredHistory = priceHistory.filter((p) => {
    const date = new Date(p.date);
    const cutoff = new Date('2026-02-20');
    cutoff.setDate(cutoff.getDate() - periodDays[period]);
    return date >= cutoff;
  });

  const costBasis = holding.quantity * holding.averageCost;
  const totalPnL = holding.pnl;
  const unrealizedPnLPercent = holding.pnlPercent;

  return (
    <div className="space-y-6">
      {/* Header with ticker and key info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface"
            style={{ border: `2px solid ${HOLDING_COLORS[ticker] || '#6b7280'}` }}
          >
            <span className="text-xl font-bold text-foreground">{ticker}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{holding.name}</h2>
            <p className="text-sm text-muted">{holding.assetClass} · {holding.sector}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-foreground font-mono-nums">
            {formatCurrency(holding.currentPrice)}
          </p>
          <p
            className={`text-sm font-medium font-mono-nums mt-1 ${
              holding.dayChange >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {holding.dayChange >= 0 ? '+' : ''}{formatCurrency(holding.dayChange)} ({holding.dayChangePercent >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 rounded-xl border border-border bg-panel p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-b border-border pb-4 last:border-0">
          <p className="text-sm text-muted uppercase tracking-wider">Quantity</p>
          <p className="text-xl font-bold text-foreground font-mono-nums mt-1">
            {holding.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
          </p>
        </div>
        <div className="border-b border-border pb-4 last:border-0">
          <p className="text-sm text-muted uppercase tracking-wider">Average Cost</p>
          <p className="text-xl font-bold text-foreground font-mono-nums mt-1">
            {formatCurrency(holding.averageCost)}
          </p>
        </div>
        <div className="border-b border-border pb-4 last:border-0">
          <p className="text-sm text-muted uppercase tracking-wider">Market Value</p>
          <p className="text-xl font-bold text-foreground font-mono-nums mt-1">
            {formatCurrency(holding.value)}
          </p>
        </div>
        <div className="border-b border-border pb-4 last:border-0">
          <p className="text-sm text-muted uppercase tracking-wider">Cost Basis</p>
          <p className="text-xl font-bold text-foreground font-mono-nums mt-1">
            {formatCurrency(costBasis)}
          </p>
        </div>
      </div>

      {/* P&L Card */}
      <div
        className={`rounded-xl border p-5 ${
          totalPnL >= 0
            ? 'bg-positive-muted/10 border-positive/20 glow-green'
            : 'bg-negative-muted/10 border-negative/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted uppercase tracking-wider">Total P&L</p>
            <p
              className={`text-3xl font-bold mt-1 font-mono-nums ${
                totalPnL >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <p
              className={`text-sm font-medium mt-1 ${
                unrealizedPnLPercent >= 0 ? 'text-positive' : 'text-negative'
              }`}
            >
              {unrealizedPnLPercent >= 0 ? '+' : ''}{unrealizedPnLPercent.toFixed(1)}% return
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Since inception</p>
            <p className="text-xs text-muted mt-1">
              {new Date(holding.inceptionDate).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="rounded-xl border border-border bg-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Price History</h3>
          <div className="flex gap-1">
            {(['1M', '3M', '6M', '1Y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  period === p
                    ? 'bg-foreground/10 text-foreground border border-foreground/20'
                    : 'text-muted hover:text-foreground/70 hover:bg-surface'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={HOLDING_COLORS[ticker] || '#6b7280'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={HOLDING_COLORS[ticker] || '#6b7280'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) =>
                  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                stroke="#3a3a52"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#3a3a52"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={HOLDING_COLORS[ticker] || '#6b7280'}
                strokeWidth={2}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 5, fill: HOLDING_COLORS[ticker] || '#6b7280', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holding-specific info */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-panel p-5">
          <h3 className="text-lg font-semibold text-foreground mb-3">Position Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Entry Date</span>
              <span className="text-sm text-foreground">
                {new Date(holding.inceptionDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Inception Price</span>
              <span className="text-sm text-foreground font-mono-nums">
                {formatCurrency(holding.averageCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Current Price</span>
              <span className="text-sm text-foreground font-mono-nums">
                {formatCurrency(holding.currentPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Shares Owned</span>
              <span className="text-sm text-foreground font-mono-nums">
                {holding.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-panel p-5">
          <h3 className="text-lg font-semibold text-foreground mb-3">Related Sector Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Sector</span>
              <span className="text-sm text-foreground">{holding.sector}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Asset Class</span>
              <span className="text-sm text-foreground">{holding.assetClass}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Market Cap Category</span>
              <span className="text-sm text-foreground">
                {ticker === 'NVDA' || ticker === 'MSFT' || ticker === 'GOOGL' ? 'Large Cap' :
                  ticker === 'AMZN' || ticker === 'AAPL' || ticker === 'NFLX' ? 'Large Cap' :
                  ticker === 'BTC' ? 'Cryptocurrency' :
                  'Large/Mid Cap'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
