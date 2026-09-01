"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCompanyProfileSnapshot } from "@/lib/company-profile-repository";
import { getJobIntelligenceExport } from "@/lib/job-intelligence-repository";
import { getAllClients, getAllWorkOrders } from "@/lib/workorder-repository";

type Receipt = { imported: Record<string, number>; verifiedAt: string; localDataRetained: true };

export function BrowserDataMigration() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function migrate() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/data/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ version: 1, companyProfile: getCompanyProfileSnapshot() ?? undefined, clients: getAllClients(), workOrders: getAllWorkOrders(), ...getJobIntelligenceExport() }) });
      const result = await response.json() as Receipt & { error?: string };
      if (!response.ok) throw new Error(result.error || "Import failed.");
      setReceipt(result);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Import failed."); }
    finally { setBusy(false); }
  }

  if (receipt) return <Card className="p-6"><h2 className="text-lg font-semibold text-emerald-700">Metadata import verified</h2><p className="mt-2 text-sm text-slate-600">Clients: {receipt.imported.clients ?? 0} · Work Orders: {receipt.imported.workOrders ?? 0} · Measurements: {receipt.imported.measurements ?? 0} · Notes: {receipt.imported.notes ?? 0} · Attachments: {receipt.imported.attachments ?? 0}</p><p className="mt-3 text-sm font-medium text-slate-700">Your original browser data was retained.</p><p className="mt-1 text-xs text-slate-400">Photo, document and logo files will be uploaded separately before cloud mode is enabled.</p></Card>;
  return <Card className="p-6"><h2 className="text-lg font-semibold text-slate-900">Import this browser’s records</h2><p className="mt-2 text-sm leading-6 text-slate-500">Quotiq will validate clients, Work Orders, measurements, notes and attachment metadata, then import them in one transaction. Nothing will be deleted from this device.</p>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<Button type="button" onClick={() => void migrate()} disabled={busy} className="mt-5 w-full sm:w-auto">{busy ? "Validating and importing…" : "Import browser data safely"}</Button></Card>;
}
