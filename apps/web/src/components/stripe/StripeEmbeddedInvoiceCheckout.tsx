"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMemo } from "react";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export function StripeEmbeddedInvoiceCheckout({ clientSecret }: { clientSecret: string }) {
  const stripePromise = useMemo(() => {
    if (!publishableKey) {
      return null;
    }

    return loadStripe(publishableKey);
  }, []);

  if (!stripePromise) {
    return null;
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
