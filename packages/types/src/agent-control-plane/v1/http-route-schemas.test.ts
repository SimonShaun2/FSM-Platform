import { describe, expect, it } from "vitest";

import {
  AgentActionIdParamsV1Schema,
  CreateInquiryResponseBodyV1Schema,
  ListAgentActionsQueryV1Schema,
  ResolveEntityBodyV1Schema
} from "./http-route-schemas.js";

describe("http-route-schemas strict()", () => {
  it("rejects unknown keys on resolve entity body", () => {
    const result = ResolveEntityBodyV1Schema.safeParse({
      entityType: "job",
      entityId: "550e8400-e29b-41d4-a716-446655440000",
      extra: true
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys on inquiry response body", () => {
    const result = CreateInquiryResponseBodyV1Schema.safeParse({
      idempotencyKey: "idem-key-12345678",
      workflow: "revenue.inquiry_response"
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown query keys on agent action list", () => {
    const result = ListAgentActionsQueryV1Schema.safeParse({
      state: "awaiting_approval",
      page: "1"
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid agent action id params", () => {
    const result = AgentActionIdParamsV1Schema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000"
    });
    expect(result.success).toBe(true);
  });
});
