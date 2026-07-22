import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
      .mockReturnValueOnce("30000000-0000-4000-8000-000000000003")
      .mockReturnValueOnce("40000000-0000-4000-8000-000000000004");
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
    render(<CreateWorkOrderForm />);

    await user.selectOptions(screen.getByLabelText("Client"), client.id);
    await user.type(screen.getByLabelText("Service Address"), "22 Pine St, Austin, TX");
    await user.selectOptions(screen.getByLabelText("Trade"), "handyman");
    await user.selectOptions(screen.getByLabelText("Category"), "repair");
    await user.type(screen.getByLabelText("Scheduled Date"), "2026-08-10");
    await user.type(screen.getByLabelText("Description"), "Repair damaged trim.");
    await user.click(screen.getByRole("button", { name: "Create Work Order" }));

    expect(push).toHaveBeenCalledWith("/jobs/40000000-0000-4000-8000-000000000004");
  });
});
