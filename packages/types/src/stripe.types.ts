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
