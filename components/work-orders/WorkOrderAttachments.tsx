"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Field";
import { addAttachment, deleteAttachment, getAttachmentFile, updateAttachmentText } from "@/lib/job-intelligence-repository";
import type { WorkOrderAttachment } from "@/lib/types";

type IconName = "camera" | "image" | "expand" | "trash" | "close" | "upload" | "file";

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    camera: <><path d="M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2h5Z"/><circle cx="12" cy="13" r="3"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-3.5-3.5L8 20"/></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 14v5h14v-5"/></>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}

function useAttachmentUrl(id: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    getAttachmentFile(id).then((blob) => {
      if (active && blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}

function PhotoCard({ attachment, onDelete, onError }: { attachment: WorkOrderAttachment; onDelete: (id: string) => Promise<void>; onError: (message: string) => void }) {
  const url = useAttachmentUrl(attachment.id);
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState(attachment.caption ?? "");

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  async function saveCaption() {
    if (caption.trim() === (attachment.caption ?? "")) return;
    try { await updateAttachmentText(attachment.id, caption); }
    catch (caught) { onError(caught instanceof Error ? caught.message : "Caption could not be saved."); }
  }

  const date = new Date(attachment.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return <>
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {url ? <button type="button" onClick={() => setOpen(true)} className="block h-full w-full cursor-zoom-in" aria-label={`Open photo${attachment.caption ? `: ${attachment.caption}` : ""}`}>
          <Image unoptimized fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" src={url} alt={attachment.caption || "Work Order photo"} className="object-cover transition duration-300 group-hover:scale-[1.02]" />
        </button> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading photo…</div>}
        <div className="absolute right-3 top-3 flex gap-2">
          <button type="button" onClick={() => setOpen(true)} disabled={!url} aria-label="View full screen" className="rounded-full bg-slate-950/65 p-2 text-white backdrop-blur transition hover:bg-slate-950/85 disabled:opacity-50"><Icon name="expand" className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(attachment.id)} aria-label="Delete photo" className="rounded-full bg-slate-950/65 p-2 text-white backdrop-blur transition hover:bg-red-600"><Icon name="trash" className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="p-4">
        <label htmlFor={`caption-${attachment.id}`} className="sr-only">Photo caption</label>
        <input id={`caption-${attachment.id}`} value={caption} onChange={(event) => setCaption(event.target.value)} onBlur={saveCaption} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className="w-full rounded-lg border-0 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0" placeholder="Add a caption…" />
        <p className="mt-1 text-xs text-slate-500">Uploaded {date}</p>
      </div>
    </Card>
    {open && url && <div role="dialog" aria-modal="true" aria-label="Photo preview" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 sm:p-8">
      <button type="button" onClick={() => setOpen(false)} aria-label="Close photo preview" className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><Icon name="close" /></button>
      <div className="flex max-h-full max-w-6xl flex-col items-center gap-4">
        <Image unoptimized width={1600} height={1200} src={url} alt={attachment.caption || "Work Order photo"} className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain" />
        {attachment.caption && <p className="max-w-2xl text-center text-sm text-white">{attachment.caption}</p>}
      </div>
    </div>}
  </>;
}

function PhotoUploader({ workOrderId, busy, setBusy, onError }: { workOrderId: string; busy: boolean; setBusy: (value: boolean) => void; onError: (message: string | null) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function saveFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!images.length) { onError("Choose at least one image."); return; }
    setBusy(true); onError(null);
    try { for (const file of images) await addAttachment(workOrderId, "photo", file); }
    catch (caught) { onError(caught instanceof Error ? caught.message : "Photos could not be saved."); }
    finally { setBusy(false); if (cameraRef.current) cameraRef.current.value = ""; if (libraryRef.current) libraryRef.current.value = ""; }
  }

  return <Card className={`border-2 border-dashed p-5 transition sm:p-7 ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50/60"}`}>
    <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void saveFiles(Array.from(event.dataTransfer.files)); }}>
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><Icon name="upload" /></div>
        <h2 className="mt-3 text-base font-semibold text-slate-900">Add job photos</h2>
        <p className="mt-1 text-sm text-slate-500">Take a new photo on site or select photos from your device.</p>
      </div>
      <div className="mx-auto mt-5 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()} className="flex min-h-20 items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"><Icon name="camera" />Take Photo</button>
        <button type="button" disabled={busy} onClick={() => libraryRef.current?.click()} className="flex min-h-20 items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 font-semibold text-slate-800 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 disabled:opacity-50"><Icon name="image" />Choose Photos</button>
      </div>
      <input ref={cameraRef} aria-label="Take Photo" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => void saveFiles(Array.from(event.target.files ?? []))} />
      <input ref={libraryRef} aria-label="Choose Photos" type="file" accept="image/*" multiple className="sr-only" onChange={(event) => void saveFiles(Array.from(event.target.files ?? []))} />
      <p className="mt-4 hidden text-center text-xs text-slate-400 sm:block">You can also drag and drop photos here</p>
    </div>
  </Card>;
}

function PhotoGallery({ workOrderId, attachments }: { workOrderId: string; attachments: WorkOrderAttachment[] }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function remove(id: string) { try { setError(null); await deleteAttachment(id); } catch (caught) { setError(caught instanceof Error ? caught.message : "Photo could not be deleted."); } }
  return <div className="space-y-6">
    <PhotoUploader workOrderId={workOrderId} busy={busy} setBusy={setBusy} onError={setError} />
    {busy && <p role="status" className="text-center text-sm font-medium text-blue-700">Saving photos…</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {attachments.length === 0 ? <Card className="p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon name="image" /></div><p className="mt-3 font-medium text-slate-700">No job photos yet</p><p className="mt-1 text-sm text-slate-500">Photos added to this Work Order will appear here.</p></Card> : <section aria-label="Work Order photo gallery"><div className="mb-3 flex items-end justify-between"><h2 className="text-base font-semibold text-slate-900">Job photos</h2><p className="text-xs text-slate-500">{attachments.length} {attachments.length === 1 ? "photo" : "photos"}</p></div><div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{attachments.map((item) => <PhotoCard key={item.id} attachment={item} onDelete={remove} onError={setError} />)}</div></section>}
  </div>;
}

function DocumentList({ workOrderId, attachments }: { workOrderId: string; attachments: WorkOrderAttachment[] }) {
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function upload(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const files = data.getAll("files").filter((value): value is File => value instanceof File && value.size > 0); if (!files.length) { setError("Choose at least one document."); return; } setBusy(true); setError(null); try { for (const file of files) await addAttachment(workOrderId, "document", file, String(data.get("text") ?? "")); form.reset(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Upload failed."); } finally { setBusy(false); } }
  async function download(item: WorkOrderAttachment) { const blob = await getAttachmentFile(item.id); if (!blob) { setError("Stored file is missing."); return; } const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = item.fileName; link.click(); URL.revokeObjectURL(url); }
  return <div className="space-y-5"><Card className="p-5"><h2 className="font-semibold">Upload documents</h2><p className="mt-1 text-sm text-slate-500">PDFs, permits, manuals, contracts, receipts, and other non-image files.</p><form onSubmit={upload} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input aria-label="Choose documents" name="files" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.csv,application/pdf" className="block w-full text-sm" /><input aria-label="Description" name="text" className={inputClass} placeholder="Description (optional)" /><Button type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload"}</Button></form>{error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}</Card>{attachments.length === 0 ? <Card className="p-8 text-center text-sm text-slate-500">No documents uploaded.</Card> : <div className="space-y-3">{attachments.map((item) => <Card key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon name="file" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.fileName}</p><p className="mt-1 text-xs text-slate-500">{(item.size / 1024).toFixed(1)} KB · Uploaded {new Date(item.uploadedAt).toLocaleDateString()}</p><input aria-label={`Description for ${item.fileName}`} defaultValue={item.description} onBlur={(event) => updateAttachmentText(item.id, event.target.value)} className={`${inputClass} mt-3`} placeholder="Add description" /></div><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => download(item)}>Download</Button><Button type="button" variant="secondary" onClick={() => deleteAttachment(item.id).catch((caught) => setError(caught instanceof Error ? caught.message : "Delete failed."))}>Delete</Button></div></Card>)}</div>}</div>;
}

export function WorkOrderAttachments({ workOrderId, kind, attachments }: { workOrderId: string; kind: "photo" | "document"; attachments: WorkOrderAttachment[] }) {
  return kind === "photo" ? <PhotoGallery workOrderId={workOrderId} attachments={attachments} /> : <DocumentList workOrderId={workOrderId} attachments={attachments} />;
}
