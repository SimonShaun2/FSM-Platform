import { describe, expect, it } from "vitest";

import {
  classifyJobFailureV1,
  DEFAULT_PLATFORM_QUEUE_RETRY_POLICY_V1,
  PlatformQueueRetryPolicyV1Schema
} from "./retry-policy.js";
import { DeadLetterJobEnvelopeV1Schema } from "./dead-letter.js";
import { QUEUE_PLATFORM_CONTRACT_VERSION } from "./constants.js";

describe("queue-platform v0.1", () => {
  it("parses default retry policy", () => {
    const parsed = PlatformQueueRetryPolicyV1Schema.parse(DEFAULT_PLATFORM_QUEUE_RETRY_POLICY_V1);
    expect(parsed.attempts).toBe(5);
  });

  it("classifies validation failures as permanent", () => {
    expect(classifyJobFailureV1(new Error("VALIDATION_ERROR: bad field"))).toBe("permanent");
  });

  it("parses dead-letter envelope", () => {
    const parsed = DeadLetterJobEnvelopeV1Schema.parse({
      contractVersion: QUEUE_PLATFORM_CONTRACT_VERSION,
      sourceQueue: "notifications",
      sourceJobId: "job-1",
      jobName: "send-sms",
      payload: { companyId: "11111111-1111-4111-8111-111111111111" },
      attemptsMade: 5,
      failedAt: "2026-10-22T12:00:00.000Z",
      failureClass: "transient",
      errorMessage: "timeout"
    });

    expect(parsed.sourceQueue).toBe("notifications");
  });
});
