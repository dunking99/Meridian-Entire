import SummaryCards from './SummaryCards';
import PerformanceChart from './PerformanceChart';
import HoldingsTable from './HoldingsTable';
import AllocationChart from './AllocationChart';
import SectorAllocation from './SectorAllocation';
import NewsFeed from './NewsFeed';
import ContributionsView from './ContributionsView';

export default function PortfolioOverview() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards />

      {/* Performance Chart */}
      <PerformanceChart />

      {/* Two column layout for allocation, contributions, and news */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Allocation Charts */}
        <div className="lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <AllocationChart />
            <SectorAllocation />
          </div>
        </div>

        {/* News Feed */}
        <div className="lg:col-span-1">
          <NewsFeed />
        </div>
      </div>

      {/* Holdings Table and Contributions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HoldingsTable />
        </div>
        <div className="lg:col-span-1">
          <ContributionsView />
        </div>
      </div>
    </div>
  );
}
