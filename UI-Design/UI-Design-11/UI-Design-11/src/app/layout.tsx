import type { Metadata } from "next";

import "./globals.css";
import AppShell from "@/components/AppShell";
import BootstrapGate from "@/components/BootstrapGate";
import { countRows } from "@/lib/bootstrap";
import { recentSyncs } from "@/lib/sync";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meridian — Personal Financial Terminal",
  description: "Single-user investment dashboard: portfolio, performance, allocation, markets, risk, income.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let ready = false;
  let lastSync: string | null = null;
  try {
    const [prices, txns, logs] = await Promise.all([countRows("prices"), countRows("transactions"), recentSyncs(1)]);
    ready = prices > 0 && txns > 0;
    lastSync = logs[0]?.finishedAt ? new Date(logs[0].finishedAt).toISOString() : null;
  } catch {
    ready = false;
  }

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AppShell lastSync={lastSync}>{children}</AppShell>
        <BootstrapGate ready={ready} />
      </body>
    </html>
  );
}
