import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addAttachment,
  addMeasurement,
  addNote,
  calculateMeasurementArea,
  deleteAttachment,
  getAttachmentFile,
  getJobIntelligence,
  resetJobIntelligenceCacheForTests,
  updateAttachmentText,
  updateNote,
} from "./job-intelligence-repository";

describe("job intelligence repository", () => {
  beforeEach(() => {
    localStorage.clear();
    resetJobIntelligenceCacheForTests();
    vi.restoreAllMocks();
  });

  it("adds a measurement and calculates square footage", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("90000000-0000-4000-8000-000000000009");
    const measurement = addMeasurement("wo-a", { type: "area", label: "North wall", unit: "ft", width: 12, height: 8, quantity: 2 });
    expect(calculateMeasurementArea(measurement)).toBe(192);
    expect(getJobIntelligence("wo-a").measurements).toContainEqual(measurement);
    expect(getJobIntelligence("wo-b").measurements).toHaveLength(0);
  });

  it("adds and edits a timestamped note", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("a0000000-0000-4000-8000-00000000000a");
    const note = addNote("wo-a", "Crew only", "internal");
    const saved = updateNote(note.id, "Share with customer", "client");
    expect(saved).toMatchObject({ body: "Share with customer", visibility: "client", workOrderId: "wo-a" });
  });

  it("associates attachments with one Work Order and deletes the file and metadata", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("b0000000-0000-4000-8000-00000000000b");
    const file = new File(["site photo"], "site.jpg", { type: "image/jpeg" });
    const attachment = await addAttachment("wo-a", "photo", file, "Before work");
    expect(getJobIntelligence("wo-a").attachments).toContainEqual(attachment);
    expect(getJobIntelligence("wo-b").attachments).toHaveLength(0);
    expect(await getAttachmentFile(attachment.id)).toBeDefined();
    await deleteAttachment(attachment.id);
    expect(getJobIntelligence("wo-a").attachments).toHaveLength(0);
    expect(await getAttachmentFile(attachment.id)).toBeUndefined();
  });

  it("reloads saved photo metadata and persists caption edits", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("c0000000-0000-4000-8000-00000000000c");
    const file = new File(["saved photo"], "refresh.jpg", { type: "image/jpeg" });
    const attachment = await addAttachment("wo-refresh", "photo", file, "Before refresh");

    await updateAttachmentText(attachment.id, "After refresh");
    resetJobIntelligenceCacheForTests();

    expect(getJobIntelligence("wo-refresh").attachments).toContainEqual(
      expect.objectContaining({ id: attachment.id, caption: "After refresh", workOrderId: "wo-refresh", kind: "photo" }),
    );
    expect(await getAttachmentFile(attachment.id)).toBeDefined();
  });
});
