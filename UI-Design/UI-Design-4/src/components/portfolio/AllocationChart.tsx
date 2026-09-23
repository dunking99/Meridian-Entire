import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency } from '../../utils/format';

const COLORS = [
  '#10b981', // Equity - green
  '#3b82f6', // ETF - blue
  '#f59e0b', // Crypto - amber
  '#8b5cf6', // Cash - purple
];

const ASSET_CLASS_LABELS: Record<string, string> = {
  Equity: 'Stocks',
  ETF: 'ETFs',
  Crypto: 'Crypto',
  Cash: 'Cash',
};

interface AllocationTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { assetClass: string; value: number; percent: number } }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: AllocationTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const entry = payload[0].payload;
  const index = portfolioData.assetAllocation.findIndex(
    (a) => a.assetClass === entry.assetClass
  );

  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground">{ASSET_CLASS_LABELS[entry.assetClass] || entry.assetClass}</p>
      <p className="text-xs text-muted mt-0.5">{formatCurrency(entry.value)}</p>
      <p className="text-xs font-medium mt-1" style={{ color: COLORS[index] }}>
        {entry.percent.toFixed(1)}% of portfolio
      </p>
    </div>
  );
};

export default function AllocationChart() {
  const data = portfolioData.assetAllocation;

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Asset Allocation</h3>

      <div className="flex flex-col items-center">
        <div className="relative h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ payload }) => {
                  if (!payload) return null;
                  const total = data.reduce((sum, d) => sum + d.value, 0);
                  const percent = (payload.value / total) * 100;
                  return (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#f0f0f5"
                      fontSize="13"
                      fontWeight="600"
                    >
                      {percent.toFixed(0)}%
                    </text>
                  );
                }}
                outerRadius={90}
                fill="#888"
                dataKey="value"
                style={{ cursor: 'pointer' }}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 w-full">
          {data.map((item, index) => (
            <div
              key={item.assetClass}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-foreground font-medium">
                  {ASSET_CLASS_LABELS[item.assetClass] || item.assetClass}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono-nums text-foreground">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-sm font-medium text-muted">{item.percent.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
