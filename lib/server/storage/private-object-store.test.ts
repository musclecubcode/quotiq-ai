import { describe, expect, it } from "vitest";
import { privateAssetKey } from "./private-asset-key";

describe("private Supabase object keys", () => {
  it("uses tenant-prefixed, purpose-specific object paths", () => {
    expect(privateAssetKey("company_1", "logos", "logo_1", "Brand Final.PNG"))
      .toBe("company_1/logos/logo_1.png");
    expect(privateAssetKey("company_1", "documents", "doc_1", "contract.pdf"))
      .toBe("company_1/documents/doc_1.pdf");
  });

  it("rejects unsafe tenant and asset identifiers", () => {
    expect(() => privateAssetKey("../company", "photos", "photo_1", "photo.jpg")).toThrow();
    expect(() => privateAssetKey("company_1", "photos", "../photo", "photo.jpg")).toThrow();
  });
});
