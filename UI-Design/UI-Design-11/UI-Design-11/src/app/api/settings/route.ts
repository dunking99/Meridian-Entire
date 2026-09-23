import { db } from "@/db";
import { settings } from "@/db/schema";
import { setSetting, getSetting } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(settings);
  return Response.json({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { key?: string; value?: unknown };
  if (!body.key) return Response.json({ ok: false, error: "key required" }, { status: 400 });
  await setSetting(body.key, body.value);
  const saved = await getSetting(body.key, null);
  return Response.json({ ok: true, key: body.key, value: saved });
}
