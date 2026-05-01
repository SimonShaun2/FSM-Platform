"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { FileCheck2 } from "lucide-react";

import type { EstimateConversionSummary } from "@/src/hooks/reporting.hooks";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";

interface ConversionDonutProps {
  summary: EstimateConversionSummary | undefined;
  isLoading: boolean;
}

const conversionColors = {
  approved: "#16a34a",
  pending: "#f59e0b",
  declined: "#ef4444",
  empty: "#e5e7eb"
};

export function ConversionDonut({ summary, isLoading }: ConversionDonutProps) {
  if (isLoading) {
    return <SkeletonCard className="h-[320px]" />;
  }

  if (!summary) {
    return (
      <section className="surface-card px-6 py-6">
        <EmptyState
          icon={FileCheck2}
          title="No conversion data"
          subtitle="Once estimates are moving through the funnel, conversion will render here."
          compact
        />
      </section>
    );
  }

  const hasData = summary.total > 0;
  const chartData = hasData
    ? [
        { name: "Approved", value: summary.approved, color: conversionColors.approved },
        { name: "Pending", value: summary.pending, color: conversionColors.pending },
        { name: "Declined", value: summary.declined, color: conversionColors.declined }
      ]
    : [{ name: "No Data", value: 1, color: conversionColors.empty }];

  return (
    <section className="surface-card px-6 py-6">
      <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Estimate Conversion</h3>
      <div className="mt-6 grid items-center gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={66}
                outerRadius={92}
                stroke="transparent"
                paddingAngle={3}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Rate</span>
            <span className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">{summary.rate}%</span>
          </div>
        </div>

        <div className="space-y-4">
          <LegendRow label="Approved" color={conversionColors.approved} value={summary.approved} />
          <LegendRow label="Pending" color={conversionColors.pending} value={summary.pending} />
          <LegendRow label="Declined" color={conversionColors.declined} value={summary.declined} />
        </div>
      </div>
    </section>
  );
}

function LegendRow({ label, color, value }: { label: string; color: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold text-neutral-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-neutral-950">{value}</span>
    </div>
  );
}
