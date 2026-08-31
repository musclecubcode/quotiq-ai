import type { CompanyProfileInput } from "../../company-profile";
import type { NewClientInput, NewWorkOrderInput, WorkOrderUpdate } from "../../workorder-repository";
import { notFound } from "./errors";
import type { ProductionDataStore } from "./store";
import type { AuthorizedCompanyContext, BrowserDataImportResult, CompanyClient, CompanyWorkOrder } from "./types";
import { validateBrowserDataImport, validateEntityId } from "./validation";

export class TenantDataService {
  constructor(private readonly store: ProductionDataStore, readonly context: AuthorizedCompanyContext) {}

  getCompany() { return this.store.getCompany(this.context.companyId); }
  updateCompany(input: CompanyProfileInput) { return this.store.updateCompany(this.context, input); }
  listClients(): Promise<CompanyClient[]> { return this.store.listClients(this.context.companyId); }
  createClient(input: NewClientInput): Promise<CompanyClient> { return this.store.createClient(this.context.companyId, input); }
  async getClient(clientId: string): Promise<CompanyClient> {
    validateEntityId(clientId, "Client ID");
    const client = await this.store.getClient(this.context.companyId, clientId);
    if (!client) throw notFound("Client");
    return client;
  }
  listWorkOrders(): Promise<CompanyWorkOrder[]> { return this.store.listWorkOrders(this.context.companyId); }
  createWorkOrder(input: NewWorkOrderInput): Promise<CompanyWorkOrder> { return this.store.createWorkOrder(this.context.companyId, input); }
  async getWorkOrder(workOrderId: string): Promise<CompanyWorkOrder> {
    validateEntityId(workOrderId, "Work Order ID");
    const workOrder = await this.store.getWorkOrder(this.context.companyId, workOrderId);
    if (!workOrder) throw notFound("Work Order");
    return workOrder;
  }
  async updateWorkOrder(workOrderId: string, input: WorkOrderUpdate): Promise<CompanyWorkOrder> {
    validateEntityId(workOrderId, "Work Order ID");
    const workOrder = await this.store.updateWorkOrder(this.context.companyId, workOrderId, input);
    if (!workOrder) throw notFound("Work Order");
    return workOrder;
  }
  async importBrowserData(input: unknown): Promise<BrowserDataImportResult> {
    return await this.store.importBrowserData(this.context.companyId, validateBrowserDataImport(input));
  }
}
