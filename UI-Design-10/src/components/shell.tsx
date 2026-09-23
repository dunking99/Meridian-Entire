import Link from "next/link";
import type { ReactNode } from "react";
import { CommandPalette, SidebarNav } from "./shell-client";
import { getQuoteBook } from "@/lib/market";
import { fmtPct, fmtNum, toneClass } from "@/lib/format";

const STRIP = ["SPY", "QQQ", "IWM", "US10Y", "VIX", "GLD", "BTC", "WTI", "DXY"];

async function TickerStrip() {
  let quotes: Awaited<ReturnType<typeof getQuoteBook>>;
  try {
    quotes = await getQuoteBook(STRIP);
  } catch {
    return <div className="text-xs text-slate-500">Market data unavailable</div>;
  }
  return (
    <div className="flex items-center gap-3 overflow-x-auto text-xs">
      {quotes.list.map((q) => (
        <Link key={q.instrument.symbol} href={`/markets/${encodeURIComponent(q.instrument.symbol)}`} className="flex shrink-0 items-baseline gap-1.5 hover:opacity-80">
          <span className="font-medium text-slate-400">{q.instrument.symbol}</span>
          <span className="tabular-nums text-slate-200">{fmtNum(q.price, q.price < 100 ? 2 : 2)}</span>
          <span className={`tabular-nums ${toneClass(q.changePct)}`}>{fmtPct(q.changePct, 2)}</span>
        </Link>
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: { href: string; label: string }[];
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {breadcrumb && (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            {breadcrumb.map((b, i) => (
              <span key={b.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-700">/</span>}
                <Link href={b.href} className="hover:text-slate-300">
                  {b.label}
                </Link>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-xs text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-slate-800/80 bg-slate-950/80 lg:block">
        <div className="flex items-center gap-2 border-b border-slate-800/80 px-3 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/15 text-[11px] font-bold text-cyan-300">PB</span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-slate-100">Personal Book</div>
            <div className="text-[10px] text-slate-500">single-user investing OS</div>
          </div>
        </div>
        <SidebarNav />
        <div className="px-3 py-3 text-[10px] leading-relaxed text-slate-600">
          Every page is a view over one entity graph: instruments ← positions, news, research, alerts.
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70 px-4 py-2.5 backdrop-blur lg:px-6">
          <TickerStrip />
          <div className="flex items-center gap-2">
            <Link href="/settings" className="rounded-md border border-slate-800 px-2 py-1 text-[11px] text-slate-400 hover:border-slate-600">
              Data ops
            </Link>
            <CommandPalette />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
