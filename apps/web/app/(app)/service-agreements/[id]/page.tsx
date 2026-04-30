"use client";

import { useParams } from "next/navigation";

import { ServiceAgreementDetailClient } from "@/src/components/service-agreements/ServiceAgreementDetailClient";

export default function ServiceAgreementDetailPage() {
  const params = useParams<{ id: string }>();

  return <ServiceAgreementDetailClient agreementId={params.id} />;
}
