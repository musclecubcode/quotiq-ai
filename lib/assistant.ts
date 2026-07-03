import {
  getClientById,
  getQuoteTotal,
  getWorkOrderById,
  invoices,
  quotes,
  workOrders,
} from "./data";
import { formatCurrency, formatDate } from "./utils";

export const suggestedPrompts = [
  "Which invoices are overdue?",
  "Are any jobs behind schedule?",
  "Draft an estimate for a bathroom remodel",
  "What estimates are still pending?",
];

/**
 * Rule-based responder standing in for the real estimating model.
 * Answers are derived from the same mock data backing the dashboard
 * so the assistant stays consistent with what a contractor sees elsewhere.
 */
export function generateAssistantReply(input: string): string {
  const text = input.toLowerCase();

  if (text.includes("overdue")) {
    const overdue = invoices.filter((invoice) => invoice.status === "overdue");
    if (overdue.length === 0) {
      return "Nice — there are no overdue invoices right now.";
    }
    const lines = overdue.map((invoice) => {
      const workOrder = getWorkOrderById(invoice.workOrderId);
      const client = workOrder ? getClientById(workOrder.clientId) : undefined;
      return `• ${invoice.number} — ${client?.name} — ${formatCurrency(
        invoice.amount - invoice.amountPaid
      )} past due since ${formatDate(invoice.dueDate)}`;
    });
    return `You have ${overdue.length} overdue invoice(s):\n${lines.join("\n")}`;
  }

  if (text.includes("behind") || (text.includes("schedule") && text.includes("job"))) {
    const atRisk = workOrders.filter((workOrder) => workOrder.status === "on_hold");
    if (atRisk.length === 0) {
      return "All active jobs are on track — nothing is on hold right now.";
    }
    const lines = atRisk.map((workOrder) => {
      const client = getClientById(workOrder.clientId);
      return `• ${workOrder.title} for ${client?.name} — on hold at ${workOrder.progress}% complete`;
    });
    return `These jobs need attention:\n${lines.join("\n")}`;
  }

  if (
    text.includes("estimate") &&
    (text.includes("draft") ||
      text.includes("deck") ||
      text.includes("bath") ||
      text.includes("kitchen") ||
      text.includes("roof"))
  ) {
    const labor = 6200;
    const materials = 4850;
    const permits = 450;
    const contingency = 1150;
    return [
      "Here's a starting breakdown you can refine and send:",
      `• Labor (3 crew, 5 days): ${formatCurrency(labor)}`,
      `• Materials & supplies: ${formatCurrency(materials)}`,
      `• Permits & inspections: ${formatCurrency(permits)}`,
      `• Contingency (10%): ${formatCurrency(contingency)}`,
      "",
      `Estimated total: ${formatCurrency(labor + materials + permits + contingency)}`,
      "Want me to turn this into a formal estimate for a specific client?",
    ].join("\n");
  }

  if (text.includes("pending") && text.includes("estimate")) {
    const pending = quotes.filter((quote) => quote.status === "sent");
    if (pending.length === 0) {
      return "No estimates are currently awaiting a response.";
    }
    const lines = pending.map((quote) => {
      const workOrder = getWorkOrderById(quote.workOrderId);
      const client = workOrder ? getClientById(workOrder.clientId) : undefined;
      return `• ${quote.number} — ${client?.name} — ${formatCurrency(
        getQuoteTotal(quote)
      )}, expires ${formatDate(quote.expiryDate)}`;
    });
    return `${pending.length} estimate(s) awaiting a response:\n${lines.join("\n")}`;
  }

  return 'I can help draft estimates, summarize overdue invoices, or flag jobs that are behind schedule. Try asking "Which invoices are overdue?" or "Draft an estimate for a bathroom remodel."';
}
