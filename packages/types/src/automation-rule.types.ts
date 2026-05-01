export type AutomationRuleType =
  | "estimate_follow_up"
  | "estimate_declined"
  | "invoice_reminder"
  | "invoice_overdue"
  | "dormant_customer"
  | "maintenance_due"
  | "service_agreement_renewal"
  | "job_follow_up"
  | "review_request";

export interface AutomationRule {
  id: string;
  companyId: string;
  ruleType: AutomationRuleType;
  isEnabled: boolean;
  delayHours: number | null;
  thresholdDays: number | null;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UpdateAutomationRuleInput {
  isEnabled?: boolean;
  delayHours?: number | null;
  thresholdDays?: number | null;
  config?: Record<string, unknown> | null;
}
