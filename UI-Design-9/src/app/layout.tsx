import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SideNav } from "@/components/nav";
import { refreshQuotesAction } from "@/lib/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ledger — Markets & Investing",
  description: "Personal markets, portfolio, news and research workspace.",
};

async function goToSymbol(fd: FormData) {
  "use server";
  const q = String(fd.get("q") ?? "").trim().toUpperCase();
  if (q) redirect(`/markets/${encodeURIComponent(q)}`);
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-slate-900 py-4 md:flex">
            <Link href="/" className="mb-6 px-5 text-lg font-semibold tracking-tight text-white">
              Ledger<span className="text-emerald-400">.</span>
            </Link>
            <SideNav />
            <div className="mt-auto px-5 text-[11px] text-slate-500">Single-user · local data</div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
              <form action={goToSymbol} className="flex-1 max-w-md">
                <input
                  name="q"
                  placeholder="Jump to ticker (e.g. NVDA)…"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                  autoComplete="off"
                />
              </form>
              <form action={refreshQuotesAction}>
                <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  ↻ Refresh quotes
                </button>
              </form>
            </header>
            <main className="flex-1 px-6 py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
