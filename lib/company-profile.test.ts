import { describe, expect, it } from "vitest";
import {
  companyProfileDefaults,
  createIssuerSnapshot,
  normalizeCompanyProfileInput,
} from "./company-profile";
import type { CompanyProfile } from "./types";

describe("company profile domain", () => {
  it("normalizes safe profile values", () => {
    const profile = normalizeCompanyProfileInput({
      ...companyProfileDefaults(" North Star Electric "),
      website: "northstar.example",
      defaultMarkup: 18.5,
      defaultTaxRate: 8.25,
    });
    expect(profile.displayName).toBe("North Star Electric");
    expect(profile.website).toBe("https://northstar.example/");
    expect(profile.defaultCurrency).toBe("USD");
  });

  it("rejects invalid profile values", () => {
    expect(() => normalizeCompanyProfileInput({ ...companyProfileDefaults(), displayName: "" })).toThrow("Company name is required");
    expect(() => normalizeCompanyProfileInput({ ...companyProfileDefaults("Company"), defaultTaxRate: 101 })).toThrow("between 0 and 100");
    expect(() => normalizeCompanyProfileInput({ ...companyProfileDefaults("Company"), accentColor: "red" })).toThrow("hex color");
  });

  it("creates a frozen issuer snapshot independent from later profile changes", () => {
    const profile: CompanyProfile = {
      ...companyProfileDefaults("North Star Electric"),
      id: "company_1", ownerId: "user_1", legalName: "North Star Electric LLC",
      logo: { id: "logo_1", storageKey: "user_1/logos/logo_1", fileName: "logo.png", mimeType: "image/png", size: 4, createdAt: "2026-01-01T00:00:00.000Z" },
      createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const snapshot = createIssuerSnapshot(profile, "2026-02-01T00:00:00.000Z");
    profile.displayName = "Renamed Company";
    expect(snapshot.displayName).toBe("North Star Electric");
    expect(snapshot.capturedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.logo)).toBe(true);
  });
});
