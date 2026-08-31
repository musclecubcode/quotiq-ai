import type { CompanyProfileInput } from "../../company-profile";
import type { NewClientInput, NewWorkOrderInput, WorkOrderUpdate } from "../../workorder-repository";
import type {
  AuthorizedCompanyContext,
  BrowserDataImportResult,
  CompanyClient,
  CompanyMembership,
  CompanyWorkOrder,
  PersistedCompany,
  ValidatedBrowserDataImport,
} from "./types";

/**
 * All methods receiving companyId must apply it in the database predicate.
 * Implementations must never load by record ID and authorize afterward.
 */
export interface ProductionDataStore {
  createCompanyWithOwner(input: CompanyProfileInput, clerkUserId: string, clerkOrganizationId: string | null): Promise<{ company: PersistedCompany; membership: CompanyMembership }>;
  findCompanyByClerkOrganizationId(clerkOrganizationId: string): Promise<PersistedCompany | null>;
  findActiveMembership(companyId: string, clerkUserId: string): Promise<CompanyMembership | null>;
  listActiveMembershipsForUser(clerkUserId: string): Promise<CompanyMembership[]>;
  getCompany(companyId: string): Promise<PersistedCompany | null>;
  updateCompany(context: AuthorizedCompanyContext, input: CompanyProfileInput): Promise<PersistedCompany>;

  listClients(companyId: string): Promise<CompanyClient[]>;
  getClient(companyId: string, clientId: string): Promise<CompanyClient | null>;
  createClient(companyId: string, input: NewClientInput): Promise<CompanyClient>;

  listWorkOrders(companyId: string): Promise<CompanyWorkOrder[]>;
  getWorkOrder(companyId: string, workOrderId: string): Promise<CompanyWorkOrder | null>;
  createWorkOrder(companyId: string, input: NewWorkOrderInput): Promise<CompanyWorkOrder>;
  updateWorkOrder(companyId: string, workOrderId: string, input: WorkOrderUpdate): Promise<CompanyWorkOrder | null>;

  importBrowserData(companyId: string, data: ValidatedBrowserDataImport): Promise<BrowserDataImportResult>;
}
