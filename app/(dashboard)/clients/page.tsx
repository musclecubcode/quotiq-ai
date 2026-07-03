import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClientStatusBadge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, Th, Tr, Td } from "@/components/ui/Table";
import { IconMapPin, IconPlus } from "@/components/icons";
import { clients, getClientLifetimeValue, getWorkOrdersByClient } from "@/lib/data";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} clients on file across active, lead, and past accounts.`}
        action={
          <Button>
            <IconPlus className="h-4 w-4" />
            New Client
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHead>
            <Th>Client</Th>
            <Th>Contact</Th>
            <Th>Status</Th>
            <Th className="text-right">Jobs</Th>
            <Th className="text-right">Lifetime Value</Th>
            <Th>Client Since</Th>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <Tr key={client.id}>
                <Td>
                  <Link
                    href={`/clients/${client.id}`}
                    className="group flex items-center gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 group-hover:text-blue-700 group-hover:underline">
                        {client.name}
                      </p>
                      {client.company && (
                        <p className="truncate text-xs text-slate-500">
                          {client.company}
                        </p>
                      )}
                    </div>
                  </Link>
                </Td>
                <Td>
                  <p>{client.email}</p>
                  <p className="text-xs text-slate-500">{client.phone}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <IconMapPin className="h-3.5 w-3.5" />
                    {client.address}
                  </p>
                </Td>
                <Td>
                  <ClientStatusBadge status={client.status} />
                </Td>
                <Td className="text-right">{getWorkOrdersByClient(client.id).length}</Td>
                <Td className="text-right font-medium text-slate-900">
                  {formatCurrency(getClientLifetimeValue(client.id))}
                </Td>
                <Td>{formatDate(client.createdAt)}</Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
