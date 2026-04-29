"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mobileNavigation } from "@/src/lib/navigation";
import { cn } from "@/src/lib/utils";

function isActiveItem(label: string, pathname: string): boolean {
  if (label === "Home") {
    return pathname === "/mobile/jobs";
  }

  if (label === "Jobs") {
    return pathname.startsWith("/mobile/jobs/");
  }

  return pathname === mobileNavigation.find((item) => item.label === label)?.href;
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white md:hidden">
      <div className="grid grid-cols-4">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveItem(item.label, pathname);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-3 text-[11px] font-medium text-neutral-500 transition-colors",
                isActive && "border-t-[3px] border-brand-accent text-brand-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
