import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { activateCompany } from "./actions";

export default async function ActivatePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const companyName = String(user.unsafeMetadata.companyName ?? "").trim();
  if (!companyName) redirect("/onboarding");
  return <main className="dashboard-theme flex min-h-screen items-center justify-center bg-slate-950 p-6"><Card className="w-full max-w-lg p-7 sm:p-9"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">Q</div><h1 className="mt-5 text-2xl font-semibold text-slate-900">Activate secure cloud storage</h1><p className="mt-2 text-sm leading-6 text-slate-500">Create the private production workspace for <strong>{companyName}</strong>. This does not remove or change anything saved in this browser.</p><form action={activateCompany} className="mt-7"><Button type="submit" className="w-full">Activate company workspace</Button></form><p className="mt-4 text-center text-xs text-slate-400">Your Clerk account remains the verified owner.</p></Card></main>;
}
