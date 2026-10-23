import { beforeEach, describe, expect, it, vi } from "vitest";

import { featureFlags } from "@fsm/config/feature-flags";

import { extractClerkOrganizationId, isClerkParallelAuthAvailable } from "./clerk-auth.js";

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn()
}));

describe("clerk-auth", () => {
  beforeEach(() => {
    delete process.env.CLERK_SECRET_KEY;
  });

  it("is disabled without secret and flag", () => {
    expect(isClerkParallelAuthAvailable()).toBe(false);
  });

  it("extracts organization id from claims", () => {
    expect(extractClerkOrganizationId({ org_id: "org_abc" })).toBe("org_abc");
    expect(extractClerkOrganizationId({ o: { id: "org_nested" } })).toBe("org_nested");
    expect(extractClerkOrganizationId({})).toBeNull();
  });

  it("requires flag when secret is set", () => {
    process.env.CLERK_SECRET_KEY = "sk_test";
    expect(isClerkParallelAuthAvailable()).toBe(featureFlags.clerkAuthParallelJwt);
  });
});
