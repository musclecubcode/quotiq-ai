"use client";

import { useSyncExternalStore } from "react";
import { clients as sampleClients, workOrders as sampleWorkOrders } from "./data";
import { isDemoModeEnabled } from "./demo-mode";
import type {
  Client,
  TradeCategory,
  TradeDetails,
  WorkOrder,
  WorkOrderCategory,
  WorkOrderPriority,
  WorkOrderStatus,
} from "./types";
import { categoryLabel } from "./work-order-options";

export const CLIENT_STORAGE_KEY = "quotiq.clients";
export const WORK_ORDER_STORAGE_KEY = "quotiq.workOrders";
let activeUserScope = "";

const scopedKey = (key: string) => activeUserScope ? `${key}.${activeUserScope}` : key;

export interface NewClientInput {
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
}

export interface NewWorkOrderInput {
  clientId: string;
  serviceAddress: string;
  trade: TradeCategory;
  tradeDetails?: TradeDetails;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  description: string;
  scheduledDate: string;
  internalNotes?: string;
}

export type WorkOrderUpdate = Pick<
  WorkOrder,
  | "title"
  | "trade"
  | "category"
  | "priority"
  | "serviceAddress"
  | "description"
  | "internalNotes"
  | "status"
  | "startDate"
  | "endDate"
  | "budget"
  | "progress"
>;

export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryError";
  }
}

const listeners = new Set<() => void>();
let cachedClientsRaw: string | null | undefined;
let cachedStoredClients: Client[] = [];
let cachedWorkOrdersRaw: string | null | undefined;
let cachedStoredWorkOrders: WorkOrder[] = [];
const initialClients = isDemoModeEnabled ? sampleClients : [];
const initialWorkOrders = isDemoModeEnabled ? sampleWorkOrders : [];
let cachedClients: Client[] = initialClients;
let cachedWorkOrders: WorkOrder[] = initialWorkOrders;

function emitChange(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === scopedKey(CLIENT_STORAGE_KEY) || event.key === scopedKey(WORK_ORDER_STORAGE_KEY)) {
      emitChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function parseArray<T>(raw: string | null, label: string): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Stored value is not an array");
    return parsed as T[];
  } catch {
    throw new RepositoryError(
      `Saved ${label} data could not be read. Clear this site's local storage or restore a valid backup.`
    );
  }
}

function mergeById<T extends { id: string }>(samples: T[], stored: T[]): T[] {
  const records = new Map(samples.map((record) => [record.id, record]));
  for (const record of stored) records.set(record.id, record);
  return [...records.values()];
}

function readStoredClients(): Client[] {
  const raw = window.localStorage.getItem(scopedKey(CLIENT_STORAGE_KEY));
  if (raw !== cachedClientsRaw) {
    cachedClientsRaw = raw;
    cachedStoredClients = parseArray<Client>(raw, "client");
    cachedClients = mergeById(initialClients, cachedStoredClients);
  }
  return cachedStoredClients;
}

function readStoredWorkOrders(): WorkOrder[] {
  const raw = window.localStorage.getItem(scopedKey(WORK_ORDER_STORAGE_KEY));
  if (raw !== cachedWorkOrdersRaw) {
    cachedWorkOrdersRaw = raw;
    cachedStoredWorkOrders = parseArray<WorkOrder>(raw, "Work Order");
    cachedWorkOrders = mergeById(initialWorkOrders, cachedStoredWorkOrders);
  }
  return cachedStoredWorkOrders;
}

function getClientsSnapshot(): Client[] {
  readStoredClients();
  return cachedClients;
}

function getWorkOrdersSnapshot(): WorkOrder[] {
  readStoredWorkOrders();
  return cachedWorkOrders;
}

function getServerClientsSnapshot(): Client[] {
  return initialClients;
}

function getServerWorkOrdersSnapshot(): WorkOrder[] {
  return initialWorkOrders;
}

function write<T>(key: string, records: T[], label: string): void {
  try {
    window.localStorage.setItem(scopedKey(key), JSON.stringify(records));
  } catch {
    throw new RepositoryError(`Unable to save ${label}. Check browser storage permissions and available space.`);
  }
  emitChange();
}

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new RepositoryError(`${label} is required.`);
  return trimmed;
}

export function getAllClients(): Client[] {
  return getClientsSnapshot();
}

export function getClient(id: string): Client | undefined {
  return getClientsSnapshot().find((client) => client.id === id);
}

export function createClient(input: NewClientInput): Client {
  const client: Client = {
    id: crypto.randomUUID(),
    firstName: required(input.firstName, "First name"),
    lastName: required(input.lastName, "Last name"),
    phone: required(input.phone, "Phone"),
    email: required(input.email, "Email"),
    address: required(input.address, "Address"),
    city: required(input.city, "City"),
    state: required(input.state, "State"),
    zip: required(input.zip, "ZIP code"),
    company: input.company?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  write(CLIENT_STORAGE_KEY, [...readStoredClients(), client], "client");
  return client;
}

export function getAllWorkOrders(): WorkOrder[] {
  return getWorkOrdersSnapshot();
}

export function getWorkOrder(id: string): WorkOrder | undefined {
  return getWorkOrdersSnapshot().find((workOrder) => workOrder.id === id);
}

export function getWorkOrdersForClient(clientId: string): WorkOrder[] {
  return getWorkOrdersSnapshot().filter((workOrder) => workOrder.clientId === clientId);
}

export function createWorkOrder(input: NewWorkOrderInput): WorkOrder {
  if (!getClient(input.clientId)) throw new RepositoryError("Select a valid client.");
  const address = required(input.serviceAddress, "Service address");
  const scheduledDate = required(input.scheduledDate, "Scheduled date");
  const workOrder: WorkOrder = {
    id: crypto.randomUUID(),
    clientId: input.clientId,
    title: `${categoryLabel(input.category)} — ${address}`,
    trade: input.trade,
    tradeDetails: input.tradeDetails,
    category: input.category,
    priority: input.priority,
    serviceAddress: address,
    description: required(input.description, "Description"),
    internalNotes: input.internalNotes?.trim() || undefined,
    status: input.status,
    startDate: scheduledDate,
    endDate: scheduledDate,
    budget: 0,
    progress: 0,
    crew: [],
  };
  write(WORK_ORDER_STORAGE_KEY, [...readStoredWorkOrders(), workOrder], "Work Order");
  return workOrder;
}

export function updateWorkOrder(id: string, update: WorkOrderUpdate): WorkOrder {
  const existing = getWorkOrder(id);
  if (!existing) throw new RepositoryError("Work Order not found.");
  if (!Number.isFinite(update.budget) || update.budget < 0) {
    throw new RepositoryError("Budget must be zero or greater.");
  }
  if (!Number.isFinite(update.progress) || update.progress < 0 || update.progress > 100) {
    throw new RepositoryError("Progress must be between 0 and 100.");
  }
  if (update.endDate < update.startDate) {
    throw new RepositoryError("End date cannot be before the start date.");
  }

  const saved: WorkOrder = {
    ...existing,
    ...update,
    title: required(update.title, "Title"),
    serviceAddress: required(update.serviceAddress, "Service address"),
    description: required(update.description, "Description"),
    internalNotes: update.internalNotes?.trim() || undefined,
  };
  const stored = readStoredWorkOrders();
  const next = stored.some((record) => record.id === id)
    ? stored.map((record) => (record.id === id ? saved : record))
    : [...stored, saved];
  write(WORK_ORDER_STORAGE_KEY, next, "Work Order");
  return saved;
}

export function useClientsRepository() {
  const clients = useSyncExternalStore(subscribe, getClientsSnapshot, getServerClientsSnapshot);
  return {
    clients: [...clients].sort((a, b) =>
      a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
    ),
    addClient: createClient,
  };
}

export function useClientRecord(id: string) {
  const clients = useSyncExternalStore(subscribe, getClientsSnapshot, getServerClientsSnapshot);
  return { client: clients.find((client) => client.id === id) };
}

export function useWorkOrdersRepository() {
  const workOrders = useSyncExternalStore(
    subscribe,
    getWorkOrdersSnapshot,
    getServerWorkOrdersSnapshot
  );
  return { workOrders, addWorkOrder: createWorkOrder, updateWorkOrder };
}

export function useWorkOrderRecord(id: string) {
  const workOrders = useSyncExternalStore(
    subscribe,
    getWorkOrdersSnapshot,
    getServerWorkOrdersSnapshot
  );
  return { workOrder: workOrders.find((record) => record.id === id), updateWorkOrder };
}

export function resetRepositoryCacheForTests(): void {
  activeUserScope = "";
  cachedClientsRaw = undefined;
  cachedWorkOrdersRaw = undefined;
}

export function setRepositoryUserScope(userId: string): void {
  if (activeUserScope === userId) return;
  activeUserScope = userId;
  cachedClientsRaw = undefined;
  cachedWorkOrdersRaw = undefined;
  cachedStoredClients = [];
  cachedStoredWorkOrders = [];
  cachedClients = initialClients;
  cachedWorkOrders = initialWorkOrders;
  emitChange();
}
