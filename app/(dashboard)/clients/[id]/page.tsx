import { ClientWorkspace } from "@/components/clients/ClientWorkspace";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientWorkspace clientId={id} />;
}
