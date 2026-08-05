"use client";

import { useSyncExternalStore } from "react";
import type { MeasurementType, WorkOrderAttachment, WorkOrderMeasurement, WorkOrderNote } from "./types";
import { FileStorageError, indexedDbFileStorage } from "./indexeddb-file-storage";

export const JOB_INTELLIGENCE_KEY = "quotiq.jobIntelligence";
let activeUserScope = "";
const storageKey = () => activeUserScope ? `${JOB_INTELLIGENCE_KEY}.${activeUserScope}` : JOB_INTELLIGENCE_KEY;
const CURRENT_VERSION = 1;

interface Store { version: number; measurements: WorkOrderMeasurement[]; notes: WorkOrderNote[]; attachments: WorkOrderAttachment[] }
const EMPTY: Store = { version: CURRENT_VERSION, measurements: [], notes: [], attachments: [] };
let cachedRaw: string | null | undefined;
let cached: Store = EMPTY;
const listeners = new Set<() => void>();

export class JobIntelligenceError extends Error {
  constructor(message: string) { super(message); this.name = "JobIntelligenceError"; }
}

function migrate(value: unknown): Store {
  if (!value || typeof value !== "object") return EMPTY;
  const record = value as Partial<Store>;
  return {
    version: CURRENT_VERSION,
    measurements: Array.isArray(record.measurements) ? record.measurements : [],
    notes: Array.isArray(record.notes) ? record.notes : [],
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
  };
}

function snapshot(): Store {
  const raw = localStorage.getItem(storageKey());
  if (raw !== cachedRaw) {
    try { cached = raw ? migrate(JSON.parse(raw)) : EMPTY; cachedRaw = raw; }
    catch { throw new JobIntelligenceError("Saved job-site data could not be read."); }
  }
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => { if (event.key === storageKey()) listener(); };
  addEventListener("storage", storage);
  return () => { listeners.delete(listener); removeEventListener("storage", storage); };
}

function write(next: Store) {
  try { localStorage.setItem(storageKey(), JSON.stringify(next)); }
  catch { throw new JobIntelligenceError("Job-site metadata could not be saved. Browser storage may be full."); }
  cachedRaw = undefined;
  snapshot();
  listeners.forEach((listener) => listener());
}

const positive = (value: number | undefined, label: string) => {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new JobIntelligenceError(`${label} must be zero or greater.`);
};

export interface MeasurementInput { type: MeasurementType; label: string; value?: number; unit: string; width?: number; height?: number; quantity?: number; notes?: string }
export function calculateMeasurementArea(input: Pick<MeasurementInput, "width" | "height" | "quantity">): number {
  return (input.width ?? 0) * (input.height ?? 0) * (input.quantity ?? 1);
}

export function addMeasurement(workOrderId: string, input: MeasurementInput) {
  if (!input.label.trim()) throw new JobIntelligenceError("Measurement label is required.");
  positive(input.value, "Value"); positive(input.width, "Width"); positive(input.height, "Height"); positive(input.quantity, "Quantity");
  const measurement: WorkOrderMeasurement = { id: crypto.randomUUID(), workOrderId, ...input, label: input.label.trim(), unit: input.unit.trim(), quantity: input.quantity ?? 1, notes: input.notes?.trim() || undefined, createdAt: new Date().toISOString() };
  const store = snapshot(); write({ ...store, measurements: [...store.measurements, measurement] }); return measurement;
}
export function deleteMeasurement(id: string) { const store = snapshot(); write({ ...store, measurements: store.measurements.filter((item) => item.id !== id) }); }

export function addNote(workOrderId: string, body: string, visibility: WorkOrderNote["visibility"]) {
  if (!body.trim()) throw new JobIntelligenceError("Note text is required.");
  const now = new Date().toISOString(); const note: WorkOrderNote = { id: crypto.randomUUID(), workOrderId, body: body.trim(), visibility, createdAt: now, updatedAt: now };
  const store = snapshot(); write({ ...store, notes: [...store.notes, note] }); return note;
}
export function updateNote(id: string, body: string, visibility: WorkOrderNote["visibility"]) {
  if (!body.trim()) throw new JobIntelligenceError("Note text is required.");
  const store = snapshot(); const note = store.notes.find((item) => item.id === id); if (!note) throw new JobIntelligenceError("Note not found.");
  const saved = { ...note, body: body.trim(), visibility, updatedAt: new Date().toISOString() };
  write({ ...store, notes: store.notes.map((item) => item.id === id ? saved : item) }); return saved;
}
export function deleteNote(id: string) { const store = snapshot(); write({ ...store, notes: store.notes.filter((item) => item.id !== id) }); }

export async function addAttachment(workOrderId: string, kind: WorkOrderAttachment["kind"], file: File, text?: string) {
  if (!file.size) throw new JobIntelligenceError("Choose a non-empty file.");
  const attachment: WorkOrderAttachment = { id: crypto.randomUUID(), workOrderId, kind, fileName: file.name, mimeType: file.type || "application/octet-stream", size: file.size, uploadedAt: new Date().toISOString(), ...(kind === "photo" ? { caption: text?.trim() || undefined } : { description: text?.trim() || undefined }) };
  try { await indexedDbFileStorage.put(attachment.id, file); const store = snapshot(); write({ ...store, attachments: [...store.attachments, attachment] }); return attachment; }
  catch (error) { try { await indexedDbFileStorage.delete(attachment.id); } catch {} throw error instanceof FileStorageError ? new JobIntelligenceError(error.message) : error; }
}
export async function updateAttachmentText(id: string, text: string) { const store = snapshot(); const found = store.attachments.find((item) => item.id === id); if (!found) throw new JobIntelligenceError("Attachment not found."); const saved = { ...found, ...(found.kind === "photo" ? { caption: text.trim() || undefined } : { description: text.trim() || undefined }) }; write({ ...store, attachments: store.attachments.map((item) => item.id === id ? saved : item) }); return saved; }
export async function deleteAttachment(id: string) { await indexedDbFileStorage.delete(id); const store = snapshot(); write({ ...store, attachments: store.attachments.filter((item) => item.id !== id) }); }
export const getAttachmentFile = (id: string) => indexedDbFileStorage.get(id);

export function useJobIntelligence(workOrderId: string) {
  const store = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  return {
    measurements: store.measurements.filter((item) => item.workOrderId === workOrderId),
    notes: store.notes.filter((item) => item.workOrderId === workOrderId),
    attachments: store.attachments.filter((item) => item.workOrderId === workOrderId),
  };
}
export function getJobIntelligence(workOrderId: string) { const store = snapshot(); return { measurements: store.measurements.filter((item) => item.workOrderId === workOrderId), notes: store.notes.filter((item) => item.workOrderId === workOrderId), attachments: store.attachments.filter((item) => item.workOrderId === workOrderId) }; }
export function resetJobIntelligenceCacheForTests() { activeUserScope = ""; cachedRaw = undefined; cached = EMPTY; }
export function setJobIntelligenceUserScope(userId: string) { if (activeUserScope === userId) return; activeUserScope = userId; cachedRaw = undefined; cached = EMPTY; }
