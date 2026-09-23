import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { refreshQuotes } from "@/lib/market-data";
import { getAlerts } from "@/lib/queries";
import { eq } from "drizzle-orm";

/**
 * Cron-friendly endpoint: refresh quotes, evaluate alerts, stamp triggeredAt.
 * Hook a scheduler or a notification sender here later.
 */
export async function POST() {
  await refreshQuotes();
  const all = await getAlerts();
  const fired = all.filter((a) => a.active && a.firing);
  for (const a of fired) {
    if (!a.triggeredAt) await db.update(alerts).set({ triggeredAt: new Date() }).where(eq(alerts.id, a.id));
  }
  return NextResponse.json({ evaluated: all.length, firing: fired.map((a) => ({ id: a.id, symbol: a.instrument.symbol, condition: a.condition, threshold: a.threshold, note: a.note })) });
}
