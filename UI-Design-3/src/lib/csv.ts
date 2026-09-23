import { HOLDINGS, TRANSACTIONS, CASH } from "@/data/portfolio";

function download(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => (typeof c === "string" && c.includes(",") ? `"${c}"` : c)).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPositions() {
  const rows: (string | number)[][] = [
    ["Ticker", "Name", "Asset class", "Sector", "Account", "Quantity", "Avg cost", "Price", "Market value", "Cost basis", "Unrealised", "Unrealised %", "Weight %", "Yield %"],
  ];
  HOLDINGS.forEach((h) =>
    rows.push([
      h.ticker, h.name, h.assetClass, h.sector, h.account, h.qty, h.avgCost.toFixed(2), h.price.toFixed(2),
      h.marketValue.toFixed(2), h.costBasis.toFixed(2), h.unrealized.toFixed(2), h.unrealizedPct.toFixed(2),
      h.weight.toFixed(2), h.divYield.toFixed(2),
    ]),
  );
  CASH.forEach((c) => rows.push([c.label, c.kind, "Cash", "Cash", c.account, "", "", "", c.balance.toFixed(2), c.balance.toFixed(2), 0, 0, "", c.apy.toFixed(2)]));
  download("meridian-positions.csv", rows);
}

export function exportLedger() {
  const rows: (string | number)[][] = [["Date", "Type", "Ticker", "Quantity", "Price", "Amount", "Account", "Realised", "Note"]];
  TRANSACTIONS.forEach((t) =>
    rows.push([t.date, t.type, t.ticker ?? "", t.qty ?? "", t.price ?? "", t.amount.toFixed(2), t.account, t.realized?.toFixed(2) ?? "", t.note ?? ""]),
  );
  download("meridian-ledger.csv", rows);
}
