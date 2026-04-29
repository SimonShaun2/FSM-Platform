"use client";

import { cn } from "@/src/lib/utils";

interface CurrencyDisplayProps {
  value: string | number | null | undefined;
  className?: string;
  showCents?: boolean;
  fallback?: string;
}

export function CurrencyDisplay({
  value,
  className,
  showCents = false,
  fallback = "$0"
}: CurrencyDisplayProps) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  const formatted = Number.isFinite(parsed)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0
      }).format(parsed)
    : fallback;

  return <span className={cn(className)}>{formatted}</span>;
}
