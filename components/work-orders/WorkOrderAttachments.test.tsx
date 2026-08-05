import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkOrderPhotos } from "./WorkOrderPhotos";
import { getJobIntelligence, resetJobIntelligenceCacheForTests, useJobIntelligence } from "@/lib/job-intelligence-repository";

function PhotoHarness() {
  const intelligence = useJobIntelligence("wo-photo-test");
  return <WorkOrderPhotos workOrderId="wo-photo-test" attachments={intelligence.attachments.filter((item) => item.kind === "photo")} />;
}

describe("Work Order photos", () => {
  beforeEach(() => {
    localStorage.clear();
    resetJobIntelligenceCacheForTests();
    vi.restoreAllMocks();
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("d0000000-0000-4000-8000-00000000000d");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:photo-preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  it("uses rear-camera capture separately from multi-photo library selection", () => {
    render(<PhotoHarness />);
    const camera = screen.getByLabelText("Take Photo");
    const library = screen.getByLabelText("Choose Photos");

    expect(camera).toHaveAttribute("accept", "image/*");
    expect(camera).toHaveAttribute("capture", "environment");
    expect(camera).not.toHaveAttribute("multiple");
    expect(library).toHaveAttribute("multiple");
    expect(library).not.toHaveAttribute("capture");
  });

  it("saves a photo, opens its preview, edits its caption, and deletes it", async () => {
    const user = userEvent.setup();
    render(<PhotoHarness />);
    const photo = new File(["job photo"], "IMG_1534.jpeg", { type: "image/jpeg" });

    await user.upload(screen.getByLabelText("Choose Photos"), photo);
    expect(await screen.findByText("1 photo")).toBeInTheDocument();
    expect(screen.queryByText("IMG_1534.jpeg")).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Open photo" }));
    expect(screen.getByRole("dialog", { name: "Photo preview" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close photo preview" }));

    const caption = screen.getByLabelText("Photo caption");
    await user.type(caption, "Fence before repair");
    await user.tab();
    await waitFor(() => expect(getJobIntelligence("wo-photo-test").attachments[0]?.caption).toBe("Fence before repair"));

    await user.click(screen.getByRole("button", { name: "Delete photo" }));
    expect(await screen.findByText("No job photos yet")).toBeInTheDocument();
    expect(getJobIntelligence("wo-photo-test").attachments).toHaveLength(0);
  });
});
