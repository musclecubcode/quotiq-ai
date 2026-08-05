import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkOrderWorkspace } from "./WorkOrderWorkspace";
import {
  createClient,
  createWorkOrder,
  getWorkOrder,
  resetRepositoryCacheForTests,
} from "@/lib/workorder-repository";

describe("WorkOrderWorkspace", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRepositoryCacheForTests();
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce("50000000-0000-4000-8000-000000000005")
      .mockReturnValueOnce("60000000-0000-4000-8000-000000000006");
  });

  it("opens a persisted Work Order and saves edits", async () => {
    const user = userEvent.setup();
    const client = createClient({
      firstName: "Morgan",
      lastName: "Hill",
      phone: "555-0102",
      email: "morgan@example.com",
      address: "30 Cedar St",
      city: "Austin",
      state: "TX",
      zip: "78703",
    });
    const workOrder = createWorkOrder({
      clientId: client.id,
      serviceAddress: "30 Cedar St, Austin, TX",
      trade: "painting",
      category: "maintenance",
      priority: "medium",
      status: "scheduled",
      description: "Paint the exterior trim.",
      scheduledDate: "2026-09-01",
    });

    render(<WorkOrderWorkspace workOrderId={workOrder.id} />);
    expect(screen.getByText("Morgan Hill")).toBeInTheDocument();
    expect(screen.getByText("Paint the exterior trim.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Work Order" }));
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Exterior Trim Painting");
    await user.selectOptions(screen.getByLabelText("Status"), "in_progress");
    await user.clear(screen.getByLabelText("Budget"));
    await user.type(screen.getByLabelText("Budget"), "1800");
    await user.click(screen.getByRole("button", { name: "Save Work Order" }));

    expect(screen.getByRole("status")).toHaveTextContent("Work Order saved.");
    expect(screen.getByRole("heading", { name: "Exterior Trim Painting" })).toBeInTheDocument();
    expect(getWorkOrder(workOrder.id)).toMatchObject({ status: "in_progress", budget: 1800 });
  });

  it("shows a clear state for a missing Work Order", () => {
    render(<WorkOrderWorkspace workOrderId="missing-work-order" />);
    expect(screen.getByRole("heading", { name: "Work Order not found" })).toBeInTheDocument();
  });
});
