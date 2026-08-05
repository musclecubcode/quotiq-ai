"use client";

import { setJobIntelligenceUserScope } from "@/lib/job-intelligence-repository";
import { setRepositoryUserScope } from "@/lib/workorder-repository";

export function AccountStorageBoundary({ userId, children }: { userId: string; children: React.ReactNode }) {
  setRepositoryUserScope(userId);
  setJobIntelligenceUserScope(userId);
  return children;
}
