import { describe, expect, it } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";
import { generateBookingHoldToken, verifyBookingHoldToken } from "./booking-hold-token.js";

setupTestEnv();

describe("booking-hold-token", () => {
  it("round-trips hold token claims", () => {
    const payload = {
      companyId: "550e8400-e29b-41d4-a716-446655440000",
      bookingRequestId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      referenceNumber: "BK-20260512-aB3xY9zQ"
    };

    const token = generateBookingHoldToken(payload);
    const verified = verifyBookingHoldToken(token);

    expect(verified).toMatchObject(payload);
  });
});
