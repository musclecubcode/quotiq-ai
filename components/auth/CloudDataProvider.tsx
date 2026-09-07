"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { NewClientInput, NewWorkOrderInput, WorkOrderUpdate } from "@/lib/workorder-repository";
import type { Client, NewInvoiceInput, SavedInvoice, WorkOrder } from "@/lib/types";

export interface CloudDataSnapshot {
  clients: Client[];
  workOrders: WorkOrder[];
  invoices: SavedInvoice[];
}

interface CloudDataContextValue extends CloudDataSnapshot {
  addClient(input: NewClientInput): Promise<Client>;
  addWorkOrder(input: NewWorkOrderInput): Promise<WorkOrder>;
  updateWorkOrder(id: string, input: WorkOrderUpdate): Promise<WorkOrder>;
  addInvoice(input: NewInvoiceInput): Promise<SavedInvoice>;
}

const CloudDataContext = createContext<CloudDataContextValue | null>(null);

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "The cloud request could not be completed.");
  return result;
}

export function CloudDataProvider({ initialData, children }: { initialData: CloudDataSnapshot; children: React.ReactNode }) {
  const [clients, setClients] = useState(initialData.clients);
  const [workOrders, setWorkOrders] = useState(initialData.workOrders);
  const [invoices, setInvoices] = useState(initialData.invoices);

  const addClient = useCallback(async (input: NewClientInput) => {
    const saved = await requestJson<Client>("/api/data/clients", { method: "POST", body: JSON.stringify(input) });
    setClients((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, []);

  const addWorkOrder = useCallback(async (input: NewWorkOrderInput) => {
    const saved = await requestJson<WorkOrder>("/api/data/work-orders", { method: "POST", body: JSON.stringify(input) });
    setWorkOrders((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, []);

  const updateWorkOrder = useCallback(async (id: string, input: WorkOrderUpdate) => {
    const saved = await requestJson<WorkOrder>(`/api/data/work-orders/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
    setWorkOrders((current) => current.map((item) => item.id === saved.id ? saved : item));
    return saved;
  }, []);

  const addInvoice = useCallback(async (input: NewInvoiceInput) => {
    const saved = await requestJson<SavedInvoice>("/api/data/invoices", { method: "POST", body: JSON.stringify(input) });
    setInvoices((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, []);

  const value = useMemo<CloudDataContextValue>(() => ({
    clients, workOrders, invoices, addClient, addWorkOrder, updateWorkOrder, addInvoice,
  }), [clients, workOrders, invoices, addClient, addWorkOrder, updateWorkOrder, addInvoice]);

  return <CloudDataContext.Provider value={value}>{children}</CloudDataContext.Provider>;
}

function useCloudData() {
  const context = useContext(CloudDataContext);
  if (!context) throw new Error("Cloud data is unavailable outside the authenticated workspace.");
  return context;
}

export function useCloudClients() {
  const { clients, addClient } = useCloudData();
  return { clients: [...clients].sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)), addClient };
}

export function useCloudClient(id: string) {
  const { clients } = useCloudData();
  return { client: clients.find((item) => item.id === id) };
}

export function useCloudWorkOrders() {
  const { workOrders, addWorkOrder, updateWorkOrder } = useCloudData();
  return { workOrders, addWorkOrder, updateWorkOrder };
}

export function useCloudWorkOrder(id: string) {
  const { workOrders, updateWorkOrder } = useCloudData();
  return { workOrder: workOrders.find((item) => item.id === id), updateWorkOrder };
}

export function useCloudInvoices() {
  const { invoices, addInvoice } = useCloudData();
  return { invoices: [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), addInvoice };
}
