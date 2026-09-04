"use client";

import { useSyncExternalStore } from "react";

export type SavedInvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface SavedInvoice {
  id: string;
  number: string;
  workOrderId: string;
  clientId: string;
  description: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: SavedInvoiceStatus;
  createdAt: string;
}

export interface NewInvoiceInput {
  workOrderId: string;
  clientId: string;
  description: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: SavedInvoiceStatus;
}

const STORAGE_KEY = "quotiq.invoices";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedInvoices: SavedInvoice[] = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
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

function readInvoices(): SavedInvoice[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    if (!raw) {
      cachedInvoices = [];
    } else {
      try {
        const parsed: unknown = JSON.parse(raw);
        cachedInvoices = Array.isArray(parsed) ? (parsed as SavedInvoice[]) : [];
      } catch {
        cachedInvoices = [];
      }
    }
  }
  return cachedInvoices;
}

function snapshot() {
  return readInvoices();
}

function serverSnapshot(): SavedInvoice[] {
  return [];
}

function writeInvoices(invoices: SavedInvoice[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  cachedRaw = undefined;
  emitChange();
}

function required(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function nextInvoiceNumber(invoices: SavedInvoice[]) {
  const year = new Date().getFullYear();
  const next = invoices.length + 1;
  return `INV-${year}-${String(next).padStart(4, "0")}`;
}

export function createInvoice(input: NewInvoiceInput): SavedInvoice {
  const invoices = readInvoices();
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error("Invoice amount must be zero or greater.");
  }

  const invoice: SavedInvoice = {
    id: crypto.randomUUID(),
    number: nextInvoiceNumber(invoices),
    workOrderId: required(input.workOrderId, "Work order"),
    clientId: required(input.clientId, "Client"),
    description: required(input.description, "Description"),
    issueDate: required(input.issueDate, "Issue date"),
    dueDate: required(input.dueDate, "Due date"),
    amount: input.amount,
    amountPaid: input.status === "paid" ? input.amount : 0,
    status: input.status,
    createdAt: new Date().toISOString(),
  };

  writeInvoices([...invoices, invoice]);
  return invoice;
}

export function useInvoicesRepository() {
  const invoices = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return {
    invoices: [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    addInvoice: createInvoice,
  };
}
