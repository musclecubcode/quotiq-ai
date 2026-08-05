"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Field";
import { addNote, deleteNote, updateNote } from "@/lib/job-intelligence-repository";
import { formatDate } from "@/lib/utils";
import type { WorkOrderNote } from "@/lib/types";

export function WorkOrderNotes({ workOrderId, notes }: { workOrderId: string; notes: WorkOrderNote[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const body = String(data.get("body")); const visibility = String(data.get("visibility")) as WorkOrderNote["visibility"]; try { if (editing) { updateNote(editing, body, visibility); setEditing(null); } else addNote(workOrderId, body, visibility); form.reset(); setError(null); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save note."); } }
  const current = notes.find((note) => note.id === editing);
  return <div className="grid gap-5 lg:grid-cols-3"><Card className="p-5"><h2 className="font-semibold">{editing ? "Edit note" : "Add note"}</h2><form key={editing ?? "new"} onSubmit={submit} className="mt-4 space-y-3"><textarea aria-label="Note text" name="body" rows={5} defaultValue={current?.body} className={inputClass} required /><select aria-label="Note visibility" name="visibility" defaultValue={current?.visibility ?? "internal"} className={inputClass}><option value="internal">Internal</option><option value="client">Client-facing</option></select>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="flex gap-2"><Button type="submit">{editing ? "Save Note" : "Add Note"}</Button>{editing && <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>}</div></form></Card><Card className="p-5 lg:col-span-2"><h2 className="font-semibold">Work Order notes</h2>{notes.length === 0 ? <p className="mt-6 text-sm text-slate-500">No timestamped notes yet.</p> : <ul className="mt-4 divide-y divide-slate-100">{[...notes].reverse().map((note) => <li key={note.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className={note.visibility === "internal" ? "rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700" : "rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"}>{note.visibility === "internal" ? "Internal" : "Client-facing"}</span><span className="text-xs text-slate-400">{formatDate(note.updatedAt)}</span></div><p className="mt-2 whitespace-pre-line text-sm">{note.body}</p><div className="mt-3 flex gap-2"><Button type="button" variant="secondary" onClick={() => setEditing(note.id)}>Edit</Button><Button type="button" variant="secondary" onClick={() => { try { deleteNote(note.id); setError(null); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete note."); } }}>Delete</Button></div></li>)}</ul>}</Card></div>;
}
