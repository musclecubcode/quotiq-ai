import {
  IconBriefcase,
  IconDashboard,
  IconFileText,
  IconReceipt,
  IconSettings,
  IconSparkles,
  IconUsers,
} from "@/components/icons";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { label: "Clients", href: "/clients", icon: IconUsers },
  { label: "Work Orders", href: "/jobs", icon: IconBriefcase },
  { label: "Estimates", href: "/estimates", icon: IconFileText },
  { label: "Invoices", href: "/invoices", icon: IconReceipt },
  { label: "AI Assistant", href: "/ai-assistant", icon: IconSparkles },
  { label: "Settings", href: "/settings", icon: IconSettings },
] as const;
