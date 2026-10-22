import { z } from "zod";

import { QUEUE_PLATFORM_CONTRACT_VERSION } from "./constants.js";

export const JobFailureClassV1Schema = z.enum(["transient", "permanent", "unknown"]);

export type JobFailureClassV1 = z.infer<typeof JobFailureClassV1Schema>;

export const QueueBackoffTypeV1Schema = z.enum(["exponential", "fixed"]);

export type QueueBackoffTypeV1 = z.infer<typeof QueueBackoffTypeV1Schema>;

export const PlatformQueueRetryPolicyV1Schema = z
  .object({
    contractVersion: z.literal(QUEUE_PLATFORM_CONTRACT_VERSION),
    attempts: z.number().int().min(1).max(25),
    backoffType: QueueBackoffTypeV1Schema,
    backoffDelayMs: z.number().int().min(100).max(3_600_000),
    removeOnComplete: z.union([z.boolean(), z.number().int().min(0)]),
    removeOnFail: z.union([z.boolean(), z.number().int().min(0)])
  })
  .strict();

export type PlatformQueueRetryPolicyV1 = z.infer<typeof PlatformQueueRetryPolicyV1Schema>;

export const DEFAULT_PLATFORM_QUEUE_RETRY_POLICY_V1: PlatformQueueRetryPolicyV1 = {
  contractVersion: QUEUE_PLATFORM_CONTRACT_VERSION,
  attempts: 5,
  backoffType: "exponential",
  backoffDelayMs: 5_000,
  removeOnComplete: 1_000,
  removeOnFail: 5_000
};

export function classifyJobFailureV1(error: unknown): JobFailureClassV1 {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "unknown";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("validation") ||
    normalized.includes("not found") ||
    normalized.includes("forbidden") ||
    normalized.includes("policy_denied")
  ) {
    return "permanent";
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("econnrefused") ||
    normalized.includes("rate limit") ||
    normalized.includes("503")
  ) {
    return "transient";
  }

  return "unknown";
}
