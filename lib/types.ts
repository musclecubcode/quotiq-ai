export type ClientStatus = "active" | "lead" | "inactive";

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatus;
  totalJobs: number;
  lifetimeValue: number;
  createdAt: string;
}

export type JobStatus =
  | "scheduled"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";

export interface Job {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status: JobStatus;
  address: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  crew: string[];
}

export type EstimateStatus = "draft" | "sent" | "approved" | "declined";

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Estimate {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  jobTitle: string;
  status: EstimateStatus;
  issueDate: string;
  expiryDate: string;
  lineItems: EstimateLineItem[];
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  jobTitle: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
}
