import { beforeEach, describe, expect, it, vi } from "vitest";
import { companyProfileDefaults } from "./company-profile";
import {
  resetCompanyProfileRepositoryForTests,
  saveCompanyProfile,
  setCompanyLogo,
  setCompanyProfileOwnerScope,
} from "./company-profile-repository";

describe("company profile repository", () => {
  beforeEach(() => {
    localStorage.clear();
    resetCompanyProfileRepositoryForTests();
    vi.restoreAllMocks();
  });

  it("creates and updates a profile without changing its identity", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("company_1");
    setCompanyProfileOwnerScope("user_1");
    const created = saveCompanyProfile(companyProfileDefaults("North Star Electric"));
    const updated = saveCompanyProfile({ ...companyProfileDefaults("North Star Electrical"), defaultMarkup: 20 });
    expect(created.id).toBe("company_1");
    expect(updated).toMatchObject({ id: "company_1", ownerId: "user_1", displayName: "North Star Electrical", defaultMarkup: 20 });
    expect(updated.createdAt).toBe(created.createdAt);
  });

  it("isolates company profiles by owner scope", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("company_1").mockReturnValueOnce("company_2");
    setCompanyProfileOwnerScope("user_1");
    saveCompanyProfile(companyProfileDefaults("Company One"));
    setCompanyProfileOwnerScope("user_2");
    const second = saveCompanyProfile(companyProfileDefaults("Company Two"));
    setCompanyProfileOwnerScope("user_1");
    const first = saveCompanyProfile(companyProfileDefaults("Company One Updated"));
    expect(first.id).toBe("company_1");
    expect(second.id).toBe("company_2");
    expect(JSON.parse(localStorage.getItem("quotiq.companyProfile.user_2") ?? "null").displayName).toBe("Company Two");
  });

  it("replaces and removes logo metadata", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("company_1");
    setCompanyProfileOwnerScope("user_1");
    saveCompanyProfile(companyProfileDefaults("Company"));
    const first = { id: "logo_1", storageKey: "user_1/logos/logo_1", fileName: "one.png", mimeType: "image/png" as const, size: 4, createdAt: "now" };
    const second = { ...first, id: "logo_2", storageKey: "user_1/logos/logo_2", fileName: "two.png" };
    expect(setCompanyLogo(first).logo?.id).toBe("logo_1");
    expect(setCompanyLogo(second).logo?.id).toBe("logo_2");
    expect(setCompanyLogo(null).logo).toBeNull();
  });
});
