"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { bookingSettingsNavigation } from "@/src/lib/navigation";
import { cn } from "@/src/lib/utils";

export default function BookingSettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <section className="overflow-x-auto rounded-[28px] border border-neutral-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex min-w-max gap-2">
          {bookingSettingsNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "bg-brand-accent text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
      {children}
    </div>
  );
}
