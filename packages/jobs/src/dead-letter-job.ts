import type { Job } from "bullmq";

import {
  classifyJobFailureV1,
  DeadLetterJobEnvelopeV1Schema,
  type DeadLetterJobEnvelopeV1,
  QUEUE_PLATFORM_CONTRACT_VERSION
} from "@fsm/types";

import { DEAD_LETTER_QUEUE_SUFFIX } from "./queue-names.js";

export function buildDeadLetterQueueName(sourceQueueName: string): string {
  return `${sourceQueueName}-${DEAD_LETTER_QUEUE_SUFFIX}`;
}

function extractCompanyId(payload: Record<string, unknown>): string | undefined {
  const companyId = payload.companyId;
  return typeof companyId === "string" ? companyId : undefined;
}

export function buildDeadLetterEnvelope(
  sourceQueueName: string,
  job: Job<Record<string, unknown>>,
  error: Error
): DeadLetterJobEnvelopeV1 {
  const payload = (job.data ?? {}) as Record<string, unknown>;

  return DeadLetterJobEnvelopeV1Schema.parse({
    contractVersion: QUEUE_PLATFORM_CONTRACT_VERSION,
    sourceQueue: sourceQueueName,
    sourceJobId: String(job.id),
    jobName: job.name,
    ...(extractCompanyId(payload) ? { companyId: extractCompanyId(payload) } : {}),
    payload,
    attemptsMade: job.attemptsMade,
    failedAt: new Date().toISOString(),
    failureClass: classifyJobFailureV1(error),
    errorMessage: error.message.slice(0, 4_000)
  });
}

export function isJobExhausted(job: Job<Record<string, unknown>>): boolean {
  const maxAttempts = job.opts.attempts ?? 1;
  return job.attemptsMade >= maxAttempts;
}
