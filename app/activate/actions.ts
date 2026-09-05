"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { companyProfileDefaults } from "@/lib/company-profile";
import { getProductionDataStore } from "@/lib/server/production-runtime";

export async function activateCompany() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const store = getProductionDataStore();
  const companyName = String(user.unsafeMetadata.companyName ?? "").trim();
  if (!companyName) redirect("/onboarding");
  await store.ensureCompanyWithOwner({
    ...companyProfileDefaults(companyName),
    contractorLicense: String(user.unsafeMetadata.contractorLicense ?? "").trim(),
  }, user.id, null);
  redirect("/migration");
}
