"use client";

import { useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  Client,
  DocumentRecord,
  Invoice,
  Note,
  Photo,
  Property,
  Quote,
  Vehicle,
  WarrantyRecord,
  WorkOrder,
} from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge, QuoteStatusBadge, InvoiceStatusBadge, WorkOrderStatusBadge } from "@/components/ui/Badge";
import { Table, TableBody, TableHead, Th, Td, Tr } from "@/components/ui/Table";
import { getClientLifetimeValue, getQuoteTotal, getWorkOrderById } from "@/lib/data";
import { IconBuilding, IconFileText, IconMapPin } from "@/components/icons";

interface ClientProfileTabsProps {
  properties: Property[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  quotes: Quote[];
  invoices: Invoice[];
  notes: Note[];
  warranties: WarrantyRecord[];
  documents: DocumentRecord[];
  photos: Photo[];
  client: Client;
}

const documentTypeLabels: Record<DocumentRecord["type"], string> = {
  contract: "Contract",
  permit: "Permit",
  insurance: "Insurance",
  inspection: "Inspection",
};

function workOrderTitle(workOrderId: string): string {
  return getWorkOrderById(workOrderId)?.title ?? "Unassigned";
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-slate-500">{label}</div>
  );
}

export function ClientProfileTabs({
  client,
  properties,
  vehicles,
  workOrders,
  quotes,
  invoices,
  notes,
  warranties,
  documents,
  photos,
}: ClientProfileTabsProps) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "properties", label: `Properties (${properties.length})` },
    { id: "vehicles", label: `Vehicles (${vehicles.length})` },
    { id: "jobs", label: `Work Orders (${workOrders.length})` },
    { id: "estimates", label: `Estimates (${quotes.length})` },
    { id: "invoices", label: `Invoices (${invoices.length})` },
    { id: "photos", label: `Photos (${photos.length})` },
    { id: "notes", label: `Notes (${notes.length})` },
    { id: "warranty", label: `Warranty (${warranties.length})` },
    { id: "documents", label: `Documents (${documents.length})` },
  ] as const;

  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("overview");

  return (
    <div>
      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-5">
        {active === "overview" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Contact Information
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-right text-slate-900">{client.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="text-right text-slate-900">{client.phone}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Address</dt>
                  <dd className="text-right text-slate-900">
                    {client.address}, {client.city}, {client.state} {client.zip}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Client since</dt>
                  <dd className="text-right text-slate-900">
                    {formatDate(client.createdAt)}
                  </dd>
                </div>
              </dl>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">Account Summary</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Lifetime value</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {formatCurrency(getClientLifetimeValue(client.id))}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Total work orders</dt>
                  <dd className="text-right text-slate-900">{workOrders.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Properties on file</dt>
                  <dd className="text-right text-slate-900">{properties.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Vehicles on file</dt>
                  <dd className="text-right text-slate-900">{vehicles.length}</dd>
                </div>
              </dl>
            </Card>
            <Card className="p-5 sm:col-span-2">
              <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
              {client.notes?.trim() ? (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                  {client.notes}
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No notes yet.</p>
              )}
            </Card>
          </div>
        )}

        {active === "properties" && (
          <Card>
            {properties.length === 0 ? (
              <EmptyState label="No properties on file for this client yet." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {properties.map((property) => (
                  <li key={property.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <IconBuilding className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{property.label}</p>
                        <Badge tone={property.type === "commercial" ? "violet" : "blue"}>
                          {property.type === "commercial" ? "Commercial" : "Residential"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                        <IconMapPin className="h-3.5 w-3.5" />
                        {property.address}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {property.squareFootage.toLocaleString()} sq ft · Built{" "}
                        {property.yearBuilt}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {active === "vehicles" && (
          <Card>
            {vehicles.length === 0 ? (
              <EmptyState label="No vehicles on file for this client yet." />
            ) : (
              <Table>
                <TableHead>
                  <Th>Vehicle</Th>
                  <Th>License Plate</Th>
                  <Th>VIN</Th>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <Tr key={vehicle.id}>
                      <Td className="font-medium text-slate-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Td>
                      <Td>{vehicle.licensePlate}</Td>
                      <Td className="font-mono text-xs text-slate-500">
                        {vehicle.vin}
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {active === "jobs" && (
          <Card>
            {workOrders.length === 0 ? (
              <EmptyState label="No work orders on file for this client yet." />
            ) : (
              <Table>
                <TableHead>
                  <Th>Work Order</Th>
                  <Th>Status</Th>
                  <Th>Timeline</Th>
                  <Th className="text-right">Budget</Th>
                </TableHead>
                <TableBody>
                  {workOrders.map((workOrder) => (
                    <Tr key={workOrder.id}>
                      <Td className="font-medium text-slate-900">{workOrder.title}</Td>
                      <Td>
                        <WorkOrderStatusBadge status={workOrder.status} />
                      </Td>
                      <Td className="text-xs text-slate-500">
                        {formatDate(workOrder.startDate)} – {formatDate(workOrder.endDate)}
                      </Td>
                      <Td className="text-right font-medium text-slate-900">
                        {formatCurrency(workOrder.budget)}
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {active === "estimates" && (
          <Card>
            {quotes.length === 0 ? (
              <EmptyState label="No estimates on file for this client yet." />
            ) : (
              <Table>
                <TableHead>
                  <Th>Estimate</Th>
                  <Th>Status</Th>
                  <Th>Issued</Th>
                  <Th className="text-right">Total</Th>
                </TableHead>
                <TableBody>
                  {quotes.map((quote) => (
                    <Tr key={quote.id}>
                      <Td>
                        <p className="font-medium text-slate-900">{quote.number}</p>
                        <p className="text-xs text-slate-500">
                          {workOrderTitle(quote.workOrderId)}
                        </p>
                      </Td>
                      <Td>
                        <QuoteStatusBadge status={quote.status} />
                      </Td>
                      <Td>{formatDate(quote.issueDate)}</Td>
                      <Td className="text-right font-medium text-slate-900">
                        {formatCurrency(getQuoteTotal(quote))}
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {active === "invoices" && (
          <Card>
            {invoices.length === 0 ? (
              <EmptyState label="No invoices on file for this client yet." />
            ) : (
              <Table>
                <TableHead>
                  <Th>Invoice</Th>
                  <Th>Status</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Amount</Th>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <Tr key={invoice.id}>
                      <Td>
                        <p className="font-medium text-slate-900">{invoice.number}</p>
                        <p className="text-xs text-slate-500">
                          {workOrderTitle(invoice.workOrderId)}
                        </p>
                      </Td>
                      <Td>
                        <InvoiceStatusBadge status={invoice.status} />
                      </Td>
                      <Td>{formatDate(invoice.dueDate)}</Td>
                      <Td className="text-right font-medium text-slate-900">
                        {formatCurrency(invoice.amount)}
                      </Td>
                    </Tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {active === "photos" && (
          <Card className="p-5">
            {photos.length === 0 ? (
              <EmptyState label="No work order photos uploaded for this client yet." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-100">
                    <div
                      className="flex h-32 items-center justify-center text-xs font-medium text-white/80"
                      style={{ backgroundColor: photo.color }}
                    >
                      {workOrderTitle(photo.workOrderId)}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-slate-900">
                        {photo.caption}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(photo.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {active === "notes" && (
          <Card>
            {notes.length === 0 ? (
              <EmptyState label="No notes logged for this client yet." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {notes.map((note) => (
                  <li key={note.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{note.author}</p>
                      <p className="text-xs text-slate-400">{formatDate(note.date)}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {active === "warranty" && (
          <Card>
            {warranties.length === 0 ? (
              <EmptyState label="No warranty records on file for this client yet." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {warranties.map((warranty) => (
                  <li key={warranty.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {warranty.item}
                      </p>
                      <Badge tone="green">
                        Expires {formatDate(warranty.expiryDate)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {workOrderTitle(warranty.workOrderId)} · Provided by {warranty.provider}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{warranty.terms}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {active === "documents" && (
          <Card>
            {documents.length === 0 ? (
              <EmptyState label="No documents uploaded for this client yet." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {documents.map((document) => (
                  <li key={document.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <IconFileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {document.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Uploaded {formatDate(document.uploadedDate)} · {document.fileSize}
                      </p>
                    </div>
                    <Badge tone="gray">{documentTypeLabels[document.type]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
