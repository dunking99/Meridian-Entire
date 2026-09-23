import { portfolioData } from '../../data/mockPortfolio';
import { formatCurrency } from '../../utils/format';

interface NewsItem {
  id: string;
  source: string;
  title: string;
  summary: string;
  ticker?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: string;
}

// Mock news data that relates to the portfolio holdings
const NEWS_DATA: NewsItem[] = [
  {
    id: 'n1',
    source: 'Reuters',
    title: 'NVIDIA Reports Record Quarterly Revenue, Guidance Beats Expectations',
    summary: 'Nvidia Corp., the chip designer powering the AI revolution, posted record revenue of $26 billion for Q4, with earnings per share of $6.12, beating Wall Street estimates.',
    ticker: 'NVDA',
    sentiment: 'positive',
    timestamp: '2026-02-20T08:30:00Z',
  },
  {
    id: 'n2',
    source: 'Bloomberg',
    title: 'Microsoft Cloud Revenue Surges 32% on AI-Driven Demand',
    summary: 'Microsoft\'s Azure cloud business grew 32% in constant currency, with AI services contributing an increasing share of the growth.',
    ticker: 'MSFT',
    sentiment: 'positive',
    timestamp: '2026-02-20T07:45:00Z',
  },
  {
    id: 'n3',
    source: 'CNBC',
    title: 'Apple Vision Pro Sales Exceed Expectations in First Quarter',
    summary: 'Apple reported stronger-than-expected sales of its Vision Pro mixed reality headset, with 250,000 units sold in the first three months.',
    ticker: 'AAPL',
    sentiment: 'positive',
    timestamp: '2026-02-19T16:20:00Z',
  },
  {
    id: 'n4',
    source: 'WSJ',
    title: 'Fed Maintains Interest Rates, Signals Potential Cuts Later This Year',
    summary: 'The Federal Reserve held interest rates steady at 4.25-4.50%, with several officials indicating a more dovish stance could emerge in the coming months.',
    ticker: undefined,
    sentiment: 'positive',
    timestamp: '2026-02-19T14:15:00Z',
  },
  {
    id: 'n5',
    source: 'TechCrunch',
    title: 'Alphabet\'s Gemini AI Model Now Powers 500+ Enterprise Clients',
    summary: 'Google\'s parent company Alphabet announced that its Gemini AI platform has been adopted by over 500 enterprise customers, signaling strong business AI adoption.',
    ticker: 'GOOGL',
    sentiment: 'positive',
    timestamp: '2026-02-19T11:30:00Z',
  },
  {
    id: 'n6',
    source: 'FT',
    title: 'Amazon Web Services Revenue Growth Accelerates to 28%',
    summary: 'AWS revenue growth accelerated to 28% year-over-year in Q4, driven by increased cloud adoption and AI workload migration.',
    ticker: 'AMZN',
    sentiment: 'positive',
    timestamp: '2026-02-18T22:00:00Z',
  },
  {
    id: 'n7',
    source: 'CoinDesk',
    title: 'Bitcoin Surges Past $67,000 as Institutional Interest Grows',
    summary: 'Bitcoin hit a new high of $68,500 as spot ETF inflows continued and institutional adoption increased with several major banks offering crypto services.',
    ticker: 'BTC',
    sentiment: 'positive',
    timestamp: '2026-02-18T20:30:00Z',
  },
  {
    id: 'n8',
    source: 'Reuters',
    title: 'Netflix Subscribers Surpass 280 Million Globally',
    summary: 'Netflix announced it has surpassed 280 million global subscribers, driven by growth in ad-supported tiers and international expansion.',
    ticker: 'NFLX',
    sentiment: 'positive',
    timestamp: '2026-02-18T14:00:00Z',
  },
  {
    id: 'n9',
    source: 'Bloomberg',
    title: 'JPMorgan Chase Profit Jumps 15% on Strong Trading Revenue',
    summary: 'JPMorgan reported net income of $14.5 billion for Q4, with investment banking fees up 25% and trading revenue surging 30%.',
    ticker: 'JPM',
    sentiment: 'positive',
    timestamp: '2026-02-17T16:45:00Z',
  },
  {
    id: 'n10',
    source: 'CNBC',
    title: 'Vanguard ETF Flows Reaches Record $120 Billion in Q4',
    summary: 'Vanguard ETFs attracted record inflows of $120 billion in the fourth quarter, reflecting growing passive investing trends.',
    ticker: undefined,
    sentiment: 'neutral',
    timestamp: '2026-02-17T10:00:00Z',
  },
  {
    id: 'n11',
    source: 'MarketWatch',
    title: 'Tech Sector Volatility Expected to Increase in Coming Weeks',
    summary: 'Analysts expect increased volatility in the technology sector due to upcoming earnings reports and macroeconomic data releases.',
    ticker: undefined,
    sentiment: 'negative',
    timestamp: '2026-02-16T09:30:00Z',
  },
];

const SENTIMENT_COLORS = {
  positive: 'bg-positive/20 text-positive border-positive/30',
  negative: 'bg-negative/20 text-negative border-negative/30',
  neutral: 'bg-muted/20 text-muted border-muted/30',
};

const SENTIMENT_LABELS = {
  positive: 'Positive',
  negative: 'Negative',
  neutral: 'Neutral',
};

export default function NewsFeed() {
  const sortedNews = [...NEWS_DATA].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Get unique tickers from holdings for filtering
  const holdingTickers = new Set(portfolioData.holdings.map((h) => h.ticker));

  return (
    <div className="rounded-xl border border-border bg-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Market News</h3>
          <p className="text-sm text-muted mt-0.5">
            Updates relevant to your portfolio holdings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {holdingTickers.size} holdings tracked
          </span>
        </div>
      </div>

      {/* News List */}
      <div className="divide-y divide-border/50">
        {sortedNews.map((news) => {
          const isPortfolioRelated = news.ticker && holdingTickers.has(news.ticker);
          const relatedHolding = news.ticker
            ? portfolioData.holdings.find((h) => h.ticker === news.ticker)
            : null;

          return (
            <article
              key={news.id}
              className={`px-5 py-4 transition-colors ${
                isPortfolioRelated ? 'bg-positive-muted/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Source & Timestamp */}
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-muted">{news.source}</span>
                    <span className="text-xs text-muted">
                      {new Date(news.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    {isPortfolioRelated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-positive bg-positive-muted/20 rounded-md">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        In your portfolio
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-medium text-foreground leading-snug hover:text-positive transition-colors cursor-pointer">
                    {news.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-xs text-muted mt-1 line-clamp-2">{news.summary}</p>

                  {/* Related Holding */}
                  {relatedHolding && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground bg-surface px-2 py-0.5 rounded-md">
                        {news.ticker}
                      </span>
                      <span className="text-xs text-muted">
                        {relatedHolding.name}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          relatedHolding.dayChange >= 0 ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {relatedHolding.dayChange >= 0 ? '+' : ''}
                        {formatCurrency(relatedHolding.dayChange)} today
                      </span>
                    </div>
                  )}
                </div>

                {/* Sentiment Badge */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${SENTIMENT_COLORS[news.sentiment]}`}
                  >
                    {SENTIMENT_LABELS[news.sentiment]}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-surface/30">
        <p className="text-xs text-muted text-center">
          Showing latest {NEWS_DATA.length} news items • News updates every 15 minutes
        </p>
      </div>
    </div>
  );
}
