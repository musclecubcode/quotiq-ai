import type { TradeCategory, WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from "./types";

export const TRADE_CATEGORIES: { value: TradeCategory; label: string }[] = [
  { value: "mobile_mechanic", label: "Mobile Mechanic" },
  { value: "handyman", label: "Handyman" },
  { value: "fence", label: "Fence" },
  { value: "drywall", label: "Drywall" },
  { value: "painting", label: "Painting" },
  { value: "electrical", label: "Electrical" },
  { value: "appliance_repair", label: "Appliance Repair" },
  { value: "sprinklers_irrigation", label: "Sprinklers/Irrigation" },
  { value: "pressure_washing", label: "Pressure Washing" },
  { value: "carpentry", label: "Carpentry" },
  { value: "plumbing", label: "Plumbing" },
  { value: "general_contractor", label: "General Contractor" },
  { value: "other", label: "Other" },
];

export function tradeLabel(trade: TradeCategory): string {
  return TRADE_CATEGORIES.find((option) => option.value === trade)?.label ?? trade;
}

export type TradeDetailFieldType = "text" | "number" | "textarea" | "select" | "checkbox";

export interface TradeDetailFieldConfig {
  name: string;
  label: string;
  type: TradeDetailFieldType;
  options?: string[];
  placeholder?: string;
}

/**
 * Optional, trade-specific fields shown in the New Work Order form once a
 * trade is selected. This is the single source of truth for per-trade
 * detail fields — to add a new trade's fields, add an entry here (and a
 * value in TradeCategory); no other code needs to change.
 */
export const TRADE_DETAIL_FIELDS: Record<TradeCategory, TradeDetailFieldConfig[]> = {
  mobile_mechanic: [
    { name: "vehicleYear", label: "Vehicle Year", type: "text", placeholder: "2023" },
    { name: "vehicleMake", label: "Vehicle Make", type: "text", placeholder: "Ford" },
    { name: "vehicleModel", label: "Vehicle Model", type: "text", placeholder: "Transit 350" },
    { name: "vehicleVin", label: "VIN", type: "text" },
    { name: "mileage", label: "Mileage", type: "number" },
  ],
  handyman: [
    { name: "taskList", label: "Task List", type: "textarea", placeholder: "List of small tasks to complete…" },
    { name: "estimatedHours", label: "Estimated Hours", type: "number" },
  ],
  fence: [
    {
      name: "fenceType",
      label: "Fence Type",
      type: "select",
      options: ["Wood", "Vinyl", "Chain Link", "Wrought Iron", "Aluminum"],
    },
    { name: "linearFeet", label: "Linear Feet", type: "number" },
    { name: "gateCount", label: "Gate Count", type: "number" },
  ],
  drywall: [
    {
      name: "repairType",
      label: "Repair Type",
      type: "select",
      options: ["Patch", "Full Wall", "Ceiling", "Texture Match"],
    },
    { name: "squareFootage", label: "Square Footage", type: "number" },
  ],
  painting: [
    { name: "surfaceType", label: "Surface", type: "select", options: ["Interior", "Exterior", "Both"] },
    { name: "squareFootage", label: "Square Footage", type: "number" },
    { name: "coats", label: "Number of Coats", type: "number" },
  ],
  electrical: [
    { name: "panelType", label: "Panel Type", type: "text" },
    { name: "amperage", label: "Amperage", type: "number" },
    { name: "permitRequired", label: "Permit Required", type: "checkbox" },
  ],
  appliance_repair: [
    { name: "applianceType", label: "Appliance Type", type: "text", placeholder: "Refrigerator, dryer, oven…" },
    { name: "brand", label: "Brand", type: "text" },
    { name: "modelNumber", label: "Model Number", type: "text" },
  ],
  sprinklers_irrigation: [
    { name: "zoneCount", label: "Zone Count", type: "number" },
    { name: "controllerType", label: "Controller Type", type: "text" },
  ],
  pressure_washing: [
    { name: "surfaceType", label: "Surface", type: "text", placeholder: "Driveway, siding, deck…" },
    { name: "squareFootage", label: "Square Footage", type: "number" },
  ],
  carpentry: [
    { name: "projectType", label: "Project Type", type: "text", placeholder: "Deck, trim, cabinetry…" },
    { name: "materialType", label: "Material", type: "text" },
  ],
  plumbing: [
    { name: "fixtureType", label: "Fixture Type", type: "text", placeholder: "Water heater, faucet, toilet…" },
    { name: "permitRequired", label: "Permit Required", type: "checkbox" },
  ],
  general_contractor: [
    { name: "scopeSummary", label: "Scope Summary", type: "textarea" },
    { name: "subcontractorsInvolved", label: "Subcontractors Involved", type: "text" },
  ],
  other: [{ name: "notes", label: "Additional Details", type: "textarea" }],
};

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
