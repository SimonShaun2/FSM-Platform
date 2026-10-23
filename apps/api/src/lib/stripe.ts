import { Decimal } from "decimal.js";
import Stripe from "stripe";

import { env } from "@fsm/config";
import {
  computeCustomerPaidPlatformFee,
  formatCustomerPlatformFeeLineItemName
} from "@fsm/config/stripe-pricing";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export interface InvoiceCheckoutLineItem {
  name: string;
  description: string | null;
  quantity: string;
  total: string;
}

export interface CreateInvoiceCheckoutSessionInput {
  companyId: string;
  invoiceId: string;
  customerId: string;
  customerEmail: string | null;
  companyStripeAccountId: string;
  invoiceNumber: string;
  total: string;
  items: InvoiceCheckoutLineItem[];
  /** Decimal fraction (0.05 = 5%). Customer-paid on top of invoice; 0 for Flat. */
  connectApplicationFeeFraction: number;
}

export interface InvoiceCheckoutSessionResult {
  id: string;
  url: string;
}

export interface CreateServiceAgreementPriceInput {
  companyId: string;
  templateId: string;
  name: string;
  amount: string;
  interval: "month" | "year";
}

export interface CreateStripeCustomerInput {
  companyId: string;
  customerId: string;
  email: string | null;
  name: string;
}

export interface StripeCustomerResult {
  id: string;
}

export interface CreateServiceAgreementSubscriptionInput {
  companyId: string;
  planId: string;
  customerId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  companyStripeAccountId: string;
  connectApplicationFeeFraction: number;
}

export interface StripeSubscriptionResult {
  id: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface ServiceAgreementSubscriptionSnapshotResult extends StripeSubscriptionResult {
  status: Stripe.Subscription.Status;
  paymentMethodLabel: string | null;
  retryPaymentUrl: string | null;
  latestInvoiceAmountDue: string | null;
  latestInvoiceDueDate: string | null;
}

export interface StripeConnectAccountSnapshot {
  id: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  accountName: string | null;
  payoutSchedule: string | null;
  lastPayoutAmount: string | null;
  lastPayoutAt: string | null;
}

function toCents(value: string): number {
  return new Decimal(value)
    .mul(100)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

function centsToCurrencyString(value: number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return new Decimal(value).div(100).toFixed(2);
}

function buildHostedDescription(item: InvoiceCheckoutLineItem): string | undefined {
  const parts = [`Quantity: ${item.quantity}`];

  if (item.description) {
    parts.push(item.description);
  }

  return parts.join(" • ");
}

function toSubscriptionResult(subscription: Stripe.Subscription): StripeSubscriptionResult {
  return {
    id: subscription.id,
    currentPeriodStart: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : null,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  };
}

function isExpandedPaymentMethod(value: unknown): value is Stripe.PaymentMethod {
  return typeof value === "object" && value !== null && "object" in value && value.object === "payment_method";
}

function getExpandedInvoice(value: unknown): Stripe.Invoice | null {
  return typeof value === "object" && value !== null && "object" in value && value.object === "invoice"
    ? (value as Stripe.Invoice)
    : null;
}

function buildPaymentMethodLabel(paymentMethod: Stripe.PaymentMethod | null): string | null {
  if (!paymentMethod || paymentMethod.type !== "card" || !paymentMethod.card) {
    return null;
  }

  const brand = paymentMethod.card.brand
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `${brand} ending in ${paymentMethod.card.last4}`;
}

function formatPayoutSchedule(interval: string | null | undefined): string | null {
  if (!interval) {
    return null;
  }

  return interval.charAt(0).toUpperCase() + interval.slice(1);
}

export async function createInvoiceCheckoutSession(
  input: CreateInvoiceCheckoutSessionInput
): Promise<InvoiceCheckoutSessionResult> {
  const feeBreakdown = computeCustomerPaidPlatformFee(input.total, input.connectApplicationFeeFraction);
  const applicationFeeAmount = toCents(feeBreakdown.platformFeeAmount);
  const appBaseUrl = env.APP_URL.replace(/\/$/, "");
  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    transfer_data: {
      destination: input.companyStripeAccountId
    },
    metadata: {
      companyId: input.companyId,
      invoiceId: input.invoiceId,
      customerId: input.customerId
    }
  };

  if (applicationFeeAmount > 0) {
    paymentIntentData.application_fee_amount = applicationFeeAmount;
  }

  const serviceLineItems = input.items.map((item) => {
    const description = buildHostedDescription(item);

    return {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: toCents(item.total),
        product_data: description ? { name: item.name, description } : { name: item.name }
      }
    };
  });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [...serviceLineItems];

  if (applicationFeeAmount > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: applicationFeeAmount,
        product_data: {
          name: formatCustomerPlatformFeeLineItemName(input.connectApplicationFeeFraction),
          description:
            "Customer-paid platform fee (added to your total). Your service provider receives the full invoice amount."
        }
      }
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    line_items: lineItems,
    payment_intent_data: paymentIntentData,
    success_url: `${appBaseUrl}/invoices/${input.invoiceId}?status=success`,
    cancel_url: `${appBaseUrl}/invoices/${input.invoiceId}?status=cancelled`,
    metadata: {
      companyId: input.companyId,
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      invoiceNumber: input.invoiceNumber
    }
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a hosted URL");
  }

  return {
    id: session.id,
    url: session.url
  };
}

export async function expireInvoiceCheckoutSession(sessionId: string): Promise<void> {
  await stripe.checkout.sessions.expire(sessionId);
}

export async function createServiceAgreementPrice(
  input: CreateServiceAgreementPriceInput
): Promise<{ id: string }> {
  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: toCents(input.amount),
    recurring: {
      interval: input.interval
    },
    product_data: {
      name: input.name,
      metadata: {
        companyId: input.companyId,
        templateId: input.templateId
      }
    }
  });

  return {
    id: price.id
  };
}

export async function archiveStripePrice(priceId: string): Promise<void> {
  await stripe.prices.update(priceId, {
    active: false
  });
}

export async function createStripeCustomer(input: CreateStripeCustomerInput): Promise<StripeCustomerResult> {
  const customer = await stripe.customers.create({
    ...(input.email ? { email: input.email } : {}),
    name: input.name,
    metadata: {
      companyId: input.companyId,
      customerId: input.customerId
    }
  });

  return {
    id: customer.id
  };
}

export async function createServiceAgreementSubscription(
  input: CreateServiceAgreementSubscriptionInput
): Promise<StripeSubscriptionResult> {
  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: input.stripeCustomerId,
    items: [{ price: input.stripePriceId }],
    transfer_data: {
      destination: input.companyStripeAccountId
    },
    metadata: {
      companyId: input.companyId,
      planId: input.planId,
      customerId: input.customerId
    }
  };

  if (input.connectApplicationFeeFraction > 0) {
    subscriptionParams.application_fee_percent = new Decimal(input.connectApplicationFeeFraction)
      .mul(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toNumber();
  }

  const subscription = await stripe.subscriptions.create(subscriptionParams);

  return toSubscriptionResult(subscription);
}

export async function updateServiceAgreementSubscriptionCancelAtPeriodEnd(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean
): Promise<StripeSubscriptionResult> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd
  });

  return toSubscriptionResult(subscription);
}

export async function cancelServiceAgreementSubscription(
  subscriptionId: string
): Promise<StripeSubscriptionResult> {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return toSubscriptionResult(subscription);
}

export async function pauseServiceAgreementSubscription(
  subscriptionId: string
): Promise<StripeSubscriptionResult> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: "void"
    }
  });

  return toSubscriptionResult(subscription);
}

export async function retrieveServiceAgreementSubscriptionSnapshot(
  subscriptionId: string
): Promise<ServiceAgreementSubscriptionSnapshotResult> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method", "latest_invoice", "latest_invoice.default_payment_method"]
  });
  const latestInvoice = getExpandedInvoice(subscription.latest_invoice);
  const subscriptionPaymentMethod = isExpandedPaymentMethod(subscription.default_payment_method)
    ? subscription.default_payment_method
    : null;
  const invoicePaymentMethod = latestInvoice && isExpandedPaymentMethod(latestInvoice.default_payment_method)
    ? latestInvoice.default_payment_method
    : null;
  const paymentMethodLabel = buildPaymentMethodLabel(subscriptionPaymentMethod ?? invoicePaymentMethod);

  return {
    ...toSubscriptionResult(subscription),
    status: subscription.status,
    paymentMethodLabel,
    retryPaymentUrl: latestInvoice?.hosted_invoice_url ?? null,
    latestInvoiceAmountDue: centsToCurrencyString(latestInvoice?.amount_due),
    latestInvoiceDueDate: latestInvoice?.due_date
      ? new Date(latestInvoice.due_date * 1000).toISOString().slice(0, 10)
      : null
  };
}

export async function createExpressConnectedAccount(companyId: string): Promise<{ id: string }> {
  const account = await stripe.accounts.create({
    type: "express",
    metadata: {
      companyId
    }
  });

  return {
    id: account.id
  };
}

export async function createConnectOnboardingLink(accountId: string): Promise<{ url: string }> {
  const appBaseUrl = env.APP_URL.replace(/\/$/, "");
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appBaseUrl}/settings/payments/onboard?refresh=true`,
    return_url: `${appBaseUrl}/settings/payments/onboard/return`,
    type: "account_onboarding"
  });

  return {
    url: accountLink.url
  };
}

export async function retrieveConnectedAccount(accountId: string): Promise<StripeConnectAccountSnapshot> {
  const [account, payouts] = await Promise.all([
    stripe.accounts.retrieve(accountId),
    stripe.payouts.list({ limit: 1 }, { stripeAccount: accountId })
  ]);
  const lastPayout = payouts.data[0];

  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    accountName: account.business_profile?.name ?? account.company?.name ?? null,
    payoutSchedule: formatPayoutSchedule(account.settings?.payouts?.schedule?.interval),
    lastPayoutAmount: centsToCurrencyString(lastPayout?.amount ?? null),
    lastPayoutAt: lastPayout?.arrival_date
      ? new Date(lastPayout.arrival_date * 1000).toISOString()
      : null
  };
}

export async function createExpressDashboardLink(accountId: string): Promise<{ url: string }> {
  const loginLink = await stripe.accounts.createLoginLink(accountId);

  return {
    url: loginLink.url
  };
}

export interface CreatePlatformBillingCheckoutInput {
  companyId: string;
  stripeCustomerId: string;
  priceId: string;
  planTier: "flex" | "flat";
  customerEmail: string | null;
}

export interface PlatformBillingCheckoutResult {
  sessionId: string;
  url: string;
}

export async function createPlatformBillingCheckoutSession(
  input: CreatePlatformBillingCheckoutInput
): Promise<PlatformBillingCheckoutResult> {
  const appBaseUrl = env.APP_URL.replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: input.stripeCustomerId,
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${appBaseUrl}/settings/billing?checkout=success`,
    cancel_url: `${appBaseUrl}/settings/billing?checkout=cancel`,
    metadata: {
      companyId: input.companyId,
      billingKind: "platform_mvp",
      planTier: input.planTier
    },
    subscription_data: {
      metadata: {
        companyId: input.companyId,
        billingKind: "platform_mvp",
        planTier: input.planTier
      }
    }
  });

  if (!session.url) {
    throw new Error("Stripe checkout session missing url");
  }

  return {
    sessionId: session.id,
    url: session.url
  };
}

export async function createStripePlatformCustomer(input: {
  companyId: string;
  email: string | null;
  name: string;
}): Promise<StripeCustomerResult> {
  const customer = await stripe.customers.create({
    ...(input.email ? { email: input.email } : {}),
    name: input.name,
    metadata: {
      companyId: input.companyId,
      billingKind: "platform_mvp"
    }
  });

  return { id: customer.id };
}
