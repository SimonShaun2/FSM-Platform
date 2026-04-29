"use client";

import { formatRelativeTime } from "@/src/lib/utils";

interface TimeAgoProps {
  value: string | Date | null | undefined;
  fallback?: string;
  className?: string;
}

export function TimeAgo({ value, fallback = "Just now", className }: TimeAgoProps) {
  if (!value) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{formatRelativeTime(value)}</span>;
}
