import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency } from '../../utils/format';

const TICKER_COLORS: Record<string, string> = {
  NVDA: '#10b981',
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

export default function ContributionsView() {
  const sortedHoldings = [...portfolioData.holdings].sort((a, b) => b.pnl - a.pnl);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { ticker: string; name: string; pnl: number; pnlPercent: number; value: number } }> }) => {
    if (!active || !payload || !payload.length) return null;
    const entry = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{entry.ticker} - {entry.name}</p>
        <p className="text-xs text-muted mt-0.5">Position Value: {formatCurrency(entry.value)}</p>
        <p className={`text-sm font-semibold mt-1 font-mono-nums ${entry.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
          {entry.pnl >= 0 ? '+' : ''}{formatCurrency(entry.pnl)} P&L
        </p>
        <p className={`text-xs mt-0.5 ${entry.pnlPercent >= 0 ? 'text-positive' : 'text-negative'}`}>
          {entry.pnlPercent >= 0 ? '+' : ''}{entry.pnlPercent.toFixed(1)}% return
        </p>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">P&L Contribution by Holding</h3>
      <p className="text-sm text-muted mb-4">Which positions are driving your portfolio performance</p>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedHoldings}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={(value) => {
                if (value >= 0) return `+$${(value / 1000).toFixed(0)}k`;
                return `-$${(Math.abs(value) / 1000).toFixed(0)}k`;
              }}
              stroke="#3a3a52"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              width={60}
              stroke="#3a3a52"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#f0f0f5', fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="pnl"
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            >
              {sortedHoldings.map((holding) => (
                <Cell
                  key={`cell-${holding.ticker}`}
                  fill={TICKER_COLORS[holding.ticker] || '#6b7280'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Contribution Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="p-4 rounded-lg bg-surface/30">
          <p className="text-sm text-muted">Top Contributor</p>
          <p className="text-lg font-bold text-positive mt-1 font-mono-nums">
            +{formatCurrency(sortedHoldings[0]?.pnl || 0)}
          </p>
          <p className="text-sm text-foreground mt-0.5">{sortedHoldings[0]?.ticker} - {sortedHoldings[0]?.name}</p>
        </div>
        <div className="p-4 rounded-lg bg-surface/30">
          <p className="text-sm text-muted">Total Portfolio P&L</p>
          <p className={`text-lg font-bold mt-1 font-mono-nums ${portfolioData.totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
            {portfolioData.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalPnl)}
          </p>
          <p className="text-sm text-foreground mt-0.5">
            {((portfolioData.totalPnl / portfolioData.totalCost) * 100).toFixed(1)}% total return
          </p>
        </div>
      </div>
    </div>
  );
}
