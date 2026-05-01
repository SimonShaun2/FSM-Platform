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
      <section className="rounded-[28px] border border-neutral-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Settings</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage company defaults, payments, booking controls, and automation behavior.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-neutral-200 bg-white px-3 py-3 shadow-sm">
          <nav className="space-y-1">
            {settingsNavigation.map((item) => {
              const isBookingRoot = item.href === "/settings/booking/general";
              const isActive = isBookingRoot
                ? pathname.startsWith("/settings/booking")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-brand-accent-light text-brand-accent"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
