"use client";

import { useQuery } from "@tanstack/react-query";
import type { DispatchView, DispatchWorkloadRow, RevenueSummary } from "@fsm/types";

import { api } from "@/src/lib/api";

interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardJobListItem {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface DashboardCustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  lifetimeValue: string;
  totalJobs: number;
  lastServiceDate: string | null;
  doNotContact: boolean;
  createdAt: string;
}

export interface DashboardEstimateListItem {
  id: string;
  estimateNumber: string;
  title: string | null;
  status: string;
  total: string;
  subtotal: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  sentAt: string | null;
  expiresAt: string | null;
  approvedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
}

export interface DashboardInvoiceListItem {
  id: string;
  invoiceNumber: string;
  title: string | null;
  status: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  dueAt: string | null;
  paidAt: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface DashboardAgreementListItem {
  id: string;
  name: string;
  status: string;
  frequency: string;
  nextServiceDate: string | null;
  lastServiceDate: string | null;
  price: string | null;
  billingCycle: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface UnscheduledJobListItem {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  priority: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

function toQueryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

export function useRevenueSummary() {
  return useQuery({
    queryKey: ["revenue-summary"],
    queryFn: () => api.get<RevenueSummary>("/api/v1/ai/revenue-summary"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

export function useDispatchWorkload(date: string) {
  return useQuery({
    queryKey: ["dispatch-workload", date],
    queryFn: () => api.get<{ workload: DispatchWorkloadRow[] }>(`/api/v1/dispatch/workload?date=${date}`)
  });
}

export function useDispatchSnapshot(date: string) {
  return useQuery({
    queryKey: ["dispatch-snapshot", date],
    queryFn: () => api.get<DispatchView>(`/api/v1/dispatch?date=${date}`)
  });
}

export function useRecentActivity() {
  const queryString = toQueryString({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 5,
    page: 1
  });

  return useQuery({
    queryKey: ["recent-activity"],
    queryFn: () => api.get<PaginatedResponse<DashboardJobListItem>>(`/api/v1/jobs?${queryString}`),
    refetchInterval: 60 * 1000
  });
}

export function useDashboardJobs() {
  const queryString = toQueryString({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100,
    page: 1
  });

  return useQuery({
    queryKey: ["dashboard-jobs"],
    queryFn: () => api.get<PaginatedResponse<DashboardJobListItem>>(`/api/v1/jobs?${queryString}`)
  });
}

export function useDashboardCustomers() {
  const queryString = toQueryString({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100,
    page: 1
  });

  return useQuery({
    queryKey: ["dashboard-customers"],
    queryFn: () => api.get<PaginatedResponse<DashboardCustomerListItem>>(`/api/v1/customers?${queryString}`)
  });
}

export function useDashboardEstimates() {
  const queryString = toQueryString({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100,
    page: 1
  });

  return useQuery({
    queryKey: ["dashboard-estimates"],
    queryFn: () => api.get<PaginatedResponse<DashboardEstimateListItem>>(`/api/v1/estimates?${queryString}`)
  });
}

export function useDashboardInvoices() {
  const queryString = toQueryString({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100,
    page: 1
  });

  return useQuery({
    queryKey: ["dashboard-invoices"],
    queryFn: () => api.get<PaginatedResponse<DashboardInvoiceListItem>>(`/api/v1/invoices?${queryString}`)
  });
}

export function useDashboardAgreements() {
  const queryString = toQueryString({
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 100,
    page: 1
  });

  return useQuery({
    queryKey: ["dashboard-agreements"],
    queryFn: () => api.get<PaginatedResponse<DashboardAgreementListItem>>(`/api/v1/service-agreements?${queryString}`)
  });
}

export function useUnscheduledJobs() {
  return useQuery({
    queryKey: ["dashboard-unscheduled-jobs"],
    queryFn: () => api.get<{ jobs: UnscheduledJobListItem[] }>("/api/v1/jobs/unscheduled")
  });
}
