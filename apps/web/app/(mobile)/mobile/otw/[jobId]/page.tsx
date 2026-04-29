"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CarFront } from "lucide-react";

import { OTWPanel } from "@/src/components/jobs/OTWPanel";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { useJob } from "@/src/hooks/jobs.hooks";

export default function MobileOnTheWayPage() {
  const params = useParams<{ jobId: string }>();
  const jobQuery = useJob(params.jobId);

  if (jobQuery.isLoading) {
    return <SkeletonCard className="h-[360px]" />;
  }

  if (jobQuery.isError || !jobQuery.data?.job) {
    return (
      <EmptyState
        icon={CarFront}
        title="Job not found"
        subtitle="The OTW notification screen is only available for active jobs you can access."
        compact
      />
    );
  }

  return (
    <div className="space-y-5">
      <Link href={`/mobile/jobs/${jobQuery.data.job.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent">
        <ArrowLeft className="h-4 w-4" />
        Back to Job
      </Link>
      <OTWPanel jobId={jobQuery.data.job.id} job={jobQuery.data.job} openComposer />
    </div>
  );
}
