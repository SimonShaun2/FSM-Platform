import { describe, expect, it } from "vitest";

import { buildRecordVersionV1 } from "./entity-ref.js";
import {
  AgentActionProposalV1Schema,
  CreateAgentActionProposalV1Schema,
  parseCreateAgentActionProposalV1
} from "./agent-action-proposal.js";
import { AgentQueueEnvelopeV1Schema } from "./queue-envelope.js";
import { TenantContextV1Schema } from "./tenant-context.js";
import { CanonicalEntityRefV1Schema } from "./entity-ref.schema.js";

const companyId = "11111111-1111-4111-8111-111111111111";
const entityId = "22222222-2222-4222-8222-222222222222";
const proposalId = "33333333-3333-4333-8333-333333333333";
const updatedAt = new Date("2026-10-20T12:00:00.000Z");

function sampleEntityRef() {
  return {
    contractVersion: "1.0.0" as const,
    entityType: "job" as const,
    entityId,
    companyId,
    observedAt: updatedAt.toISOString(),
    recordVersion: buildRecordVersionV1("job", entityId, updatedAt)
  };
}

describe("TenantContextV1Schema", () => {
  it("accepts a valid tenant context", () => {
    const parsed = TenantContextV1Schema.parse({
      contractVersion: "1.0.0",
      companyId,
      timezone: "America/Chicago",
      actor: { type: "ai", agentProduct: "revenue" },
      policyVersion: "agent-policy-v1"
    });
    expect(parsed.companyId).toBe(companyId);
  });
});

describe("CanonicalEntityRefV1Schema", () => {
  it("rejects invalid recordVersion tokens", () => {
    const result = CanonicalEntityRefV1Schema.safeParse({
      ...sampleEntityRef(),
      recordVersion: "not-rv1"
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateAgentActionProposalV1Schema", () => {
  it("parses context.resolve create payloads", () => {
    const input = {
      contractVersion: "1.0.0",
      companyId,
      agentProduct: "revenue",
      actionType: "context.resolve",
      parameters: { entityType: "job", entityId },
      target: sampleEntityRef(),
      sourceEventIds: [],
      idempotencyKey: "idem-1",
      policyVersion: "agent-policy-v1",
      requiresApproval: false,
      expiresAt: "2026-10-21T12:00:00.000Z"
    };
    expect(parseCreateAgentActionProposalV1(input).actionType).toBe("context.resolve");
  });

  it("rejects unknown actionType", () => {
    const result = CreateAgentActionProposalV1Schema.safeParse({
      contractVersion: "1.0.0",
      companyId,
      agentProduct: "revenue",
      actionType: "message.send",
      parameters: {},
      target: sampleEntityRef(),
      sourceEventIds: [],
      idempotencyKey: "k",
      policyVersion: "agent-policy-v1",
      requiresApproval: true,
      expiresAt: "2026-10-21T12:00:00.000Z"
    });
    expect(result.success).toBe(false);
  });

  it("rejects parameter shape mismatch for actionType", () => {
    const result = CreateAgentActionProposalV1Schema.safeParse({
      contractVersion: "1.0.0",
      companyId,
      agentProduct: "revenue",
      actionType: "message.draft",
      parameters: { entityType: "job", entityId },
      target: sampleEntityRef(),
      sourceEventIds: [],
      idempotencyKey: "k",
      policyVersion: "agent-policy-v1",
      requiresApproval: false,
      expiresAt: "2026-10-21T12:00:00.000Z"
    });
    expect(result.success).toBe(false);
  });
});

describe("AgentActionProposalV1Schema", () => {
  it("parses a full message.draft proposal", () => {
    const parsed = AgentActionProposalV1Schema.parse({
      contractVersion: "1.0.0",
      id: proposalId,
      companyId,
      agentProduct: "service",
      actionType: "message.draft",
      parameters: { channel: "sms", body: "Hello" },
      target: sampleEntityRef(),
      sourceEventIds: [],
      idempotencyKey: "idem-2",
      policyVersion: "agent-policy-v1",
      requiresApproval: false,
      expiresAt: "2026-10-21T12:00:00.000Z",
      state: "proposed"
    });
    expect(parsed.state).toBe("proposed");
  });
});

describe("AgentQueueEnvelopeV1Schema", () => {
  it("requires companyId and idempotencyKey", () => {
    const result = AgentQueueEnvelopeV1Schema.safeParse({
      contractVersion: "1.0.0",
      proposalId,
      idempotencyKey: "worker-1"
    });
    expect(result.success).toBe(false);
  });
});
