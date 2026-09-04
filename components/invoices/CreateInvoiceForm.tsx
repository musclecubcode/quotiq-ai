"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import { useClients } from "@/lib/client-storage";
import { useWorkOrdersRepository } from "@/lib/workorder-repository";
import { useInvoicesRepository, type SavedInvoiceStatus } from "@/lib/invoice-repository";
import { getClientFullName } from "@/lib/utils";

export function CreateInvoiceForm() {
  const router = useRouter();
  const { clients } = useClients();
  const { workOrders } = useWorkOrdersRepository();
  const { addInvoice } = useInvoicesRepository();
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const availableWorkOrders = useMemo(
    () => workOrders.filter((workOrder) => !clientId || workOrder.clientId === clientId),
    [workOrders, clientId]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    const amount = Number(get("amount"));
    const status = get("status") as SavedInvoiceStatus;

    try {
      addInvoice({
        clientId: get("clientId"),
        workOrderId: get("workOrderId"),
        description: get("description"),
        issueDate: get("issueDate"),
        dueDate: get("dueDate"),
        amount,
        status,
      });
      router.push("/invoices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create invoice.");
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="clientId">
          <select
            id="clientId"
            name="clientId"
            className={inputClass}
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            required
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {getClientFullName(client)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Work Order" htmlFor="workOrderId">
          <select id="workOrderId" name="workOrderId" className={inputClass} required>
            <option value="">Select work order</option>
            {availableWorkOrders.map((workOrder) => (
              <option key={workOrder.id} value={workOrder.id}>
                {workOrder.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Issue Date" htmlFor="issueDate">
          <input id="issueDate" name="issueDate" type="date" defaultValue={today} className={inputClass} required />
        </Field>

        <Field label="Due Date" htmlFor="dueDate">
          <input id="dueDate" name="dueDate" type="date" defaultValue={today} className={inputClass} required />
        </Field>

        <Field label="Amount" htmlFor="amount">
          <input id="amount" name="amount" type="number" min="0" step="0.01" className={inputClass} placeholder="150.00" required />
        </Field>

        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue="sent" className={inputClass}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </Field>

        <Field label="Service Description" htmlFor="description" className="sm:col-span-2">
          <textarea
            id="description"
            name="description"
            rows={5}
            className={inputClass}
            placeholder="Mobile Service Call & Diagnostic — describe the work performed and findings."
            required
          />
        </Field>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit">Create Invoice</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/invoices")}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
