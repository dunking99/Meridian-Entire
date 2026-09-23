import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency } from '../../utils/format';

const COLORS = [
  '#10b981', // Technology - green
  '#3b82f6', // Diversified - blue
  '#f59e0b', // Consumer Cyclical - amber
  '#8b5cf6', // Financial - purple
  '#ec4899', // Cryptocurrency - pink
  '#6b7280', // Cash - gray
];

export default function SectorAllocation() {
  const data = portfolioData.sectorAllocation.sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { sector: string; value: number; percent: number } }> }) => {
    if (!active || !payload || !payload.length) return null;
    const entry = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-panel px-3 py-2 shadow-lg">
        <p className="text-sm font-semibold text-foreground">{entry.sector}</p>
        <p className="text-xs text-muted mt-0.5">{formatCurrency(entry.value)}</p>
        <p className="text-xs font-medium mt-1" style={{ color: COLORS[0] }}>
          {entry.percent.toFixed(1)}% of portfolio
        </p>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Sector Allocation</h3>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              stroke="#3a3a52"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="sector"
              width={100}
              stroke="#3a3a52"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#f0f0f5', fontWeight: 500 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {data.map((item, index) => (
          <div key={item.sector} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs text-muted">{item.sector}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
