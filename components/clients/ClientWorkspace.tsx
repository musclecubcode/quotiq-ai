"use client";

import Link from "next/link";
import { ClientStatusBadge } from "@/components/ui/Badge";
import { ClientProfileTabs } from "@/components/clients/ClientProfileTabs";
import { IconMapPin } from "@/components/icons";
import { useClient } from "@/lib/client-storage";
import { useStoredWorkOrders } from "@/lib/workorder-storage";
import { getClientRelatedRecords } from "@/lib/data";
import { getClientFullName, getInitials } from "@/lib/utils";

export function ClientWorkspace({ clientId }: { clientId: string }) {
  const { client } = useClient(clientId);
  const { workOrders } = useStoredWorkOrders();

  if (!client) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Link
          href="/clients"
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back to Clients
        </Link>
        <p className="text-sm text-slate-500">
          We couldn&apos;t find that client. They may have been removed.
        </p>
      </div>
    );
  }

  const related = getClientRelatedRecords(client.id);
  const clientWorkOrders = workOrders.filter((workOrder) => workOrder.clientId === client.id);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/clients"
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Back to Clients
      </Link>

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700">
          {getInitials(getClientFullName(client))}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {getClientFullName(client)}
            </h1>
            <ClientStatusBadge status={client.status} />
          </div>
          {client.company && <p className="text-sm text-slate-500">{client.company}</p>}
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <IconMapPin className="h-3.5 w-3.5" />
            {client.address}, {client.city}, {client.state} {client.zip}
          </p>
        </div>
      </div>

      <ClientProfileTabs client={client} {...related} workOrders={clientWorkOrders} />
    </div>
  );
}
