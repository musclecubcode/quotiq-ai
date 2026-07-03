/**
 * Core domain model. See docs/ARCHITECTURE.md for the full entity-relationship
 * diagram and the reasoning behind it.
 *
 * WorkOrder is the relational hub: every Quote, Invoice, Photo, Note,
 * Document, and Warranty belongs to exactly one WorkOrder, and every
 * WorkOrder belongs to exactly one Client (with an optional Property or
 * Vehicle reference). Nothing attaches directly to a Client except
 * Properties, Vehicles, and WorkOrders themselves.
 */

export type ClientStatus = "active" | "lead" | "inactive";

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatus;
  createdAt: string;
}

export type PropertyType = "residential" | "commercial";

export interface Property {
  id: string;
  clientId: string;
  label: string;
  address: string;
  type: PropertyType;
  squareFootage: number;
  yearBuilt: number;
}

export interface Vehicle {
  id: string;
  clientId: string;
  year: number;
  make: string;
  model: string;
  licensePlate: string;
  vin: string;
}

export type WorkOrderStatus =
  | "quoting"
  | "scheduled"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

/**
 * A unit of work for a client. May optionally reference the Property or
 * Vehicle it concerns (e.g. a remodel references a Property, a fleet
 * repair references a Vehicle); either, neither, or — in principle — both
 * may be set depending on the nature of the job.
 */
export interface WorkOrder {
  id: string;
  clientId: string;
  propertyId?: string;
  vehicleId?: string;
  title: string;
  status: WorkOrderStatus;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  crew: string[];
}

export type QuoteStatus = "draft" | "sent" | "approved" | "declined";

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  number: string;
  workOrderId: string;
  status: QuoteStatus;
  issueDate: string;
  expiryDate: string;
  lineItems: QuoteLineItem[];
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  number: string;
  workOrderId: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
}

export interface Photo {
  id: string;
  workOrderId: string;
  caption: string;
  date: string;
  /** Placeholder swatch standing in for an actual uploaded image. */
  color: string;
}

export type DocumentType = "contract" | "permit" | "insurance" | "inspection";

export interface DocumentRecord {
  id: string;
  workOrderId: string;
  name: string;
  type: DocumentType;
  uploadedDate: string;
  fileSize: string;
}

export interface Note {
  id: string;
  workOrderId: string;
  author: string;
  date: string;
  body: string;
}

export interface WarrantyRecord {
  id: string;
  workOrderId: string;
  item: string;
  provider: string;
  startDate: string;
  expiryDate: string;
  terms: string;
}
