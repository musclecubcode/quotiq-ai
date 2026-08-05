export type NotificationTone = "info" | "success" | "warning";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  tone: NotificationTone;
}

/**
 * Real notifications don't exist yet — there's no backend generating them.
 * This sample set exists purely to exercise the dropdown UI, and only
 * renders when demo mode is explicitly enabled (NEXT_PUBLIC_DEMO_MODE=true).
 * Everyone else sees the honest "No notifications yet." empty state.
 */
export const sampleNotifications: AppNotification[] = [
  {
    id: "note-1",
    title: "Estimate approved",
    body: "Renee Castillo approved EST-1039 for the Primary Bath Renovation.",
    createdAt: "2026-07-01T09:15:00-05:00",
    tone: "success",
  },
  {
    id: "note-2",
    title: "Invoice overdue",
    body: "INV-2180 for Linda Chu is 30+ days past due.",
    createdAt: "2026-07-02T08:00:00-05:00",
    tone: "warning",
  },
  {
    id: "note-3",
    title: "Work order scheduled",
    body: "Showroom Flooring Upgrade for Tom Bradshaw starts July 21.",
    createdAt: "2026-07-03T07:30:00-05:00",
    tone: "info",
  },
];

import { isDemoModeEnabled } from "./demo-mode";

export function getNotifications(): AppNotification[] {
  return isDemoModeEnabled ? sampleNotifications : [];
}
