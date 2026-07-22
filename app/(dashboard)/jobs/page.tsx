"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PriorityBadge, WorkOrderStatusBadge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, Th, Tr, Td } from "@/components/ui/Table";
import { IconPlus } from "@/components/icons";
import { clients as fixtureClients, workOrders as fixtureWorkOrders } from "@/lib/data";
import { useClients } from "@/lib/client-storage";
import { useStoredWorkOrders } from "@/lib/workorder-storage";
import { categoryLabel, tradeLabel } from "@/lib/work-order-options";
import { formatCurrency, formatDate, getClientFullName } from "@/lib/utils";
import type { Client } from "@/lib/types";

export default function JobsPage() {
  const { clients: realClients } = useClients();
  const { workOrders: realWorkOrders } = useStoredWorkOrders();

  const clientsById = new Map<string, Client>();
  for (const client of fixtureClients) clientsById.set(client.id, client);
  for (const client of realClients) clientsById.set(client.id, client);

  const workOrders = [...realWorkOrders, ...fixtureWorkOrders].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1
  );

  const activeCount = workOrders.filter(
    (workOrder) => workOrder.status === "in_progress" || workOrder.status === "scheduled"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Work Orders"
        description={`${activeCount} active work orders out of ${workOrders.length} total on the books.`}
        action={
          <Link href="/jobs/new">
            <Button>
              <IconPlus className="h-4 w-4" />
              New Work Order
            </Button>
          </Link>
        }
      />

      <Card>
        <Table>
          <TableHead>
            <Th>Work Order</Th>
            <Th>Client</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Scheduled</Th>
            <Th>Progress</Th>
            <Th className="text-right">Budget</Th>
          </TableHead>
          <TableBody>
            {workOrders.map((workOrder) => {
              const client = clientsById.get(workOrder.clientId);
              return (
                <Tr key={workOrder.id}>
                  <Td>
                    <p className="font-medium text-slate-900">{workOrder.title}</p>
                    <p className="text-xs text-slate-500">
                      {tradeLabel(workOrder.trade)} · {categoryLabel(workOrder.category)} ·{" "}
                      {workOrder.serviceAddress}
                    </p>
                  </Td>
                  <Td>{client && getClientFullName(client)}</Td>
                  <Td>
                    <PriorityBadge priority={workOrder.priority} />
                  </Td>
                  <Td>
                    <WorkOrderStatusBadge status={workOrder.status} />
                  </Td>
                  <Td>
                    <p className="text-xs text-slate-500">{formatDate(workOrder.startDate)}</p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${workOrder.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{workOrder.progress}%</span>
                    </div>
                  </Td>
                  <Td className="text-right font-medium text-slate-900">
                    {formatCurrency(workOrder.budget)}
                  </Td>
                </Tr>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
