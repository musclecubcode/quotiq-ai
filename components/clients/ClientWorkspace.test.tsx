import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientWorkspace } from "./ClientWorkspace";
import { createClient, createWorkOrder, resetRepositoryCacheForTests } from "@/lib/workorder-repository";

describe("ClientWorkspace", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRepositoryCacheForTests();
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce("70000000-0000-4000-8000-000000000007")
      .mockReturnValueOnce("80000000-0000-4000-8000-000000000008");
  });

  it("displays a persisted Work Order under the correct client", async () => {
    const user = userEvent.setup();
    const client = createClient({
      firstName: "Taylor",
      lastName: "Reed",
      phone: "555-0103",
      email: "taylor@example.com",
      address: "44 Elm St",
      city: "Austin",
      state: "TX",
      zip: "78704",
    });
    const workOrder = createWorkOrder({
      clientId: client.id,
      serviceAddress: "44 Elm St, Austin, TX",
      trade: "plumbing",
      category: "repair",
      priority: "medium",
      status: "scheduled",
      description: "Repair the supply line.",
      scheduledDate: "2026-09-10",
    });

    render(<ClientWorkspace clientId={client.id} />);
    await user.click(screen.getByRole("button", { name: "Work Orders (1)" }));

    expect(screen.getByRole("link", { name: workOrder.title })).toHaveAttribute(
      "href",
      `/jobs/${workOrder.id}`
    );
  });
});
