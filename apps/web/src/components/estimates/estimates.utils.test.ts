import { describe, expect, it } from "vitest";

import { buildEstimatePublicPath } from "./estimates.utils";

describe("buildEstimatePublicPath", () => {
  it("uses the dedicated public approval route (not /estimates/:token)", () => {
    expect(buildEstimatePublicPath("customer-approval-token")).toBe("/approve/customer-approval-token");
    expect(buildEstimatePublicPath("customer-approval-token")).not.toMatch(/^\/estimates\//);
  });

  it("returns null when no token is provided", () => {
    expect(buildEstimatePublicPath(null)).toBeNull();
    expect(buildEstimatePublicPath(undefined)).toBeNull();
    expect(buildEstimatePublicPath("")).toBeNull();
  });
});
