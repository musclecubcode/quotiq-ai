import { DataLayerError } from "./errors";
import type { BrowserDataImportResult, CompanyDataSnapshot, ValidatedBrowserDataImport } from "./types";

export const importCounts = (data: ValidatedBrowserDataImport): BrowserDataImportResult["imported"] => ({
  clients: data.clients.length,
  workOrders: data.workOrders.length,
  measurements: data.measurements.length,
  notes: data.notes.length,
  attachments: data.attachments.length,
});

const select = <T extends { id: string }>(records: T[], ids: Set<string>) => records.filter((item) => ids.has(item.id));
const normalized = (value: unknown) => JSON.stringify(value, (_key, item) => item === undefined ? null : item);

function clientValue(item: CompanyDataSnapshot["clients"][number] | ValidatedBrowserDataImport["clients"][number]) {
  return { id:item.id,firstName:item.firstName,lastName:item.lastName,company:item.company??null,email:item.email,phone:item.phone,address:item.address,city:item.city,state:item.state,zip:item.zip,notes:item.notes??null,status:item.status,createdAt:item.createdAt };
}
function workOrderValue(item: CompanyDataSnapshot["workOrders"][number] | ValidatedBrowserDataImport["workOrders"][number]) {
  return { id:item.id,clientId:item.clientId,propertyId:item.propertyId??null,vehicleId:item.vehicleId??null,title:item.title,trade:item.trade,tradeDetails:item.tradeDetails??null,category:item.category,priority:item.priority,serviceAddress:item.serviceAddress,description:item.description,internalNotes:item.internalNotes??null,status:item.status,startDate:item.startDate,endDate:item.endDate,budget:item.budget,progress:item.progress,crew:item.crew };
}
function measurementValue(item: CompanyDataSnapshot["measurements"][number] | ValidatedBrowserDataImport["measurements"][number]) {
  return { id:item.id,workOrderId:item.workOrderId,type:item.type,label:item.label,value:item.value??null,unit:item.unit,width:item.width??null,height:item.height??null,quantity:item.quantity,notes:item.notes??null,createdAt:item.createdAt };
}
function noteValue(item: CompanyDataSnapshot["notes"][number] | ValidatedBrowserDataImport["notes"][number]) {
  return { id:item.id,workOrderId:item.workOrderId,body:item.body,visibility:item.visibility,createdAt:item.createdAt,updatedAt:item.updatedAt };
}
function attachmentValue(item: CompanyDataSnapshot["attachments"][number] | ValidatedBrowserDataImport["attachments"][number]) {
  return { id:item.id,workOrderId:item.workOrderId,kind:item.kind,fileName:item.fileName,mimeType:item.mimeType,size:item.size,caption:item.caption??null,description:item.description??null,uploadedAt:item.uploadedAt };
}

function same<T>(left: T[], right: T[], value: (item: T) => unknown) {
  const sort = (items: T[]) => items.map(value).sort((a, b) => String((a as { id: string }).id).localeCompare(String((b as { id: string }).id)));
  return normalized(sort(left)) === normalized(sort(right));
}

export function analyzeBrowserImport(snapshot: CompanyDataSnapshot, data: ValidatedBrowserDataImport): "ready" | "already_imported" {
  const clientIds = new Set(data.clients.map((item) => item.id));
  const workOrderIds = new Set(data.workOrders.map((item) => item.id));
  const measurementIds = new Set(data.measurements.map((item) => item.id));
  const noteIds = new Set(data.notes.map((item) => item.id));
  const attachmentIds = new Set(data.attachments.map((item) => item.id));
  const existing = {
    clients: select(snapshot.clients, clientIds), workOrders: select(snapshot.workOrders, workOrderIds),
    measurements: select(snapshot.measurements, measurementIds), notes: select(snapshot.notes, noteIds),
    attachments: select(snapshot.attachments, attachmentIds),
  };
  const existingCount = Object.values(existing).reduce((total, records) => total + records.length, 0);
  const expectedCount = Object.values(importCounts(data)).reduce((total, count) => total + count, 0);
  if (existingCount === 0) return "ready";
  const exact = existingCount === expectedCount
    && same(existing.clients, data.clients, clientValue)
    && same(existing.workOrders, data.workOrders, workOrderValue)
    && same(existing.measurements, data.measurements, measurementValue)
    && same(existing.notes, data.notes, noteValue)
    && same(existing.attachments, data.attachments, attachmentValue);
  if (exact) return "already_imported";
  throw new DataLayerError("CONFLICT", "Import conflicts with existing company data. No records were changed.");
}
