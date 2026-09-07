import { DashboardShell } from "@/components/layout/DashboardShell";
import { AccountStorageBoundary } from "@/components/auth/AccountStorageBoundary";
import { CloudDataProvider } from "@/components/auth/CloudDataProvider";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DataLayerError } from "@/lib/server/data/errors";
import { getTenantDataService } from "@/lib/server/production-runtime";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const companyName = String(user.unsafeMetadata.companyName ?? "").trim();
  if (!companyName) redirect("/onboarding");
  let service: Awaited<ReturnType<typeof getTenantDataService>>;
  try {
    service = await getTenantDataService();
  } catch (error) {
    if (error instanceof DataLayerError && error.code === "FORBIDDEN") redirect("/activate");
    throw error;
  }
  const snapshot = await service.getCompanyDataSnapshot();
  const userName = user.fullName || user.primaryEmailAddress?.emailAddress || "Beta User";
  return (
    <AccountStorageBoundary userId={user.id}>
      <CloudDataProvider initialData={{ clients: snapshot.clients, workOrders: snapshot.workOrders, invoices: snapshot.invoices }}>
        <DashboardShell userName={userName} companyName={snapshot.company.displayName || snapshot.company.legalName || companyName}>
          {children}
        </DashboardShell>
      </CloudDataProvider>
    </AccountStorageBoundary>
  );
}
