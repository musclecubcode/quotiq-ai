"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function WorkOrdersError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h1 className="text-lg font-semibold text-slate-900">Unable to load Work Orders</h1>
      <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      <div className="mt-5 flex gap-3">
        <Button type="button" onClick={reset}>Try again</Button>
        <Link href="/jobs"><Button variant="secondary">Back to Work Orders</Button></Link>
      </div>
    </Card>
  );
}
