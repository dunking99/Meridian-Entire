import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency, formatDate } from '../../utils/format';

const TRANSACTION_COLORS: Record<string, string> = {
  Buy: 'text-positive',
  Sell: 'text-negative',
  Dividend: 'text-chart-2',
  Deposit: 'text-chart-4',
  Withdrawal: 'text-chart-5',
};

const TRANSACTION_ICONS: Record<string, string> = {
  Buy: '↓',
  Sell: '↑',
  Dividend: '◎',
  Deposit: '→',
  Withdrawal: '←',
};

export default function TransactionsView() {
  const transactions = [...portfolioData.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const groupByDate = transactions.reduce((acc, tx) => {
    const dateKey = tx.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  const sortedDates = Object.keys(groupByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const totalDeposits = transactions
    .filter((t) => t.type === 'Deposit')
    .reduce((sum, t) => sum + t.total, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'Withdrawal')
    .reduce((sum, t) => sum + t.total, 0);

  const totalBuys = transactions
    .filter((t) => t.type === 'Buy')
    .reduce((sum, t) => sum + t.total, 0);

  const totalSells = transactions
    .filter((t) => t.type === 'Sell')
    .reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transactions</h2>
          <p className="text-sm text-muted mt-1">Your portfolio transaction history</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-panel p-4">
          <p className="text-sm text-muted">Total Deposits</p>
          <p className="text-xl font-bold text-chart-4 font-mono-nums mt-1">
            +{formatCurrency(totalDeposits)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-panel p-4">
          <p className="text-sm text-muted">Total Withdrawals</p>
          <p className="text-xl font-bold text-chart-5 font-mono-nums mt-1">
            -{formatCurrency(totalWithdrawals)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-panel p-4">
          <p className="text-sm text-muted">Total Buys</p>
          <p className="text-xl font-bold text-positive font-mono-nums mt-1">
            {formatCurrency(totalBuys)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-panel p-4">
          <p className="text-sm text-muted">Total Sells</p>
          <p className="text-xl font-bold text-negative font-mono-nums mt-1">
            {formatCurrency(totalSells)}
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-xl border border-border bg-panel p-5">
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                {formatDate(date, 'long')}
              </p>
              <div className="space-y-2">
                {groupByDate[date].map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          tx.type === 'Buy'
                            ? 'bg-positive-muted/20'
                            : tx.type === 'Sell'
                            ? 'bg-negative-muted/20'
                            : tx.type === 'Dividend'
                            ? 'bg-chart-2/20'
                            : tx.type === 'Deposit'
                            ? 'bg-chart-4/20'
                            : 'bg-chart-5/20'
                        }`}
                      >
                        <span className={`text-sm ${TRANSACTION_COLORS[tx.type]}`}>
                          {TRANSACTION_ICONS[tx.type]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {tx.type === 'Buy' && `Bought ${tx.quantity} ${tx.ticker}`}
                          {tx.type === 'Sell' && `Sold ${tx.quantity} ${tx.ticker}`}
                          {tx.type === 'Dividend' && `${tx.ticker} Dividend`}
                          {tx.type === 'Deposit' && 'Cash Deposit'}
                          {tx.type === 'Withdrawal' && 'Cash Withdrawal'}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {tx.type === 'Buy' && `At $${tx.price.toFixed(2)} per share`}
                          {tx.type === 'Sell' && `At $${tx.price.toFixed(2)} per share`}
                          {tx.type === 'Dividend' && `$${tx.price.toFixed(2)} per share`}
                          {tx.type === 'Deposit' && 'From bank transfer'}
                          {tx.type === 'Withdrawal' && 'To bank transfer'}
                          {tx.fee && ` · Fee: ${formatCurrency(tx.fee)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold font-mono-nums ${TRANSACTION_COLORS[tx.type]}`}>
                        {tx.type === 'Buy' || tx.type === 'Withdrawal' ? '-' : '+'}
                        {formatCurrency(tx.total)}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {formatDate(tx.date, 'time')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
