import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  WorkOrderStatusBadge,
  InvoiceStatusBadge,
  QuoteStatusBadge,
} from "@/components/ui/Badge";
import {
  IconArrowUpRight,
  IconBriefcase,
  IconFileText,
  IconPlus,
  IconReceipt,
  IconUsers,
} from "@/components/icons";
import {
  getClientById,
  getDashboardStats,
  getWorkOrderById,
  invoices,
  quotes,
  workOrders,
} from "@/lib/data";
import { formatCurrency, formatDate, getClientFullName } from "@/lib/utils";

export default function DashboardPage() {
  const stats = getDashboardStats();

  const activeWorkOrders = workOrders
    .filter(
      (workOrder) => workOrder.status === "in_progress" || workOrder.status === "scheduled"
    )
    .slice(0, 5);

  const recentInvoices = [...invoices]
    .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))
    .slice(0, 4);

  const openQuotes = quotes.filter((quote) => quote.status === "sent").slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back — here's what's happening across your work orders today."
        action={
          <Link href="/estimates">
            <Button>
              <IconPlus className="h-4 w-4" />
              New Estimate
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Work Orders"
          value={String(stats.activeWorkOrders)}
          icon={IconBriefcase}
          trend="Scheduled + in progress"
          iconTone="blue"
        />
        <StatCard
          label="Pending Estimates"
          value={String(stats.pendingQuotes)}
          icon={IconFileText}
          trend="Awaiting client response"
          iconTone="violet"
        />
        <StatCard
          label="Outstanding Invoices"
          value={formatCurrency(stats.outstandingInvoices)}
          icon={IconReceipt}
          trend="Sent + overdue"
          iconTone="amber"
        />
        <StatCard
          label="Revenue Collected"
          value={formatCurrency(stats.revenueThisYear)}
          icon={IconUsers}
          trend="Paid invoices, year to date"
          iconTone="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Active Work Orders"
            description="Work orders currently scheduled or in progress"
            action={
              <Link
                href="/jobs"
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all
                <IconArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-slate-100">
            {activeWorkOrders.map((workOrder) => {
              const client = getClientById(workOrder.clientId);
              return (
              <li key={workOrder.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {workOrder.title}
                    </p>
                    <WorkOrderStatusBadge status={workOrder.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {client && getClientFullName(client)} · Due{" "}
                    {formatDate(workOrder.endDate)}
                  </p>
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${workOrder.progress}%` }}
                    />
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-900">
                  {formatCurrency(workOrder.budget)}
                </p>
              </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Estimates Awaiting Response"
            description="Sent, not yet approved"
          />
          <ul className="divide-y divide-slate-100">
            {openQuotes.map((quote) => {
              const workOrder = getWorkOrderById(quote.workOrderId);
              const client = workOrder ? getClientById(workOrder.clientId) : undefined;
              return (
              <li key={quote.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {workOrder?.title}
                  </p>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {client && getClientFullName(client)} ·
                  Expires {formatDate(quote.expiryDate)}
                </p>
              </li>
              );
            })}
            {openQuotes.length === 0 && (
              <li className="px-5 py-6 text-sm text-slate-500">
                No estimates awaiting response.
              </li>
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent Invoices"
          description="Latest billing activity across all clients"
          action={
            <Link
              href="/invoices"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <IconArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <ul className="divide-y divide-slate-100">
          {recentInvoices.map((invoice) => {
            const workOrder = getWorkOrderById(invoice.workOrderId);
            const client = workOrder ? getClientById(workOrder.clientId) : undefined;
            return (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {invoice.number} · {client && getClientFullName(client)}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {workOrder?.title} · Issued {formatDate(invoice.issueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(invoice.amount)}
                  </p>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
