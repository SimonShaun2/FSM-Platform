"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/src/lib/route-access";
import { cn } from "@/src/lib/utils";

import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
  companyName: string;
  role: UserRole;
  userName: string;
}

export function AppShell({ children, companyName, role, userName }: AppShellProps) {
  const pathname = usePathname();
  const isMobileRoute = pathname.startsWith("/mobile");

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {!isMobileRoute ? (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar border-r border-white/5 md:flex">
          <Sidebar companyName={companyName} role={role} userName={userName} />
        </aside>
      ) : null}

      <div className={cn("flex min-h-screen flex-col", !isMobileRoute && "md:ml-sidebar")}>
        <Header companyName={companyName} role={role} userName={userName} />
        <main className={cn("flex-1 px-4 py-6 md:px-8 md:py-8", isMobileRoute && "pb-24 md:pb-8")}>{children}</main>
      </div>

      {isMobileRoute ? <MobileNav /> : null}
    </div>
  );
}
