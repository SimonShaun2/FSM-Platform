"use client";

import { useParams } from "next/navigation";

import { CustomerProfile } from "@/src/components/customers/CustomerProfile";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();

  return <CustomerProfile customerId={params.id} />;
}
