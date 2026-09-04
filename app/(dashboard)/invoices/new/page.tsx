import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateInvoiceForm } from "@/components/invoices/CreateInvoiceForm";

export default function NewInvoicePage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/invoices" className="text-sm font-medium text-slate-500 hover:text-slate-800">
        ← Back to Invoices
      </Link>
      <PageHeader title="New Invoice" description="Create a real invoice from an existing client and work order." />
      <CreateInvoiceForm />
    </div>
  );
}
