"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import type { AiRecommendationDetail } from "@fsm/types";

import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { StatBadge } from "@/src/components/ui/StatBadge";

import { formatStatusLabel } from "./jobs.utils";

interface JobAISuggestionProps {
  recommendation: AiRecommendationDetail | null;
  dismissed: boolean;
  onDismiss: () => void;
}

export function JobAISuggestion({ recommendation, dismissed, onDismiss }: JobAISuggestionProps) {
  if (!recommendation || dismissed) {
    return null;
  }

  const urgency = recommendation.urgencyScore ?? 0;

  return (
    <section className="rounded-[28px] border border-ai/10 bg-[linear-gradient(135deg,#f3ebff_0%,#efe4ff_100%)] px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-ai shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">AI Suggested Action</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-ai">
              {formatStatusLabel(recommendation.type)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-2 text-neutral-400 transition hover:bg-white/80 hover:text-neutral-700"
          aria-label="Dismiss AI suggestion"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatBadge
          label={urgency >= 85 ? "Urgent" : urgency >= 70 ? "High" : "Suggested"}
          tone={urgency >= 85 ? "red" : urgency >= 70 ? "orange" : "purple"}
        />
        <span className="text-sm text-neutral-600">
          Est. value <CurrencyDisplay value={recommendation.estimatedRevenue} className="font-semibold text-neutral-900" showCents />
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-700">{recommendation.body}</p>

      <Link
        href={`/ai-revenue-center?customerId=${recommendation.customerId ?? ""}`}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ai"
      >
        See why this surfaced →
      </Link>
    </section>
  );
}
