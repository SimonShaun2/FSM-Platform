export interface StripePlatformBillingStatus {
  enabled: boolean;
  subscribed: boolean;
  status?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  checkoutAvailable: boolean;
}

export interface StripeConnectStatus {
  connected: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  stripeAccountId?: string;
  accountName?: string | null;
  payoutSchedule?: string | null;
  lastPayoutAmount?: string | null;
  lastPayoutAt?: string | null;
  platformFeePercent?: number;
}
