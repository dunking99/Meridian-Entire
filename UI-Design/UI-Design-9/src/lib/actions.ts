"use server";

import { db } from "@/db";
import {
  alerts,
  instruments,
  newsArticles,
  researchNoteInstruments,
  researchNotes,
  transactions,
  watchlistItems,
  watchlists,
} from "@/db/schema";
import { refreshQuotes } from "@/lib/market-data";
import { getDefaultPortfolio } from "@/lib/queries";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

async function resolveInstrumentIds(symbolsCsv: string) {
  const syms = symbolsCsv
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (!syms.length) return [];
  const rows = await db.select({ id: instruments.id, symbol: instruments.symbol }).from(instruments);
  const map = new Map(rows.map((r) => [r.symbol, r.id]));
  return syms.map((s) => map.get(s)).filter((x): x is number => x != null);
}

function revalidateAll() {
  for (const p of ["/", "/portfolio", "/portfolio/holdings", "/portfolio/transactions", "/portfolio/allocation", "/markets", "/news", "/research", "/alerts", "/watchlists"]) {
    revalidatePath(p);
  }
  revalidatePath("/markets/[symbol]", "page");
  revalidatePath("/news/[id]", "page");
  revalidatePath("/research/[id]", "page");
}

// ---------- Portfolio ----------
export async function addTransaction(fd: FormData) {
  const portfolio = await getDefaultPortfolio();
  const type = str(fd, "type");
  const symbol = str(fd, "symbol").toUpperCase();
  const isCashOnly = type === "deposit" || type === "withdrawal";
  let instrumentId: number | null = null;
  if (!isCashOnly && symbol) {
    const [inst] = await db.select({ id: instruments.id }).from(instruments).where(eq(instruments.symbol, symbol));
    if (!inst) throw new Error(`Unknown symbol ${symbol}`);
    instrumentId = inst.id;
  }
  const amount = str(fd, "amount");
  await db.insert(transactions).values({
    portfolioId: portfolio.id,
    instrumentId,
    type,
    quantity: isCashOnly ? "1" : str(fd, "quantity") || "0",
    price: isCashOnly ? amount || "0" : str(fd, "price") || "0",
    fees: str(fd, "fees") || "0",
    tradedAt: str(fd, "tradedAt") ? new Date(str(fd, "tradedAt")) : new Date(),
    note: str(fd, "note") || null,
  });
  revalidateAll();
  const back = str(fd, "redirectTo");
  if (back) redirect(back);
}

export async function deleteTransaction(fd: FormData) {
  await db.delete(transactions).where(eq(transactions.id, Number(fd.get("id"))));
  revalidateAll();
}

// ---------- Market data ----------
export async function refreshQuotesAction() {
  await refreshQuotes();
  revalidateAll();
}

// ---------- Watchlists ----------
export async function createWatchlist(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  await db.insert(watchlists).values({ name });
  revalidateAll();
}

export async function addToWatchlist(fd: FormData) {
  const watchlistId = Number(fd.get("watchlistId"));
  const symbol = str(fd, "symbol").toUpperCase();
  const [inst] = await db.select({ id: instruments.id }).from(instruments).where(eq(instruments.symbol, symbol));
  if (!inst || !watchlistId) return;
  await db
    .insert(watchlistItems)
    .values({ watchlistId, instrumentId: inst.id, note: str(fd, "note") || null })
    .onConflictDoNothing();
  revalidateAll();
}

export async function removeFromWatchlist(fd: FormData) {
  await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.watchlistId, Number(fd.get("watchlistId"))), eq(watchlistItems.instrumentId, Number(fd.get("instrumentId")))));
  revalidateAll();
}

// ---------- News ----------
export async function toggleSaveArticle(fd: FormData) {
  const id = Number(fd.get("id"));
  const [row] = await db.select({ saved: newsArticles.saved }).from(newsArticles).where(eq(newsArticles.id, id));
  if (!row) return;
  await db.update(newsArticles).set({ saved: !row.saved }).where(eq(newsArticles.id, id));
  revalidateAll();
}

// ---------- Research ----------
export async function createNote(fd: FormData) {
  const title = str(fd, "title");
  const body = str(fd, "body");
  if (!title || !body) return;
  const [note] = await db
    .insert(researchNotes)
    .values({ title, body, kind: str(fd, "kind") || "memo", stance: str(fd, "stance") || "neutral" })
    .returning({ id: researchNotes.id });
  const ids = await resolveInstrumentIds(str(fd, "symbols"));
  if (ids.length) await db.insert(researchNoteInstruments).values(ids.map((instrumentId) => ({ noteId: note.id, instrumentId })));
  revalidateAll();
  redirect(`/research/${note.id}`);
}

export async function updateNote(fd: FormData) {
  const id = Number(fd.get("id"));
  await db
    .update(researchNotes)
    .set({
      title: str(fd, "title"),
      body: str(fd, "body"),
      kind: str(fd, "kind") || "memo",
      stance: str(fd, "stance") || "neutral",
      status: str(fd, "status") || "open",
      updatedAt: new Date(),
    })
    .where(eq(researchNotes.id, id));
  await db.delete(researchNoteInstruments).where(eq(researchNoteInstruments.noteId, id));
  const ids = await resolveInstrumentIds(str(fd, "symbols"));
  if (ids.length) await db.insert(researchNoteInstruments).values(ids.map((instrumentId) => ({ noteId: id, instrumentId })));
  revalidateAll();
  redirect(`/research/${id}`);
}

export async function deleteNote(fd: FormData) {
  await db.delete(researchNotes).where(eq(researchNotes.id, Number(fd.get("id"))));
  revalidateAll();
  redirect("/research");
}

// ---------- Alerts ----------
export async function createAlert(fd: FormData) {
  const symbol = str(fd, "symbol").toUpperCase();
  const [inst] = await db.select({ id: instruments.id }).from(instruments).where(eq(instruments.symbol, symbol));
  if (!inst) return;
  await db.insert(alerts).values({
    instrumentId: inst.id,
    condition: str(fd, "condition") || "price_above",
    threshold: str(fd, "threshold") || "0",
    note: str(fd, "note") || null,
  });
  revalidateAll();
}

export async function toggleAlert(fd: FormData) {
  const id = Number(fd.get("id"));
  const [row] = await db.select({ active: alerts.active }).from(alerts).where(eq(alerts.id, id));
  if (!row) return;
  await db.update(alerts).set({ active: !row.active }).where(eq(alerts.id, id));
  revalidateAll();
}

export async function deleteAlert(fd: FormData) {
  await db.delete(alerts).where(eq(alerts.id, Number(fd.get("id"))));
  revalidateAll();
}
