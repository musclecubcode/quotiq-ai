import { DashboardShell } from "@/components/layout/DashboardShell";
import { AccountStorageBoundary } from "@/components/auth/AccountStorageBoundary";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const companyName = String(user.unsafeMetadata.companyName ?? "").trim();
  if (!companyName) redirect("/onboarding");
  const userName = user.fullName || user.primaryEmailAddress?.emailAddress || "Beta User";
  return <AccountStorageBoundary userId={user.id}><DashboardShell userName={userName} companyName={companyName}>{children}</DashboardShell></AccountStorageBoundary>;
}
