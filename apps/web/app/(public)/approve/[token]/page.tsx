"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";

import { CustomerEstimateView } from "@/src/components/estimates/CustomerEstimateView";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { SkeletonCard } from "@/src/components/ui/SkeletonCard";
import { usePublicApproveEstimate, usePublicDeclineEstimate, usePublicEstimate } from "@/src/hooks/estimates.hooks";

export default function PublicEstimatePage() {
  const params = useParams<{ token: string }>();
  const [approvedState, setApprovedState] = useState(false);
  const estimateQuery = usePublicEstimate(params.token);
  const approveEstimate = usePublicApproveEstimate(params.token);
  const declineEstimate = usePublicDeclineEstimate(params.token);

  if (estimateQuery.isLoading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <SkeletonCard className="h-[160px]" />
          <SkeletonCard className="h-[720px]" />
        </div>
      </div>
    );
  }

  if (estimateQuery.isError || !estimateQuery.data) {
    return (
      <div className="min-h-screen bg-white px-4 py-12 md:px-8">
        <div className="mx-auto max-w-xl">
          <EmptyState
            icon={FileText}
            title="Estimate not available"
            subtitle="This approval link may have expired or already been used. Contact ServiceRev for help."
          />
        </div>
      </div>
    );
  }

  return (
    <CustomerEstimateView
      estimate={estimateQuery.data.estimate}
      approvedState={approvedState}
      isSubmitting={approveEstimate.isPending || declineEstimate.isPending}
      onApprove={async (input) => {
        await approveEstimate.mutateAsync(input);
        await estimateQuery.refetch();
        setApprovedState(true);
      }}
      onDecline={async (reason) => {
        await declineEstimate.mutateAsync(reason);
        await estimateQuery.refetch();
      }}
    />
  );
}
