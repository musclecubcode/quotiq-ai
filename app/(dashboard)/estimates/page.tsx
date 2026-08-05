import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuoteStatusBadge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, Th, Tr, Td } from "@/components/ui/Table";
import { IconPlus } from "@/components/icons";
import { getClientById, getQuoteTotal, getWorkOrderById, quotes } from "@/lib/data";
import { formatCurrency, formatDate, getClientFullName } from "@/lib/utils";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export default function EstimatesPage() {
  const visibleQuotes = isDemoModeEnabled ? quotes : [];
  const pendingCount = visibleQuotes.filter((quote) => quote.status === "sent").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estimates"
        description={`${pendingCount} estimates sent and awaiting client response.`}
        action={
          <Button>
            <IconPlus className="h-4 w-4" />
            New Estimate
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHead>
            <Th>Estimate</Th>
            <Th>Client</Th>
            <Th>Status</Th>
            <Th>Issued</Th>
            <Th>Expires</Th>
            <Th className="text-right">Total</Th>
          </TableHead>
          <TableBody>
            {visibleQuotes.map((quote) => {
              const workOrder = getWorkOrderById(quote.workOrderId);
              const client = workOrder ? getClientById(workOrder.clientId) : undefined;
              return (
                <Tr key={quote.id}>
                  <Td>
                    <p className="font-medium text-slate-900">{quote.number}</p>
                    <p className="text-xs text-slate-500">{workOrder?.title}</p>
                  </Td>
                  <Td>{client && getClientFullName(client)}</Td>
                  <Td>
                    <QuoteStatusBadge status={quote.status} />
                  </Td>
                  <Td>{formatDate(quote.issueDate)}</Td>
                  <Td>{formatDate(quote.expiryDate)}</Td>
                  <Td className="text-right font-medium text-slate-900">
                    {formatCurrency(getQuoteTotal(quote))}
                  </Td>
                </Tr>
              );
            })}
            {visibleQuotes.length === 0 && <Tr><Td className="py-12 text-center text-slate-500" colSpan={6}>No estimates yet. Estimate creation is coming during the beta.</Td></Tr>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
