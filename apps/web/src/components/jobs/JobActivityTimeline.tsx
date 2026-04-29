"use client";

import { CircleDot } from "lucide-react";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useJobActivity } from "@/src/hooks/jobs.hooks";

import { formatRelativeTime, sortNewestFirst } from "./jobs.utils";

export function JobActivityTimeline({ jobId }: { jobId: string }) {
  const activityQuery = useJobActivity(jobId);
  const items = sortNewestFirst(activityQuery.data?.data ?? []);

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Activity Timeline</h2>
          <p className="mt-1 text-sm text-neutral-500">Newest events first so dispatch and field work stay aligned.</p>
        </div>
      </div>

      <div className="mt-5 max-h-[420px] space-y-4 overflow-y-auto pr-1">
        {activityQuery.isLoading ? (
          Array.from({ length: 5 }, (_, index) => <SkeletonCard key={index} className="h-[88px]" />)
        ) : activityQuery.isError ? (
          <p className="rounded-3xl border border-error/15 bg-error-light px-4 py-4 text-sm text-error">
            Activity could not be loaded right now.
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={CircleDot}
            title="No activity yet"
            subtitle="Scheduling, time tracking, OTW messages, tasks, products, and status changes will show up here automatically."
            compact
          />
        ) : (
          items.map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent-light text-brand-accent">
                <CircleDot className="h-4 w-4" />
              </div>
              <div className="min-w-0 rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-sm leading-6 text-neutral-700">{event.summary}</p>
                <p className="mt-2 text-xs font-medium text-neutral-400">{formatRelativeTime(event.occurredAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
