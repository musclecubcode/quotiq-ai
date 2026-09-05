import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserDataMigration } from "./BrowserDataMigration";

vi.mock("@/lib/company-profile-repository", () => ({ getCompanyProfileSnapshot: () => null }));
vi.mock("@/lib/job-intelligence-repository", () => ({ getJobIntelligenceExport: () => ({ measurements: [], notes: [], attachments: [] }) }));
vi.mock("@/lib/workorder-repository", () => ({ getAllClients: () => [], getAllWorkOrders: () => [] }));

describe("BrowserDataMigration", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("previews explicitly, imports only after confirmation, and retains local browser data", async () => {
    localStorage.setItem("quotiq.clients.user", "important-local-copy");
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ready", records: { clients:0,workOrders:0,measurements:0,notes:0,attachments:0 }, localDataRetained:true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ imported: { clients:0,workOrders:0,measurements:0,notes:0,attachments:0 }, verifiedAt:"2026-09-04T12:00:00.000Z", localDataRetained:true, idempotentReplay:false }), { status: 200 }));
    const user = userEvent.setup();
    render(<BrowserDataMigration />);
    await user.click(screen.getByRole("button", { name: "Preview browser data" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Ready to import")).toBeVisible();
    expect(localStorage.getItem("quotiq.clients.user")).toBe("important-local-copy");
    await user.click(screen.getByRole("button", { name: "Confirm safe import" }));
    expect(await screen.findByText("Metadata import verified")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("quotiq.clients.user")).toBe("important-local-copy");
  });
});
