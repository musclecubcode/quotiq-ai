import type { Client, WorkOrder, WorkOrderAttachment, WorkOrderMeasurement, WorkOrderNote } from "../../types";
import { invalid } from "./errors";
import type { BrowserDataImport, ValidatedBrowserDataImport } from "./types";

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const MAX_RECORDS_PER_KIND = 10_000;

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function text(record: Record<string, unknown>, key: string, label: string, required = true) {
  const value = record[key];
  if (typeof value !== "string" || (required && !value.trim())) throw invalid(`${label} is invalid.`);
  return value;
}

function id(record: Record<string, unknown>, key: string, label: string) {
  const value = text(record, key, label);
  validateEntityId(value, label);
  return value;
}

export function validateEntityId(value: string, label = "ID") {
  if (!SAFE_ID.test(value)) throw invalid(`${label} is invalid.`);
  return value;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw invalid(`${label} must be an array.`);
  if (value.length > MAX_RECORDS_PER_KIND) throw invalid(`${label} exceeds the 10,000-record import limit.`);
  return value;
}

function uniqueIds(records: Array<{ id: string }>, label: string) {
  if (new Set(records.map((record) => record.id)).size !== records.length) throw invalid(`${label} contains duplicate IDs.`);
}

function client(value: unknown): Client {
  const record = object(value, "Client");
  id(record, "id", "Client ID");
  text(record, "firstName", "Client first name");
  text(record, "lastName", "Client last name");
  text(record, "email", "Client email");
  text(record, "phone", "Client phone");
  text(record, "address", "Client address");
  text(record, "city", "Client city");
  text(record, "state", "Client state");
  text(record, "zip", "Client ZIP code");
  return record as unknown as Client;
}

function workOrder(value: unknown): WorkOrder {
  const record = object(value, "Work Order");
  id(record, "id", "Work Order ID");
  id(record, "clientId", "Work Order client ID");
  text(record, "title", "Work Order title");
  text(record, "trade", "Work Order trade");
  text(record, "category", "Work Order category");
  text(record, "status", "Work Order status");
  text(record, "serviceAddress", "Work Order service address");
  text(record, "description", "Work Order description");
  if (typeof record.budget !== "number" || record.budget < 0) throw invalid("Work Order budget is invalid.");
  if (typeof record.progress !== "number" || record.progress < 0 || record.progress > 100) throw invalid("Work Order progress is invalid.");
  return record as unknown as WorkOrder;
}

function related<T extends { id: string; workOrderId: string }>(value: unknown, label: string): T {
  const record = object(value, label);
  id(record, "id", `${label} ID`);
  id(record, "workOrderId", `${label} Work Order ID`);
  return record as unknown as T;
}

export function validateBrowserDataImport(value: unknown): ValidatedBrowserDataImport {
  const input = object(value, "Import payload");
  if (input.version !== 1) throw invalid("Import version is not supported.");
  const clients = array(input.clients, "Clients").map(client);
  const workOrders = array(input.workOrders, "Work Orders").map(workOrder);
  const measurements = array(input.measurements, "Measurements").map((item) => related<WorkOrderMeasurement>(item, "Measurement"));
  const notes = array(input.notes, "Notes").map((item) => related<WorkOrderNote>(item, "Note"));
  const attachments = array(input.attachments, "Attachments").map((item) => related<WorkOrderAttachment>(item, "Attachment"));
  uniqueIds(clients, "Clients"); uniqueIds(workOrders, "Work Orders"); uniqueIds(measurements, "Measurements"); uniqueIds(notes, "Notes"); uniqueIds(attachments, "Attachments");

  const clientIds = new Set(clients.map((item) => item.id));
  const workOrderIds = new Set(workOrders.map((item) => item.id));
  for (const item of workOrders) if (!clientIds.has(item.clientId)) throw invalid(`Work Order ${item.id} references a client outside this import.`);
  for (const item of [...measurements, ...notes, ...attachments]) {
    if (!workOrderIds.has(item.workOrderId)) throw invalid(`Record ${item.id} references a Work Order outside this import.`);
  }
  const profile = input.companyProfile === undefined ? undefined : object(input.companyProfile, "Company profile") as unknown as BrowserDataImport["companyProfile"];
  return {
    version: 1,
    companyProfile: profile,
    clients,
    workOrders,
    measurements,
    notes,
    attachments,
    sourceOwnerId: profile?.ownerId ?? null,
  };
}
