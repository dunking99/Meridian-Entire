import type { ReactNode } from "react";
import { SubNav } from "@/components/nav";
import { PageHeader } from "@/components/ui";

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <PageHeader title="Portfolio" subtitle="Positions are derived from your transaction ledger — the ledger is the source of truth." />
      <SubNav
        items={[
          { href: "/portfolio", label: "Overview" },
          { href: "/portfolio/holdings", label: "Holdings" },
          { href: "/portfolio/allocation", label: "Allocation" },
          { href: "/portfolio/transactions", label: "Transactions" },
        ]}
      />
      {children}
    </div>
  );
}
