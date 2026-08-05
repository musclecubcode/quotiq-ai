"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";

export default function OnboardingPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const companyName = String(data.get("companyName") ?? "").trim();
    const contractorLicense = String(data.get("contractorLicense") ?? "").trim();
    if (!companyName) { setError("Company name is required."); return; }
    setSaving(true); setError(null);
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, companyName, contractorLicense: contractorLicense || null } });
      await user.reload();
      router.replace("/dashboard");
      router.refresh();
    } catch { setError("Your company profile could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  if (!isLoaded) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading your account…</main>;
  if (!isSignedIn) return null;
  return <main className="dashboard-theme flex min-h-screen items-center justify-center bg-slate-950 p-6"><Card className="w-full max-w-lg p-6 sm:p-8"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">Q</div><h1 className="mt-5 text-2xl font-semibold text-slate-900">Set up your company</h1><p className="mt-2 text-sm text-slate-500">This creates your private Quotiq AI workspace. You can add a contractor license now or later.</p><form onSubmit={submit} className="mt-6 space-y-4"><Field label="Company name" htmlFor="companyName"><input id="companyName" name="companyName" className={inputClass} placeholder="Your company name" defaultValue={String(user.unsafeMetadata.companyName ?? "")} required /></Field><Field label="Contractor license (optional)" htmlFor="contractorLicense"><input id="contractorLicense" name="contractorLicense" className={inputClass} placeholder="License number" defaultValue={String(user.unsafeMetadata.contractorLicense ?? "")} /></Field>{error && <p role="alert" className="text-sm text-red-400">{error}</p>}<Button type="submit" disabled={saving} className="w-full">{saving ? "Creating workspace…" : "Continue to Quotiq AI"}</Button></form></Card></main>;
}
