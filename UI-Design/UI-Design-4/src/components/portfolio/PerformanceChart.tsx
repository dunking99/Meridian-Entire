import { useState, useMemo } from 'react';
import {
  LineChart,
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

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

const timePeriods: TimePeriod[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'];

const periodDays: Record<TimePeriod, number> = {
  '1D': 1,
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

function calculateChange(data: { date: string; value: number }[]): { change: number; percent: number } | null {
  if (data.length < 2) return null;
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const change = last - first;
  const percent = (change / first) * 100;
  return { change, percent };
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length || !label) return null;

  const value = payload[0].value;
  const date = new Date(label);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: date.getHours() ? 'numeric' : undefined,
    minute: date.getMinutes() ? '2-digit' : undefined,
  });

  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-lg">
      <p className="text-xs text-muted mb-1">{formattedDate}</p>
      <p className="text-sm font-semibold text-foreground font-mono-nums">{formatCurrency(value)}</p>
      <p className="text-xs text-muted mt-0.5">Portfolio Value</p>
    </div>
  );
}

export default function PerformanceChart() {
  const [period, setPeriod] = useState<TimePeriod>('1Y');

  const filteredData = useMemo(
    () => filterByPeriod(portfolioData.performanceHistory, period),
    [period]
  );

  const change = useMemo(() => calculateChange(filteredData), [filteredData]);

  const formatXAxis = (date: string) => {
    const d = new Date(date);
    if (period === '1D') {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ChartComponent = filteredData.length > 1 ? AreaChart : LineChart;

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Portfolio Performance</h3>
          <p className="text-sm text-muted mt-0.5">
            {period === '1D' ? 'Intraday' : `${period} period`}
            {change && (
              <span
                className={`ml-2 font-medium font-mono-nums ${
                  change.percent >= 0 ? 'text-positive' : 'text-negative'
                }`}
              >
                {formatCurrency(Math.abs(change.change))} ({change.percent >= 0 ? '+' : ''}
                {change.percent.toFixed(2)}%)
              </span>
            )}
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

      <div className="mt-4 h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorValueRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#3a3a52"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#3a3a52"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {change && change.percent >= 0 ? (
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorValue)"
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorValueRed)"
                dot={false}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
