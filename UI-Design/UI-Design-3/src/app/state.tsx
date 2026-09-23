import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Section = "portfolio" | "markets" | "news" | "research" | "journal" | "settings";
export type PortfolioTab =
  | "overview"
  | "holdings"
  | "performance"
  | "allocation"
  | "income"
  | "activity"
  | "signals";

interface Ctx {
  section: Section;
  tab: PortfolioTab;
  go: (s: Section, t?: PortfolioTab) => void;
  setTab: (t: PortfolioTab) => void;
  focus: string | null;
  setFocus: (t: string | null) => void;
  privacy: boolean;
  setPrivacy: (b: boolean) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [section, setSection] = useState<Section>("portfolio");
  const [tab, setTab] = useState<PortfolioTab>("overview");
  const [focus, setFocus] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(false);

  const value = useMemo<Ctx>(
    () => ({
      section,
      tab,
      go: (s, t) => {
        setSection(s);
        if (t) setTab(t);
        window.scrollTo({ top: 0 });
      },
      setTab: (t) => {
        setTab(t);
        setSection("portfolio");
        window.scrollTo({ top: 0 });
      },
      focus,
      setFocus,
      privacy,
      setPrivacy,
    }),
    [section, tab, focus, privacy],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
