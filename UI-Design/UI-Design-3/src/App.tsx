import { AppProvider, useApp } from "@/app/state";
import { AppShell } from "@/components/AppShell";
import { HoldingDrawer } from "@/components/HoldingDrawer";
import { Overview } from "@/pages/portfolio/Overview";
import { Holdings } from "@/pages/portfolio/Holdings";
import { Performance } from "@/pages/portfolio/Performance";
import { Allocation } from "@/pages/portfolio/Allocation";
import { Income } from "@/pages/portfolio/Income";
import { Activity } from "@/pages/portfolio/Activity";
import { Signals } from "@/pages/portfolio/Signals";
import { Markets, NewsPage, Research, Journal, Settings } from "@/pages/Other";

function Router() {
  const { section, tab } = useApp();

  if (section === "markets") return <Markets />;
  if (section === "news") return <NewsPage />;
  if (section === "research") return <Research />;
  if (section === "journal") return <Journal />;
  if (section === "settings") return <Settings />;

  switch (tab) {
    case "holdings":
      return <Holdings />;
    case "performance":
      return <Performance />;
    case "allocation":
      return <Allocation />;
    case "income":
      return <Income />;
    case "activity":
      return <Activity />;
    case "signals":
      return <Signals />;
    default:
      return <Overview />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <Router />
        <HoldingDrawer />
      </AppShell>
    </AppProvider>
  );
}
