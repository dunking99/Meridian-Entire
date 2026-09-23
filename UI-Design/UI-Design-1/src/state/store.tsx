import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { HOLDING_SEEDS, CASHFLOW_SEEDS, NOTE_SEEDS, type CashFlow, type HoldingSeed, type Note } from "../data/portfolio";
import { NAME_LOOKUP } from "../data/universe";
import { buildPortfolio, breakdowns as buildBreakdowns, concentrationFlags } from "../engine/portfolio";
import { computeXRay } from "../engine/lookthrough";
import { computePerformance } from "../engine/performance";
import { computeScorecard, computeCorrelations } from "../engine/analysis";
import { DEFAULT_MANDATE, type Mandate } from "../engine/rebuild";
import { MAX_BARS, indexOfDate } from "../data/prices";

export type TabKey = "holdings" | "xray" | "performance" | "analysis" | "allocate" | "rebuild";
export type PanelTab = "overview" | "holding" | "updates" | "notes";

interface Ctx {
  seeds: HoldingSeed[];
  flows: CashFlow[];
  notes: Note[];
  nameOverrides: Record<string, string>;
  mandate: Mandate;
  setMandate: (m: Mandate) => void;
  tab: TabKey;
  setTab: (t: TabKey) => void;
  selected: string | null;
  panelTab: PanelTab;
  openHolding: (symbol: string, tab?: PanelTab) => void;
  setPanelTab: (t: PanelTab) => void;
  closePanel: () => void;
  addPosition: (p: { symbol: string; qty: number; avgPrice: number; wrapper: HoldingSeed["wrapper"]; account: string; date: string; targetPct?: number }) => void;
  removePosition: (id: string) => void;
  addFlow: (f: Omit<CashFlow, "id">) => void;
  removeFlow: (id: string) => void;
  addNote: (n: Omit<Note, "id">) => void;
  refreshNames: () => void;
  namesRefreshed: boolean;
  setTarget: (symbol: string, pct: number) => void;
  portfolio: ReturnType<typeof buildPortfolio>;
  breakdowns: ReturnType<typeof buildBreakdowns>;
  xray: ReturnType<typeof computeXRay>;
  performance: ReturnType<typeof computePerformance>;
  scorecard: ReturnType<typeof computeScorecard>;
  correlations: ReturnType<typeof computeCorrelations>;
  flags: ReturnType<typeof concentrationFlags>;
}

const PortfolioContext = createContext<Ctx | null>(null);

let uid = 0;
const nextId = (p: string) => `${p}_${Date.now().toString(36)}_${uid++}`;

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [seeds, setSeeds] = useState<HoldingSeed[]>(HOLDING_SEEDS);
  const [flows, setFlows] = useState<CashFlow[]>(CASHFLOW_SEEDS);
  const [notes, setNotes] = useState<Note[]>(NOTE_SEEDS);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [namesRefreshed, setNamesRefreshed] = useState(false);
  const [mandate, setMandate] = useState<Mandate>(DEFAULT_MANDATE);
  const [tab, setTab] = useState<TabKey>("holdings");
  const [selected, setSelected] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("overview");

  const portfolio = useMemo(() => buildPortfolio(seeds, flows, nameOverrides), [seeds, flows, nameOverrides]);
  const breakdowns = useMemo(() => buildBreakdowns(portfolio), [portfolio]);
  const xray = useMemo(() => computeXRay(portfolio), [portfolio]);
  const performance = useMemo(() => computePerformance(portfolio, seeds), [portfolio, seeds]);
  const scorecard = useMemo(() => computeScorecard(portfolio), [portfolio]);
  const correlations = useMemo(() => computeCorrelations(portfolio), [portfolio]);
  const flags = useMemo(() => concentrationFlags(portfolio, xray.usExposure), [portfolio, xray]);

  const value: Ctx = {
    seeds,
    flows: portfolio.flows,
    notes,
    nameOverrides,
    namesRefreshed,
    mandate,
    setMandate,
    tab,
    setTab,
    selected,
    panelTab,
    openHolding: (symbol, t) => {
      setSelected(symbol);
      setPanelTab(t ?? "overview");
    },
    setPanelTab,
    closePanel: () => setSelected(null),
    addPosition: (p) => {
      const daysAgo = Math.max(1, MAX_BARS - indexOfDate(p.date));
      setSeeds((s) => [
        ...s,
        {
          id: nextId("h"),
          symbol: p.symbol,
          qty: p.qty,
          wrapper: p.wrapper,
          account: p.account,
          daysAgo,
          costFactor: 1,
          targetPct: p.targetPct,
          fixedAvgPrice: p.avgPrice,
        },
      ]);
    },
    removePosition: (id) => setSeeds((s) => s.filter((x) => x.id !== id)),
    addFlow: (f) => setFlows((s) => [...s, { ...f, id: nextId("cf") }]),
    removeFlow: (id) => setFlows((s) => s.filter((x) => x.id !== id)),
    addNote: (n) => setNotes((s) => [{ ...n, id: nextId("n") }, ...s]),
    refreshNames: () => {
      setNameOverrides((o) => ({ ...o, ...NAME_LOOKUP }));
      setNamesRefreshed(true);
    },
    setTarget: (symbol, pct) =>
      setSeeds((s) => s.map((x) => (x.symbol === symbol ? { ...x, targetPct: pct } : x))),
    portfolio,
    breakdowns,
    xray,
    performance,
    scorecard,
    correlations,
    flags,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used inside PortfolioProvider");
  return ctx;
}
