import type { BackoffOptions, JobsOptions, WorkerOptions } from "bullmq";

import { QUEUE_PLATFORM_CONTRACT_VERSION } from "@fsm/types";

import {
  platformDefaultJobOptions,
  resolvePlatformQueueRetryPolicy
} from "./queue-retry-policy.js";
import { queueBaseOptions } from "./queues.js";

/** FS-81 v0.1 — aligned with `PlatformQueueRetryPolicyV1` (single enqueue default). */
export const FSM_QUEUE_RETRY_POLICY_VERSION = QUEUE_PLATFORM_CONTRACT_VERSION;

const defaultPolicy = resolvePlatformQueueRetryPolicy();

export const fsmDefaultJobAttempts = defaultPolicy.attempts;

export const fsmDefaultJobBackoff: BackoffOptions = {
  type: defaultPolicy.backoffType,
  delay: defaultPolicy.backoffDelayMs
};

/** Failed jobs stay on the source queue for replay; exhausted jobs also forward to `{queue}-dlq`. */
export const fsmRetainFailedJobsForDlq = defaultPolicy.removeOnFail === false;

export const fsmDefaultWorkerConcurrency = 5;

/** Same defaults as platform queues (`createPlatformQueue` → `platformDefaultJobOptions`). */
export function buildDefaultEnqueueJobOptions(overrides: Partial<JobsOptions> = {}): JobsOptions {
  const base = platformDefaultJobOptions();
  const removeOnFail = overrides.removeOnFail ?? base.removeOnFail;

  return {
    ...base,
    ...overrides,
    ...(removeOnFail !== undefined ? { removeOnFail } : {})
  };
}

export function buildDefaultWorkerOptions(overrides: Partial<WorkerOptions> = {}): WorkerOptions {
  return {
    ...queueBaseOptions,
    concurrency: fsmDefaultWorkerConcurrency,
    ...overrides
  };
}
