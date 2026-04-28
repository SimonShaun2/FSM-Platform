import { Decimal } from "decimal.js";
import Stripe from "stripe";

import { env } from "@fsm/config";

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
}

export interface StripeSubscriptionResult {
  id: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface StripeConnectAccountSnapshot {
  id: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

function toCents(value: string): number {
  return new Decimal(value)
    .mul(100)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
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

export async function createInvoiceCheckoutSession(
  input: CreateInvoiceCheckoutSessionInput
): Promise<InvoiceCheckoutSessionResult> {
  const totalCents = toCents(input.total);
  const applicationFeeAmount = new Decimal(totalCents)
    .mul(env.STRIPE_PLATFORM_FEE_PERCENT)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
  const appBaseUrl = env.APP_URL.replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    line_items: input.items.map((item) => {
      const description = buildHostedDescription(item);

      return {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: toCents(item.total),
          product_data: description ? { name: item.name, description } : { name: item.name }
        }
      };
    }),
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: input.companyStripeAccountId
      },
      metadata: {
        companyId: input.companyId,
        invoiceId: input.invoiceId,
        customerId: input.customerId
      }
    },
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
  const applicationFeePercent = new Decimal(env.STRIPE_PLATFORM_FEE_PERCENT)
    .mul(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();
  const subscription = await stripe.subscriptions.create({
    customer: input.stripeCustomerId,
    items: [{ price: input.stripePriceId }],
    application_fee_percent: applicationFeePercent,
    transfer_data: {
      destination: input.companyStripeAccountId
    },
    metadata: {
      companyId: input.companyId,
      planId: input.planId,
      customerId: input.customerId
    }
  });

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
  const account = await stripe.accounts.retrieve(accountId);

  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted
  };
}

export async function createExpressDashboardLink(accountId: string): Promise<{ url: string }> {
  const loginLink = await stripe.accounts.createLoginLink(accountId);

  return {
    url: loginLink.url
  };
}
