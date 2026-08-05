"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WorkOrderStatusBadge } from "@/components/ui/Badge";
import { IconArrowUpRight, IconBriefcase, IconFileText, IconPlus, IconReceipt, IconUsers } from "@/components/icons";
import { useClients } from "@/lib/client-storage";
import { useStoredWorkOrders } from "@/lib/workorder-storage";
import { formatCurrency, formatDate, getClientFullName } from "@/lib/utils";
import type { Client } from "@/lib/types";

export default function DashboardPage() {
  const { clients } = useClients();
  const { workOrders } = useStoredWorkOrders();
  const clientsById = new Map<string, Client>(clients.map((client) => [client.id, client]));
  const activeWorkOrders = workOrders.filter((item) => item.status === "in_progress" || item.status === "scheduled").slice(0, 5);

  return <div className="flex flex-col gap-6">
    <PageHeader title="Dashboard" description="Your workspace is ready. Add a client to get started." action={<Link href="/clients/new"><Button><IconPlus className="h-4 w-4" />New Client</Button></Link>} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active Work Orders" value={String(activeWorkOrders.length)} icon={IconBriefcase} trend="Scheduled + in progress" iconTone="blue" />
      <StatCard label="Pending Estimates" value="0" icon={IconFileText} trend="Awaiting client response" iconTone="violet" />
      <StatCard label="Outstanding Invoices" value={formatCurrency(0)} icon={IconReceipt} trend="Sent + overdue" iconTone="amber" />
      <StatCard label="Clients" value={String(clients.length)} icon={IconUsers} trend="Saved in this browser" iconTone="green" />
    </div>
    <Card>
      <CardHeader title="Active Work Orders" description="Work Orders currently scheduled or in progress" action={<Link href="/jobs" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">View all<IconArrowUpRight className="h-3.5 w-3.5" /></Link>} />
      {activeWorkOrders.length === 0 ? <div className="px-6 py-12 text-center"><p className="font-medium text-slate-800">Nothing here yet</p><p className="mt-1 text-sm text-slate-500">Create a client first, then add their first Work Order.</p><Link href="/clients/new"><Button className="mt-4"><IconPlus className="h-4 w-4" />Add your first client</Button></Link></div> : <ul className="divide-y divide-slate-100">{activeWorkOrders.map((workOrder) => { const client = clientsById.get(workOrder.clientId); return <li key={workOrder.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium text-slate-900">{workOrder.title}</p><WorkOrderStatusBadge status={workOrder.status} /></div><p className="mt-0.5 truncate text-sm text-slate-500">{client ? getClientFullName(client) : "Unknown client"} · Due {formatDate(workOrder.endDate)}</p></div><p className="shrink-0 text-sm font-semibold text-slate-900">{formatCurrency(workOrder.budget)}</p></li>; })}</ul>}
    </Card>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><Card><CardHeader title="Estimates" description="Estimate creation is coming during the beta" /><p className="px-5 py-8 text-center text-sm text-slate-500">No estimates yet.</p></Card><Card><CardHeader title="Invoices" description="Invoicing is coming during the beta" /><p className="px-5 py-8 text-center text-sm text-slate-500">No invoices yet.</p></Card></div>
  </div>;
}
