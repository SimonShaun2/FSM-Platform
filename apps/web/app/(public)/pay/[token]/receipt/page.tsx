"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/src/lib/api";

interface ReceiptView {
  invoiceNumber: string;
  totalDue: string;
  invoiceAmount: string;
  platformFeeAmount: string;
  receiptPortalUrl: string;
  pdfDownloadUrl: string;
  brandName: string;
}

export default function InvoiceReceiptPage() {
  const params = useParams<{ token: string }>();
  const receiptQuery = useQuery({
    queryKey: ["public-receipt", params.token],
    queryFn: () => api.get<ReceiptView>(`/api/v1/public/pay/${params.token}/receipt`)
  });

  if (receiptQuery.isLoading || !receiptQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-10 w-10 animate-spin text-brand-accent" />
      </div>
    );
  }

  const receipt = receiptQuery.data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-neutral-200 bg-white px-8 py-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{receipt.brandName} receipt</p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">{receipt.invoiceNumber}</h1>
        <p className="mt-6 text-sm text-neutral-600">Service amount: ${receipt.invoiceAmount}</p>
        {Number(receipt.platformFeeAmount) > 0 ? (
          <p className="mt-2 text-sm text-neutral-600">Platform fee: ${receipt.platformFeeAmount}</p>
        ) : null}
        <p className="mt-4 text-lg font-semibold text-neutral-900">Total: ${receipt.totalDue}</p>
        <a
          href={receipt.pdfDownloadUrl}
          className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
