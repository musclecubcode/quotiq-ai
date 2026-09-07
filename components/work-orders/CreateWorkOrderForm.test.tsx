import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudDataProvider } from "@/components/auth/CloudDataProvider";
import { CreateWorkOrderForm } from "./CreateWorkOrderForm";
import { createClient, resetRepositoryCacheForTests } from "@/lib/workorder-repository";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("CreateWorkOrderForm", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRepositoryCacheForTests();
    push.mockReset();
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce("30000000-0000-4000-8000-000000000003");
  });

  it("creates a Work Order and redirects directly to its dynamic route", async () => {
    const user = userEvent.setup();
    const client = createClient({
      firstName: "Jordan",
      lastName: "Lee",
      phone: "555-0101",
      email: "jordan@example.com",
      address: "22 Pine St",
      city: "Austin",
      state: "TX",
      zip: "78702",
    });
    const savedWorkOrder = {
      id: "40000000-0000-4000-8000-000000000004",
      clientId: client.id,
      title: "Repair — 22 Pine St, Austin, TX",
      trade: "handyman" as const,
      category: "repair" as const,
      priority: "medium" as const,
      serviceAddress: "22 Pine St, Austin, TX",
      description: "Repair damaged trim.",
      status: "scheduled" as const,
      startDate: "2026-08-10",
      endDate: "2026-08-10",
      budget: 0,
      progress: 0,
      crew: [],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(savedWorkOrder), { status: 201 })));
    render(<CloudDataProvider initialData={{ clients: [client], workOrders: [], invoices: [] }}><CreateWorkOrderForm /></CloudDataProvider>);

    await user.selectOptions(screen.getByLabelText("Client"), client.id);
    await user.type(screen.getByLabelText("Service Address"), "22 Pine St, Austin, TX");
    await user.selectOptions(screen.getByLabelText("Trade"), "handyman");
    await user.selectOptions(screen.getByLabelText("Category"), "repair");
    await user.type(screen.getByLabelText("Scheduled Date"), "2026-08-10");
    await user.type(screen.getByLabelText("Description"), "Repair damaged trim.");
    await user.click(screen.getByRole("button", { name: "Create Work Order" }));

    expect(push).toHaveBeenCalledWith(`/jobs/${savedWorkOrder.id}`);
    expect(fetch).toHaveBeenCalledWith("/api/data/work-orders", expect.objectContaining({ method: "POST" }));
  });
});
