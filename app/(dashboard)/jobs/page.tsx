import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WorkOrderStatusBadge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, Th, Tr, Td } from "@/components/ui/Table";
import { IconPlus } from "@/components/icons";
import { getClientById, properties, vehicles, workOrders } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

function getLocationLabel(workOrder: (typeof workOrders)[number]): string {
  if (workOrder.propertyId) {
    return properties.find((p) => p.id === workOrder.propertyId)?.address ?? "—";
  }
  if (workOrder.vehicleId) {
    const vehicle = vehicles.find((v) => v.id === workOrder.vehicleId);
    return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—";
  }
  return "—";
}

export default function JobsPage() {
  const activeCount = workOrders.filter(
    (workOrder) => workOrder.status === "in_progress" || workOrder.status === "scheduled"
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jobs"
        description={`${activeCount} active jobs out of ${workOrders.length} total on the books.`}
        action={
          <Button>
            <IconPlus className="h-4 w-4" />
            New Job
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHead>
            <Th>Job</Th>
            <Th>Client</Th>
            <Th>Status</Th>
            <Th>Timeline</Th>
            <Th>Progress</Th>
            <Th className="text-right">Budget</Th>
          </TableHead>
          <TableBody>
            {workOrders.map((workOrder) => (
              <Tr key={workOrder.id}>
                <Td>
                  <p className="font-medium text-slate-900">{workOrder.title}</p>
                  <p className="text-xs text-slate-500">{getLocationLabel(workOrder)}</p>
                </Td>
                <Td>{getClientById(workOrder.clientId)?.name}</Td>
                <Td>
                  <WorkOrderStatusBadge status={workOrder.status} />
                </Td>
                <Td>
                  <p className="text-xs text-slate-500">
                    {formatDate(workOrder.startDate)} – {formatDate(workOrder.endDate)}
                  </p>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${workOrder.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{workOrder.progress}%</span>
                  </div>
                </Td>
                <Td className="text-right font-medium text-slate-900">
                  {formatCurrency(workOrder.budget)}
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
