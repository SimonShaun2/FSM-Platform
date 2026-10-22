import { describe, expect, it } from "vitest";

import {
  integrationProfileForTier,
  parseEnvFile,
  resolveDeploymentTier,
  validateDeploymentBoundaries
} from "./deployment-environment.js";

describe("resolveDeploymentTier", () => {
  it("defaults to development when unset", () => {
    expect(resolveDeploymentTier({})).toBe("development");
  });

  it("parses staging", () => {
    expect(resolveDeploymentTier({ RENVANI_DEPLOYMENT_TIER: "staging" })).toBe("staging");
  });
});

describe("integrationProfileForTier", () => {
  it("marks staging as non_live", () => {
    expect(integrationProfileForTier("staging")).toBe("non_live");
  });

  it("marks production as live", () => {
    expect(integrationProfileForTier("production")).toBe("live");
  });
});

describe("validateDeploymentBoundaries", () => {
  const stagingBase = {
    RENVANI_DEPLOYMENT_TIER: "staging",
    DATABASE_URL: "postgresql://localhost/renvani_staging",
    REDIS_URL: "redis://localhost:6379",
    JWT_SECRET: "staging-jwt",
    JWT_REFRESH_SECRET: "staging-refresh",
    STRIPE_SECRET_KEY: "sk_test_abc",
    R2_BUCKET_NAME: "renvani-staging"
  };

  it("accepts valid staging test Stripe key", () => {
    const result = validateDeploymentBoundaries(stagingBase);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tier).toBe("staging");
      expect(result.integrationProfile).toBe("non_live");
    }
  });

  it("rejects live Stripe key on staging", () => {
    const result = validateDeploymentBoundaries({
      ...stagingBase,
      STRIPE_SECRET_KEY: "sk_live_abc"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.code === "STRIPE_NON_LIVE_REQUIRED")).toBe(true);
    }
  });

  it("rejects production-like bucket names on staging", () => {
    const result = validateDeploymentBoundaries({
      ...stagingBase,
      R2_BUCKET_NAME: "renvani-production"
    });
    expect(result.ok).toBe(false);
  });
});

describe("parseEnvFile", () => {
  it("ignores comments and parses key/value pairs", () => {
    const parsed = parseEnvFile(`
# comment
RENVANI_DEPLOYMENT_TIER=staging
STRIPE_SECRET_KEY="sk_test_x"
`);
    expect(parsed.RENVANI_DEPLOYMENT_TIER).toBe("staging");
    expect(parsed.STRIPE_SECRET_KEY).toBe("sk_test_x");
  });
});
