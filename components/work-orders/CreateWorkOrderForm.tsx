"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import { useClients } from "@/lib/client-storage";
import { useStoredWorkOrders } from "@/lib/workorder-storage";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES, WORK_ORDER_STATUSES } from "@/lib/work-order-options";
import { getClientFullName } from "@/lib/utils";
import type { WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from "@/lib/types";

export function CreateWorkOrderForm() {
  const router = useRouter();
  const { clients } = useClients();
  const { addWorkOrder } = useStoredWorkOrders();
  const [error, setError] = useState<string | null>(null);

  if (clients.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm text-slate-600">
          You need at least one client on file before creating a work order.
        </p>
        <Link href="/clients/new">
          <Button>Create a client first</Button>
        </Link>
      </Card>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const clientId = get("clientId");
    const serviceAddress = get("serviceAddress");
    const category = get("category") as WorkOrderCategory;
    const priority = get("priority") as WorkOrderPriority;
    const status = get("status") as WorkOrderStatus;
    const description = get("description");
    const scheduledDate = get("scheduledDate");
    const internalNotes = get("internalNotes");

    if (
      !clientId ||
      !serviceAddress ||
      !category ||
      !priority ||
      !status ||
      !description ||
      !scheduledDate
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    addWorkOrder({
      clientId,
      serviceAddress,
      category,
      priority,
      status,
      description,
      scheduledDate,
      internalNotes: internalNotes || undefined,
    });

    router.push("/jobs");
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="clientId" className="sm:col-span-2">
          <select id="clientId" name="clientId" defaultValue="" className={inputClass} required>
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {getClientFullName(client)}
                {client.company ? ` — ${client.company}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Service Address" htmlFor="serviceAddress" className="sm:col-span-2">
          <input id="serviceAddress" name="serviceAddress" className={inputClass} required />
        </Field>

        <Field label="Category" htmlFor="category">
          <select id="category" name="category" defaultValue="" className={inputClass} required>
            <option value="" disabled>
              Select
            </option>
            {WORK_ORDER_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority" htmlFor="priority">
          <select id="priority" name="priority" defaultValue="medium" className={inputClass} required>
            {WORK_ORDER_PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue="scheduled" className={inputClass} required>
            {WORK_ORDER_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Scheduled Date" htmlFor="scheduledDate">
          <input
            id="scheduledDate"
            name="scheduledDate"
            type="date"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Description" htmlFor="description" className="sm:col-span-2">
          <textarea
            id="description"
            name="description"
            rows={4}
            className={inputClass}
            placeholder="What needs to be done?"
            required
          />
        </Field>

        <Field label="Internal Notes (optional)" htmlFor="internalNotes" className="sm:col-span-2">
          <textarea
            id="internalNotes"
            name="internalNotes"
            rows={3}
            className={inputClass}
            placeholder="Notes for your crew — not shared with the client…"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-red-600 sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit">Create Work Order</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/jobs")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
