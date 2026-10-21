import { describe, expect, it } from "vitest";

import { AppError, ErrorCode } from "@fsm/types";

import {
  assertActionAllowedForProduct,
  requiresHumanApproval
} from "./agent-action.policy.js";

describe("agent-action.policy", () => {
  it("requires approval for outbound send proposals", () => {
    expect(requiresHumanApproval("message.send_proposed")).toBe(true);
    expect(requiresHumanApproval("message.draft")).toBe(false);
  });

  it("allows AI to create send_proposed proposals", () => {
    expect(() =>
      assertActionAllowedForProduct("revenue", "message.send_proposed", "ai")
    ).not.toThrow();
  });

  it("denies unknown revenue tools", () => {
    try {
      assertActionAllowedForProduct("revenue", "invoice.charge", "user");
      expect.fail("expected policy error");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCode.POLICY_DENIED);
    }
  });
});
