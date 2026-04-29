"use client";

import { useParams } from "next/navigation";

import { EstimateBuilderClient } from "@/src/components/estimates/EstimateBuilderClient";

export default function EstimateDetailPage() {
  const params = useParams<{ id: string }>();

  return <EstimateBuilderClient estimateId={params.id} />;
}
