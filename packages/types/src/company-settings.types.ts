export interface NotificationChannelPreferences {
  email: boolean;
  sms: boolean;
}

export interface CompanyNotificationSettings {
  estimateFollowUp?: NotificationChannelPreferences | null;
  invoiceRecovery?: NotificationChannelPreferences | null;
  reviewRequest?: NotificationChannelPreferences | null;
  bookingRequest?: NotificationChannelPreferences | null;
  paymentReceived?: NotificationChannelPreferences | null;
  serviceDueAlert?: NotificationChannelPreferences | null;
}

export interface CompanyBillingSettings {
  planName?: string | null;
  billingInterval?: string | null;
  monthlyPrice?: string | null;
  seatsIncluded?: number | null;
  seatsUsed?: number | null;
  jobsThisMonth?: number | null;
  smsCreditsUsed?: number | null;
  smsCreditsLimit?: number | null;
}

export interface CompanyClerkSettings {
  organizationId?: string | null;
}

export interface CompanySettings {
  tradingName?: string | null;
  currency?: string | null;
  notifications?: CompanyNotificationSettings | null;
  billing?: CompanyBillingSettings | null;
  /** STACK-02 — maps Clerk org to tenant company */
  clerk?: CompanyClerkSettings | null;
}
