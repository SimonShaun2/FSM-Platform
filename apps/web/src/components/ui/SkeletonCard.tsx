"use client";

import { cn } from "@/src/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-3xl border border-neutral-200 bg-white/80",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.92),transparent)]" />
      <div className="h-full w-full animate-pulse bg-neutral-100" />
    </div>
  );
}
