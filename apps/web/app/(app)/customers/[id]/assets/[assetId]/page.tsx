"use client";

import { useParams } from "next/navigation";

import { AssetDetail } from "@/src/components/customers/AssetDetail";

export default function AssetDetailPage() {
  const params = useParams<{ id: string; assetId: string }>();

  return <AssetDetail customerId={params.id} assetId={params.assetId} />;
}
