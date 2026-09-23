import Link from "next/link";
import { NoteForm } from "@/components/note-form";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewNotePage({ searchParams }: { searchParams: Promise<{ symbols?: string; title?: string; kind?: string }> }) {
  const { symbols = "", title = "", kind = "memo" } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/research" className="text-xs text-slate-500 hover:underline">← Research</Link>
      <h1 className="mb-4 mt-2 text-2xl font-semibold">New note</h1>
      <Card>
        <NoteForm defaultSymbols={symbols} defaultTitle={title} defaultKind={kind} />
      </Card>
    </div>
  );
}
