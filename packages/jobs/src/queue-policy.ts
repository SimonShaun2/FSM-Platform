import type { BackoffOptions, JobsOptions, WorkerOptions } from "bullmq";

import { queueBaseOptions } from "./queues.js";

/** FS-81 v0.1 — bounded retries; failed jobs retained for operator replay (BullMQ `removeOnFail: false`). */
export const FSM_QUEUE_RETRY_POLICY_VERSION = "0.1.0";

export const fsmDefaultJobAttempts = 5;

export const fsmDefaultJobBackoff: BackoffOptions = {
  type: "exponential",
  delay: 5000
};

/** Keep failed jobs in Redis for dead-letter inspection and controlled replay. */
export const fsmRetainFailedJobsForDlq = true;

export const fsmDefaultWorkerConcurrency = 5;

export function buildDefaultEnqueueJobOptions(overrides: Partial<JobsOptions> = {}): JobsOptions {
  const attempts = overrides.attempts ?? fsmDefaultJobAttempts;
  const backoff = overrides.backoff ?? fsmDefaultJobBackoff;
  const removeOnFail = overrides.removeOnFail ?? (fsmRetainFailedJobsForDlq ? false : { count: 250 });

  return {
    ...overrides,
    attempts,
    backoff,
    removeOnFail
  };
}

export function buildDefaultWorkerOptions(overrides: Partial<WorkerOptions> = {}): WorkerOptions {
  return {
    ...queueBaseOptions,
    concurrency: fsmDefaultWorkerConcurrency,
    ...overrides
  };
}
