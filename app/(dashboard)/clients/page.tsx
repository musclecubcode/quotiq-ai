"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClientStatusBadge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, Th, Tr, Td } from "@/components/ui/Table";
import { IconMapPin, IconPlus, IconUsers } from "@/components/icons";
import { useClients } from "@/lib/client-storage";
import { formatDate, getClientFullName, getInitials } from "@/lib/utils";

export default function ClientsPage() {
  const { clients } = useClients();

  if (clients.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Clients" description="Manage your client roster." />
        <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <IconUsers className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">No clients yet</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add your first client to start tracking their properties, vehicles, work
              orders, estimates, and invoices in one place.
            </p>
          </div>
          <Link href="/clients/new">
            <Button>
              <IconPlus className="h-4 w-4" />
              Create your first client
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length === 1 ? "" : "s"} on file.`}
        action={
          <Link href="/clients/new">
            <Button>
              <IconPlus className="h-4 w-4" />
              New Client
            </Button>
          </Link>
        }
      />

      <Card>
        <Table>
          <TableHead>
            <Th>Client</Th>
            <Th>Contact</Th>
            <Th>Status</Th>
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
                      {getInitials(getClientFullName(client))}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 group-hover:text-blue-700 group-hover:underline">
                        {getClientFullName(client)}
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
                    {client.address}, {client.city}, {client.state} {client.zip}
                  </p>
                </Td>
                <Td>
                  <ClientStatusBadge status={client.status} />
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
