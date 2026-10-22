import { describe, expect, it } from "vitest";

import {
  mapIsActiveToLifecycleState,
  staffAccessTokenClaimsV1Schema,
  staffSessionPrincipalV1Schema,
  STAFF_SESSION_CONTRACT_VERSION
} from "./staff-session.contract.js";

describe("staff session contract v0.1", () => {
  it("parses a staff session principal", () => {
    const parsed = staffSessionPrincipalV1Schema.parse({
      contractVersion: STAFF_SESSION_CONTRACT_VERSION,
      userId: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      role: "dispatcher",
      email: "staff@example.com",
      firstName: "Sam",
      lastName: "River"
    });

    expect(parsed.role).toBe("dispatcher");
  });

  it("parses access token claims with tokenType access", () => {
    const parsed = staffAccessTokenClaimsV1Schema.parse({
      userId: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      role: "owner",
      tokenType: "access"
    });

    expect(parsed.tokenType).toBe("access");
  });

  it("maps isActive to lifecycle states without invite semantics", () => {
    expect(mapIsActiveToLifecycleState(true)).toBe("active");
    expect(mapIsActiveToLifecycleState(false)).toBe("inactive");
  });
});
