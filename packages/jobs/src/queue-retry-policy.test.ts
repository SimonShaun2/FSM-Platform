import { describe, expect, it } from "vitest";

import { platformDefaultJobOptions, resolvePlatformQueueRetryPolicy } from "./queue-retry-policy.js";

describe("queue-retry-policy", () => {
  it("maps platform policy to BullMQ job options", () => {
    const policy = resolvePlatformQueueRetryPolicy();
    const options = platformDefaultJobOptions();

    expect(options.attempts).toBe(policy.attempts);
    expect(options.backoff).toEqual({
      type: policy.backoffType,
      delay: policy.backoffDelayMs
    });
  });
});
