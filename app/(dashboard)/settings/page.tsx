"use client";

import { useUser } from "@clerk/nextjs";
import { CompanySettings } from "@/components/company/CompanySettings";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <p className="text-sm text-slate-500">Loading company profile…</p>;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Company Profile & Branding" description="Manage the business identity and defaults used on customer documents." />
      <CompanySettings
        legacyCompanyName={String(user?.unsafeMetadata.companyName ?? "")}
        legacyLicense={String(user?.unsafeMetadata.contractorLicense ?? "")}
      />
    </div>
  );
}
