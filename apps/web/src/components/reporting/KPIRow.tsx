"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import type { ReportingKpiMetric } from "@/src/hooks/reporting.hooks";
import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { cn } from "@/src/lib/utils";

interface KPIRowProps {
  metrics: ReportingKpiMetric[];
  isLoading: boolean;
}

function formatValue(metric: ReportingKpiMetric) {
  if (metric.id === "revenue" || metric.id === "ticket") {
    return <CurrencyDisplay value={metric.value} showCents={false} className="text-[2rem] font-semibold tracking-tight text-neutral-950" />;
  }

  return <span className="text-[2rem] font-semibold tracking-tight text-neutral-950">{metric.value}</span>;
}

export function KPIRow({ metrics, isLoading }: KPIRowProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonCard key={index} className="h-[136px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {metrics.map((metric) => {
        const trendClass =
          metric.trendDirection === "up"
            ? "bg-success-light text-success"
            : metric.trendDirection === "down"
              ? "bg-error-light text-error"
              : "bg-neutral-100 text-neutral-500";
        const TrendIcon =
          metric.trendDirection === "up"
            ? ArrowUpRight
            : metric.trendDirection === "down"
              ? ArrowDownRight
              : Minus;

        return (
          <section key={metric.id} className="surface-card px-5 py-5">
            <p className="text-sm font-medium text-neutral-500">{metric.label}</p>
            <div className="mt-3">{formatValue(metric)}</div>
            <div className="mt-4 flex items-center gap-3">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", trendClass)}>
                <TrendIcon className="h-3.5 w-3.5" />
                {metric.trendPercent}%
              </span>
              <span className="text-xs font-medium text-neutral-400">{metric.helper}</span>
            </div>
          </section>
        );
      })}
    </div>
  );
}
