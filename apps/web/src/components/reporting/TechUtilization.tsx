"use client";

import { Users } from "lucide-react";

import type { TechUtilizationRow } from "@/src/hooks/reporting.hooks";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { cn } from "@/src/lib/utils";

interface TechUtilizationProps {
  rows: TechUtilizationRow[];
  isLoading: boolean;
}

function getToneClass(tone: TechUtilizationRow["tone"]) {
  switch (tone) {
    case "green":
      return "bg-success";
    case "orange":
      return "bg-warning";
    case "red":
    default:
      return "bg-error";
  }
}

export function TechUtilization({ rows, isLoading }: TechUtilizationProps) {
  if (isLoading) {
    return <SkeletonCard className="h-[360px]" />;
  }

  if (rows.length === 0) {
    return (
      <section className="surface-card px-6 py-6">
        <EmptyState
          icon={Users}
          title="No active technicians"
          subtitle="Technician utilization appears once active technicians are scheduled in the selected window."
          compact
        />
      </section>
    );
  }

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Tech Utilization</h3>
          <p className="mt-1 text-sm text-neutral-500">Booked hours versus available technician capacity.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-neutral-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{row.name}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {row.jobsCount} {row.jobsCount === 1 ? "job" : "jobs"} - {Math.round(row.bookedMinutes / 60)}h booked
                </p>
              </div>
              <span className="text-sm font-semibold text-neutral-900">{row.utilizationPercent}%</span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn("h-full rounded-full transition-all duration-500", getToneClass(row.tone))}
                style={{ width: `${row.utilizationPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
