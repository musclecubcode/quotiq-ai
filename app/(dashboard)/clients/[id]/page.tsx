import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClientProfileTabs } from "@/components/clients/ClientProfileTabs";
import { IconMapPin } from "@/components/icons";
import { getClientProfile } from "@/lib/data";
import { getInitials } from "@/lib/utils";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = getClientProfile(id);

  if (!profile.client) {
    notFound();
  }

  const { client, ...rest } = profile;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/clients"
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Back to Clients
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700">
            {getInitials(client.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {client.name}
              </h1>
              <ClientStatusBadge status={client.status} />
            </div>
            {client.company && (
              <p className="text-sm text-slate-500">{client.company}</p>
            )}
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <IconMapPin className="h-3.5 w-3.5" />
              {client.address}
            </p>
          </div>
        </div>
        <Button variant="secondary">Edit Client</Button>
      </div>

      <ClientProfileTabs client={client} {...rest} />
    </div>
  );
}
