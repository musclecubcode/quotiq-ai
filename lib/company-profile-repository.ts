"use client";

import { useSyncExternalStore } from "react";
import { normalizeCompanyProfileInput, type CompanyProfileInput } from "./company-profile";
import type { CompanyLogoAsset, CompanyProfile } from "./types";

const STORAGE_PREFIX = "quotiq.companyProfile";
let activeOwnerId = "";
let cachedRaw: string | null | undefined;
let cachedProfile: CompanyProfile | null = null;
const listeners = new Set<() => void>();

export class CompanyProfileRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompanyProfileRepositoryError";
  }
}

const storageKey = (ownerId = activeOwnerId) => `${STORAGE_PREFIX}.${ownerId}`;

function read(): CompanyProfile | null {
  if (!activeOwnerId || typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey());
  if (raw !== cachedRaw) {
    try { cachedProfile = raw ? JSON.parse(raw) as CompanyProfile : null; }
    catch { throw new CompanyProfileRepositoryError("Saved company profile data could not be read."); }
    cachedRaw = raw;
  }
  return cachedProfile;
}

function emit() { listeners.forEach((listener) => listener()); }

function write(profile: CompanyProfile) {
  try { localStorage.setItem(storageKey(), JSON.stringify(profile)); }
  catch { throw new CompanyProfileRepositoryError("Company profile could not be saved in this browser."); }
  cachedRaw = undefined;
  read();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => { if (event.key === storageKey()) emit(); };
  addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); removeEventListener("storage", onStorage); };
}

export function saveCompanyProfile(input: CompanyProfileInput): CompanyProfile {
  if (!activeOwnerId) throw new CompanyProfileRepositoryError("Company owner is not available.");
  const existing = read();
  const now = new Date().toISOString();
  const profile: CompanyProfile = {
    ...normalizeCompanyProfileInput(input),
    id: existing?.id ?? crypto.randomUUID(),
    ownerId: activeOwnerId,
    logo: existing?.logo ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  write(profile);
  return profile;
}

export function setCompanyLogo(logo: CompanyLogoAsset | null): CompanyProfile {
  const existing = read();
  if (!existing) throw new CompanyProfileRepositoryError("Save the company profile before adding a logo.");
  const profile = { ...existing, logo, updatedAt: new Date().toISOString() };
  write(profile);
  return profile;
}

export function useCompanyProfile() {
  const profile = useSyncExternalStore(subscribe, read, () => null);
  return { profile, saveCompanyProfile, setCompanyLogo };
}

export function getCompanyProfileSnapshot() { return read(); }

export function setCompanyProfileOwnerScope(ownerId: string) {
  if (activeOwnerId === ownerId) return;
  activeOwnerId = ownerId;
  cachedRaw = undefined;
  cachedProfile = null;
  emit();
}

export function resetCompanyProfileRepositoryForTests() {
  activeOwnerId = "";
  cachedRaw = undefined;
  cachedProfile = null;
}

export { STORAGE_PREFIX as COMPANY_PROFILE_STORAGE_PREFIX };
