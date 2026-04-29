"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ActionRecommendationInput,
  AiRecommendationDetail,
  ListRecommendationsQuery,
  PaginatedAiRecommendations
} from "@fsm/types";

import { api } from "@/src/lib/api";

interface RecommendationResponse {
  recommendation: AiRecommendationDetail;
}

interface DismissRecommendationInput {
  id: string;
  reason?: string;
}

interface SnoozeRecommendationInput {
  id: string;
  snoozedUntil: string;
}

function buildRecommendationQuery(filters: ListRecommendationsQuery): string {
  const params = new URLSearchParams();

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.customerId) {
    params.set("customerId", filters.customerId);
  }

  if (filters.assetId) {
    params.set("assetId", filters.assetId);
  }

  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  return params.toString();
}

function invalidateRevenueQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
    queryClient.invalidateQueries({ queryKey: ["revenue-summary"] })
  ]);
}

export function useRecommendations(filters: ListRecommendationsQuery) {
  const queryString = buildRecommendationQuery(filters);

  return useQuery({
    queryKey: ["recommendations", filters],
    queryFn: () => api.get<PaginatedAiRecommendations>(`/api/v1/ai/recommendations?${queryString}`)
  });
}

export function useRecommendation(id: string | null) {
  return useQuery({
    queryKey: ["recommendation", id],
    queryFn: () => api.get<RecommendationResponse>(`/api/v1/ai/recommendations/${id}`),
    enabled: Boolean(id)
  });
}

export function useActionRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActionRecommendationInput }) =>
      api.post<RecommendationResponse>(`/api/v1/ai/recommendations/${id}/action`, input),
    onSuccess: async () => {
      await invalidateRevenueQueries(queryClient);
    }
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: DismissRecommendationInput) =>
      api.post<RecommendationResponse>(
        `/api/v1/ai/recommendations/${id}/dismiss`,
        reason ? { reason } : {}
      ),
    onSuccess: async () => {
      await invalidateRevenueQueries(queryClient);
    }
  });
}

export function useSnoozeRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, snoozedUntil }: SnoozeRecommendationInput) =>
      api.post<RecommendationResponse>(`/api/v1/ai/recommendations/${id}/snooze`, {
        snoozedUntil
      }),
    onSuccess: async () => {
      await invalidateRevenueQueries(queryClient);
    }
  });
}
