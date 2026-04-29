"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { settingsNavigation } from "@/src/lib/navigation";
import { cn } from "@/src/lib/utils";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-[28px] border border-neutral-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex min-w-max gap-2">
          {settingsNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-brand-primary text-white" : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
