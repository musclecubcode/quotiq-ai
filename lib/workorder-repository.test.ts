import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLIENT_STORAGE_KEY,
  WORK_ORDER_STORAGE_KEY,
  createClient,
  createWorkOrder,
  getAllClients,
  getWorkOrder,
  getWorkOrdersForClient,
  resetRepositoryCacheForTests,
  setRepositoryUserScope,
  updateWorkOrder,
} from "./workorder-repository";

describe("Work Order repository workflow", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRepositoryCacheForTests();
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce("10000000-0000-4000-8000-000000000001")
      .mockReturnValueOnce("20000000-0000-4000-8000-000000000002");
  });

  it("creates, opens, edits, and relates a persisted Work Order to its client", () => {
    const client = createClient({
      firstName: "Avery",
      lastName: "Stone",
      phone: "555-0100",
      email: "avery@example.com",
      address: "10 Oak St",
      city: "Austin",
      state: "TX",
      zip: "78701",
    });

    const workOrder = createWorkOrder({
      clientId: client.id,
      serviceAddress: "10 Oak St, Austin, TX",
      trade: "electrical",
      category: "repair",
      priority: "high",
      status: "scheduled",
      description: "Replace the damaged service panel.",
      scheduledDate: "2026-08-01",
      internalNotes: "Confirm utility disconnect.",
    });

    expect(JSON.parse(localStorage.getItem(CLIENT_STORAGE_KEY) ?? "[]")).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(WORK_ORDER_STORAGE_KEY) ?? "[]")).toHaveLength(1);
    expect(getWorkOrder(workOrder.id)).toMatchObject({ clientId: client.id, status: "scheduled" });

    const edited = updateWorkOrder(workOrder.id, {
      title: "Service Panel Replacement",
      trade: "electrical",
      category: "repair",
      priority: "urgent",
      serviceAddress: workOrder.serviceAddress,
      description: workOrder.description,
      internalNotes: "Utility disconnect approved.",
      status: "in_progress",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
      budget: 3200,
      progress: 25,
    });

    expect(getWorkOrder(workOrder.id)).toEqual(edited);
    expect(edited).toMatchObject({ title: "Service Panel Replacement", status: "in_progress", budget: 3200 });
    expect(getWorkOrdersForClient(client.id)).toContainEqual(edited);
  });

  it("isolates each signed-in user's browser workspace", () => {
    setRepositoryUserScope("user-a");
    createClient({ firstName: "A", lastName: "User", phone: "555-0100", email: "a@example.com", address: "1 Main St", city: "Austin", state: "TX", zip: "78701" });
    expect(getAllClients()).toHaveLength(1);

    setRepositoryUserScope("user-b");
    expect(getAllClients()).toHaveLength(0);

    setRepositoryUserScope("user-a");
    expect(getAllClients()).toHaveLength(1);
  });
});
