import Image from "next/image";
import type { CompanyProfile, IssuerSnapshot } from "@/lib/types";

type BrandingSource = Pick<
  CompanyProfile | IssuerSnapshot,
  | "displayName" | "legalName" | "email" | "phone" | "website" | "address"
  | "city" | "state" | "postalCode" | "country" | "contractorLicense" | "accentColor" | "logo"
>;

function locationLine(company: BrandingSource) {
  return [company.city, company.state, company.postalCode].filter(Boolean).join(", ");
}

export function BrandedDocumentHeader({
  company,
  logoUrl,
  documentLabel = "ESTIMATE",
}: {
  company: BrandingSource;
  logoUrl?: string;
  documentLabel?: "ESTIMATE" | "INVOICE";
}) {
  const location = locationLine(company);
  const website = company.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-2" style={{ backgroundColor: company.accentColor }} />
      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {logoUrl ? (
              <Image unoptimized src={logoUrl} alt={`${company.displayName || "Company"} logo`} width={160} height={128} className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-xl font-bold" style={{ color: company.accentColor }}>
                {(company.displayName || "Q").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="break-words text-xl font-bold text-slate-950">{company.displayName || "Your Company"}</p>
            {company.legalName && company.legalName !== company.displayName ? <p className="text-xs text-slate-500">{company.legalName}</p> : null}
            <div className="mt-3 space-y-0.5 text-xs leading-5 text-slate-600">
              {company.address ? <p>{company.address}</p> : null}
              {location ? <p>{location}{company.country && company.country !== "US" ? ` · ${company.country}` : ""}</p> : null}
              {company.phone ? <p>{company.phone}</p> : null}
              {company.email ? <p className="break-all">{company.email}</p> : null}
              {website ? <p className="break-all">{website}</p> : null}
              {company.contractorLicense ? <p>License #{company.contractorLicense}</p> : null}
            </div>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-400">{documentLabel}</p>
          <p className="mt-2 text-2xl font-light text-slate-900">#DRAFT</p>
          <p className="mt-1 text-xs text-slate-500">Branding preview</p>
        </div>
      </div>
      <div className="mx-5 border-t border-slate-200 px-0 py-4 text-xs text-slate-500 sm:mx-7">
        <span className="font-semibold text-slate-800">Prepared for</span> Client Name · Project Address
      </div>
    </header>
  );
}
