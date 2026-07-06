"use client";

/**
 * Real, persisted client storage — backed by the browser's localStorage.
 * This is intentionally separate from the demo `clients` fixture in
 * lib/data.ts, which still backs the Work Orders/Estimates/Invoices/Dashboard/AI
 * Assistant screens until those areas get their own real data layer.
 *
 * Reads go through useSyncExternalStore rather than useEffect+useState:
 * localStorage is external mutable state, and this is the API React ships
 * specifically for subscribing to it without a state-in-effect footgun or
 * a hydration mismatch (the server snapshot is an empty list; the real
 * list syncs in immediately on the client).
 */
import { useSyncExternalStore } from "react";
import type { Client, ClientStatus } from "./types";

const STORAGE_KEY = "quotiq.clients";

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

// Cached so repeated snapshots return the same array reference (and don't
// look "changed" to useSyncExternalStore) whenever the raw string is
// unchanged — required for it to not re-render in a loop.
let cachedRaw: string | null | undefined;
let cachedClients: Client[] = [];

function getSnapshot(): Client[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedClients = raw ? (JSON.parse(raw) as Client[]) : [];
  }
  return cachedClients;
}

// A single stable empty-array constant — not `[]` inline, which would
// allocate a new reference on every call and never compare equal to its
// previous return, tripping useSyncExternalStore's infinite-loop guard.
const EMPTY_CLIENTS: Client[] = [];

function getServerSnapshot(): Client[] {
  return EMPTY_CLIENTS;
}

function writeAll(clients: Client[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  emitChange();
}

export function getStoredClient(id: string): Client | undefined {
  return getSnapshot().find((client) => client.id === id);
}

export function createStoredClient(input: NewClientInput): Client {
  const client: Client = {
    id: crypto.randomUUID(),
    status: "active" as ClientStatus,
    createdAt: new Date().toISOString(),
    ...input,
  };
  writeAll([...getSnapshot(), client]);
  return client;
}

/** All saved clients, alphabetical by last name then first name. */
export function useClients() {
  const clients = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const sorted = [...clients].sort((a, b) => {
    const byLastName = a.lastName.localeCompare(b.lastName);
    return byLastName !== 0 ? byLastName : a.firstName.localeCompare(b.firstName);
  });

  return { clients: sorted, addClient: createStoredClient };
}

/** A single client by id, kept in sync with the store. */
export function useClient(id: string): { client: Client | undefined } {
  const clients = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { client: clients.find((client) => client.id === id) };
}
