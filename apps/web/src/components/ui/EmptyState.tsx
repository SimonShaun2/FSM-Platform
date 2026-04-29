"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({ title, subtitle, icon: Icon, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/80 text-center",
        compact ? "px-5 py-8" : "px-6 py-12"
      ].join(" ")}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent-light text-brand-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">{subtitle}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
