"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Package2 } from "lucide-react";

import type { ProductUsageStatsRecord } from "@/src/hooks/products.hooks";
import { formatDate } from "@/src/lib/utils";
import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";

interface ProductUsageStatsProps {
  stats: ProductUsageStatsRecord | null;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: ReactNode;
  helper?: string;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{value}</p>
      {helper ? <p className="mt-2 text-xs text-neutral-500">{helper}</p> : null}
    </div>
  );
}

export function ProductUsageStats({ stats, isLoading = false }: ProductUsageStatsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard className="h-[170px]" />
        <SkeletonCard className="h-[270px]" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-brand-accent" />
          <p className="text-sm font-semibold text-neutral-900">Usage Stats</p>
        </div>

        <div className="mt-4 grid gap-3">
          <StatCard label="Times Used" value={String(stats.usedOnJobs)} helper="Unique jobs using this product" />
          <StatCard
            label="Total Revenue"
            value={<CurrencyDisplay value={stats.totalRevenue} showCents />}
          />
          <StatCard
            label="Avg Per Job"
            value={<CurrencyDisplay value={stats.averageRevenuePerJob} showCents />}
          />
          <StatCard
            label="Last Used"
            value={stats.lastUsedAt ? formatDate(stats.lastUsedAt) : "Not yet used"}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Package2 className="h-4 w-4 text-brand-accent" />
          <p className="text-sm font-semibold text-neutral-900">Recently Used On</p>
        </div>

        <div className="mt-4 space-y-3">
          {stats.recentJobs.length === 0 ? (
            <EmptyState
              icon={Package2}
              title="No job history yet"
              subtitle="Once this product is added to jobs, the most recent usage will appear here."
              compact
            />
          ) : (
            stats.recentJobs.map((job) => (
              <Link
                key={job.jobId}
                href={`/jobs/${job.jobId}`}
                className="block rounded-[22px] border border-neutral-200 bg-neutral-50 px-4 py-4 transition hover:border-brand-accent/25 hover:bg-brand-accent-light/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">{job.jobNumber}</p>
                    <p className="mt-1 truncate text-sm text-neutral-600">{job.customerName}</p>
                  </div>
                  <p className="shrink-0 text-xs text-neutral-500">{formatDate(job.usedAt)}</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-brand-accent">
                  <CurrencyDisplay value={job.totalRevenue} showCents />
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
