import { useState } from 'react';
import PortfolioOverview from './PortfolioOverview';
import HoldingDetail from './HoldingDetail';
import PerformanceDetail from './PerformanceDetail';
import TransactionsView from './TransactionsView';
import NewsFeed from './NewsFeed';

type Tab = 'overview' | 'performance' | 'transactions' | 'news';

export default function PortfolioApp() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);

  const tabs = [
    { id: 'overview', label: 'Portfolio', icon: '⊞' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'transactions', label: 'Activity', icon: '🔄' },
    { id: 'news', label: 'News', icon: '📰' },
  ];

  const renderContent = () => {
    if (selectedHolding && activeTab === 'overview') {
      return <HoldingDetail ticker={selectedHolding} />;
    }

    switch (activeTab) {
      case 'overview':
        return <PortfolioOverview />;
      case 'performance':
        return <PerformanceDetail />;
      case 'transactions':
        return <TransactionsView />;
      case 'news':
        return <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Market News</h1>
            <p className="text-muted">Latest news and updates relevant to your holdings</p>
          </div>
          <NewsFeed />
        </div>;
      default:
        return <PortfolioOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-panel">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-panel/95 backdrop-blur supports-[backdrop-filter]:bg-panel/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 shadow-lg shadow-chart-1/20">
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M7 16l4-8 4 4 4-6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">Meridian</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden items-center gap-1 sm:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as Tab); setSelectedHolding(null); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted hover:text-foreground/80 hover:bg-surface/50'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User menu area */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono-nums">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <button className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm text-muted hover:bg-surface-hover transition-colors">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center text-xs font-bold text-white">
                U
              </div>
              <span className="hidden sm:inline">User</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="border-t border-border px-4 py-2 sm:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as Tab); setSelectedHolding(null); }}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted hover:text-foreground/80'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {(activeTab === 'overview' || activeTab === 'performance' || activeTab === 'transactions' || activeTab === 'news') && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">
                {activeTab === 'overview' && 'Portfolio'}
                {activeTab === 'performance' && 'Performance Analysis'}
                {activeTab === 'transactions' && 'Transaction Activity'}
                {activeTab === 'news' && 'Market News'}
              </h1>
              <p className="text-muted">
                {activeTab === 'overview' && 'Your holdings, performance, and allocation'}
                {activeTab === 'performance' && 'Deep dive into your portfolio\'s performance metrics'}
                {activeTab === 'transactions' && 'Your complete transaction history'}
                {activeTab === 'news' && 'Latest news and updates relevant to your holdings'}
              </p>
            </div>
            {renderContent()}
          </>
        )}
      </main>

      {/* Back to overview floating button */}
      {selectedHolding && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setSelectedHolding(null)}
            className="flex items-center gap-2 rounded-full bg-surface border border-border px-4 py-2 shadow-lg text-sm text-foreground hover:bg-surface-hover transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to overview
          </button>
        </div>
      )}
    </div>
  );
}
