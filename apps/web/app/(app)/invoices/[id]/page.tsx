"use client";

import { useParams } from "next/navigation";

import { InvoiceDetailClient } from "@/src/components/invoices/InvoiceDetailClient";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();

  return <InvoiceDetailClient invoiceId={params.id} />;
}
