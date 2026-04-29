import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  FileText,
  Gauge,
  MessageSquareText,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users
} from "lucide-react";

import type { UserRole } from "./route-access";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface RoleNavigation {
  primary: NavItem[];
  growth?: NavItem[];
  footer?: NavItem[];
}

const ownerAdminNavigation: RoleNavigation = {
  primary: [
    { label: "Dashboard", href: "/dashboard", icon: Gauge },
    { label: "Dispatch", href: "/dispatch", icon: CalendarDays },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Estimates", href: "/estimates", icon: FileText },
    { label: "Invoices", href: "/invoices", icon: CreditCard },
    { label: "Service Agreements", href: "/service-agreements", icon: ShieldCheck },
    { label: "AI Revenue Center", href: "/ai-revenue-center", icon: Sparkles }
  ],
  growth: [{ label: "Settings", href: "/settings", icon: Settings }]
};

const dispatcherNavigation: RoleNavigation = {
  primary: [
    { label: "Dispatch", href: "/dispatch", icon: CalendarDays },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
    { label: "Estimates", href: "/estimates", icon: FileText },
    { label: "Invoices", href: "/invoices", icon: CreditCard }
  ],
  growth: [{ label: "Settings", href: "/settings", icon: Settings }]
};

export function getSidebarNavigation(role: UserRole): RoleNavigation {
  if (role === "owner" || role === "admin") {
    return ownerAdminNavigation;
  }

  return dispatcherNavigation;
}

export const mobileNavigation: NavItem[] = [
  { label: "Home", href: "/mobile/jobs", icon: Gauge },
  { label: "Jobs", href: "/mobile/jobs", icon: BriefcaseBusiness },
  { label: "Messages", href: "/mobile/messages", icon: MessageSquareText },
  { label: "Profile", href: "/mobile/profile", icon: UserRound }
];

export const settingsNavigation: NavItem[] = [
  { label: "General", href: "/settings/general", icon: Settings },
  { label: "Payments", href: "/settings/payments", icon: CreditCard },
  { label: "Automation", href: "/settings/automation", icon: Sparkles },
  { label: "Users", href: "/settings/users", icon: Users },
  { label: "Booking Links", href: "/settings/booking/links", icon: CalendarDays },
  { label: "Service Areas", href: "/settings/booking/service-areas", icon: Package },
  { label: "Review Links", href: "/settings/review-links", icon: MessageSquareText }
];
