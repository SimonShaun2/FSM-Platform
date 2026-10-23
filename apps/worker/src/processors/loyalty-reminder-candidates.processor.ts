import type { Job, Processor } from "bullmq";
import pino from "pino";

import { featureFlags } from "@fsm/config/feature-flags";
import {
  evaluateLoyaltyReminderCandidatesForCompany,
  syncLoyaltyReminderDryRunRecommendations
} from "@fsm/db";
import {
  LOYALTY_AGREEMENTS_JOB_NAMES,
  type EvaluateLoyaltyReminderCandidatesJobData
} from "@fsm/types";

const logger = pino({
  name: "loyalty-reminder-candidates-processor"
});

export interface LoyaltyReminderCandidatesDependencies {
  evaluateCandidates: typeof evaluateLoyaltyReminderCandidatesForCompany;
  syncDryRunRecommendations: typeof syncLoyaltyReminderDryRunRecommendations;
}

const defaultDependencies: LoyaltyReminderCandidatesDependencies = {
  evaluateCandidates: evaluateLoyaltyReminderCandidatesForCompany,
  syncDryRunRecommendations: syncLoyaltyReminderDryRunRecommendations
};

export async function processEvaluateLoyaltyReminderCandidates(
  job: Job<EvaluateLoyaltyReminderCandidatesJobData>,
  dependencies: LoyaltyReminderCandidatesDependencies = defaultDependencies
): Promise<void> {
  const companyId = job.data.companyId;

  if (!companyId) {
    logger.warn({ jobId: job.id ?? null }, "evaluate-loyalty-reminder-candidates missing companyId");
    return;
  }

  // FEATURE FLAG: loyalty-reminders-enabled — FS-72 dry-run evaluation (no customer sends)
  if (!featureFlags.loyaltyRemindersEnabled) {
    logger.info({ companyId, jobId: job.id ?? null }, "Loyalty reminders disabled; skipping candidate evaluation");
    return;
  }

  const dryRun = job.data.dryRun ?? featureFlags.loyaltyRemindersDryRun;
  const horizonDays = job.data.horizonDays ?? 14;
  const importSessionId = job.data.importSessionId ?? null;

  const candidates = await dependencies.evaluateCandidates(companyId, {
    horizonDays,
    importSessionId,
    lapsedDays: job.data.lapsedDays,
    dryRun
  });

  const syncResult = dryRun
    ? await dependencies.syncDryRunRecommendations(companyId, candidates)
    : { createdCount: 0, skippedExistingCount: 0 };

  await job.updateProgress(100);

  logger.info(
    {
      companyId,
      dryRun,
      importSessionId,
      candidateCount: candidates.length,
      createdRecommendations: syncResult.createdCount,
      skippedExisting: syncResult.skippedExistingCount,
      jobId: job.id ?? null
    },
    "evaluate-loyalty-reminder-candidates completed"
  );
}

export function createLoyaltyReminderCandidatesProcessor(
  dependencies?: LoyaltyReminderCandidatesDependencies
): Processor<Record<string, unknown>, void, string> {
  return async (job) => {
    if (job.name !== LOYALTY_AGREEMENTS_JOB_NAMES.evaluateReminderCandidates) {
      return;
    }

    await processEvaluateLoyaltyReminderCandidates(
      job as unknown as Job<EvaluateLoyaltyReminderCandidatesJobData>,
      dependencies
    );
  };
}

export const processLoyaltyReminderCandidates = createLoyaltyReminderCandidatesProcessor();
