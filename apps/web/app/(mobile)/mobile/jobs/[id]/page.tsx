"use client";

import { useParams } from "next/navigation";

import { JobDetailClient } from "@/src/components/jobs/JobDetailClient";

export default function MobileJobDetailPage() {
  const params = useParams<{ id: string }>();

  return <JobDetailClient jobId={params.id} />;
}
