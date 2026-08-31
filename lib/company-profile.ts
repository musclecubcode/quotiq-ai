import type { CompanyLogoAsset, CompanyProfile, IssuerSnapshot } from "./types";

export const DEFAULT_ACCENT_COLOR = "#2563eb";
export const DEFAULT_CURRENCY = "USD";

export type CompanyProfileInput = Omit<
  CompanyProfile,
  "id" | "ownerId" | "logo" | "createdAt" | "updatedAt"
>;

export class CompanyProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompanyProfileValidationError";
  }
}

const required = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) throw new CompanyProfileValidationError(`${label} is required.`);
  return trimmed;
};

const optionalUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try { url = new URL(candidate); }
  catch { throw new CompanyProfileValidationError("Website must be a valid web address."); }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new CompanyProfileValidationError("Website must use HTTP or HTTPS.");
  }
  return url.toString();
};

const percentage = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new CompanyProfileValidationError(`${label} must be between 0 and 100.`);
  }
  return value;
};

export function normalizeCompanyProfileInput(input: CompanyProfileInput): CompanyProfileInput {
  const email = input.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CompanyProfileValidationError("Email must be valid.");
  }
  const currency = input.defaultCurrency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new CompanyProfileValidationError("Currency must be a three-letter ISO code.");
  }
  const accentColor = input.accentColor.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(accentColor)) {
    throw new CompanyProfileValidationError("Brand color must be a six-digit hex color.");
  }
  return {
    legalName: input.legalName.trim(),
    displayName: required(input.displayName, "Company name"),
    email,
    phone: input.phone.trim(),
    website: optionalUrl(input.website),
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    postalCode: input.postalCode.trim(),
    country: input.country.trim() || "US",
    contractorLicense: input.contractorLicense.trim(),
    defaultCurrency: currency,
    defaultMarkup: percentage(input.defaultMarkup, "Default markup"),
    defaultTaxRate: percentage(input.defaultTaxRate, "Default tax rate"),
    paymentTerms: input.paymentTerms.trim(),
    estimateTerms: input.estimateTerms.trim(),
    invoiceTerms: input.invoiceTerms.trim(),
    accentColor,
  };
}

export function createIssuerSnapshot(profile: CompanyProfile, capturedAt = new Date().toISOString()): IssuerSnapshot {
  const logo = profile.logo ? Object.freeze({ ...profile.logo }) : null;
  return Object.freeze({
    companyId: profile.id,
    legalName: profile.legalName,
    displayName: profile.displayName,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    postalCode: profile.postalCode,
    country: profile.country,
    contractorLicense: profile.contractorLicense,
    accentColor: profile.accentColor,
    logo,
    capturedAt,
  });
}

export function companyProfileDefaults(displayName = ""): CompanyProfileInput {
  return {
    displayName,
    legalName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    contractorLicense: "",
    defaultCurrency: DEFAULT_CURRENCY,
    defaultMarkup: 0,
    defaultTaxRate: 0,
    paymentTerms: "Due upon receipt",
    estimateTerms: "Estimate valid for 30 days.",
    invoiceTerms: "Thank you for your business.",
    accentColor: DEFAULT_ACCENT_COLOR,
  };
}

export function withLogo(profile: CompanyProfile, logo: CompanyLogoAsset | null, updatedAt = new Date().toISOString()): CompanyProfile {
  return { ...profile, logo, updatedAt };
}
