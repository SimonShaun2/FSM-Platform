import { describe, expect, it } from "vitest";

import {
  hasPublicApiPathTraversal,
  hasPublicApiPathTraversalInRequest,
  isPublicApiProxyPath
} from "@/src/lib/public-api-path-security";

describe("public-api-path-security", () => {
  it("identifies public API proxy paths", () => {
    expect(isPublicApiProxyPath("/api/v1/public/booking/acme-hvac")).toBe(true);
    expect(isPublicApiProxyPath("/api/v1/booking-settings")).toBe(false);
  });

  it("rejects dot-segment traversal on public API paths", () => {
    expect(hasPublicApiPathTraversal("/api/v1/public/booking/../secrets")).toBe(true);
    expect(hasPublicApiPathTraversal("/api/v1/public/booking/%2e%2e/secrets")).toBe(true);
    expect(hasPublicApiPathTraversal("/api/v1/public/booking/%2E%2E/secrets")).toBe(true);
    expect(hasPublicApiPathTraversal("/api/v1/public/booking/%252e%252e/secrets")).toBe(true);
  });

  it("detects traversal in raw request URL when pathname is normalized", () => {
    expect(
      hasPublicApiPathTraversalInRequest(
        "http://localhost:3000/api/v1/public/booking/%2e%2e/admin",
        "/api/v1/public/admin"
      )
    ).toBe(true);
  });

  it("allows normal public booking paths", () => {
    expect(hasPublicApiPathTraversal("/api/v1/public/booking/acme-hvac")).toBe(false);
  });
});
