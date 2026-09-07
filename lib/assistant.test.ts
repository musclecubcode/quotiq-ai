import { describe, expect, it } from "vitest";
import { generateAssistantReply } from "./assistant";
import type { AssistantContext } from "./assistant";

const context: AssistantContext = {
  clients: [{ id: "client_1", firstName: "Alex", lastName: "Rivera", email: "alex@example.com", phone: "555-0100", address: "1 Main St", city: "Austin", state: "TX", zip: "78701", status: "active", createdAt: "2026-09-01T12:00:00.000Z" }],
  workOrders: [{ id: "work_1", clientId: "client_1", title: "Repair — 1 Main St", trade: "handyman", category: "repair", priority: "medium", serviceAddress: "1 Main St", description: "Repair trim", status: "scheduled", startDate: "2026-09-08", endDate: "2026-09-08", budget: 500, progress: 0, crew: [] }],
  invoices: [{ id: "invoice_1", workOrderId: "work_1", clientId: "client_1", number: "INV-2026-0001", description: "Repair trim", issueDate: "2026-09-07", dueDate: "2026-09-21", amount: 500, amountPaid: 100, status: "sent", createdAt: "2026-09-07T12:00:00.000Z" }],
};

describe("workspace assistant", () => {
  it("answers from the authenticated company snapshot", () => {
    expect(generateAssistantReply("What is in my workspace?", context)).toContain("1 client(s), 1 active Work Order(s), and $400");
  });

  it("lists overdue invoices using the matching company client", () => {
    const overdue = { ...context, invoices: [{ ...context.invoices[0], status: "overdue" as const }] };
    expect(generateAssistantReply("Which invoices are overdue?", overdue)).toContain("INV-2026-0001 — Alex Rivera — $400");
  });
});
