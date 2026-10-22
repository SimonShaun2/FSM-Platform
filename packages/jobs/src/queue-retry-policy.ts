import type { JobsOptions } from "bullmq";

import {
  DEFAULT_PLATFORM_QUEUE_RETRY_POLICY_V1,
  type PlatformQueueRetryPolicyV1,
  PlatformQueueRetryPolicyV1Schema
} from "@fsm/types";

export function resolvePlatformQueueRetryPolicy(
  override?: Partial<PlatformQueueRetryPolicyV1>
): PlatformQueueRetryPolicyV1 {
  return PlatformQueueRetryPolicyV1Schema.parse({
    ...DEFAULT_PLATFORM_QUEUE_RETRY_POLICY_V1,
    ...override
  });
}

export function toBullMqJobOptions(policy: PlatformQueueRetryPolicyV1): Pick<
  JobsOptions,
  "attempts" | "backoff" | "removeOnComplete" | "removeOnFail"
> {
  return {
    attempts: policy.attempts,
    backoff: {
      type: policy.backoffType,
      delay: policy.backoffDelayMs
    },
    removeOnComplete: policy.removeOnComplete,
    removeOnFail: policy.removeOnFail
  };
}

export function platformDefaultJobOptions(
  override?: Partial<PlatformQueueRetryPolicyV1>
): JobsOptions {
  return toBullMqJobOptions(resolvePlatformQueueRetryPolicy(override));
}
