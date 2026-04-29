"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { usePublicPaymentLink } from "@/src/hooks/invoices.hooks";

export default function PublicPaymentPage() {
  const params = useParams<{ token: string }>();
  const paymentQuery = usePublicPaymentLink(params.token);

  useEffect(() => {
    if (!paymentQuery.data?.paymentLinkUrl) {
      return;
    }

    window.location.replace(paymentQuery.data.paymentLinkUrl);
  }, [paymentQuery.data?.paymentLinkUrl]);

  if (paymentQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-lg">
          <EmptyState
            icon={Loader2}
            title="Payment link unavailable"
            subtitle="This payment link may have expired. Contact ServiceRev to request a new invoice link."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="rounded-[32px] border border-neutral-200 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(16,33,99,0.08)]">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-accent" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-900">Redirecting to secure payment</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
          We&apos;re sending you to Stripe now so you can complete the payment securely.
        </p>
      </div>
    </div>
  );
}
