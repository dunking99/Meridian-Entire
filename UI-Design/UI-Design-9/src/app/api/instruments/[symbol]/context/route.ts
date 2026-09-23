import { NextResponse } from "next/server";
import { getInstrumentContext } from "@/lib/queries";

/** Everything the app knows about one ticker, across all domains. */
export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const ctx = await getInstrumentContext(symbol);
  if (!ctx) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(ctx);
}
