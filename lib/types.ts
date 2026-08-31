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

export type MeasurementType =
  | "linear_feet" | "width" | "height" | "area" | "perimeter" | "count" | "custom";

export interface WorkOrderMeasurement {
  id: string;
  workOrderId: string;
  type: MeasurementType;
  label: string;
  value?: number;
  unit: string;
  width?: number;
  height?: number;
  quantity: number;
  notes?: string;
  createdAt: string;
}

export interface WorkOrderNote {
  id: string;
  workOrderId: string;
  body: string;
  visibility: "internal" | "client";
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderAttachmentKind = "photo" | "document";

export interface WorkOrderAttachment {
  id: string;
  workOrderId: string;
  kind: WorkOrderAttachmentKind;
  fileName: string;
  mimeType: string;
  size: number;
  caption?: string;
  description?: string;
  uploadedAt: string;
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

/** A replaceable reference to a company-owned binary branding asset. */
export interface CompanyLogoAsset {
  id: string;
  storageKey: string;
  fileName: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  size: number;
  createdAt: string;
}

/**
 * The contractor tenant profile. `ownerId` is currently a Clerk user ID and
 * becomes an organization ID when organization membership is enabled.
 */
export interface ContractorCompany {
  id: string;
  ownerId: string;
  legalName: string;
  displayName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contractorLicense: string;
  defaultCurrency: string;
  defaultMarkup: number;
  defaultTaxRate: number;
  paymentTerms: string;
  estimateTerms: string;
  invoiceTerms: string;
  accentColor: string;
  logo: CompanyLogoAsset | null;
  createdAt: string;
  updatedAt: string;
}

export type CompanyProfile = ContractorCompany;

/** Immutable company identity copied onto a document when it is issued. */
export interface IssuerSnapshot {
  readonly companyId: string;
  readonly legalName: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly website: string;
  readonly address: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly contractorLicense: string;
  readonly accentColor: string;
  readonly logo: Readonly<CompanyLogoAsset> | null;
  readonly capturedAt: string;
}
