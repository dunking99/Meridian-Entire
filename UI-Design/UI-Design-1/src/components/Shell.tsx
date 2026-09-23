import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

const NAV = [
  { key: "portfolio", label: "Portfolio", icon: "◧", active: true },
  { key: "markets", label: "Markets", icon: "◈" },
  { key: "news", label: "News", icon: "❏" },
  { key: "research", label: "Research", icon: "◎" },
  { key: "screener", label: "Screener", icon: "⌗" },
  { key: "watchlist", label: "Watchlist", icon: "★" },
];

const SUB: Record<string, string[]> = {
  portfolio: ["Holdings", "X-Ray", "Performance", "Analysis", "Allocate", "Rebuild"],
};

export function Shell({ children, activeSub, onSub }: { children: ReactNode; activeSub: string; onSub: (s: string) => void }) {
  const [nav, setNav] = useState("portfolio");
  const now = new Date();

  return (
    <div className="flex h-full min-h-screen bg-[#060709] text-zinc-200">
      {/* rail */}
      <aside className="sticky top-0 hidden h-screen w-[208px] shrink-0 flex-col border-r border-white/[0.06] bg-[#08090c] lg:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-300 via-emerald-400 to-teal-600 shadow-[0_6px_20px_-8px_rgba(45,212,191,0.8)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-950" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M3 17l5-6 4 4 4-7 5 5" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold tracking-tight text-zinc-50">Meridian</div>
            <div className="mt-0.5 text-[9px] tracking-[0.16em] text-zinc-600 uppercase">Private markets desk</div>
          </div>
        </div>

        <nav className="mt-1 flex-1 space-y-0.5 px-2">
          {NAV.map((n) => (
            <div key={n.key}>
              <button
                onClick={() => setNav(n.key)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] transition",
                  nav === n.key ? "bg-white/[0.07] text-zinc-50" : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300",
                )}
              >
                <span className={cn("w-3.5 text-center text-[11px]", nav === n.key ? "text-teal-300" : "text-zinc-600 group-hover:text-zinc-400")}>{n.icon}</span>
                {n.label}
                {!n.active && <span className="ml-auto text-[9px] text-zinc-700">—</span>}
              </button>
              {nav === n.key && SUB[n.key] && (
                <div className="mt-0.5 mb-1 ml-[22px] space-y-px border-l border-white/[0.07] pl-2.5">
                  {SUB[n.key].map((s) => (
                    <button
                      key={s}
                      onClick={() => onSub(s.toLowerCase().replace("-", ""))}
                      className={cn(
                        "block w-full rounded px-2 py-[5px] text-left text-[11.5px] transition",
                        activeSub === s.toLowerCase().replace("-", "")
                          ? "text-teal-300"
                          : "text-zinc-600 hover:text-zinc-300",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10.5px] font-medium text-zinc-300">Feeds connected</span>
            </div>
            <p className="mt-1 text-[9.5px] leading-relaxed text-zinc-600">
              Prices · fund composition · news. Last sync {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.
            </p>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {nav === "portfolio" ? children : <Placeholder section={NAV.find((n) => n.key === nav)!} onBack={() => setNav("portfolio")} />}
      </main>
    </div>
  );
}

const BLURB: Record<string, string> = {
  markets: "Index levels, rates, curves and cross-asset moves — with every instrument you hold flagged inline.",
  news: "The feed, filtered against your book. Each story is checked for exposure: which holdings it touches, how much weight sits behind it, and whether it changes a thesis.",
  research: "Company and fund deep-dives, screeners and precedent studies. Anything you save here becomes a note on the relevant holding.",
  screener: "Factor and fundamental screens across the tracked universe. Results feed straight into the Allocate candidate list.",
  watchlist: "Names you are tracking but do not own — scored on the same axes as your holdings so the comparison is fair.",
};

function Placeholder({ section, onBack }: { section: { key: string; label: string; icon: string }; onBack: () => void }) {
  return (
    <div className="grid-noise flex min-h-screen items-center justify-center p-8">
      <div className="anim-in max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[18px] text-zinc-500">
          {section.icon}
        </div>
        <h2 className="mt-4 text-[17px] font-semibold tracking-tight text-zinc-100">{section.label}</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{BLURB[section.key]}</p>
        <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
          This area sits outside the current build. The cross-referencing layer it feeds — news matched against holdings, screener results matched
          against conviction — is already wired into Portfolio.
        </p>
        <button
          onClick={onBack}
          className="mt-5 rounded-lg border border-teal-400/25 bg-teal-400/[0.07] px-3.5 py-2 text-[11.5px] font-medium text-teal-200 transition hover:border-teal-400/45"
        >
          ← Back to Portfolio
        </button>
      </div>
    </div>
  );
}
