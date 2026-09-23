import { PortfolioProvider, usePortfolio, type TabKey } from "./state/store";
import { Shell } from "./components/Shell";
import { PortfolioPage } from "./features/PortfolioPage";

function Inner() {
  const { tab, setTab } = usePortfolio();
  return (
    <Shell activeSub={tab} onSub={(s) => setTab(s as TabKey)}>
      <PortfolioPage />
    </Shell>
  );
}

export default function App() {
  return (
    <PortfolioProvider>
      <Inner />
    </PortfolioProvider>
  );
}
