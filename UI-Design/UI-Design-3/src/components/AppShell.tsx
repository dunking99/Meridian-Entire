import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { useApp, type PortfolioTab, type Section } from "@/app/state";
import { HOLDINGS, TOTAL_VALUE, DAY_PL_PCT, AS_OF } from "@/data/portfolio";
import { SIGNALS } from "@/data/signals";
import { fmtUSD0, fmtPct, clsTone } from "@/lib/format";
import {
  IconCompass, IconPie, IconCandles, IconNews, IconFlask, IconPen, IconGear, IconSearch,
  IconEye, IconEyeOff, IconSpark, IconLayers, IconActivity, IconScale, IconCoins, IconTarget, IconAlert, IconX,
} from "@/components/ui/icons";
import { Pill } from "@/components/ui/Primitives";

const NAV: { id: Section; label: string; icon: typeof IconPie }[] = [
  { id: "portfolio", label: "Portfolio", icon: IconPie },
  { id: "markets", label: "Markets", icon: IconCandles },
  { id: "news", label: "News", icon: IconNews },
  { id: "research", label: "Research", icon: IconFlask },
  { id: "journal", label: "Journal", icon: IconPen },
];

export const TABS: { id: PortfolioTab; label: string; icon: typeof IconPie; hint: string }[] = [
  { id: "overview", label: "Overview", icon: IconCompass, hint: "The whole book at a glance" },
  { id: "holdings", label: "Holdings", icon: IconLayers, hint: "Every position, lot and P&L" },
  { id: "performance", label: "Performance", icon: IconActivity, hint: "Returns, risk and attribution" },
  { id: "allocation", label: "Allocation", icon: IconScale, hint: "Exposure, drift and rebalancing" },
  { id: "income", label: "Income", icon: IconCoins, hint: "Dividends, interest and yield" },
  { id: "activity", label: "Activity", icon: IconTarget, hint: "Transactions, cash flow and tax" },
  { id: "signals", label: "Signals", icon: IconSpark, hint: "Cross-checks against news and research" },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-4">
      <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-acc/25 to-violet/20 ring-1 ring-inset ring-white/10">
        <IconCompass className="text-acc" size={17} />
      </div>
      <div className="leading-none">
        <div className="text-[13px] font-semibold tracking-[0.18em] text-mist-100">MERIDIAN</div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-mist-500">Private markets desk</div>
      </div>
    </div>
  );
}

function Sidebar() {
  const { section, tab, go, setTab } = useApp();
  const critical = SIGNALS.filter((s) => s.severity === "critical" || s.severity === "warning").length;

  return (
    <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col border-r border-ink-800 bg-ink-900/70 lg:flex">
      <Logo />
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {NAV.map((n) => {
          const active = section === n.id;
          return (
            <div key={n.id}>
              <button
                onClick={() => go(n.id)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors",
                  active ? "bg-ink-800 text-mist-100" : "text-mist-400 hover:bg-ink-850 hover:text-mist-200",
                )}
              >
                <n.icon className={active ? "text-acc" : "text-mist-500 group-hover:text-mist-300"} size={16} />
                {n.label}
                {n.id === "portfolio" && (
                  <span className="ml-auto rounded bg-acc/15 px-1.5 py-px text-[9px] font-semibold text-acc">
                    LIVE
                  </span>
                )}
              </button>

              {n.id === "portfolio" && active && (
                <div className="relative mb-2 ml-[18px] mt-1 border-l border-ink-750 pl-2.5">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "relative flex w-full items-center gap-2 rounded-md px-2 py-[5px] text-[12px] transition-colors",
                        tab === t.id ? "text-acc" : "text-mist-500 hover:text-mist-200",
                      )}
                    >
                      {tab === t.id && (
                        <span className="absolute -left-[11px] top-1/2 h-4 w-px -translate-y-1/2 bg-acc" />
                      )}
                      {t.label}
                      {t.id === "signals" && critical > 0 && (
                        <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-down/15 px-1 text-[9px] font-semibold text-down">
                          {critical}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-ink-800 p-2">
        <button
          onClick={() => go("settings")}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors",
            section === "settings" ? "bg-ink-800 text-mist-100" : "text-mist-400 hover:bg-ink-850",
          )}
        >
          <IconGear size={16} className="text-mist-500" /> Settings
        </button>
        <div className="mt-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet/40 to-acc/30 text-[10px] font-semibold text-mist-100">
            AK
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[11.5px] font-medium text-mist-200">Alex Kerr</div>
            <div className="truncate text-[9.5px] text-mist-500">Single-user workspace</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setTab, setFocus, go } = useApp();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  if (!open) return null;
  const ql = q.toLowerCase();
  const pages = TABS.filter((t) => t.label.toLowerCase().includes(ql) || t.hint.toLowerCase().includes(ql));
  const names = HOLDINGS.filter(
    (h) => h.ticker.toLowerCase().includes(ql) || h.name.toLowerCase().includes(ql),
  ).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-ink-700 bg-ink-880 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-ink-800 px-3.5 py-3">
          <IconSearch size={15} className="text-mist-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a page, holding or metric…"
            className="w-full bg-transparent text-[13px] text-mist-100 outline-none placeholder:text-mist-500"
          />
          <button onClick={onClose} className="rounded p-1 text-mist-500 hover:text-mist-200">
            <IconX size={14} />
          </button>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {names.length > 0 && (
            <div className="px-2 pb-1 pt-2 text-[10px] uppercase tracking-wider text-mist-500">Holdings</div>
          )}
          {names.map((h) => (
            <button
              key={h.ticker}
              onClick={() => {
                setFocus(h.ticker);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-800"
            >
              <span className="tnum w-12 text-[11px] font-semibold text-acc">{h.ticker}</span>
              <span className="flex-1 truncate text-[12px] text-mist-300">{h.name}</span>
              <span className={cn("tnum text-[11px]", clsTone(h.dayChangePct))}>{fmtPct(h.dayChangePct)}</span>
            </button>
          ))}
          {pages.length > 0 && (
            <div className="px-2 pb-1 pt-2 text-[10px] uppercase tracking-wider text-mist-500">Portfolio pages</div>
          )}
          {pages.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-800"
            >
              <t.icon size={14} className="text-mist-500" />
              <span className="text-[12px] text-mist-200">{t.label}</span>
              <span className="truncate text-[11px] text-mist-500">{t.hint}</span>
            </button>
          ))}
          {"news research markets journal".includes(ql) && ql.length > 1 && (
            <>
              <div className="px-2 pb-1 pt-2 text-[10px] uppercase tracking-wider text-mist-500">Sections</div>
              {NAV.filter((n) => n.label.toLowerCase().includes(ql)).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    go(n.id);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-ink-800"
                >
                  <n.icon size={14} className="text-mist-500" />
                  <span className="text-[12px] text-mist-200">{n.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-ink-800 px-3 py-2 text-[10px] text-mist-500">
          <span>↑↓ to browse · ⏎ to open</span>
          <span>Meridian command bar</span>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onSearch }: { onSearch: () => void }) {
  const { section, tab, privacy, setPrivacy } = useApp();
  const label = section === "portfolio" ? TABS.find((t) => t.id === tab)?.label : section;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <IconCompass className="text-acc" size={18} />
          <span className="text-[12px] font-semibold tracking-[0.16em]">MERIDIAN</span>
        </div>
        <div className="hidden min-w-0 items-center gap-2 text-[12px] lg:flex">
          <span className="capitalize text-mist-500">{section}</span>
          <span className="text-ink-600">/</span>
          <span className="font-medium capitalize text-mist-100">{label}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-ink-800 bg-ink-900 px-2.5 py-1.5 sm:flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-dot absolute inline-flex h-full w-full rounded-full bg-gold" />
            </span>
            <span className="text-[10.5px] text-mist-400">Market closed · {AS_OF}</span>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-ink-800 bg-ink-900 px-3 py-1.5 md:flex">
            <span className="text-[10px] uppercase tracking-wider text-mist-500">Net worth</span>
            <span className="tnum text-[12.5px] font-semibold text-mist-100">{fmtUSD0(TOTAL_VALUE)}</span>
            <span className={cn("tnum text-[11px]", clsTone(DAY_PL_PCT))}>{fmtPct(DAY_PL_PCT)}</span>
          </div>

          <button
            onClick={onSearch}
            className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-900 px-2.5 py-1.5 text-mist-500 transition-colors hover:text-mist-200"
          >
            <IconSearch size={14} />
            <span className="hidden text-[11px] sm:block">Search</span>
            <kbd className="hidden rounded border border-ink-700 px-1 text-[9px] text-mist-500 sm:block">⌘K</kbd>
          </button>

          <button
            onClick={() => setPrivacy(!privacy)}
            title="Privacy mode"
            className="rounded-lg border border-ink-800 bg-ink-900 p-2 text-mist-500 transition-colors hover:text-mist-200"
          >
            {privacy ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileTabs() {
  const { tab, setTab, section, go } = useApp();
  return (
    <div className="lg:hidden">
      <div className="flex gap-1 overflow-x-auto border-b border-ink-800 bg-ink-950 px-3 py-2">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => go(n.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium",
              section === n.id ? "bg-ink-800 text-mist-100" : "text-mist-500",
            )}
          >
            <n.icon size={13} className={section === n.id ? "text-acc" : ""} />
            {n.label}
          </button>
        ))}
      </div>
      {section === "portfolio" && (
        <div className="flex gap-1 overflow-x-auto border-b border-ink-800 bg-ink-900/60 px-3 py-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-[11.5px] font-medium",
                tab === t.id ? "bg-ink-800 text-acc" : "text-mist-500",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [cmd, setCmd] = useState(false);
  const { privacy } = useApp();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
      }
      if (e.key === "Escape") setCmd(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div
      className={cn("flex min-h-screen bg-ink-950", privacy && "privacy-on")}
      style={{
        backgroundImage:
          "radial-gradient(70% 45% at 18% -8%, rgba(99,230,210,0.06), transparent 62%), radial-gradient(55% 40% at 92% -6%, rgba(168,148,250,0.055), transparent 60%)",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onSearch={() => setCmd(true)} />
        <MobileTabs />
        <main className="flex-1 px-4 pb-16 pt-5 sm:px-6">{children}</main>
        <footer className="border-t border-ink-800 px-6 py-4 text-[10px] text-mist-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Meridian · simulated data for design purposes · prices delayed</span>
            <span className="flex items-center gap-3">
              <Pill tone="neutral">
                <IconAlert size={10} /> Not investment advice
              </Pill>
              <span>v2.4.0</span>
            </span>
          </div>
        </footer>
      </div>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} />
    </div>
  );
}
