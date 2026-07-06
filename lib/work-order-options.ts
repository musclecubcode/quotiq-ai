import type { WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from "./types";

export const WORK_ORDER_CATEGORIES: { value: WorkOrderCategory; label: string }[] = [
  { value: "remodel", label: "Remodel" },
  { value: "repair", label: "Repair" },
  { value: "installation", label: "Installation" },
  { value: "inspection", label: "Inspection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export const WORK_ORDER_PRIORITIES: { value: WorkOrderPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const WORK_ORDER_STATUSES: { value: WorkOrderStatus; label: string }[] = [
  { value: "quoting", label: "Quoting" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function categoryLabel(category: WorkOrderCategory): string {
  return WORK_ORDER_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

export function priorityLabel(priority: WorkOrderPriority): string {
  return WORK_ORDER_PRIORITIES.find((option) => option.value === priority)?.label ?? priority;
}
