export type MaintenancePlanStatus = "active" | "paused" | "expired" | "cancelled";
export type MaintenancePlanFrequency = "monthly" | "bi_monthly" | "quarterly" | "bi_annual" | "annual";
export type ServiceAgreementBillingCycle = "monthly" | "annual";
export type ServiceAgreementStripeStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "trialing"
  | "unpaid";

export interface ServiceAgreementTemplate {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  includedServices: string[] | null;
  visitsPerYear: number;
  frequency: MaintenancePlanFrequency;
  monthlyPrice: string | null;
  annualPrice: string | null;
  stripeMthlyPriceId: string | null;
  stripeAnnualPriceId: string | null;
  sortOrder: number | null;
  isActive: boolean;
  applicableAssetTypes: string[] | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MaintenancePlan {
  id: string;
  companyId: string;
  customerId: string;
  propertyId: string | null;
  serviceAgreementTemplateId: string | null;
  name: string;
  description: string | null;
  includedServices: string[] | null;
  frequency: MaintenancePlanFrequency;
  status: MaintenancePlanStatus;
  price: string | null;
  billingCycle: ServiceAgreementBillingCycle | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodStart: Date | null;
  stripeCurrentPeriodEnd: Date | null;
  stripeCancelAtPeriodEnd: boolean | null;
  startDate: string;
  endDate: string | null;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  assetIds: string[] | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MaintenanceVisit {
  id: string;
  companyId: string;
  maintenancePlanId: string;
  jobId: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AgreementListItem {
  id: string;
  name: string;
  status: MaintenancePlanStatus;
  frequency: MaintenancePlanFrequency;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  price: string | null;
  billingCycle: ServiceAgreementBillingCycle | null;
  stripeStatus: ServiceAgreementStripeStatus | null;
  stripeCurrentPeriodEnd: Date | null;
  stripeCancelAtPeriodEnd: boolean;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}

export interface AgreementDetail {
  id: string;
  name: string;
  description: string | null;
  status: MaintenancePlanStatus;
  frequency: MaintenancePlanFrequency;
  startDate: string;
  endDate: string | null;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  price: string | null;
  billingCycle: ServiceAgreementBillingCycle | null;
  stripeStatus: ServiceAgreementStripeStatus | null;
  stripeCancelAtPeriodEnd: boolean;
  stripeCurrentPeriodEnd: Date | null;
  paymentMethodLabel: string | null;
  retryPaymentUrl: string | null;
  latestInvoiceAmountDue: string | null;
  latestInvoiceDueDate: string | null;
  includedServices: string[];
  notes: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
  property: {
    id: string;
    addressLine1: string;
    city: string;
    state: string;
  } | null;
  template: {
    id: string;
    name: string;
    visitsPerYear: number;
    frequency: MaintenancePlanFrequency;
  } | null;
  assets: Array<{
    id: string;
    name: string;
    assetType: string;
  }>;
  recentVisits: Array<{
    id: string;
    completedDate: string;
    notes: string | null;
    jobId: string | null;
  }>;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  includedServices?: string[];
  visitsPerYear: number;
  frequency: MaintenancePlanFrequency;
  monthlyPrice?: string;
  annualPrice?: string;
  applicableAssetTypes?: string[];
  sortOrder?: number;
  notes?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  includedServices?: string[];
  visitsPerYear?: number;
  frequency?: MaintenancePlanFrequency;
  monthlyPrice?: string;
  annualPrice?: string;
  applicableAssetTypes?: string[];
  sortOrder?: number;
  notes?: string;
  isActive?: boolean;
}

export interface CreateAgreementInput {
  customerId: string;
  serviceAgreementTemplateId?: string;
  propertyId?: string;
  name: string;
  description?: string;
  frequency: MaintenancePlanFrequency;
  startDate: string;
  billingEnabled?: boolean;
  billingCycle?: ServiceAgreementBillingCycle;
  assetIds?: string[];
  notes?: string;
}

export interface UpdateAgreementInput {
  name?: string;
  description?: string;
  notes?: string;
  nextServiceDate?: string;
  assetIds?: string[];
  frequency?: MaintenancePlanFrequency;
}

export interface CancelAgreementInput {
  cancelImmediately?: boolean;
  reason?: string;
}

export interface RetryAgreementPaymentResult {
  retryPaymentUrl: string;
}

export interface RecordVisitInput {
  completedDate: string;
  jobId?: string;
  notes?: string;
}

export interface ListAgreementsQuery {
  status?: MaintenancePlanStatus;
  customerId?: string;
  templateId?: string;
  search?: string;
  expiresAfter?: string;
  expiresBefore?: string;
  sortBy?: "nextServiceDate" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
