"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCompanyProfileSnapshot } from "@/lib/company-profile-repository";
import { getJobIntelligenceExport } from "@/lib/job-intelligence-repository";
import { getAllClients, getAllWorkOrders } from "@/lib/workorder-repository";

type Counts = { clients: number; workOrders: number; measurements: number; notes: number; attachments: number };
type Preview = { status: "ready" | "already_imported"; records: Counts; localDataRetained: true };
type Receipt = { imported: Counts; verifiedAt: string; localDataRetained: true; idempotentReplay: boolean };

function browserPayload() {
  return { version: 1, companyProfile: getCompanyProfileSnapshot() ?? undefined, clients: getAllClients(), workOrders: getAllWorkOrders(), ...getJobIntelligenceExport() };
}

export function BrowserDataMigration() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function submit(path: string) {
    setBusy(true); setError(null);
    try {
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(browserPayload()) });
      const result = await response.json() as (Preview | Receipt) & { error?: string };
      if (!response.ok) throw new Error(result.error || "Import failed.");
      if (path.endsWith("/preview")) setPreview(result as Preview); else setReceipt(result as Receipt);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Import failed."); }
    finally { setBusy(false); }
  }

  if (receipt) return <Card className="p-6"><h2 className="text-lg font-semibold text-emerald-700">Metadata import verified</h2><p className="mt-2 text-sm text-slate-600">Clients: {receipt.imported.clients} · Work Orders: {receipt.imported.workOrders} · Measurements: {receipt.imported.measurements} · Notes: {receipt.imported.notes} · Attachments: {receipt.imported.attachments}</p><p className="mt-3 text-sm font-medium text-slate-700">Your original browser data was retained.</p>{receipt.idempotentReplay && <p className="mt-1 text-sm text-slate-500">This exact import was already present, so no duplicate records were created.</p>}<p className="mt-1 text-xs text-slate-400">Photo, document and logo files will be uploaded separately before cloud mode is enabled.</p><a className="mt-4 inline-block text-sm font-medium text-blue-700 underline" href="/api/data/snapshot" target="_blank" rel="noreferrer">Open verified cloud recovery copy</a></Card>;
  return <Card className="p-6"><h2 className="text-lg font-semibold text-slate-900">Import this browser’s records</h2><p className="mt-2 text-sm leading-6 text-slate-500">First preview the validated record counts. Import happens only after you confirm, in one transaction. Nothing will be deleted from this device.</p>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{preview && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite"><p className="font-medium text-slate-800">{preview.status === "already_imported" ? "Exact cloud copy already verified" : "Ready to import"}</p><p className="mt-1 text-sm text-slate-600">Clients: {preview.records.clients} · Work Orders: {preview.records.workOrders} · Measurements: {preview.records.measurements} · Notes: {preview.records.notes} · Attachments: {preview.records.attachments}</p><p className="mt-2 text-xs text-slate-500">The browser copy will remain on this device.</p></div>}<div className="mt-5 flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={() => void submit("/api/data/import/preview")} disabled={busy} className="w-full sm:w-auto">{busy ? "Checking…" : preview ? "Refresh preview" : "Preview browser data"}</Button>{preview && <Button type="button" onClick={() => void submit("/api/data/import")} disabled={busy} className="w-full sm:w-auto">{preview.status === "already_imported" ? "Verify import again" : "Confirm safe import"}</Button>}</div></Card>;
}
