"use client";

import { Activity } from "lucide-react";

import type { ReportingActivityItem } from "@/src/hooks/reporting.hooks";
import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { TimeAgo } from "@/src/components/ui/TimeAgo";
import { cn } from "@/src/lib/utils";

interface RecentActivityFeedProps {
  items: ReportingActivityItem[];
  isLoading: boolean;
}

function getToneClass(tone: ReportingActivityItem["tone"]) {
  switch (tone) {
    case "green":
      return "border-success";
    case "red":
      return "border-error";
    case "blue":
      return "border-brand-accent";
    case "orange":
    default:
      return "border-warning";
  }
}

function renderAmount(amount: string | null) {
  if (!amount) {
    return null;
  }

  if (amount.startsWith("-")) {
    return (
      <span className="text-sm font-semibold text-error">
        -<CurrencyDisplay value={amount.slice(1)} showCents={false} />
      </span>
    );
  }

  return <CurrencyDisplay value={amount} showCents={false} className="text-sm font-semibold text-success" />;
}

export function RecentActivityFeed({ items, isLoading }: RecentActivityFeedProps) {
  if (isLoading) {
    return <SkeletonCard className="h-[360px]" />;
  }

  if (items.length === 0) {
    return (
      <section className="surface-card px-6 py-6">
        <EmptyState
          icon={Activity}
          title="No recent activity"
          subtitle="Completed jobs, approvals, payments, and reviews will populate this feed."
          compact
        />
      </section>
    );
  }

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Recent Activity</h3>
          <p className="mt-1 text-sm text-neutral-500">The most recent business events inside the selected window.</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn("flex items-center justify-between gap-4 rounded-2xl border-l-4 bg-neutral-50 px-4 py-4", getToneClass(item.tone))}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-6 text-neutral-800">{item.summary}</p>
            </div>
            <div className="shrink-0 text-right">
              <TimeAgo value={item.occurredAt} className="block text-xs font-medium text-neutral-400" />
              {item.amount ? <div className="mt-2">{renderAmount(item.amount)}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
