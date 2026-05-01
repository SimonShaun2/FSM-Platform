"use client";

import { Star } from "lucide-react";

import type { ReviewScoreSummary } from "@/src/hooks/reporting.hooks";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { cn } from "@/src/lib/utils";

interface ReviewScoreProps {
  summary: ReviewScoreSummary | undefined;
  isLoading: boolean;
}

export function ReviewScore({ summary, isLoading }: ReviewScoreProps) {
  if (isLoading) {
    return <SkeletonCard className="h-[320px]" />;
  }

  if (!summary) {
    return (
      <section className="surface-card px-6 py-6">
        <EmptyState
          icon={Star}
          title="No reviews in this range"
          subtitle="Customer review performance will appear here once review requests are completed."
          compact
        />
      </section>
    );
  }

  return (
    <section className="surface-card px-6 py-6">
      <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Customer Reviews</h3>
      <div className="mt-6 grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <p className="text-5xl font-semibold tracking-tight text-warning">
            {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : "0.0"}
          </p>
          <div className="mt-3 flex items-center gap-1 text-warning">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <p className="mt-3 text-sm text-neutral-500">Based on {summary.totalReviews} reviews in this range</p>
        </div>

        <div className="space-y-4">
          {summary.breakdown.map((row) => (
            <div key={row.stars} className="grid grid-cols-[44px_minmax(0,1fr)_52px] items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-semibold text-neutral-700">
                <span>{row.stars}</span>
                <Star className="h-4 w-4 fill-current text-warning" />
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn("h-full rounded-full bg-warning transition-all duration-500")}
                  style={{ width: `${row.percent}%` }}
                />
              </div>
              <span className="text-right text-sm font-medium text-neutral-500">{row.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
