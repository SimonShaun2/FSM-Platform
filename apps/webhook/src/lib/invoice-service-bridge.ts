import type Stripe from "stripe";

interface InvoiceServiceModule {
  handleStripePaymentSuccess(event: Stripe.PaymentIntentSucceededEvent): Promise<void>;
  handleStripePaymentFailed(event: Stripe.PaymentIntentPaymentFailedEvent): Promise<void>;
}

let cachedInvoiceServiceModule: Promise<InvoiceServiceModule> | null = null;

async function loadInvoiceServiceModule(): Promise<InvoiceServiceModule> {
  if (!cachedInvoiceServiceModule) {
    const moduleUrl = new URL("../../../api/dist/services/invoice.service.js", import.meta.url);
    cachedInvoiceServiceModule = import(moduleUrl.href) as Promise<InvoiceServiceModule>;
  }

  return cachedInvoiceServiceModule;
}

export async function forwardStripePaymentSuccess(
  event: Stripe.PaymentIntentSucceededEvent
): Promise<void> {
  const invoiceService = await loadInvoiceServiceModule();
  await invoiceService.handleStripePaymentSuccess(event);
}

export async function forwardStripePaymentFailed(
  event: Stripe.PaymentIntentPaymentFailedEvent
): Promise<void> {
  const invoiceService = await loadInvoiceServiceModule();
  await invoiceService.handleStripePaymentFailed(event);
}
