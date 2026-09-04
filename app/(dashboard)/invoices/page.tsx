"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { InvoiceStatusBadge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, Th, Tr, Td } from "@/components/ui/Table";
import { IconPlus } from "@/components/icons";
import { formatCurrency, formatDate, getClientFullName } from "@/lib/utils";
import { useClients } from "@/lib/client-storage";
import { useWorkOrdersRepository } from "@/lib/workorder-repository";
import { useInvoicesRepository } from "@/lib/invoice-repository";

export default function InvoicesPage() {
  const { clients } = useClients();
  const { workOrders } = useWorkOrdersRepository();
  const { invoices } = useInvoicesRepository();

  const outstanding = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + (invoice.amount - invoice.amountPaid), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invoices"
        description={`${formatCurrency(outstanding)} outstanding across sent and overdue invoices.`}
        action={
          <Link
            href="/invoices/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <IconPlus className="h-4 w-4" />
            New Invoice
          </Link>
        }
      />

      <Card>
        <Table>
          <TableHead>
            <Th>Invoice</Th>
            <Th>Client</Th>
            <Th>Status</Th>
            <Th>Issued</Th>
            <Th>Due</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Balance</Th>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => {
              const workOrder = workOrders.find((record) => record.id === invoice.workOrderId);
              const client = clients.find((record) => record.id === invoice.clientId);
              return (
                <Tr key={invoice.id}>
                  <Td>
                    <p className="font-medium text-slate-900">{invoice.number}</p>
                    <p className="text-xs text-slate-500">{workOrder?.title ?? invoice.description}</p>
                  </Td>
                  <Td>{client ? getClientFullName(client) : "Unknown client"}</Td>
                  <Td>
                    <InvoiceStatusBadge status={invoice.status} />
                  </Td>
                  <Td>{formatDate(invoice.issueDate)}</Td>
                  <Td>{formatDate(invoice.dueDate)}</Td>
                  <Td className="text-right font-medium text-slate-900">
                    {formatCurrency(invoice.amount)}
                  </Td>
                  <Td className="text-right">
                    {invoice.amount - invoice.amountPaid > 0
                      ? formatCurrency(invoice.amount - invoice.amountPaid)
                      : "—"}
                  </Td>
                </Tr>
              );
            })}
            {invoices.length === 0 && (
              <Tr>
                <Td className="py-12 text-center text-slate-500" colSpan={7}>
                  No invoices yet. Create your first invoice to start tracking billing.
                </Td>
              </Tr>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
