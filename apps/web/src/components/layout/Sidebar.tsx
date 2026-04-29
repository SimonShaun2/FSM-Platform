"use client";

import { cva } from "class-variance-authority";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/src/lib/route-access";
import { getSidebarNavigation } from "@/src/lib/navigation";
import { cn } from "@/src/lib/utils";

import { BrandMark } from "./BrandMark";

interface SidebarProps {
  companyName: string;
  role: UserRole;
  userName: string;
}

const sidebarItemStyles = cva(
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
  {
    variants: {
      active: {
        true: "bg-sidebar-active text-white shadow-lg shadow-brand-accent/20",
        false: "text-neutral-400 hover:bg-white/5 hover:text-white"
      }
    }
  }
);

export function Sidebar({ companyName, role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navigation = getSidebarNavigation(role);

  return (
    <div className="flex h-full w-sidebar flex-col bg-sidebar-bg px-5 py-6 text-white">
      <BrandMark compact light />

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Workspace</p>
        <p className="mt-2 text-sm font-semibold text-white">{companyName}</p>
      </div>

      <nav className="mt-8 flex-1 space-y-2">
        {navigation.primary.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className={sidebarItemStyles({ active: isActive })}>
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {navigation.growth?.length ? (
          <div className="pt-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-600">
                Growth
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-2">
              {navigation.growth.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href} className={sidebarItemStyles({ active: isActive })}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {userName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className={cn("truncate text-xs capitalize text-neutral-500", role === "office" && "normal-case")}>
              {role === "office" ? "Office" : role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
