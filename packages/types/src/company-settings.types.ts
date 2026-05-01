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

export interface CompanySettings {
  tradingName?: string | null;
  currency?: string | null;
  notifications?: CompanyNotificationSettings | null;
  billing?: CompanyBillingSettings | null;
}
