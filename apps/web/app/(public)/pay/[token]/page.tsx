"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { usePublicPaymentLink } from "@/src/hooks/invoices.hooks";

function formatUsd(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return amount;
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function PublicPaymentPage() {
  const params = useParams<{ token: string }>();
  const paymentQuery = usePublicPaymentLink(params.token);
  const [redirecting, setRedirecting] = useState(false);

  if (paymentQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={Loader2}
            title="Payment link unavailable"
            subtitle="This payment link may have expired. Contact your service provider to request a new invoice link."
          />
        </div>
      </div>
    );
  }

  if (paymentQuery.isLoading || !paymentQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-accent" />
      </div>
    );
  }

  const payment = paymentQuery.data;

  const handleContinue = () => {
    setRedirecting(true);
    window.location.replace(payment.paymentLinkUrl);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-neutral-200 bg-white px-8 py-10 shadow-[0_24px_80px_rgba(16,33,99,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Invoice payment</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
          {payment.invoiceNumber}
        </h1>

        <dl className="mt-8 space-y-4 border-t border-neutral-100 pt-6 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-neutral-600">Invoice amount</dt>
            <dd className="font-semibold text-neutral-900">{formatUsd(payment.invoiceAmount)}</dd>
          </div>
          {payment.platformFeePaidByCustomer && payment.platformFeePercent != null ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-neutral-600">
                Renvani platform fee ({payment.platformFeePercent}%)
                <span className="mt-1 block text-xs font-normal text-neutral-500">
                  Paid by you; not deducted from your service provider.
                </span>
              </dt>
              <dd className="font-semibold text-neutral-900">{formatUsd(payment.platformFeeAmount)}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-4 text-base">
            <dt className="font-semibold text-neutral-900">Total due today</dt>
            <dd className="font-semibold text-neutral-900">{formatUsd(payment.totalDue)}</dd>
          </div>
        </dl>

        {payment.platformFeeDisclosure ? (
          <p className="mt-4 text-xs leading-5 text-neutral-500">{payment.platformFeeDisclosure}</p>
        ) : null}

        <button
          type="button"
          className="mt-8 w-full rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={redirecting}
          onClick={handleContinue}
        >
          {redirecting ? "Redirecting…" : "Continue to secure payment"}
        </button>
      </div>
    </div>
  );
}
