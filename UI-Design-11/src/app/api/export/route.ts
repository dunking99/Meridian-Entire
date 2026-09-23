import { getAllTransactions } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getAllTransactions();
  const header = "day,symbol,kind,quantity,price,fee,currency,note\n";
  const body = rows
    .map((r) =>
      [r.day, r.symbol, r.kind, r.quantity, r.price, r.fee, r.currency, `"${(r.note ?? "").replace(/"/g, '""')}"`].join(","),
    )
    .join("\n");
  return new Response(header + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="meridian-ledger-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
