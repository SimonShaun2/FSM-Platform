"use client";

import { useParams } from "next/navigation";

import { PropertyDetail } from "@/src/components/customers/PropertyDetail";

export default function PropertyDetailPage() {
  const params = useParams<{ id: string; propId: string }>();

  return <PropertyDetail customerId={params.id} propertyId={params.propId} />;
}
