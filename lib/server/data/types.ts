import type {
  Client,
  CompanyProfile,
  WorkOrder,
  WorkOrderAttachment,
  WorkOrderMeasurement,
  WorkOrderNote,
} from "../../types";

export type MembershipRole = "owner" | "admin" | "member";
export type MembershipStatus = "active" | "suspended";

export interface CompanyMembership {
  id: string;
  companyId: string;
  clerkUserId: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedCompany extends Omit<CompanyProfile, "ownerId"> {
  clerkOrganizationId: string | null;
}

export interface CompanyClient extends Client {
  companyId: string;
  updatedAt: string;
}

export interface CompanyWorkOrder extends WorkOrder {
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMeasurement extends WorkOrderMeasurement { companyId: string }
export interface CompanyNote extends WorkOrderNote { companyId: string }
export interface CompanyAttachment extends WorkOrderAttachment { companyId: string }

export interface BrowserDataImport {
  version: 1;
  companyProfile?: CompanyProfile;
  clients: Client[];
  workOrders: WorkOrder[];
  measurements: WorkOrderMeasurement[];
  notes: WorkOrderNote[];
  attachments: WorkOrderAttachment[];
}

export interface ValidatedBrowserDataImport extends BrowserDataImport {
  sourceOwnerId: string | null;
}

export interface BrowserDataImportResult {
  companyId: string;
  imported: {
    clients: number;
    workOrders: number;
    measurements: number;
    notes: number;
    attachments: number;
  };
  verifiedAt: string;
  localDataRetained: true;
}

export interface AuthenticatedIdentity {
  clerkUserId: string;
  clerkOrganizationId: string | null;
}

export interface AuthorizedCompanyContext {
  companyId: string;
  clerkUserId: string;
  membershipId: string;
  role: MembershipRole;
}
