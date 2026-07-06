import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InvoiceStatusBadge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, Th, Tr, Td } from "@/components/ui/Table";
import { IconPlus } from "@/components/icons";
import { getClientById, getWorkOrderById, invoices } from "@/lib/data";
import { formatCurrency, formatDate, getClientFullName } from "@/lib/utils";

export default function InvoicesPage() {
  const outstanding = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + (invoice.amount - invoice.amountPaid), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invoices"
        description={`${formatCurrency(outstanding)} outstanding across sent and overdue invoices.`}
        action={
          <Button>
            <IconPlus className="h-4 w-4" />
            New Invoice
          </Button>
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
              const workOrder = getWorkOrderById(invoice.workOrderId);
              const client = workOrder ? getClientById(workOrder.clientId) : undefined;
              return (
                <Tr key={invoice.id}>
                  <Td>
                    <p className="font-medium text-slate-900">{invoice.number}</p>
                    <p className="text-xs text-slate-500">{workOrder?.title}</p>
                  </Td>
                  <Td>{client && getClientFullName(client)}</Td>
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
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
