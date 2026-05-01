"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { RevenueChartPoint } from "@/src/hooks/reporting.hooks";
import { CurrencyDisplay } from "@/src/components/ui/CurrencyDisplay";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { LineChart } from "lucide-react";

interface RevenueChartProps {
  data: RevenueChartPoint[];
  isLoading: boolean;
  rangeLabel: string;
}

export function RevenueChart({ data, isLoading, rangeLabel }: RevenueChartProps) {
  if (isLoading) {
    return <SkeletonCard className="h-[360px]" />;
  }

  if (data.length === 0) {
    return (
      <section className="surface-card px-6 py-6">
        <EmptyState
          icon={LineChart}
          title="No revenue in this range"
          subtitle="Collected payment activity will appear here once revenue hits the selected period."
          compact
        />
      </section>
    );
  }

  const total = data.reduce((sum, point) => sum + point.revenue, 0);
  const chartWidth = Math.max(680, data.length * 26);

  return (
    <section className="surface-card px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-950">Revenue</h3>
          <p className="mt-1 text-sm text-neutral-500">{rangeLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Total</p>
          <CurrencyDisplay value={total.toFixed(2)} className="mt-1 text-xl font-semibold text-success" />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div style={{ width: chartWidth }} className="h-[260px] min-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={18}
                interval="preserveStartEnd"
                tick={{ fill: "#8c94a6", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8c94a6", fontSize: 11 }}
                tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
              />
              <Tooltip
                cursor={{ fill: "rgba(37, 122, 250, 0.08)" }}
                content={({ active, payload }) => {
                  const point = active && payload?.[0]?.payload ? (payload[0].payload as RevenueChartPoint) : null;

                  if (!point) {
                    return null;
                  }

                  return (
                    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{point.label}</p>
                      <CurrencyDisplay value={point.formattedRevenue} className="mt-2 text-base font-semibold text-neutral-950" />
                    </div>
                  );
                }}
              />
              <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                {data.map((point) => (
                  <Cell
                    key={point.dateKey}
                    fill={point.isToday ? "#257afa" : "#cfe0ff"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
