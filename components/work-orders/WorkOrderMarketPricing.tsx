"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { WorkOrderMeasurement } from "@/lib/types";

type Source = { title: string; url: string };
type Material = { item: string; quantity: string; unitPrice: string; extendedPrice: string; source?: string };
type PricingResult = {
  summary: string;
  materials: Material[];
  materialSubtotal: string;
  laborMarketRange: string;
  recommendedClientRange: string;
  assumptions: string[];
  sources: Source[];
  researchedAt: string;
};

export function WorkOrderMarketPricing({ workOrderId, trade, serviceAddress, description, measurements }: {
  workOrderId: string;
  trade: string;
  serviceAddress: string;
  description: string;
  measurements: WorkOrderMeasurement[];
}) {
  const storageKey = `quotiq:market-pricing:${workOrderId}`;
  const [result, setResult] = useState<PricingResult | null>(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "null"); } catch { return null; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function research() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/market-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderId, trade, serviceAddress, description, measurements }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Market research failed.");
      setResult(payload);
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Market research failed.");
    } finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold">Market Pricing</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Research current material prices and local professional labor ranges using this Work Order's scope, address, and saved measurements. Results are estimates and should be reviewed before quoting.</p></div>
        <Button type="button" onClick={research} disabled={busy}>{busy ? "Researching…" : result ? "Refresh Market Prices" : "Research Market Prices"}</Button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!result && !error && <p className="mt-5 text-sm text-slate-500">Add your measurements first, then run market research. Quotiq will not invent prices when live research is unavailable.</p>}
    </Card>
    {result && <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Materials</p><p className="mt-2 text-xl font-semibold">{result.materialSubtotal}</p></Card>
        <Card className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Local labor market</p><p className="mt-2 text-xl font-semibold">{result.laborMarketRange}</p></Card>
        <Card className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Suggested client range</p><p className="mt-2 text-xl font-semibold">{result.recommendedClientRange}</p></Card>
      </div>
      <Card className="p-5 sm:p-6"><h3 className="font-semibold">Research summary</h3><p className="mt-2 whitespace-pre-line text-sm text-slate-600">{result.summary}</p></Card>
      <Card className="overflow-hidden"><div className="p-5"><h3 className="font-semibold">Materials</h3></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Item</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Unit price</th><th className="px-5 py-3">Extended</th></tr></thead><tbody>{result.materials.map((item, index) => <tr key={`${item.item}-${index}`} className="border-b border-slate-100"><td className="px-5 py-3 font-medium">{item.item}</td><td className="px-5 py-3">{item.quantity}</td><td className="px-5 py-3">{item.unitPrice}</td><td className="px-5 py-3">{item.extendedPrice}</td></tr>)}</tbody></table></div></Card>
      <div className="grid gap-4 lg:grid-cols-2"><Card className="p-5"><h3 className="font-semibold">Assumptions to verify</h3><ul className="mt-3 space-y-2 text-sm text-slate-600">{result.assumptions.map((item, i) => <li key={i}>• {item}</li>)}</ul></Card><Card className="p-5"><h3 className="font-semibold">Sources</h3><div className="mt-3 space-y-2">{result.sources.map((source, i) => <a key={i} href={source.url} target="_blank" rel="noreferrer" className="block break-words text-sm font-medium text-blue-700 hover:underline">{source.title}</a>)}</div><p className="mt-4 text-xs text-slate-400">Researched {new Date(result.researchedAt).toLocaleString()}</p></Card></div>
    </>}
  </div>;
}
