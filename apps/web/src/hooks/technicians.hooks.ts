"use client";

import { useMemo } from "react";
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

export interface TechnicianListRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  skills: string[];
  serviceZipCodes: string[];
  status: "active" | "inactive" | "on_leave";
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

interface TechnicianResponse {
  technician: TechnicianDetailRecord;
}

interface TechnicianTimeResponse extends PaginatedResponse<TechnicianTimeEntryRecord> {}

const technicianKeys = {
  all: ["technicians"] as const,
  list: ["technicians", "list"] as const,
  detail: (technicianId: string) => ["technicians", "detail", technicianId] as const,
  time: (technicianId: string) => ["technicians", "time", technicianId] as const
};

async function invalidateTechnicianQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  technicianId?: string
) {
  await queryClient.invalidateQueries({ queryKey: technicianKeys.all });

  if (technicianId) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: technicianKeys.detail(technicianId) }),
      queryClient.invalidateQueries({ queryKey: technicianKeys.time(technicianId) })
    ]);
  }
}

export function useTechnicians() {
  return useQuery({
    queryKey: technicianKeys.list,
    queryFn: () =>
      api.get<PaginatedResponse<TechnicianListRecord>>(
        "/api/v1/technicians?status=active&page=1&limit=100&sortBy=firstName&sortOrder=asc"
      ),
    staleTime: 60 * 1000
  });
}

export function useCurrentTechnician() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const email = useAuthStore((state) => state.user?.email ?? null);
  const query = useTechnicians();

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

export function useTechnicianDetail(technicianId: string | null) {
  return useQuery({
    queryKey: technicianId ? technicianKeys.detail(technicianId) : technicianKeys.detail("pending"),
    queryFn: () => api.get<TechnicianResponse>(`/api/v1/technicians/${technicianId}`),
    enabled: Boolean(technicianId)
  });
}

export function useTechnicianTime(technicianId: string | null) {
  return useQuery({
    queryKey: technicianId ? technicianKeys.time(technicianId) : technicianKeys.time("pending"),
    queryFn: () => api.get<TechnicianTimeResponse>(`/api/v1/technicians/${technicianId}/time?page=1&limit=50`),
    enabled: Boolean(technicianId)
  });
}

export function useUpdateTechnicianServiceAreas(technicianId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceZipCodes: string[]) =>
      api.patch<TechnicianResponse>(`/api/v1/technicians/${technicianId}/service-areas`, { serviceZipCodes }),
    onSuccess: async () => {
      await invalidateTechnicianQueries(queryClient, technicianId);
    }
  });
}
