"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMessageConversations } from "@/src/hooks/messages.hooks";
import { mobileNavigation } from "@/src/lib/navigation";
import { cn } from "@/src/lib/utils";

function isActiveItem(label: string, pathname: string) {
  if (label === "Home") {
    return pathname === "/mobile/jobs";
  }

  if (label === "Jobs") {
    return pathname.startsWith("/mobile/jobs/");
  }

  if (label === "Messages") {
    return pathname.startsWith("/mobile/messages");
  }

  if (label === "Profile") {
    return pathname.startsWith("/mobile/profile");
  }

  return false;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const conversationsQuery = useMessageConversations();
  const totalUnread = conversationsQuery.data?.totalUnread ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white shadow-[0_-12px_40px_rgba(16,33,99,0.08)] md:hidden">
      <div className="grid h-14 grid-cols-4">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveItem(item.label, pathname);
          const showBadge = item.label === "Messages" && totalUnread > 0;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-1 px-2 text-[11px] font-semibold text-neutral-500 transition-colors",
                isActive && "border-t-[3px] border-brand-accent text-brand-accent"
              )}
            >
              {showBadge ? (
                <span className="absolute right-4 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              ) : null}
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
