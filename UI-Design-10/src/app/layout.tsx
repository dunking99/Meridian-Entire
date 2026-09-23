import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/shell";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Personal Book — markets & investing OS",
  description:
    "Single-user markets terminal: portfolio, research, news, watchlists and alerts over one linked entity graph.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  try {
    await ensureSeeded();
  } catch (error) {
    console.error("[bootstrap] skipped", error);
  }
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
