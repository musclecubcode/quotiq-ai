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
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
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

export type WorkOrderCategory =
  | "remodel"
  | "repair"
  | "installation"
  | "inspection"
  | "maintenance"
  | "other";

export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";

/**
 * The contractor trade/specialty a WorkOrder falls under. Quotiq AI is a
 * multi-trade platform — one shared WorkOrder model serves every trade
 * rather than each trade getting its own app or record type. See
 * TRADE_DETAIL_FIELDS in lib/work-order-options.ts, which is the single
 * source of truth for which optional detail fields apply to each trade;
 * adding a new trade only means adding a value here and an entry there.
 */
export type TradeCategory =
  | "mobile_mechanic"
  | "handyman"
  | "fence"
  | "drywall"
  | "painting"
  | "electrical"
  | "appliance_repair"
  | "sprinklers_irrigation"
  | "pressure_washing"
  | "carpentry"
  | "plumbing"
  | "general_contractor"
  | "other";

/**
 * Trade-specific structured data for a WorkOrder, keyed by field name.
 * Deliberately a loose record rather than a per-trade discriminated union:
 * which keys are meaningful for a given trade is config (TRADE_DETAIL_FIELDS),
 * not a type-level concern, so new trades don't require new TypeScript types.
 * Values are strings from form inputs except checkbox fields, which are boolean.
 */
export type TradeDetails = Record<string, string | boolean>;

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
  trade: TradeCategory;
  tradeDetails?: TradeDetails;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  serviceAddress: string;
  description: string;
  internalNotes?: string;
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
