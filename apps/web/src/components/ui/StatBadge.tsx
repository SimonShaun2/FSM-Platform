"use client";

import { cn } from "@/src/lib/utils";

type StatBadgeTone = "neutral" | "blue" | "purple" | "orange" | "red" | "green" | "gray";

interface StatBadgeProps {
  label: string;
  tone?: StatBadgeTone;
  className?: string;
}

const toneClasses: Record<StatBadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-600",
  blue: "bg-brand-accent-light text-brand-accent",
  purple: "bg-ai-light text-ai",
  orange: "bg-warning-light text-warning",
  red: "bg-error-light text-error",
  green: "bg-success-light text-success",
  gray: "bg-neutral-200 text-neutral-600"
};

export function StatBadge({ label, tone = "neutral", className }: StatBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight",
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
