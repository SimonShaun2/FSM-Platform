"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CancelAgreementInput,
  CreateAgreementInput,
  ListAgreementsQuery,
  MaintenancePlanFrequency,
  MaintenancePlanStatus,
  RetryAgreementPaymentResult,
  ServiceAgreementBillingCycle,
  ServiceAgreementStripeStatus
} from "@fsm/types";

import { api } from "@/src/lib/api";

interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceAgreementTemplateRecord {
  id: string;
  name: string;
  description: string | null;
  visitsPerYear: number;
  frequency: MaintenancePlanFrequency;
  monthlyPrice: string | null;
  annualPrice: string | null;
  applicableAssetTypes: string[];
  sortOrder: number | null;
  isActive: boolean;
}

export interface ServiceAgreementListRecord {
  id: string;
  name: string;
  status: MaintenancePlanStatus;
  frequency: MaintenancePlanFrequency;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  price: string | null;
  billingCycle: ServiceAgreementBillingCycle | null;
  stripeStatus: ServiceAgreementStripeStatus | null;
  stripeCurrentPeriodEnd: string | null;
  stripeCancelAtPeriodEnd: boolean;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface ServiceAgreementDetailRecord {
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
  stripeCurrentPeriodEnd: string | null;
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

export interface ServiceAgreementActivityRecord {
  id: string;
  companyId: string;
  eventType: string;
  actorId: string | null;
  actorType: string | null;
  actorName: string | null;
  entityType: string;
  entityId: string;
  customerId: string | null;
  jobId: string | null;
  estimateId: string | null;
  invoiceId: string | null;
  payload: unknown;
  summary: string;
  occurredAt: string;
}

interface TemplatesResponse {
  templates: ServiceAgreementTemplateRecord[];
}

interface AgreementResponse {
  agreement: ServiceAgreementDetailRecord;
}

interface VisitsResponse {
  visits: ServiceAgreementVisitRecord[];
}

export interface ServiceAgreementVisitRecord {
  id: string;
  companyId: string;
  maintenancePlanId: string;
  jobId: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface ActivityResponse extends PaginatedResponse<ServiceAgreementActivityRecord> {}

function buildQueryString(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}

const serviceAgreementKeys = {
  all: ["service-agreements"] as const,
  list: (query: ListAgreementsQuery) => ["service-agreements", "list", query] as const,
  detail: (agreementId: string) => ["service-agreements", "detail", agreementId] as const,
  templates: ["service-agreements", "templates"] as const,
  visits: (agreementId: string) => ["service-agreements", "visits", agreementId] as const,
  activity: (agreementId: string) => ["service-agreements", "activity", agreementId] as const
};

async function invalidateServiceAgreementQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  agreementId?: string
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: serviceAgreementKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["customers"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["ai-revenue"] })
  ]);

  if (agreementId) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: serviceAgreementKeys.detail(agreementId) }),
      queryClient.invalidateQueries({ queryKey: serviceAgreementKeys.visits(agreementId) }),
      queryClient.invalidateQueries({ queryKey: serviceAgreementKeys.activity(agreementId) })
    ]);
  }
}

export function useServiceAgreementTemplates() {
  return useQuery({
    queryKey: serviceAgreementKeys.templates,
    queryFn: () => api.get<TemplatesResponse>("/api/v1/service-agreements/templates"),
    staleTime: 5 * 60 * 1000
  });
}

export function useServiceAgreements(query: ListAgreementsQuery) {
  const queryString = buildQueryString({
    status: query.status,
    customerId: query.customerId,
    templateId: query.templateId,
    search: query.search,
    expiresAfter: query.expiresAfter,
    expiresBefore: query.expiresBefore,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    page: query.page,
    limit: query.limit
  });

  return useQuery({
    queryKey: serviceAgreementKeys.list(query),
    queryFn: () =>
      api.get<PaginatedResponse<ServiceAgreementListRecord>>(
        `/api/v1/service-agreements?${queryString}`
      )
  });
}

export function useServiceAgreement(agreementId: string | null) {
  return useQuery({
    queryKey: agreementId
      ? serviceAgreementKeys.detail(agreementId)
      : serviceAgreementKeys.detail("pending"),
    queryFn: () => api.get<AgreementResponse>(`/api/v1/service-agreements/${agreementId}`),
    enabled: Boolean(agreementId)
  });
}

export function useServiceAgreementVisits(agreementId: string | null) {
  return useQuery({
    queryKey: agreementId
      ? serviceAgreementKeys.visits(agreementId)
      : serviceAgreementKeys.visits("pending"),
    queryFn: () => api.get<VisitsResponse>(`/api/v1/service-agreements/${agreementId}/visits`),
    enabled: Boolean(agreementId)
  });
}

export function useServiceAgreementActivity(agreementId: string | null) {
  return useQuery({
    queryKey: agreementId
      ? serviceAgreementKeys.activity(agreementId)
      : serviceAgreementKeys.activity("pending"),
    queryFn: () =>
      api.get<ActivityResponse>(
        `/api/v1/activity-events?entityType=maintenance_plan&entityId=${agreementId}&page=1&limit=100`
      ),
    enabled: Boolean(agreementId)
  });
}

export function useCreateServiceAgreement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAgreementInput) =>
      api.post<AgreementResponse>("/api/v1/service-agreements", input),
    onSuccess: async (response) => {
      await invalidateServiceAgreementQueries(queryClient, response.agreement.id);
    }
  });
}

export function useCancelServiceAgreement(agreementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CancelAgreementInput) =>
      api.post<AgreementResponse>(`/api/v1/service-agreements/${agreementId}/cancel`, input),
    onSuccess: async () => {
      await invalidateServiceAgreementQueries(queryClient, agreementId);
    }
  });
}

export function usePauseServiceAgreement(agreementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<AgreementResponse>(`/api/v1/service-agreements/${agreementId}/pause`, {}),
    onSuccess: async () => {
      await invalidateServiceAgreementQueries(queryClient, agreementId);
    }
  });
}

export function useRetryServiceAgreementPayment(agreementId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<RetryAgreementPaymentResult>(
        `/api/v1/service-agreements/${agreementId}/retry-payment`,
        {}
      ),
    onSuccess: async () => {
      await invalidateServiceAgreementQueries(queryClient, agreementId);
    }
  });
}
