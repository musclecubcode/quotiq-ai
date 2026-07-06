import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateWorkOrderForm } from "@/components/work-orders/CreateWorkOrderForm";

export default function NewWorkOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/jobs"
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Back to Work Orders
      </Link>
      <PageHeader title="New Work Order" description="Create a new work order for a client." />
      <CreateWorkOrderForm />
    </div>
  );
}
