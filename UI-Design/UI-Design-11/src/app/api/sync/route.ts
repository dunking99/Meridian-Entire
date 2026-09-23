import { recentSyncs, syncSymbols, trackedSymbols, universeTargets, type SyncTarget } from "@/lib/sync";
import { writeSnapshot } from "@/lib/portfolio";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const logs = await recentSyncs(10);
  return Response.json({ logs });
}

export async function POST(request: Request) {
  let body: { scope?: string; symbols?: string[]; range?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* defaults */
  }
  const scope = body.scope ?? "tracked";
  const range = body.range ?? "5y";

  let targets: SyncTarget[] = [];
  if (scope === "universe") targets = universeTargets(false);
  else if (scope === "boards") targets = universeTargets(true);
  else if (scope === "custom" && body.symbols?.length) {
    const all = await trackedSymbols();
    const map = new Map(all.map((t) => [t.symbol, t]));
    targets = body.symbols.map((s) => map.get(s) ?? { symbol: s, yahooSymbol: s, assetClass: "equity" });
  } else targets = await trackedSymbols();

  const result = await syncSymbols(targets, range);
  const snapshot = await writeSnapshot("post-sync");
  const logs = await recentSyncs(5);

  return Response.json({
    ok: true,
    scope,
    ...result,
    totalValue: snapshot.totalValue,
    logs,
  });
}
