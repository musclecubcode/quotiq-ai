"use client";

/**
 * Real, persisted Work Order storage — backed by the browser's
 * localStorage, mirroring lib/client-storage.ts. Separate from the demo
 * `workOrders` fixture in lib/data.ts, which still backs the Dashboard,
 * Estimates, Invoices, and AI Assistant screens. The Work Orders list page
 * merges both sources; see app/(dashboard)/jobs/page.tsx.
 */
import { useSyncExternalStore } from "react";
import type {
  WorkOrder,
  WorkOrderCategory,
  WorkOrderPriority,
  WorkOrderStatus,
} from "./types";
import { categoryLabel } from "./work-order-options";

const STORAGE_KEY = "quotiq.workOrders";

export interface NewWorkOrderInput {
  clientId: string;
  serviceAddress: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  description: string;
  scheduledDate: string;
  internalNotes?: string;
}

const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) emitChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

let cachedRaw: string | null | undefined;
let cachedWorkOrders: WorkOrder[] = [];

function getSnapshot(): WorkOrder[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedWorkOrders = raw ? (JSON.parse(raw) as WorkOrder[]) : [];
  }
  return cachedWorkOrders;
}

function getServerSnapshot(): WorkOrder[] {
  return [];
}

function writeAll(workOrders: WorkOrder[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workOrders));
  emitChange();
}

export function createStoredWorkOrder(input: NewWorkOrderInput): WorkOrder {
  const workOrder: WorkOrder = {
    id: crypto.randomUUID(),
    clientId: input.clientId,
    title: `${categoryLabel(input.category)} — ${input.serviceAddress}`,
    category: input.category,
    priority: input.priority,
    serviceAddress: input.serviceAddress,
    description: input.description,
    internalNotes: input.internalNotes,
    status: input.status,
    startDate: input.scheduledDate,
    endDate: input.scheduledDate,
    budget: 0,
    progress: 0,
    crew: [],
  };
  writeAll([...getSnapshot(), workOrder]);
  return workOrder;
}

/** All saved (real) work orders, kept in sync with the store. */
export function useStoredWorkOrders(): {
  workOrders: WorkOrder[];
  addWorkOrder: (input: NewWorkOrderInput) => WorkOrder;
} {
  const workOrders = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { workOrders, addWorkOrder: createStoredWorkOrder };
}
