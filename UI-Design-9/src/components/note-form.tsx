import { btnCls, btnGhost, inputCls } from "@/components/ui";
import { createNote, deleteNote, updateNote } from "@/lib/actions";
import type { ResearchNote } from "@/db/schema";

export function NoteForm({
  note,
  defaultSymbols = "",
  defaultTitle = "",
  defaultKind = "memo",
}: {
  note?: ResearchNote;
  defaultSymbols?: string;
  defaultTitle?: string;
  defaultKind?: string;
}) {
  return (
    <form action={note ? updateNote : createNote} className="space-y-3 text-sm">
      {note && <input type="hidden" name="id" value={note.id} />}
      <div>
        <label className="mb-1 block text-xs text-slate-500">Title</label>
        <input name="title" required className={inputCls} defaultValue={note?.title ?? defaultTitle} placeholder="NVDA: AI capex cycle thesis" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Kind</label>
          <select name="kind" className={inputCls} defaultValue={note?.kind ?? defaultKind}>
            {["thesis", "memo", "earnings", "journal"].map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Stance</label>
          <select name="stance" className={inputCls} defaultValue={note?.stance ?? "neutral"}>
            {["bullish", "neutral", "bearish"].map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        {note && (
          <div>
            <label className="mb-1 block text-xs text-slate-500">Status</label>
            <select name="status" className={inputCls} defaultValue={note.status}>
              <option>open</option><option>closed</option>
            </select>
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Linked instruments (comma-separated symbols)</label>
        <input name="symbols" className={`${inputCls} font-mono uppercase`} defaultValue={defaultSymbols} placeholder="NVDA, MSFT" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Body (markdown-ish)</label>
        <textarea name="body" required rows={14} className={`${inputCls} font-mono`} defaultValue={note?.body} placeholder={"## Thesis\n\n## What would change my mind\n\n## Position sizing"} />
      </div>
      <div className="flex gap-2">
        <button className={btnCls}>{note ? "Save changes" : "Create note"}</button>
        {note && (
          <button formAction={deleteNote} className={`${btnGhost} text-rose-700`}>Delete</button>
        )}
      </div>
    </form>
  );
}
