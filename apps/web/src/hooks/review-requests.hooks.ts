"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CompleteReviewRequestInput,
  CreateReviewRequestInput,
  ListReviewRequestsQuery,
  ReviewRequestChannel,
  ReviewRequestFunnelStats,
  ReviewRequestSettings,
  ReviewRequestStatus
} from "@fsm/types";

import { api } from "@/src/lib/api";
import { useBookingSettings, useUpdateBookingSettings, type BookingSettingsRecord } from "@/src/hooks/booking.hooks";

export interface ReviewRequestListRecord {
  id: string;
  referenceId: string;
  status: ReviewRequestStatus;
  channel: ReviewRequestChannel;
  sentAt: string | null;
  completedAt: string | null;
  rating: number | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
  technician: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  job: {
    id: string;
    jobNumber: string;
    title: string;
  } | null;
  createdAt: string;
}

export interface ReviewStatsRecord {
  requestsSent: number;
  clickedLink: number;
  reviewsLeft: number;
  averageRating: number | null;
  clickRate: number;
  completionRate: number;
  raw: ReviewRequestFunnelStats;
}

export interface PublicReviewRecord {
  reviewRequestId: string;
  companyName: string;
  technicianName: string | null;
  status: ReviewRequestStatus;
  reviewUrl: string | null;
  expiresAt: string | null;
  settings: ReviewRequestSettings;
  reviewLinks: {
    google: string | null;
    yelp: string | null;
    facebook: string | null;
    custom: string | null;
  };
}

interface PaginatedResponse<TItem> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ReviewRequestsResponse extends PaginatedResponse<ReviewRequestListRecord> {
  stats: ReviewRequestFunnelStats;
}

interface ReviewRequestMutationRecord {
  id: string;
  companyId: string;
  jobId: string | null;
  customerId: string;
  technicianId: string | null;
  referenceId: string;
  status: ReviewRequestStatus;
  channel: ReviewRequestChannel;
  reviewUrl: string | null;
  sentAt: string | null;
  clickedAt: string | null;
  completedAt: string | null;
  rating: number | null;
  reviewText: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface ReviewRequestResponse {
  reviewRequest: ReviewRequestMutationRecord;
}

interface PublicReviewResponse {
  review: PublicReviewRecord;
}

function buildQueryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}

function mapStats(stats: ReviewRequestFunnelStats): ReviewStatsRecord {
  const requestsSent = stats.sent + stats.clicked + stats.completed + stats.declined;
  const clickedLink = stats.clicked + stats.completed;
  const reviewsLeft = stats.completed;
  const clickRate = requestsSent > 0 ? Math.round((clickedLink / requestsSent) * 100) : 0;
  const completionRate = clickedLink > 0 ? Math.round((reviewsLeft / clickedLink) * 100) : 0;

  return {
    requestsSent,
    clickedLink,
    reviewsLeft,
    averageRating: stats.averageRating,
    clickRate,
    completionRate,
    raw: stats
  };
}

const reviewRequestKeys = {
  all: ["review-requests"] as const,
  list: (query: ListReviewRequestsQuery) => ["review-requests", "list", query] as const,
  stats: ["review-requests", "stats"] as const,
  publicReview: (token: string) => ["review-requests", "public", token] as const
};

async function invalidateReviewRequestQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: reviewRequestKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["jobs"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["customers"] })
  ]);
}

export function useReviewRequests(query: ListReviewRequestsQuery) {
  const queryString = buildQueryString({
    status: query.status,
    channel: query.channel,
    page: query.page,
    limit: query.limit
  });

  return useQuery({
    queryKey: reviewRequestKeys.list(query),
    queryFn: () => api.get<ReviewRequestsResponse>(`/api/v1/review-requests?${queryString}`)
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: reviewRequestKeys.stats,
    queryFn: async () => {
      const response = await api.get<ReviewRequestsResponse>("/api/v1/review-requests?page=1&limit=25");
      return mapStats(response.stats);
    },
    staleTime: 60 * 1000
  });
}

export function useResendReviewRequest(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<ReviewRequestResponse>(`/api/v1/review-requests/${requestId}/resend`, {}),
    onSuccess: async () => {
      await invalidateReviewRequestQueries(queryClient);
    }
  });
}

export function useSendReviewRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, channel }: { jobId: string; channel?: CreateReviewRequestInput["channel"] }) =>
      api.post<ReviewRequestResponse>(`/api/v1/jobs/${jobId}/review-request`, {
        ...(channel ? { channel } : {})
      }),
    onSuccess: async () => {
      await invalidateReviewRequestQueries(queryClient);
    }
  });
}

export function useReviewSettings() {
  return useBookingSettings();
}

export function useUpdateReviewSettings() {
  return useUpdateBookingSettings();
}

export function usePublicReview(token: string | null) {
  return useQuery({
    queryKey: token ? reviewRequestKeys.publicReview(token) : reviewRequestKeys.publicReview("pending"),
    queryFn: () => api.get<PublicReviewResponse>(`/api/v1/public/reviews/${token}`),
    enabled: Boolean(token),
    retry: false
  });
}

export function useCompleteReview(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompleteReviewRequestInput) =>
      api.post<ReviewRequestResponse>(`/api/v1/public/reviews/${token}/complete`, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reviewRequestKeys.publicReview(token) }),
        invalidateReviewRequestQueries(queryClient)
      ]);
    }
  });
}

export type { BookingSettingsRecord };
