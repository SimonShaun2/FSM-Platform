"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompanySettings } from "@fsm/types";

import { api } from "@/src/lib/api";

export interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string;
  logoUrl: string | null;
  settings: CompanySettings;
  createdAt: string;
}

export interface UpdateCompanyInput {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  timezone?: string;
  logoUrl?: string | null;
  settings?: {
    tradingName?: string | null;
    currency?: string | null;
    notifications?: CompanySettings["notifications"];
  };
}

interface CompanyResponse {
  company: CompanyRecord;
}

const companyKeys = {
  all: ["company"] as const
};

export function useCompany() {
  return useQuery({
    queryKey: companyKeys.all,
    queryFn: () => api.get<CompanyResponse>("/api/v1/company"),
    staleTime: 60 * 1000
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCompanyInput) => api.patch<CompanyResponse>("/api/v1/company", input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all });
    }
  });
}
