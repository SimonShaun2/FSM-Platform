"use client";

import { BriefcaseBusiness } from "lucide-react";

import type { PipelineMetricRow } from "@/src/hooks/reporting.hooks";
import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";

interface PipelineMetricsProps {
  rows: PipelineMetricRow[];
  isLoading: boolean;
}

export function PipelineMetrics({ rows, isLoading }: PipelineMetricsProps) {
  if (isLoading) {
    return <SkeletonCard className="h-[320px]" />;
  }

  if (rows.length === 0) {
    return (
      <section className="surface-card px-6 py-6">
        <EmptyState
          icon={BriefcaseBusiness}
          title="No pipeline metrics yet"
          subtitle="Estimate, invoice, and agreement pipeline value will show here once work starts moving."
          compact
        />
      </section>
    );
  }

  return (
    <section className="surface-card px-6 py-6">
      <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Pipeline</h3>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{row.label}</p>
              <p className="mt-1 text-xs text-neutral-500">{row.note}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-neutral-950">{row.count}</p>
              <CurrencyDisplay value={row.value} className="text-sm font-semibold text-success" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
