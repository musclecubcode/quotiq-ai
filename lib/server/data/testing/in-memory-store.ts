import { normalizeCompanyProfileInput, type CompanyProfileInput } from "../../../company-profile";
import { categoryLabel } from "../../../work-order-options";
import type { NewClientInput, NewWorkOrderInput, WorkOrderUpdate } from "../../../workorder-repository";
import type { CompanyAttachment, CompanyMeasurement, CompanyNote } from "../types";
import { DataLayerError, invalid } from "../errors";
import { analyzeBrowserImport, importCounts } from "../browser-import";
import type { ProductionDataStore } from "../store";
import type {
  AuthorizedCompanyContext,
  BrowserDataImportResult,
  CompanyClient,
  CompanyMembership,
  CompanyWorkOrder,
  PersistedCompany,
  ValidatedBrowserDataImport,
} from "../types";

const key = (companyId: string, id: string) => `${companyId}:${id}`;
const required = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) throw invalid(`${label} is required.`);
  return trimmed;
};

/** Test/conformance adapter only. It is never selected by the application runtime. */
export class InMemoryProductionDataStore implements ProductionDataStore {
  private readonly companies = new Map<string, PersistedCompany>();
  private readonly memberships = new Map<string, CompanyMembership>();
  private readonly clients = new Map<string, CompanyClient>();
  private readonly workOrders = new Map<string, CompanyWorkOrder>();
  private readonly measurements = new Map<string, CompanyMeasurement>();
  private readonly notes = new Map<string, CompanyNote>();
  private readonly attachments = new Map<string, CompanyAttachment>();

  constructor(
    private readonly createId: () => string = () => crypto.randomUUID(),
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async createCompanyWithOwner(input: CompanyProfileInput, clerkUserId: string, clerkOrganizationId: string | null) {
    if (!clerkUserId.trim()) throw invalid("Clerk user ID is required.");
    if (clerkOrganizationId && [...this.companies.values()].some((item) => item.clerkOrganizationId === clerkOrganizationId)) {
      throw new DataLayerError("CONFLICT", "That Clerk organization is already linked.");
    }
    const timestamp = this.now();
    const company: PersistedCompany = {
      ...normalizeCompanyProfileInput(input),
      id: this.createId(),
      clerkOrganizationId,
      logo: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const membership: CompanyMembership = {
      id: this.createId(), companyId: company.id, clerkUserId, role: "owner", status: "active",
      createdAt: timestamp, updatedAt: timestamp,
    };
    this.companies.set(company.id, company);
    this.memberships.set(membership.id, membership);
    return { company, membership };
  }

  async ensureCompanyWithOwner(input: CompanyProfileInput, clerkUserId: string, clerkOrganizationId: string | null) {
    const memberships = await this.listActiveMembershipsForUser(clerkUserId);
    if (memberships.length > 1) throw new DataLayerError("CONFLICT", "Select an active company before continuing.");
    if (memberships[0]) {
      const company = await this.getCompany(memberships[0].companyId);
      if (!company) throw new DataLayerError("NOT_FOUND", "Company was not found.");
      if (clerkOrganizationId && company.clerkOrganizationId !== clerkOrganizationId) throw new DataLayerError("FORBIDDEN", "You do not have access to this company.");
      return { company, membership: memberships[0], created: false };
    }
    const created = await this.createCompanyWithOwner(input, clerkUserId, clerkOrganizationId);
    return { ...created, created: true };
  }

  async findCompanyByClerkOrganizationId(id: string) {
    return [...this.companies.values()].find((company) => company.clerkOrganizationId === id) ?? null;
  }
  async findActiveMembership(companyId: string, clerkUserId: string) {
    return [...this.memberships.values()].find((item) => item.companyId === companyId && item.clerkUserId === clerkUserId && item.status === "active") ?? null;
  }
  async listActiveMembershipsForUser(clerkUserId: string) {
    return [...this.memberships.values()].filter((item) => item.clerkUserId === clerkUserId && item.status === "active");
  }
  async getCompany(companyId: string) { return this.companies.get(companyId) ?? null; }
  async updateCompany(context: AuthorizedCompanyContext, input: CompanyProfileInput) {
    const company = this.companies.get(context.companyId);
    if (!company) throw new DataLayerError("NOT_FOUND", "Company was not found.");
    const saved = { ...company, ...normalizeCompanyProfileInput(input), updatedAt: this.now() };
    this.companies.set(company.id, saved);
    return saved;
  }

  async listClients(companyId: string) { return [...this.clients.values()].filter((item) => item.companyId === companyId); }
  async getClient(companyId: string, clientId: string) { return this.clients.get(key(companyId, clientId)) ?? null; }
  async createClient(companyId: string, input: NewClientInput) {
    const timestamp = this.now();
    const client: CompanyClient = {
      id: this.createId(), companyId,
      firstName: required(input.firstName, "First name"), lastName: required(input.lastName, "Last name"),
      company: input.company?.trim() || undefined, email: required(input.email, "Email"), phone: required(input.phone, "Phone"),
      address: required(input.address, "Address"), city: required(input.city, "City"), state: required(input.state, "State"),
      zip: required(input.zip, "ZIP code"), notes: input.notes?.trim() || undefined, status: "active",
      createdAt: timestamp, updatedAt: timestamp,
    };
    this.clients.set(key(companyId, client.id), client);
    return client;
  }

  async listWorkOrders(companyId: string) { return [...this.workOrders.values()].filter((item) => item.companyId === companyId); }
  async getWorkOrder(companyId: string, workOrderId: string) { return this.workOrders.get(key(companyId, workOrderId)) ?? null; }
  async createWorkOrder(companyId: string, input: NewWorkOrderInput) {
    if (!await this.getClient(companyId, input.clientId)) throw invalid("Select a valid client.");
    const address = required(input.serviceAddress, "Service address");
    const scheduledDate = required(input.scheduledDate, "Scheduled date");
    const timestamp = this.now();
    const workOrder: CompanyWorkOrder = {
      id: this.createId(), companyId, clientId: input.clientId,
      title: `${categoryLabel(input.category)} — ${address}`, trade: input.trade, tradeDetails: input.tradeDetails,
      category: input.category, priority: input.priority, serviceAddress: address,
      description: required(input.description, "Description"), internalNotes: input.internalNotes?.trim() || undefined,
      status: input.status, startDate: scheduledDate, endDate: scheduledDate, budget: 0, progress: 0, crew: [],
      createdAt: timestamp, updatedAt: timestamp,
    };
    this.workOrders.set(key(companyId, workOrder.id), workOrder);
    return workOrder;
  }
  async updateWorkOrder(companyId: string, workOrderId: string, input: WorkOrderUpdate) {
    const existing = await this.getWorkOrder(companyId, workOrderId);
    if (!existing) return null;
    if (!Number.isFinite(input.budget) || input.budget < 0) throw invalid("Budget must be zero or greater.");
    if (!Number.isFinite(input.progress) || input.progress < 0 || input.progress > 100) throw invalid("Progress must be between 0 and 100.");
    if (input.endDate < input.startDate) throw invalid("End date cannot be before the start date.");
    const saved = { ...existing, ...input, title: required(input.title, "Title"), serviceAddress: required(input.serviceAddress, "Service address"), description: required(input.description, "Description"), internalNotes: input.internalNotes?.trim() || undefined, updatedAt: this.now() };
    this.workOrders.set(key(companyId, workOrderId), saved);
    return saved;
  }

  async getCompanyDataSnapshot(companyId: string) {
    const company = await this.getCompany(companyId);
    if (!company) return null;
    return { company, clients: await this.listClients(companyId), workOrders: await this.listWorkOrders(companyId),
      measurements: [...this.measurements.values()].filter((item) => item.companyId === companyId),
      notes: [...this.notes.values()].filter((item) => item.companyId === companyId),
      attachments: [...this.attachments.values()].filter((item) => item.companyId === companyId) };
  }

  async previewBrowserDataImport(companyId: string, data: ValidatedBrowserDataImport) {
    const snapshot = await this.getCompanyDataSnapshot(companyId);
    if (!snapshot) throw new DataLayerError("NOT_FOUND", "Company was not found.");
    return { status: analyzeBrowserImport(snapshot, data), records: importCounts(data), localDataRetained: true as const };
  }

  async importBrowserData(companyId: string, data: ValidatedBrowserDataImport): Promise<BrowserDataImportResult> {
    const preview = await this.previewBrowserDataImport(companyId, data);
    if (preview.status === "already_imported") return { companyId, imported: preview.records, verifiedAt: this.now(), localDataRetained: true, idempotentReplay: true };
    if (Object.values(preview.records).every((count) => count === 0)) return { companyId, imported: preview.records, verifiedAt: this.now(), localDataRetained: true, idempotentReplay: false };
    const timestamp = this.now();
    data.clients.forEach((item) => this.clients.set(key(companyId, item.id), { ...item, companyId, updatedAt: timestamp }));
    data.workOrders.forEach((item) => this.workOrders.set(key(companyId, item.id), { ...item, companyId, createdAt: timestamp, updatedAt: timestamp }));
    data.measurements.forEach((item) => this.measurements.set(key(companyId, item.id), { ...item, companyId }));
    data.notes.forEach((item) => this.notes.set(key(companyId, item.id), { ...item, companyId }));
    data.attachments.forEach((item) => this.attachments.set(key(companyId, item.id), { ...item, companyId }));
    const verified = await this.getCompanyDataSnapshot(companyId);
    if (!verified || analyzeBrowserImport(verified, data) !== "already_imported") throw new DataLayerError("CONFLICT", "Imported data could not be verified.");
    return { companyId, imported: importCounts(data), verifiedAt: timestamp, localDataRetained: true, idempotentReplay: false };
  }
}
