import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateClientForm } from "@/components/clients/CreateClientForm";

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/clients"
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Back to Clients
      </Link>
      <PageHeader title="New Client" description="Add a new client to Quotiq AI." />
      <CreateClientForm />
    </div>
  );
}
