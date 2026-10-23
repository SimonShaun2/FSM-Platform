export const LOYALTY_AGREEMENTS_JOB_NAMES = {
  evaluateReminderCandidates: "evaluate-loyalty-reminder-candidates"
} as const;

export type LoyaltyAgreementsJobName =
  (typeof LOYALTY_AGREEMENTS_JOB_NAMES)[keyof typeof LOYALTY_AGREEMENTS_JOB_NAMES];

export interface EvaluateLoyaltyReminderCandidatesJobData {
  companyId: string;
  importSessionId?: string;
  horizonDays?: number;
  lapsedDays?: number;
  dryRun?: boolean;
}
