import { useState } from 'react';
import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency } from '../../utils/format';

type SortField = 'ticker' | 'value' | 'pnl' | 'pnlPercent' | 'dayChange' | 'quantity';
type SortDirection = 'asc' | 'desc';

const columns = [
  { key: 'ticker' as const, label: 'Ticker', width: '80px' },
  { key: 'name' as const, label: 'Name', width: 'auto' },
  { key: 'quantity' as const, label: 'Quantity', width: '100px' },
  { key: 'price' as const, label: 'Price', width: '110px' },
  { key: 'value' as const, label: 'Value', width: '120px' },
  { key: 'pnl' as const, label: 'P&L', width: '130px' },
  { key: 'pnlPercent' as const, label: 'Return', width: '100px' },
  { key: 'dayChange' as const, label: 'Day', width: '100px' },
];

interface HoldingRowProps {
  holding: typeof portfolioData.holdings[0];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function HoldingRow({ holding, sortField, sortDirection, onSort }: HoldingRowProps) {
  const isSorted = (field: SortField) => field === sortField;

  return (
    <tr className="group border-b border-border/50 hover:bg-surface/50 transition-colors">
      <td className="px-4 py-3">
        <button
          onClick={() => onSort('ticker')}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground bg-surface px-2 py-1 rounded-md">
            {holding.ticker}
          </span>
          {isSorted('ticker') && (
            <span className={`text-xs ${sortDirection === 'asc' ? 'text-positive' : 'text-negative'}`}>↑</span>
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSort('value')}
          className="text-left cursor-pointer hover:text-foreground/80 transition-colors"
        >
          <p className="text-sm font-medium text-foreground">{holding.name}</p>
          <p className="text-xs text-muted mt-0.5">{holding.assetClass} · {holding.sector}</p>
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSort('quantity')}
          className="text-right cursor-pointer hover:text-foreground/80 transition-colors"
        >
          <span className="text-sm text-muted font-mono-nums">
            {holding.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
          </span>
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="text-right text-sm text-foreground font-mono-nums">
          {formatCurrency(holding.currentPrice)}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSort('value')}
          className="text-right cursor-pointer hover:text-foreground/80 transition-colors"
        >
          <span className="text-sm text-foreground font-mono-nums">{formatCurrency(holding.value)}</span>
          {isSorted('value') && (sortDirection === 'desc' ? ' ↑' : ' ↓')}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSort('pnl')}
          className="text-right cursor-pointer hover:text-foreground/80 transition-colors"
        >
          <span
            className={`inline-block text-sm font-mono-nums font-medium px-2 py-0.5 rounded-md ${
              holding.pnl >= 0
                ? 'bg-positive-muted/30 text-positive'
                : 'bg-negative-muted/30 text-negative'
            }`}
          >
            {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
          </span>
          {isSorted('pnl') && (sortDirection === 'desc' ? ' ↑' : ' ↓')}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSort('pnlPercent')}
          className="text-right cursor-pointer hover:text-foreground/80 transition-colors"
        >
          <span
            className={`text-sm font-mono-nums font-medium ${
              holding.pnlPercent >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(1)}%
          </span>
          {isSorted('pnlPercent') && (sortDirection === 'desc' ? ' ↑' : ' ↓')}
        </button>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSort('dayChange')}
          className="text-right cursor-pointer hover:text-foreground/80 transition-colors"
        >
          <span
            className={`text-sm font-mono-nums ${
              holding.dayChange >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {holding.dayChange >= 0 ? '+' : ''}{formatCurrency(holding.dayChange)}
          </span>
          <span
            className={`text-xs ml-1 ${
              holding.dayChangePercent >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            ({holding.dayChangePercent >= 0 ? '+' : ''}{holding.dayChangePercent.toFixed(2)}%)
          </span>
          {isSorted('dayChange') && (sortDirection === 'desc' ? ' ↑' : ' ↓')}
        </button>
      </td>
    </tr>
  );
}

export default function HoldingsTable() {
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedHoldings = [...portfolioData.holdings].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case 'ticker':
        aVal = a.ticker;
        bVal = b.ticker;
        break;
      case 'quantity':
        aVal = a.quantity;
        bVal = b.quantity;
        break;
      case 'value':
        aVal = a.value;
        bVal = b.value;
        break;
      case 'pnl':
        aVal = a.pnl;
        bVal = b.pnl;
        break;
      case 'pnlPercent':
        aVal = a.pnlPercent;
        bVal = b.pnlPercent;
        break;
      case 'dayChange':
        aVal = a.dayChange;
        bVal = b.dayChange;
        break;
      default:
        aVal = a.value;
        bVal = b.value;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const totalPnl = portfolioData.holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalDayChange = portfolioData.holdings.reduce((sum, h) => sum + h.dayChange, 0);

  return (
    <div className="rounded-xl border border-border bg-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Holdings</h3>
          <p className="text-sm text-muted mt-0.5">
            {portfolioData.holdings.length} positions · Total P&L:{' '}
            <span className={totalPnl >= 0 ? 'text-positive' : 'text-negative'}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </span>
            {' · '}Day change:{' '}
            <span className={totalDayChange >= 0 ? 'text-positive' : 'text-negative'}>
              {totalDayChange >= 0 ? '+' : ''}{formatCurrency(totalDayChange)}
            </span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted border-b border-border/50"
                  style={{ width: col.width }}
                >
                  <button
                    onClick={() => handleSort(col.key as SortField)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    {col.label}
                    {sortField === col.key && (
                      <span className={sortDirection === 'asc' ? 'text-positive' : 'text-negative'}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((holding) => (
              <HoldingRow
                key={holding.ticker}
                holding={holding}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-surface/30 border-t border-border flex justify-between items-center">
        <span className="text-sm text-muted">Total Portfolio Value (incl. cash)</span>
        <span className="text-lg font-bold text-foreground font-mono-nums">
          {formatCurrency(portfolioData.totalValue)}
        </span>
      </div>
    </div>
  );
}
