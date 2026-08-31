"use client";

import { setJobIntelligenceUserScope } from "@/lib/job-intelligence-repository";
import { setRepositoryUserScope } from "@/lib/workorder-repository";
import { setCompanyProfileOwnerScope } from "@/lib/company-profile-repository";

export function AccountStorageBoundary({ userId, children }: { userId: string; children: React.ReactNode }) {
  setRepositoryUserScope(userId);
  setJobIntelligenceUserScope(userId);
  setCompanyProfileOwnerScope(userId);
  return children;
}
