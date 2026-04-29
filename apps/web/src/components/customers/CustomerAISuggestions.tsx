"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { useRecommendations } from "@/src/hooks/ai-revenue.hooks";
import { CurrencyDisplay } from "../ui/CurrencyDisplay";
import { EmptyState } from "../ui/EmptyState";
import { SkeletonCard } from "../ui/SkeletonCard";
import { StatBadge } from "../ui/StatBadge";

interface CustomerAISuggestionsProps {
  customerId: string;
}

function getActionLabel(type: string): string {
  switch (type) {
    case "reactivation":
      return "Schedule overdue service";
    case "aging_asset":
      return "Recommend HVAC replacement";
    case "unpaid_invoice":
      return "Follow up on unpaid invoice";
    case "unsold_estimate":
      return "Revisit unsold estimate";
    case "maintenance_plan_offer":
      return "Offer service plan";
    default:
      return "Review AI suggestion";
  }
}

export function CustomerAISuggestions({ customerId }: CustomerAISuggestionsProps) {
  const recommendationsQuery = useRecommendations({
    customerId,
    status: "pending",
    sortBy: "urgencyScore",
    sortOrder: "desc",
    page: 1,
    limit: 3
  });
  const items = recommendationsQuery.data?.data ?? [];

  return (
    <section className="surface-card px-5 py-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-ai" />
        <h2 className="text-base font-semibold text-neutral-900">AI Suggested Actions</h2>
      </div>

      <div className="mt-4 space-y-4">
        {recommendationsQuery.isLoading ? (
          Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} className="h-[154px]" />)
        ) : recommendationsQuery.isError ? (
          <p className="rounded-3xl border border-error/15 bg-error-light px-4 py-4 text-sm text-error">
            Suggestions could not be loaded right now.
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No live suggestions"
            subtitle="Fresh AI revenue opportunities for this customer will show up here automatically."
            compact
          />
        ) : (
          items.map((recommendation) => (
            <div key={recommendation.id} className="rounded-[24px] border border-neutral-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <StatBadge
                  label={recommendation.urgencyScore && recommendation.urgencyScore >= 85 ? "Urgent" : "Suggested"}
                  tone={recommendation.urgencyScore && recommendation.urgencyScore >= 85 ? "red" : "purple"}
                />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  {recommendation.type.replaceAll("_", " ")}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-neutral-900">{getActionLabel(recommendation.type)}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{recommendation.body}</p>
              <p className="mt-3 text-sm font-medium text-neutral-700">
                Est. value <CurrencyDisplay value={recommendation.estimatedRevenue} className="font-semibold text-neutral-900" />
              </p>
            </div>
          ))
        )}
      </div>

      <Link
        href={`/ai-revenue-center?customerId=${customerId}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-accent"
      >
        View all suggestions <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
