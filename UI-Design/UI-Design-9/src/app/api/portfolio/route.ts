import { NextResponse } from "next/server";
import { getPortfolioSummary } from "@/lib/queries";

export async function GET() {
  const s = await getPortfolioSummary();
  return NextResponse.json(s);
}
