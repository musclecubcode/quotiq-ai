import { WorkOrderWorkspace } from "@/components/work-orders/WorkOrderWorkspace";

export default async function WorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkOrderWorkspace workOrderId={id} />;
}
