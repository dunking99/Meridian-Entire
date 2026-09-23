import { runBootstrap, countRows } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const [prices, instruments, txns] = await Promise.all([
    countRows("prices"),
    countRows("instruments"),
    countRows("transactions"),
  ]);
  return Response.json({ ready: prices > 0 && txns > 0, prices, instruments, transactions: txns });
}

export async function POST() {
  const result = await runBootstrap();
  return Response.json({ ok: true, ...result });
}
