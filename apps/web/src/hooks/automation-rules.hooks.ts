"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AutomationRuleType } from "@fsm/types";

import { api } from "@/src/lib/api";

export interface AutomationRuleRecord {
  id: string;
  companyId: string;
  ruleType: AutomationRuleType;
  isEnabled: boolean;
  delayHours: number | null;
  thresholdDays: number | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface AutomationRulesResponse {
  rules: AutomationRuleRecord[];
}

interface AutomationRuleResponse {
  rule: AutomationRuleRecord;
}

const automationRuleKeys = {
  all: ["automation-rules"] as const
};

export function useAutomationRules() {
  return useQuery({
    queryKey: automationRuleKeys.all,
    queryFn: () => api.get<AutomationRulesResponse>("/api/v1/automation-rules"),
    staleTime: 60 * 1000
  });
}

export function useUpdateAutomationRule(ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { isEnabled: boolean }) =>
      api.patch<AutomationRuleResponse>(`/api/v1/automation-rules/${ruleId}`, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: automationRuleKeys.all });
    }
  });
}
