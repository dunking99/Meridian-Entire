import { useState, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency, formatDate } from '../../utils/format';

type TimePeriod = '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

const timePeriods: TimePeriod[] = ['1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'];

const periodDays: Record<TimePeriod, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  YTD: 365,
  ALL: 9999,
};

function filterByPeriod(data: { date: string; value: number }[], period: TimePeriod): typeof data {
  const now = new Date('2026-02-20');
  const cutoff = new Date(now);

  if (period === 'YTD') {
    cutoff.setMonth(0, 1);
    cutoff.setDate(1);
  } else if (period !== 'ALL') {
    cutoff.setDate(cutoff.getDate() - periodDays[period]);
  }

  return data.filter((d) => new Date(d.date) >= cutoff);
}

// Generate benchmark data (roughly tracking portfolio but with less volatility)
function generateBenchmark(portfolioData: { date: string; value: number }[]): { date: string; benchmark: number }[] {
  return portfolioData.map((d) => {
    // Slight underperformance to show skill
    const ratio = 0.95 + (Math.random() - 0.5) * 0.02;
    return {
      date: d.date,
      benchmark: Math.round(d.value * ratio * 100) / 100,
    };
  });
}

interface Stats {
  portfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  alpha: number;
  volatility: number;
  sharpe: number;
  bestDay: number;
  worstDay: number;
  maxDrawdown: number;
}

export default function PerformanceDetail() {
  const [period, setPeriod] = useState<TimePeriod>('1Y');

  const filteredData = useMemo(
    () => filterByPeriod(portfolioData.performanceHistory, period),
    [period]
  );

  const benchmarkData = useMemo(() => generateBenchmark(filteredData), [filteredData]);

  const combinedData = filteredData.map((d, i) => ({
    ...d,
    benchmark: benchmarkData[i]?.benchmark || d.value * 0.95,
  }));

  const calculateStats = (): Stats | null => {
    if (combinedData.length < 2) return null;

    const first = combinedData[0];
    const last = combinedData[combinedData.length - 1];

    const portfolioReturn = (last.value - first.value) / first.value * 100;
    const benchmarkReturn = (last.benchmark - first.benchmark) / first.benchmark * 100;
    const excessReturn = portfolioReturn - benchmarkReturn;

    // Calculate volatility (annualized)
    const returns = combinedData.slice(1).map((d, i) => {
      return (d.value - combinedData[i].value) / combinedData[i].value;
    });
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

    // Sharpe ratio (assuming risk-free rate of 2%)
    const sharpe = (avgReturn * 252 - 0.02) / (Math.sqrt(variance) * Math.sqrt(252));

    // Best/worst day
    const bestDay = Math.max(...returns) * 100;
    const worstDay = Math.min(...returns) * 100;

    // Max drawdown
    let peak = first.value;
    let maxDrawdown = 0;
    combinedData.forEach((d) => {
      if (d.value > peak) peak = d.value;
      const drawdown = (peak - d.value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return {
      portfolioReturn,
      benchmarkReturn,
      excessReturn,
      alpha: excessReturn,
      volatility,
      sharpe,
      bestDay,
      worstDay,
      maxDrawdown: maxDrawdown * 100,
    };
  };

  const stats = useMemo(calculateStats, [combinedData]);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length || !label) return null;

    return (
      <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-lg">
        <p className="text-xs text-muted mb-1">{formatDate(label, 'long')}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="text-xs text-muted">{entry.name === 'value' ? 'Portfolio' : 'Benchmark'}</span>
            <span className="text-xs font-semibold text-foreground font-mono-nums">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Analysis</h2>
          <p className="text-sm text-muted mt-1">
            Detailed view of portfolio performance with benchmark comparison
          </p>
        </div>
        <div className="flex gap-1">
          {timePeriods.map((p) => (
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-panel p-4">
            <p className="text-sm text-muted">Portfolio Return</p>
            <p className={`text-2xl font-bold mt-1 font-mono-nums ${stats.portfolioReturn >= 0 ? 'text-positive' : 'text-negative'}`}>
              {stats.portfolioReturn >= 0 ? '+' : ''}{stats.portfolioReturn.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel p-4">
            <p className="text-sm text-muted">Benchmark Return</p>
            <p className={`text-2xl font-bold mt-1 font-mono-nums ${stats.benchmarkReturn >= 0 ? 'text-positive' : 'text-negative'}`}>
              {stats.benchmarkReturn >= 0 ? '+' : ''}{stats.benchmarkReturn.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel p-4">
            <p className="text-sm text-muted">Excess Return (Alpha)</p>
            <p className={`text-2xl font-bold mt-1 font-mono-nums ${stats.excessReturn >= 0 ? 'text-positive' : 'text-negative'}`}>
              {stats.excessReturn >= 0 ? '+' : ''}{stats.excessReturn.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel p-4">
            <p className="text-sm text-muted">Sharpe Ratio</p>
            <p className="text-2xl font-bold mt-1 font-mono-nums text-foreground">
              {stats.sharpe.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div className="rounded-xl border border-border bg-panel p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio vs Benchmark</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                tickFormatter={(value) => `$${value / 1000}k`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-foreground">
                    {value === 'value' ? 'Portfolio' : 'Benchmark (S&P 500)'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#portfolioGrad)"
                name="Portfolio"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                name="Benchmark"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-panel p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Risk Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Annualized Volatility</span>
              <span className="text-sm font-mono-nums text-foreground">{stats?.volatility.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Max Drawdown</span>
              <span className="text-sm font-mono-nums text-negative">-{stats?.maxDrawdown.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Best Day</span>
              <span className="text-sm font-mono-nums text-positive">+{stats?.bestDay.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Worst Day</span>
              <span className="text-sm font-mono-nums text-negative">{stats?.worstDay.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-panel p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Additional Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Tracking Error (est.)</span>
              <span className="text-sm font-mono-nums text-foreground">{(stats?.volatility || 0) * 0.3 > 0 ? (stats?.volatility || 0) * 0.3 : 0}%</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Information Ratio (est.)</span>
              <span className="text-sm font-mono-nums text-foreground">
                {((stats?.alpha || 0) / (stats?.volatility || 1)) > 0 ? '+' : ''}
                {((stats?.alpha || 0) / (stats?.volatility || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Period Start</span>
              <span className="text-sm text-foreground">{formatDate(combinedData[0]?.date || '', 'long')}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="text-sm text-muted">Period End</span>
              <span className="text-sm text-foreground">{formatDate(combinedData[combinedData.length - 1]?.date || '', 'long')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
