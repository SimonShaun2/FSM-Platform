import { describe, expect, it } from "vitest";

import { AppError, ErrorCode } from "@fsm/types";

import { assertNonTerminalBookingRequest } from "./booking-request-guards.js";

describe("booking-request-guards", () => {
  it("allows pending status", () => {
    expect(() => assertNonTerminalBookingRequest("pending", "held")).not.toThrow();
  });

  it("blocks terminal statuses for confirm", () => {
    expect(() => assertNonTerminalBookingRequest("confirmed", "confirmed")).toThrow(AppError);
    try {
      assertNonTerminalBookingRequest("confirmed", "confirmed");
    } catch (error) {
      expect(error).toMatchObject({
        code: ErrorCode.CONFLICT,
        message: "Only pending booking requests can be confirmed"
      });
    }
  });
});
