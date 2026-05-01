"use client";

import { useMemo } from "react";
import type {
  CreateTechnicianInput,
  TechnicianAvailableDay,
  TechnicianStatus,
  UpdateTechnicianInput
} from "@fsm/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/stores/auth.store";

interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TechnicianListQueryInput {
  status?: TechnicianStatus;
  page?: number;
  limit?: number;
  sortBy?: "firstName" | "totalJobsCompleted" | "createdAt";
  sortOrder?: "asc" | "desc";
  enabled?: boolean;
}

export interface TechnicianListRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  skills: string[];
  serviceZipCodes: string[];
  availableDays: TechnicianAvailableDay[];
  status: TechnicianStatus;
  calendarColor: string;
  hoursPerDay: string;
  totalJobsCompleted: number;
  userId: string | null;
  createdAt: string;
}

export interface TechnicianDetailRecord extends TechnicianListRecord {
  serviceAreaIds: string[];
  notes: string | null;
  avgJobDurationMinutes: number | null;
  estimateCloseRate: string | null;
  avgTicketValue: string | null;
  todayJobCount: number;
  activeJobCount: number;
}

export interface TechnicianTimeEntryRecord {
  id: string;
  companyId: string;
  jobId: string | null;
  technicianId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  entryType: "travel" | "on_site" | "break";
  notes: string | null;
  travelFromAddress: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TechnicianPerformanceRecord {
  technicianId: string;
  totalJobsCompleted: number;
  avgJobDurationMinutes: number | null;
  estimateCloseRate: string | null;
  avgTicketValue: string | null;
  last30Days: {
    jobsCompleted: number;
    revenue: string;
    avgTicket: string;
  };
}

export interface TechnicianAvailabilityDayRecord {
  date: string;
  totalBookedMinutes: number;
  availableMinutes: number;
  slots: Array<{
    id: string;
    jobId: string | null;
    isBlockedTime: boolean;
    blockReason: string | null;
    startTime: string;
    endTime: string;
    isConfirmed: boolean;
  }>;
}

export interface TechnicianAvailabilityRecord {
  technicianId: string;
  startDate: string;
  endDate: string;
  days: TechnicianAvailabilityDayRecord[];
}

export interface TechnicianRecentJobRecord {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  scheduledStart: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  invoiceTotal: string | null;
  rating: number | null;
}

export interface TechnicianStatsRecord {
  jobsThisMonth: number;
  averageRating: number | null;
  reviewCount: number;
  revenueGenerated: string;
  utilization: number;
  estimateConversion: number;
}

interface TechnicianResponse {
  technician: TechnicianDetailRecord;
}

interface TechnicianTimeResponse extends PaginatedResponse<TechnicianTimeEntryRecord> {}

interface TechnicianPerformanceResponse {
  performance: TechnicianPerformanceRecord;
}

interface TechnicianAvailabilityResponse {
  availability: TechnicianAvailabilityRecord;
}

interface ReviewRequestListResponse {
  data: Array<{
    id: string;
    rating: number | null;
    technician: {
      id: string;
    } | null;
    job: {
      id: string;
    } | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface JobListResponse {
  data: Array<{
    id: string;
    jobNumber: string;
    title: string;
    status: string;
    scheduledStart: string | null;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string | null;
    };
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface JobDetailResponse {
  job: {
    id: string;
    invoiceTotal: string | null;
  };
}

const technicianKeys = {
  all: ["technicians"] as const,
  list: (query: TechnicianListQueryInput) => ["technicians", "list", query] as const,
  detail: (technicianId: string) => ["technicians", "detail", technicianId] as const,
  time: (technicianId: string) => ["technicians", "time", technicianId] as const,
  performance: (technicianId: string) => ["technicians", "performance", technicianId] as const,
  availability: (technicianId: string, startDate: string, endDate: string) =>
    ["technicians", "availability", technicianId, startDate, endDate] as const,
  stats: (technicianId: string) => ["technicians", "stats", technicianId] as const,
  recentJobs: (technicianId: string) => ["technicians", "recent-jobs", technicianId] as const
};

function buildTechnicianListQuery(query: TechnicianListQueryInput) {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 100),
    sortBy: query.sortBy ?? "firstName",
    sortOrder: query.sortOrder ?? "asc"
  });

  if (query.status) {
    params.set("status", query.status);
  }

  return params.toString();
}

function getMonthDateRange() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const endDate = today.toISOString().slice(0, 10);

  return { startDate, endDate };
}

function parseEstimateConversion(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function calculateUtilization(days: TechnicianAvailabilityDayRecord[]) {
  const totals = days.reduce(
    (sum, day) => {
      sum.booked += day.totalBookedMinutes;
      sum.available += day.availableMinutes;
      return sum;
    },
    { booked: 0, available: 0 }
  );
  const capacity = totals.booked + totals.available;

  if (capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((totals.booked / capacity) * 100)));
}

async function invalidateTechnicianQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  technicianId?: string
) {
  await queryClient.invalidateQueries({ queryKey: technicianKeys.all });
  await queryClient.invalidateQueries({ queryKey: ["jobs"] });

  if (technicianId) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: technicianKeys.detail(technicianId) }),
      queryClient.invalidateQueries({ queryKey: technicianKeys.time(technicianId) }),
      queryClient.invalidateQueries({ queryKey: technicianKeys.performance(technicianId) }),
      queryClient.invalidateQueries({ queryKey: technicianKeys.stats(technicianId) }),
      queryClient.invalidateQueries({ queryKey: technicianKeys.recentJobs(technicianId) })
    ]);
  }
}

export function useTechnicians(query: TechnicianListQueryInput = {}) {
  const queryString = buildTechnicianListQuery(query);

  return useQuery({
    queryKey: technicianKeys.list(query),
    queryFn: () => api.get<PaginatedResponse<TechnicianListRecord>>(`/api/v1/technicians?${queryString}`),
    staleTime: 60 * 1000,
    enabled: query.enabled ?? true
  });
}

export function useCurrentTechnician() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const email = useAuthStore((state) => state.user?.email ?? null);
  const query = useTechnicians({ status: "active", page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });

  const technician = useMemo(() => {
    const technicians = query.data?.data ?? [];

    return (
      technicians.find((item) => item.userId === userId) ??
      technicians.find((item) => item.email && item.email === email) ??
      null
    );
  }, [email, query.data, userId]);

  return {
    ...query,
    technician
  };
}

export function useTechnician(technicianId: string | null) {
  return useQuery({
    queryKey: technicianId ? technicianKeys.detail(technicianId) : technicianKeys.detail("pending"),
    queryFn: () => api.get<TechnicianResponse>(`/api/v1/technicians/${technicianId}`),
    enabled: Boolean(technicianId)
  });
}

export const useTechnicianDetail = useTechnician;

export function useTechnicianTime(technicianId: string | null) {
  return useQuery({
    queryKey: technicianId ? technicianKeys.time(technicianId) : technicianKeys.time("pending"),
    queryFn: () => api.get<TechnicianTimeResponse>(`/api/v1/technicians/${technicianId}/time?page=1&limit=50`),
    enabled: Boolean(technicianId)
  });
}

export function useTechnicianPerformance(technicianId: string | null) {
  return useQuery({
    queryKey: technicianId ? technicianKeys.performance(technicianId) : technicianKeys.performance("pending"),
    queryFn: () => api.get<TechnicianPerformanceResponse>(`/api/v1/technicians/${technicianId}/performance`),
    enabled: Boolean(technicianId)
  });
}

export function useTechnicianAvailability(technicianId: string | null) {
  const { startDate, endDate } = useMemo(() => getMonthDateRange(), []);

  return useQuery({
    queryKey: technicianId
      ? technicianKeys.availability(technicianId, startDate, endDate)
      : technicianKeys.availability("pending", startDate, endDate),
    queryFn: () =>
      api.get<TechnicianAvailabilityResponse>(
        `/api/v1/technicians/${technicianId}/availability?startDate=${startDate}&endDate=${endDate}`
      ),
    enabled: Boolean(technicianId)
  });
}

export function useTechnicianRecentJobs(technicianId: string | null) {
  return useQuery({
    queryKey: technicianId ? technicianKeys.recentJobs(technicianId) : technicianKeys.recentJobs("pending"),
    enabled: Boolean(technicianId),
    queryFn: async () => {
      const [jobsResponse, reviewsResponse] = await Promise.all([
        api.get<JobListResponse>(
          `/api/v1/jobs?technicianId=${technicianId}&page=1&limit=4&sortBy=scheduledStart&sortOrder=desc`
        ),
        api.get<ReviewRequestListResponse>("/api/v1/review-requests?page=1&limit=100&status=completed")
      ]);

      const jobDetails = await Promise.all(
        jobsResponse.data.map((job) => api.get<JobDetailResponse>(`/api/v1/jobs/${job.id}`))
      );
      const ratingByJobId = new Map(
        reviewsResponse.data
          .filter((item) => item.job?.id)
          .map((item) => [item.job?.id as string, item.rating])
      );

      return jobsResponse.data.map((job, index) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        title: job.title,
        status: job.status,
        scheduledStart: job.scheduledStart,
        customer: job.customer,
        invoiceTotal: jobDetails[index]?.job.invoiceTotal ?? null,
        rating: ratingByJobId.get(job.id) ?? null
      })) satisfies TechnicianRecentJobRecord[];
    }
  });
}

export function useTechStats(technicianId: string | null) {
  const technicianQuery = useTechnician(technicianId);
  const performanceQuery = useTechnicianPerformance(technicianId);
  const availabilityQuery = useTechnicianAvailability(technicianId);
  const reviewsQuery = useQuery({
    queryKey: technicianId ? ["technicians", "reviews", technicianId] : ["technicians", "reviews", "pending"],
    enabled: Boolean(technicianId),
    queryFn: () => api.get<ReviewRequestListResponse>("/api/v1/review-requests?page=1&limit=100&status=completed")
  });

  const data = useMemo<TechnicianStatsRecord | null>(() => {
    if (
      !technicianQuery.data?.technician ||
      !performanceQuery.data?.performance ||
      !availabilityQuery.data?.availability ||
      !reviewsQuery.data
    ) {
      return null;
    }

    const reviews = reviewsQuery.data.data.filter(
      (item) => item.technician?.id === technicianId && typeof item.rating === "number"
    );
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? Number((reviews.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / reviewCount).toFixed(1))
        : null;

    return {
      jobsThisMonth: performanceQuery.data.performance.last30Days.jobsCompleted,
      averageRating,
      reviewCount,
      revenueGenerated: performanceQuery.data.performance.last30Days.revenue,
      utilization: calculateUtilization(availabilityQuery.data.availability.days),
      estimateConversion: parseEstimateConversion(
        technicianQuery.data.technician.estimateCloseRate ?? performanceQuery.data.performance.estimateCloseRate
      )
    };
  }, [
    availabilityQuery.data,
    performanceQuery.data,
    reviewsQuery.data,
    technicianId,
    technicianQuery.data
  ]);

  return {
    data,
    isLoading:
      technicianQuery.isLoading ||
      performanceQuery.isLoading ||
      availabilityQuery.isLoading ||
      reviewsQuery.isLoading,
    isError:
      technicianQuery.isError ||
      performanceQuery.isError ||
      availabilityQuery.isError ||
      reviewsQuery.isError
  };
}

export function useUpdateTechnician(technicianId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTechnicianInput) =>
      api.patch<TechnicianResponse>(`/api/v1/technicians/${technicianId}`, input),
    onSuccess: async () => {
      await invalidateTechnicianQueries(queryClient, technicianId);
    }
  });
}

export function useUpdateTechSchedule(technicianId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { hoursPerDay: number; availableDays: TechnicianAvailableDay[] }) =>
      api.patch<TechnicianResponse>(`/api/v1/technicians/${technicianId}`, input),
    onSuccess: async () => {
      await invalidateTechnicianQueries(queryClient, technicianId);
    }
  });
}

export function useUpdateTechServiceAreas(technicianId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceZipCodes: string[]) =>
      api.patch<TechnicianResponse>(`/api/v1/technicians/${technicianId}/service-areas`, { serviceZipCodes }),
    onSuccess: async () => {
      await invalidateTechnicianQueries(queryClient, technicianId);
    }
  });
}

export const useUpdateTechnicianServiceAreas = useUpdateTechServiceAreas;

export function useInviteTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTechnicianInput) =>
      api.post<TechnicianResponse>("/api/v1/technicians", input),
    onSuccess: async () => {
      await invalidateTechnicianQueries(queryClient);
    }
  });
}

export function useDeactivateTechnician(technicianId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.patch<TechnicianResponse>(`/api/v1/technicians/${technicianId}`, { status: "inactive" }),
    onSuccess: async () => {
      await invalidateTechnicianQueries(queryClient, technicianId);
    }
  });
}
