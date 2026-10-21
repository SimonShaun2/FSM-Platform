import { describe, expect, it } from "vitest";

import { isPublicRoute } from "./route-access";

describe("isPublicRoute", () => {
  it("treats customer estimate approval paths as public", () => {
    expect(isPublicRoute("/approve/some-approval-token")).toBe(true);
  });

  it("does not treat authenticated estimate detail paths as public", () => {
    expect(isPublicRoute("/estimates/550e8400-e29b-41d4-a716-446655440000")).toBe(false);
    expect(isPublicRoute("/estimates/new")).toBe(false);
    // Legacy public URL shape — must stay private (staff route + login), not redirected in middleware.
    expect(isPublicRoute("/estimates/legacy-approval-token-base64url")).toBe(false);
  });
});
