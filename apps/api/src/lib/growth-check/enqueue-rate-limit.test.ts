import { beforeEach, describe, expect, it } from "vitest";

import { setupTestEnv } from "../../test-support/env-setup.js";
import {
  GROWTH_CHECK_GLOBAL_ENQUEUE_LIMIT,
  GROWTH_CHECK_TENANT_ENQUEUE_LIMIT,
  checkGrowthCheckEnqueueRateLimits,
  resetGrowthCheckEnqueueRateLimitsForTests
} from "./enqueue-rate-limit.js";

setupTestEnv();

describe("growth-check enqueue rate limits", () => {
  beforeEach(() => {
    resetGrowthCheckEnqueueRateLimitsForTests();
  });

  it("limits global enqueue attempts", async () => {
    for (let index = 0; index < GROWTH_CHECK_GLOBAL_ENQUEUE_LIMIT; index += 1) {
      const companyId = `550e8400-e29b-41d4-a716-44665544${String(index).padStart(4, "0")}`;
      await expect(checkGrowthCheckEnqueueRateLimits(companyId)).resolves.toMatchObject({ allowed: true });
    }

    await expect(
      checkGrowthCheckEnqueueRateLimits("550e8400-e29b-41d4-a716-446655449999")
    ).resolves.toMatchObject({
      allowed: false,
      scope: "global"
    });
  });

  it("limits per-tenant enqueue attempts", async () => {
    const companyId = "550e8400-e29b-41d4-a716-446655440000";

    for (let index = 0; index < GROWTH_CHECK_TENANT_ENQUEUE_LIMIT; index += 1) {
      await expect(checkGrowthCheckEnqueueRateLimits(companyId)).resolves.toMatchObject({ allowed: true });
    }

    await expect(checkGrowthCheckEnqueueRateLimits(companyId)).resolves.toMatchObject({
      allowed: false,
      scope: "tenant"
    });
  });
});
