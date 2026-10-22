import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { EditAgentActionParametersInput, OperatorInboxItem } from "@fsm/types";

import { api } from "@/src/lib/api";

const operatorInboxKeys = {
  all: ["operator-inbox"] as const,
  list: (state?: string) => [...operatorInboxKeys.all, "list", state ?? "all"] as const,
  detail: (id: string) => [...operatorInboxKeys.all, "detail", id] as const
};

export function useOperatorInbox(state?: string) {
  const queryString = state ? `?state=${encodeURIComponent(state)}` : "";

  return useQuery({
    queryKey: operatorInboxKeys.list(state),
    queryFn: () => api.get<{ items: OperatorInboxItem[] }>(`/api/v1/operator/inbox${queryString}`)
  });
}

export function useOperatorInboxItem(id: string | null) {
  return useQuery({
    queryKey: id ? operatorInboxKeys.detail(id) : operatorInboxKeys.detail("pending"),
    queryFn: () => api.get<OperatorInboxItem>(`/api/v1/operator/inbox/${id}`),
    enabled: Boolean(id)
  });
}

export function useEditOperatorInboxItem(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EditAgentActionParametersInput) =>
      api.patch<OperatorInboxItem>(`/api/v1/operator/inbox/${id}`, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operatorInboxKeys.all });
    }
  });
}

export function useApproveAgentAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<OperatorInboxItem>(`/api/v1/agent-actions/${id}/approve`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operatorInboxKeys.all });
    }
  });
}

export function useRejectAgentAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<OperatorInboxItem>(`/api/v1/agent-actions/${id}/reject`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operatorInboxKeys.all });
    }
  });
}

export function useExecuteAgentAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<OperatorInboxItem>(`/api/v1/agent-actions/${id}/execute`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operatorInboxKeys.all });
    }
  });
}
