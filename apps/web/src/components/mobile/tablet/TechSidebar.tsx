"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Clock3,
  FileImage,
  FileText,
  MessageSquareText,
  Package,
  SquareCheckBig,
  UserRound
} from "lucide-react";

import { BrandMark } from "@/src/components/layout/BrandMark";
import type { AuthSessionSnapshot } from "@/src/lib/auth";
import { cn } from "@/src/lib/utils";

const techSidebarItems = [
  { label: "My Jobs", icon: BriefcaseBusiness, href: "/mobile/jobs" },
  { label: "Job Detail", icon: UserRound, href: "/mobile/jobs" },
  { label: "Tasks", icon: SquareCheckBig, href: "/mobile/jobs" },
  { label: "Products", icon: Package, href: "/mobile/jobs" },
  { label: "Estimates", icon: FileText, href: "/mobile/jobs" },
  { label: "Files", icon: FileImage, href: "/mobile/jobs" },
  { label: "Time", icon: Clock3, href: "/mobile/jobs" },
  { label: "Messages", icon: MessageSquareText, href: "/mobile/messages" }
] as const;

function resolveItemHref(itemHref: string, pathname: string) {
  if (itemHref === "/mobile/messages") {
    return itemHref;
  }

  const match = pathname.match(/\/mobile\/jobs\/([^/]+)/u);
  const jobId = match?.[1];

  if (!jobId) {
    return "/mobile/jobs";
  }

  if (pathname.includes("/tasks")) {
    return `/mobile/jobs/${jobId}/tasks`;
  }

  if (pathname.includes("/products")) {
    return `/mobile/jobs/${jobId}/products`;
  }

  if (pathname.includes("/photos")) {
    return `/mobile/jobs/${jobId}/photos`;
  }

  if (pathname.includes("/complete")) {
    return `/mobile/jobs/${jobId}/complete`;
  }

  if (pathname.startsWith("/mobile/otw/")) {
    return `/mobile/otw/${jobId}`;
  }

  return `/mobile/jobs/${jobId}`;
}

function isActiveLink(label: string, pathname: string) {
  switch (label) {
    case "My Jobs":
      return pathname === "/mobile/jobs";
    case "Tasks":
      return pathname.includes("/tasks");
    case "Products":
      return pathname.includes("/products");
    case "Estimates":
      return pathname.includes("/complete");
    case "Files":
      return pathname.includes("/photos");
    case "Time":
      return pathname.includes("/time") || pathname.includes("/otw");
    case "Messages":
      return pathname.startsWith("/mobile/messages");
    case "Job Detail":
      return pathname.startsWith("/mobile/jobs/");
    default:
      return false;
  }
}

export function TechSidebar({ session }: { session: AuthSessionSnapshot }) {
  const pathname = usePathname();
  const userName = `${session.user.firstName} ${session.user.lastName}`.trim();
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-full flex-col bg-sidebar-bg px-5 py-6 text-white">
      <BrandMark compact light />

      <nav className="mt-8 space-y-1.5">
        {techSidebarItems.map((item) => {
          const Icon = item.icon;
          const href = resolveItemHref(item.href, pathname);
          const isActive = isActiveLink(item.label, pathname);

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-sidebar-active text-white shadow-[0_18px_42px_rgba(37,122,250,0.24)]"
                  : "text-neutral-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-neutral-400">Senior Tech · HVAC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
