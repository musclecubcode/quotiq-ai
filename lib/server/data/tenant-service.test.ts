import { beforeEach, describe, expect, it } from "vitest";
import { companyProfileDefaults } from "../../company-profile";
import { resolveAuthorizedCompany } from "./authorization";
import { TenantDataService } from "./tenant-service";
import { InMemoryProductionDataStore } from "./testing/in-memory-store";

const timestamp = "2026-08-31T12:00:00.000Z";
const clientInput = (name: string) => ({
  firstName: name, lastName: "Customer", email: `${name.toLowerCase()}@example.com`, phone: "555-0100",
  address: "1 Main St", city: "Austin", state: "TX", zip: "78701",
});
const workOrderInput = (clientId: string) => ({
  clientId, serviceAddress: "1 Main St, Austin, TX", trade: "painting" as const,
  category: "maintenance" as const, priority: "medium" as const, status: "scheduled" as const,
  description: "Paint exterior trim.", scheduledDate: "2026-09-15",
});

describe("production tenant data service", () => {
  let counter: number;
  let store: InMemoryProductionDataStore;

  beforeEach(() => {
    counter = 0;
    store = new InMemoryProductionDataStore(() => `id_${++counter}`, () => timestamp);
  });

  it("persists a company and owner membership, then authorizes profile updates", async () => {
    const { company, membership } = await store.createCompanyWithOwner(companyProfileDefaults("Alpha Electric"), "user_alpha", "org_alpha");
    expect(membership).toMatchObject({ companyId: company.id, clerkUserId: "user_alpha", role: "owner" });
    const context = await resolveAuthorizedCompany(store, { clerkUserId: "user_alpha", clerkOrganizationId: "org_alpha" });
    const service = new TenantDataService(store, context);
    const saved = await service.updateCompany({ ...companyProfileDefaults("Alpha Electrical"), defaultMarkup: 18 });
    expect(saved).toMatchObject({ id: company.id, displayName: "Alpha Electrical", defaultMarkup: 18 });
  });

  it("provisions the first user once and resolves the same owner on retries", async () => {
    const first = await store.ensureCompanyWithOwner(companyProfileDefaults("Alpha"), "user_alpha", null);
    const retry = await store.ensureCompanyWithOwner(companyProfileDefaults("Changed name"), "user_alpha", null);
    expect(first.created).toBe(true);
    expect(retry).toMatchObject({ created: false, company: { id: first.company.id, displayName: "Alpha" }, membership: { id: first.membership.id, role: "owner" } });
    expect(await store.listActiveMembershipsForUser("user_alpha")).toHaveLength(1);
  });

  it("rejects unauthenticated users and users without company membership", async () => {
    await store.createCompanyWithOwner(companyProfileDefaults("Alpha"), "user_alpha", "org_alpha");
    await expect(resolveAuthorizedCompany(store, null)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(resolveAuthorizedCompany(store, { clerkUserId: "outsider", clerkOrganizationId: "org_alpha" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("isolates clients and Work Orders across companies", async () => {
    await store.createCompanyWithOwner(companyProfileDefaults("Alpha"), "user_alpha", "org_alpha");
    await store.createCompanyWithOwner(companyProfileDefaults("Bravo"), "user_bravo", "org_bravo");
    const alpha = new TenantDataService(store, await resolveAuthorizedCompany(store, { clerkUserId: "user_alpha", clerkOrganizationId: "org_alpha" }));
    const bravo = new TenantDataService(store, await resolveAuthorizedCompany(store, { clerkUserId: "user_bravo", clerkOrganizationId: "org_bravo" }));
    const alphaClient = await alpha.createClient(clientInput("Alpha"));
    const bravoClient = await bravo.createClient(clientInput("Bravo"));
    const bravoWorkOrder = await bravo.createWorkOrder(workOrderInput(bravoClient.id));

    expect(await alpha.listClients()).toEqual([expect.objectContaining({ id: alphaClient.id })]);
    expect(await alpha.listWorkOrders()).toEqual([]);
    await expect(alpha.getClient(bravoClient.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(alpha.getWorkOrder(bravoWorkOrder.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(alpha.createWorkOrder(workOrderInput(bravoClient.id))).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("rejects invalid record IDs before querying storage", async () => {
    await store.createCompanyWithOwner(companyProfileDefaults("Alpha"), "user_alpha", null);
    const service = new TenantDataService(store, await resolveAuthorizedCompany(store, { clerkUserId: "user_alpha", clerkOrganizationId: null }));
    await expect(service.getClient("../../company_b/client")).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("requires an active organization when a user has multiple memberships", async () => {
    await store.createCompanyWithOwner(companyProfileDefaults("Alpha"), "shared_user", "org_alpha");
    await store.createCompanyWithOwner(companyProfileDefaults("Bravo"), "shared_user", "org_bravo");
    await expect(resolveAuthorizedCompany(store, { clerkUserId: "shared_user", clerkOrganizationId: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const selected = await resolveAuthorizedCompany(store, { clerkUserId: "shared_user", clerkOrganizationId: "org_bravo" });
    expect((await store.getCompany(selected.companyId))?.displayName).toBe("Bravo");
  });

  it("imports validated browser data without deleting the source or changing IDs", async () => {
    await store.createCompanyWithOwner(companyProfileDefaults("Alpha"), "user_alpha", null);
    const service = new TenantDataService(store, await resolveAuthorizedCompany(store, { clerkUserId: "user_alpha", clerkOrganizationId: null }));
    const payload = {
      version: 1,
      clients: [{ id: "client_local_1", ...clientInput("Local"), status: "active", createdAt: timestamp }],
      workOrders: [{ id: "work_local_1", clientId: "client_local_1", title: "Local job", trade: "painting", category: "maintenance", priority: "medium", serviceAddress: "1 Main St", description: "Paint", status: "scheduled", startDate: "2026-09-01", endDate: "2026-09-01", budget: 0, progress: 0, crew: [] }],
      measurements: [{ id: "measurement_local_1", workOrderId: "work_local_1", type: "area", label: "Wall", value: 100, unit: "sq ft", quantity: 1, createdAt: timestamp }],
      notes: [], attachments: [],
    };
    const result = await service.importBrowserData(payload);
    expect(result).toMatchObject({ localDataRetained: true, imported: { clients: 1, workOrders: 1, measurements: 1 } });
    expect((await service.getClient("client_local_1")).id).toBe("client_local_1");
    expect((await service.getWorkOrder("work_local_1")).clientId).toBe("client_local_1");
    const replay = await service.importBrowserData(payload);
    expect(replay).toMatchObject({ idempotentReplay: true, localDataRetained: true, imported: { clients: 1, workOrders: 1 } });
    expect(await service.listClients()).toHaveLength(1);
  });

  it("rejects a changed replay without modifying the verified import", async () => {
    await store.createCompanyWithOwner(companyProfileDefaults("Alpha"), "user_alpha", null);
    const service = new TenantDataService(store, await resolveAuthorizedCompany(store, { clerkUserId: "user_alpha", clerkOrganizationId: null }));
    const payload = { version: 1, clients: [{ id: "client_1", ...clientInput("Original"), status: "active", createdAt: timestamp }], workOrders: [], measurements: [], notes: [], attachments: [] };
    await service.importBrowserData(payload);
    await expect(service.importBrowserData({ ...payload, clients: [{ ...payload.clients[0], firstName: "Changed" }] })).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await service.getClient("client_1")).firstName).toBe("Original");
  });

  it("rejects migration records with broken relationships or duplicate IDs", async () => {
    await store.createCompanyWithOwner(companyProfileDefaults("Alpha"), "user_alpha", null);
    const service = new TenantDataService(store, await resolveAuthorizedCompany(store, { clerkUserId: "user_alpha", clerkOrganizationId: null }));
    const badRelationship = { version: 1, clients: [], workOrders: [{ id: "work_1", clientId: "missing", title: "Job", trade: "painting", category: "maintenance", priority: "medium", status: "scheduled", serviceAddress: "Address", description: "Scope", budget: 0, progress: 0 }], measurements: [], notes: [], attachments: [] };
    await expect(service.importBrowserData(badRelationship)).rejects.toMatchObject({ code: "VALIDATION" });

    const duplicateClients = { version: 1, clients: [{ id: "client_1", ...clientInput("One") }, { id: "client_1", ...clientInput("Two") }], workOrders: [], measurements: [], notes: [], attachments: [] };
    await expect(service.importBrowserData(duplicateClients)).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
