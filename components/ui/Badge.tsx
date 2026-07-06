import { cn } from "@/lib/utils";
import type {
  ClientStatus,
  InvoiceStatus,
  QuoteStatus,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@/lib/types";

type Tone = "blue" | "green" | "amber" | "red" | "gray" | "violet";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

const workOrderStatusMap: Record<WorkOrderStatus, { label: string; tone: Tone }> = {
  quoting: { label: "Quoting", tone: "violet" },
  scheduled: { label: "Scheduled", tone: "blue" },
  in_progress: { label: "In Progress", tone: "amber" },
  on_hold: { label: "On Hold", tone: "gray" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const { label, tone } = workOrderStatusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const priorityMap: Record<WorkOrderPriority, { label: string; tone: Tone }> = {
  low: { label: "Low", tone: "gray" },
  medium: { label: "Medium", tone: "blue" },
  high: { label: "High", tone: "amber" },
  urgent: { label: "Urgent", tone: "red" },
};

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  const { label, tone } = priorityMap[priority];
  return <Badge tone={tone}>{label}</Badge>;
}

const quoteStatusMap: Record<QuoteStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "gray" },
  sent: { label: "Sent", tone: "blue" },
  approved: { label: "Approved", tone: "green" },
  declined: { label: "Declined", tone: "red" },
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const { label, tone } = quoteStatusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const invoiceStatusMap: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "gray" },
  sent: { label: "Sent", tone: "blue" },
  paid: { label: "Paid", tone: "green" },
  overdue: { label: "Overdue", tone: "red" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, tone } = invoiceStatusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const clientStatusMap: Record<ClientStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "green" },
  lead: { label: "Lead", tone: "violet" },
  inactive: { label: "Inactive", tone: "gray" },
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, tone } = clientStatusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}
