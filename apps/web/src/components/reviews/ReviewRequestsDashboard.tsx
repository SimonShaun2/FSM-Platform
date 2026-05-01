"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareText, Settings2, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { ReviewRequestStatus } from "@fsm/types";

import { PageLayout } from "@/src/components/layout/PageLayout";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { StatBadge } from "@/src/components/ui/StatBadge";
import {
  useResendReviewRequest,
  useReviewRequests,
  useReviewSettings,
  useReviewStats,
  type ReviewRequestListRecord
} from "@/src/hooks/review-requests.hooks";
import { ApiError } from "@/src/lib/api";
import { cn, formatDate } from "@/src/lib/utils";
import { showToast } from "@/src/stores/toast.store";

type ReviewStatusFilter = "all" | ReviewRequestStatus;

const FILTERS: Array<{ value: ReviewStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "clicked", label: "Clicked" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" }
];

const cardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 }
};

function getStatusTone(status: ReviewRequestStatus) {
  switch (status) {
    case "sent":
      return "blue" as const;
    case "clicked":
      return "orange" as const;
    case "completed":
      return "green" as const;
    case "declined":
      return "red" as const;
    default:
      return "neutral" as const;
  }
}

function formatStatusLabel(status: ReviewRequestStatus) {
  switch (status) {
    case "sent":
      return "Sent";
    case "clicked":
      return "Clicked";
    case "completed":
      return "Completed";
    case "declined":
      return "Declined";
    default:
      return "Pending";
  }
}

function isResendable(status: ReviewRequestStatus) {
  return status === "sent" || status === "clicked";
}

function renderStars(rating: number | null) {
  if (!rating) {
    return <span className="text-sm text-neutral-400">--</span>;
  }

  return (
    <div className="flex items-center gap-1 text-warning">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn("h-4 w-4", index < rating ? "fill-current" : "text-neutral-200")}
        />
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "orange" | "green" | "purple";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-brand-accent-light text-brand-accent"
      : tone === "orange"
        ? "bg-warning-light text-warning"
        : tone === "green"
          ? "bg-success-light text-success"
          : "bg-ai-light text-ai";

  return (
    <div className="surface-card px-5 py-5">
      <div className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", toneClass)}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
      <p className="mt-2 text-sm text-neutral-500">{detail}</p>
    </div>
  );
}

function ResendButton({ request }: { request: ReviewRequestListRecord }) {
  const resendMutation = useResendReviewRequest(request.id);
  const resendable = isResendable(request.status);

  async function handleResend() {
    try {
      await resendMutation.mutateAsync();
      showToast({
        tone: "success",
        title: "Review request resent",
        description: `${request.customer.firstName} ${request.customer.lastName} was queued again.`
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "The review request could not be resent.";
      showToast({
        tone: "error",
        title: "Resend failed",
        description: message
      });
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleResend();
      }}
      disabled={!resendable || resendMutation.isPending}
      className={cn(
        "inline-flex min-w-[96px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
        resendable
          ? "bg-neutral-100 text-brand-accent hover:bg-brand-accent-light"
          : "cursor-not-allowed bg-neutral-100 text-neutral-300",
        resendMutation.isPending && "cursor-wait opacity-70"
      )}
    >
      {resendMutation.isPending ? "Sending..." : "Resend"}
    </button>
  );
}

function SettingsStatusPanel() {
  const settingsQuery = useReviewSettings();
  const settings = settingsQuery.data?.settings;

  if (settingsQuery.isLoading) {
    return <SkeletonCard className="h-[272px]" />;
  }

  if (settingsQuery.isError || !settings) {
    return (
      <div className="surface-card px-5 py-6">
        <p className="text-base font-semibold text-neutral-900">Review Link Settings</p>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Review platform settings could not be loaded right now.
        </p>
      </div>
    );
  }

  const platforms = [
    {
      label: "Google",
      url: settings.googleReviewUrl,
      active: Boolean(settings.googleReviewUrl)
    },
    {
      label: "Yelp",
      url: settings.yelpReviewUrl,
      active: Boolean(settings.yelpReviewUrl)
    },
    {
      label: "Facebook",
      url: settings.facebookReviewUrl,
      active: Boolean(settings.facebookReviewUrl)
    }
  ];

  return (
    <aside className="surface-card px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Review Link Settings</h2>
          <p className="mt-1 text-sm text-neutral-500">Platforms customers can be routed to after rating your visit.</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {platforms.map((platform) => (
          <div
            key={platform.label}
            className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">{platform.label}</p>
                <p className="mt-1 truncate text-xs text-neutral-500">
                  {platform.url ?? "Not configured"}
                </p>
              </div>
              <StatBadge label={platform.active ? "Active" : "Inactive"} tone={platform.active ? "green" : "gray"} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ReviewRequestsDashboard() {
  const [filter, setFilter] = useState<ReviewStatusFilter>("all");
  const reviewRequestsQuery = useReviewRequests({
    ...(filter !== "all" ? { status: filter } : {}),
    page: 1,
    limit: 100
  });
  const reviewStatsQuery = useReviewStats();

  const requests = reviewRequestsQuery.data?.data ?? [];
  const stats = reviewStatsQuery.data;

  const averageRatingLabel = useMemo(() => {
    if (stats?.averageRating == null) {
      return "--";
    }

    return stats.averageRating.toFixed(1);
  }, [stats?.averageRating]);

  const rows = useMemo(
    () =>
      requests.map((request) => ({
        ...request,
        customerName: `${request.customer.firstName} ${request.customer.lastName}`.trim(),
        sentDate: request.sentAt ? formatDate(request.sentAt) : "Not sent",
        jobTitle: request.job?.title ?? request.job?.jobNumber ?? "Review request"
      })),
    [requests]
  );

  if (reviewRequestsQuery.isLoading || reviewStatsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-[108px]" />
        <SkeletonCard className="h-[640px]" />
      </div>
    );
  }

  return (
    <motion.div {...cardMotion} transition={{ duration: 0.24 }}>
      <PageLayout
        title="Review Requests"
        subtitle="Track customer review funnel performance and keep request follow-up moving."
        actions={
          <Link
            href="/settings/review-links"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            <Settings2 className="h-4 w-4" />
            Configure Review Links
          </Link>
        }
      >
        <section className="grid gap-4 xl:grid-cols-4">
          <SummaryCard
            label="Requests Sent"
            value={String(stats?.requestsSent ?? 0)}
            detail="Current review funnel volume"
            tone="blue"
          />
          <SummaryCard
            label="Clicked Link"
            value={String(stats?.clickedLink ?? 0)}
            detail={`${stats?.clickRate ?? 0}% click rate`}
            tone="orange"
          />
          <SummaryCard
            label="Reviews Left"
            value={String(stats?.reviewsLeft ?? 0)}
            detail={`${stats?.completionRate ?? 0}% of clicks converted`}
            tone="green"
          />
          <SummaryCard
            label="Avg Rating"
            value={averageRatingLabel}
            detail="Average across completed reviews"
            tone="purple"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="surface-card overflow-hidden">
            <div className="border-b border-neutral-200 px-5 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                        filter === item.value
                          ? "bg-brand-accent text-white"
                          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-full bg-neutral-50 px-4 py-2 text-sm text-neutral-500">
                  {reviewRequestsQuery.data?.total ?? 0} total requests
                </div>
              </div>
            </div>

            {reviewRequestsQuery.isError ? (
              <div className="px-5 py-12">
                <EmptyState
                  icon={MessageSquareText}
                  title="Review requests unavailable"
                  subtitle="We couldn't load the review funnel right now. Refresh and try again."
                />
              </div>
            ) : rows.length === 0 ? (
              <div className="px-5 py-12">
                <EmptyState
                  icon={MessageSquareText}
                  title="No review requests yet"
                  subtitle="Completed jobs can send review requests from the job detail flow."
                  action={(
                    <Link
                      href="/jobs"
                      className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary"
                    >
                      View Jobs
                    </Link>
                  )}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-[0.18em] text-neutral-400">
                    <tr>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Job</th>
                      <th className="px-5 py-4">Sent</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Channel</th>
                      <th className="px-5 py-4">Rating</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {rows.map((request) => (
                      <tr key={request.id} className="transition hover:bg-brand-accent-light/20">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-neutral-900">{request.customerName}</p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {request.customer.email ?? request.customer.phone ?? "No contact on file"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-neutral-900">{request.jobTitle}</p>
                            <p className="mt-1 text-xs text-neutral-500">{request.job?.jobNumber ?? "Manual follow-up"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-neutral-600">{request.sentDate}</td>
                        <td className="px-5 py-4">
                          <StatBadge
                            label={formatStatusLabel(request.status)}
                            tone={getStatusTone(request.status)}
                          />
                        </td>
                        <td className="px-5 py-4 text-neutral-600">{request.channel.toUpperCase()}</td>
                        <td className="px-5 py-4">{renderStars(request.rating)}</td>
                        <td className="px-5 py-4 text-right">
                          <ResendButton request={request} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <SettingsStatusPanel />
        </div>
      </PageLayout>
    </motion.div>
  );
}
