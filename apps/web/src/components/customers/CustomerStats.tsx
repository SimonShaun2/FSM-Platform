"use client";

import { formatDate, formatCurrency } from "@/src/lib/utils";

interface CustomerStatsProps {
  customerSince: string | null;
  lifetimeValue: string;
  totalJobs: number;
  lastJobDate: string | null;
}

export function CustomerStats({ customerSince, lifetimeValue, totalJobs, lastJobDate }: CustomerStatsProps) {
  const items = [
    {
      label: "Customer since",
      value: customerSince ? formatDate(customerSince) : "New"
    },
    {
      label: "Lifetime value",
      value: formatCurrency(lifetimeValue)
    },
    {
      label: "Total jobs",
      value: totalJobs.toString()
    },
    {
      label: "Last job",
      value: lastJobDate ? formatDate(lastJobDate) : "No jobs yet"
    }
  ];

  return (
    <section className="grid gap-0 overflow-hidden rounded-[28px] border border-neutral-200 bg-white md:grid-cols-4">
      {items.map((item, index) => (
        <div key={item.label} className={index < items.length - 1 ? "border-b border-neutral-200 px-5 py-4 md:border-b-0 md:border-r" : "px-5 py-4"}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">{item.label}</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
