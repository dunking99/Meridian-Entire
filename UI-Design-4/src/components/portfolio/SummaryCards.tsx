import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency, formatPercent } from '../../utils/format';

export default function SummaryCards() {
  const { totalValue, dailyChange, dailyChangePercent, totalPnl, totalPnlPercent, cash } = portfolioData;

  const cards = [
    {
      label: 'Total Portfolio Value',
      value: formatCurrency(totalValue),
      change: dailyChangePercent !== 0 ? `${dailyChangePercent > 0 ? '+' : ''}${formatPercent(dailyChangePercent)} (${formatCurrency(Math.abs(dailyChange))})` : null,
      positive: dailyChange >= 0,
      highlight: true,
    },
    {
      label: 'Total Return',
      value: formatCurrency(totalPnl),
      change: `${totalPnlPercent > 0 ? '+' : ''}${formatPercent(totalPnlPercent)}`,
      positive: totalPnl >= 0,
      highlight: false,
    },
    {
      label: 'Cash Balance',
      value: formatCurrency(cash),
      change: `${(cash / totalValue * 100).toFixed(1)}% of portfolio`,
      positive: true,
      highlight: false,
    },
    {
      label: 'Invested Value',
      value: formatCurrency(totalValue - cash),
      change: `${((totalValue - cash) / totalValue * 100).toFixed(1)}% of portfolio`,
      positive: true,
      highlight: false,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
            card.highlight
              ? 'bg-gradient-to-br from-chart-1/10 to-chart-1/5 border-chart-1/20 glow-green'
              : 'bg-panel border-border'
          }`}
        >
          <div className="p-5">
            <p className="text-sm font-medium text-muted uppercase tracking-wider">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground font-mono-nums">{card.value}</p>
            {card.change && (
              <p
                className={`mt-1 text-sm font-medium font-mono-nums ${
                  card.positive ? 'text-positive' : 'text-negative'
                }`}
              >
                {card.change}
              </p>
            )}
          </div>
          {/* Decorative gradient */}
          {card.highlight && (
            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-chart-1/10 blur-2xl" />
          )}
        </div>
      ))}
    </div>
  );
}
