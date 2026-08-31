import { beforeEach, describe, expect, it, vi } from "vitest";
import { localCompanyLogoStorage, validateCompanyLogo } from "./company-logo-storage";

const png = (name = "logo.png") => new File([
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
], name, { type: "image/png" });

describe("company logo storage", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("validates file content rather than trusting its extension", async () => {
    await expect(validateCompanyLogo(png())).resolves.toBe("image/png");
    await expect(validateCompanyLogo(new File(["not an image"], "fake.png", { type: "image/png" }))).rejects.toThrow("valid PNG, JPEG, or WebP");
    await expect(validateCompanyLogo(new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "logo.svg", { type: "image/svg+xml" }))).rejects.toThrow("valid PNG, JPEG, or WebP");
  });

  it("stores tenant-prefixed metadata and removes the blob", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("logo_1");
    const asset = await localCompanyLogoStorage.put("company_1", png());
    expect(asset).toMatchObject({ id: "logo_1", storageKey: "company_1/logos/logo_1", mimeType: "image/png", size: 8 });
    expect(await localCompanyLogoStorage.get(asset)).toBeDefined();
    await localCompanyLogoStorage.delete(asset);
    expect(await localCompanyLogoStorage.get(asset)).toBeUndefined();
  });
});
