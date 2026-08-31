"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { BrandedDocumentHeader } from "./BrandedDocumentHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import {
  COMPANY_LOGO_ACCEPT,
  localCompanyLogoStorage,
  MAX_COMPANY_LOGO_BYTES,
  validateCompanyLogo,
} from "@/lib/company-logo-storage";
import {
  companyProfileDefaults,
  type CompanyProfileInput,
} from "@/lib/company-profile";
import { useCompanyProfile } from "@/lib/company-profile-repository";
import type { CompanyProfile } from "@/lib/types";

function useStoredLogoUrl(profile: CompanyProfile | null) {
  const [stored, setStored] = useState({ assetId: "", url: "" });
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    if (!profile?.logo) return;
    localCompanyLogoStorage.get(profile.logo).then((blob) => {
      if (active && blob) { objectUrl = URL.createObjectURL(blob); setStored({ assetId: profile.logo?.id ?? "", url: objectUrl }); }
    }).catch(() => undefined);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [profile?.logo]);
  return stored.assetId === profile?.logo?.id ? stored.url : "";
}

function inputFromForm(form: HTMLFormElement): CompanyProfileInput {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "");
  return {
    displayName: text("displayName"), legalName: text("legalName"), email: text("email"), phone: text("phone"),
    website: text("website"), address: text("address"), city: text("city"), state: text("state"),
    postalCode: text("postalCode"), country: text("country"), contractorLicense: text("contractorLicense"),
    defaultCurrency: text("defaultCurrency"), defaultMarkup: Number(text("defaultMarkup")),
    defaultTaxRate: Number(text("defaultTaxRate")), paymentTerms: text("paymentTerms"),
    estimateTerms: text("estimateTerms"), invoiceTerms: text("invoiceTerms"), accentColor: text("accentColor"),
  };
}

export function CompanySettings({ legacyCompanyName = "", legacyLicense = "" }: { legacyCompanyName?: string; legacyLicense?: string }) {
  const { user } = useUser();
  const { profile, saveCompanyProfile, setCompanyLogo } = useCompanyProfile();
  const defaults = useMemo(() => ({ ...companyProfileDefaults(legacyCompanyName), contractorLicense: legacyLicense }), [legacyCompanyName, legacyLicense]);
  const values = profile ?? defaults;
  const [draft, setDraft] = useState<CompanyProfileInput>(values);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingLogoUrl, setPendingLogoUrl] = useState("");
  const storedLogoUrl = useStoredLogoUrl(profile);

  useEffect(() => () => { if (pendingLogoUrl) URL.revokeObjectURL(pendingLogoUrl); }, [pendingLogoUrl]);

  const previewCompany: CompanyProfile = {
    ...draft,
    id: profile?.id ?? "preview",
    ownerId: profile?.ownerId ?? "preview",
    logo: profile?.logo ?? null,
    createdAt: profile?.createdAt ?? "",
    updatedAt: profile?.updatedAt ?? "",
  };

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null); setProfileStatus(null);
    try {
      const input = inputFromForm(event.currentTarget);
      const saved = saveCompanyProfile(input);
      setDraft(saved);
      if (user) {
        await user.update({ unsafeMetadata: { ...user.unsafeMetadata, companyName: saved.displayName, contractorLicense: saved.contractorLicense || null } });
        await user.reload();
      }
      setProfileStatus("Company profile saved.");
    } catch (caught) {
      setProfileError(caught instanceof Error ? caught.message : "Company profile could not be saved.");
    }
  }

  async function chooseLogo(file: File | undefined) {
    setLogoError(null);
    if (!file) { setPendingLogo(null); setPendingLogoUrl(""); return; }
    try {
      await validateCompanyLogo(file);
      setPendingLogo(file);
      setPendingLogoUrl(URL.createObjectURL(file));
    }
    catch (caught) { setPendingLogo(null); setPendingLogoUrl(""); setLogoError(caught instanceof Error ? caught.message : "Logo is invalid."); }
  }

  async function saveLogo() {
    if (!pendingLogo || !profile) return;
    setLogoBusy(true); setLogoError(null);
    let uploaded = null;
    try {
      uploaded = await localCompanyLogoStorage.put(profile.ownerId, pendingLogo);
      const oldLogo = profile.logo;
      setCompanyLogo(uploaded);
      setPendingLogo(null);
      setPendingLogoUrl("");
      if (oldLogo) await localCompanyLogoStorage.delete(oldLogo).catch(() => undefined);
    } catch (caught) {
      if (uploaded) await localCompanyLogoStorage.delete(uploaded).catch(() => undefined);
      setLogoError(caught instanceof Error ? caught.message : "Logo could not be saved.");
    } finally { setLogoBusy(false); }
  }

  async function removeLogo() {
    if (!profile?.logo) return;
    setLogoBusy(true); setLogoError(null);
    const oldLogo = profile.logo;
    try { setCompanyLogo(null); await localCompanyLogoStorage.delete(oldLogo); }
    catch (caught) { setLogoError(caught instanceof Error ? caught.message : "Logo could not be removed."); }
    finally { setLogoBusy(false); }
  }

  const fieldChange = (name: keyof CompanyProfileInput, value: string | number) => setDraft((current) => ({ ...current, [name]: value }));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader title="Business Information" description="The contractor identity shown on customer documents." />
          <form onSubmit={submitProfile} onChange={(event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
            if (!target.name) return;
            fieldChange(target.name as keyof CompanyProfileInput, target.type === "number" ? Number(target.value) : target.value);
            setProfileStatus(null);
          }} className="space-y-7 px-5 py-5">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company name" htmlFor="displayName"><input id="displayName" name="displayName" defaultValue={values.displayName} className={inputClass} required /></Field>
              <Field label="Legal name (if different)" htmlFor="legalName"><input id="legalName" name="legalName" defaultValue={values.legalName} className={inputClass} /></Field>
              <Field label="Business email" htmlFor="companyEmail"><input id="companyEmail" name="email" type="email" defaultValue={values.email} className={inputClass} /></Field>
              <Field label="Business phone" htmlFor="companyPhone"><input id="companyPhone" name="phone" type="tel" defaultValue={values.phone} className={inputClass} /></Field>
              <Field label="Website" htmlFor="website" className="sm:col-span-2"><input id="website" name="website" inputMode="url" defaultValue={values.website} placeholder="https://example.com" className={inputClass} /></Field>
              <Field label="Street address" htmlFor="address" className="sm:col-span-2"><input id="address" name="address" defaultValue={values.address} className={inputClass} /></Field>
              <Field label="City" htmlFor="city"><input id="city" name="city" defaultValue={values.city} className={inputClass} /></Field>
              <Field label="State / region" htmlFor="companyState"><input id="companyState" name="state" defaultValue={values.state} className={inputClass} /></Field>
              <Field label="Postal code" htmlFor="postalCode"><input id="postalCode" name="postalCode" defaultValue={values.postalCode} className={inputClass} /></Field>
              <Field label="Country" htmlFor="country"><input id="country" name="country" defaultValue={values.country} className={inputClass} /></Field>
              <Field label="Contractor / license number" htmlFor="contractorLicense" className="sm:col-span-2"><input id="contractorLicense" name="contractorLicense" defaultValue={values.contractorLicense} className={inputClass} /></Field>
            </section>

            <section className="border-t border-slate-100 pt-6">
              <h2 className="font-semibold text-slate-900">Branding</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Brand / accent color" htmlFor="accentColor"><div className="flex gap-2"><input aria-label="Choose brand color" type="color" value={draft.accentColor} onChange={(event) => fieldChange("accentColor", event.target.value)} className="h-10 w-12 rounded border border-slate-200 bg-white p-1" /><input id="accentColor" name="accentColor" value={draft.accentColor} onChange={(event) => fieldChange("accentColor", event.target.value)} className={inputClass} pattern="#[0-9A-Fa-f]{6}" required /></div></Field>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-6">
              <h2 className="font-semibold text-slate-900">Pricing Defaults</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Default markup (%)" htmlFor="defaultMarkup"><input id="defaultMarkup" name="defaultMarkup" type="number" min="0" max="100" step="0.01" defaultValue={values.defaultMarkup} className={inputClass} required /></Field>
                <Field label="Default tax rate (%)" htmlFor="defaultTaxRate"><input id="defaultTaxRate" name="defaultTaxRate" type="number" min="0" max="100" step="0.001" defaultValue={values.defaultTaxRate} className={inputClass} required /></Field>
                <Field label="Currency" htmlFor="defaultCurrency"><select id="defaultCurrency" name="defaultCurrency" defaultValue={values.defaultCurrency} className={inputClass}><option value="USD">USD</option><option value="CAD">CAD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AUD">AUD</option></select></Field>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-6">
              <h2 className="font-semibold text-slate-900">Document Defaults</h2>
              <div className="mt-4 space-y-4">
                <Field label="Payment terms" htmlFor="paymentTerms"><textarea id="paymentTerms" name="paymentTerms" rows={2} defaultValue={values.paymentTerms} className={inputClass} /></Field>
                <Field label="Estimate terms" htmlFor="estimateTerms"><textarea id="estimateTerms" name="estimateTerms" rows={3} defaultValue={values.estimateTerms} className={inputClass} /></Field>
                <Field label="Invoice terms" htmlFor="invoiceTerms"><textarea id="invoiceTerms" name="invoiceTerms" rows={3} defaultValue={values.invoiceTerms} className={inputClass} /></Field>
              </div>
            </section>
            {profileError ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</p> : null}
            <div className="flex flex-wrap items-center gap-3"><Button type="submit">Save company profile</Button>{profileStatus ? <span role="status" className="text-sm text-green-700">{profileStatus}</span> : null}</div>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Company Logo</h2>
          <p className="mt-1 text-sm text-slate-500">PNG, JPEG, or WebP. Maximum 5 MB. Stored locally during this foundation phase.</p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-24 w-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {pendingLogoUrl || storedLogoUrl ? <Image unoptimized src={pendingLogoUrl || storedLogoUrl} alt="Company logo preview" width={256} height={192} className="h-full w-full object-contain p-2" /> : <span className="text-sm text-slate-400">No logo</span>}
            </div>
            <div className="space-y-3">
              <input aria-label="Choose company logo" type="file" accept={COMPANY_LOGO_ACCEPT} onChange={(event) => void chooseLogo(event.target.files?.[0])} disabled={logoBusy} className="block max-w-full text-sm" />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void saveLogo()} disabled={!pendingLogo || !profile || logoBusy}>{logoBusy ? "Saving…" : profile?.logo ? "Replace logo" : "Save logo"}</Button>
                {profile?.logo ? <Button type="button" variant="secondary" onClick={() => void removeLogo()} disabled={logoBusy}>Remove logo</Button> : null}
              </div>
              {!profile ? <p className="text-xs text-amber-700">Save the company profile before saving its logo.</p> : null}
              {pendingLogo ? <p className="text-xs text-blue-700">Previewing {pendingLogo.name} ({(pendingLogo.size / 1024).toFixed(1)} KB). Save to apply it.</p> : null}
            </div>
          </div>
          {logoError ? <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{logoError}</p> : null}
          <p className="mt-4 text-xs text-slate-400">Storage limit: {Math.round(MAX_COMPANY_LOGO_BYTES / 1024 / 1024)} MB. Production requires a tenant-authorized object-storage adapter.</p>
        </Card>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="mb-3"><h2 className="font-semibold text-slate-900">Live document preview</h2><p className="text-sm text-slate-500">Future estimates and invoices will share this header.</p></div>
        <BrandedDocumentHeader company={previewCompany} logoUrl={pendingLogoUrl || storedLogoUrl} />
      </aside>
    </div>
  );
}
