import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { AGENT_POLICY_V1 } from "./agent-action.policy.js";
import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("./tenant-context.service.js", () => ({
  resolveEntityRef: vi.fn(async (_companyId: string, entityType: string, entityId: string) => ({
    entityType,
    entityId,
    recordVersion: "rv1:1",
    source: { channel: "web" }
  }))
}));

vi.mock("@fsm/ai/langfuse", () => ({
  recordAgentAuditObservation: vi.fn(async () => undefined)
}));

type AgentActionServiceModule = typeof import("./agent-action.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let agentActionService: AgentActionServiceModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  agentActionService = await import("./agent-action.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function seedAwaitingAction(companyId: string) {
  return fakeDb.seedAgentAction({
    companyId,
    agentProduct: "revenue",
    actionType: "message.send_proposed",
    idempotencyKey: `idem-${companyId}`,
    payloadHash: "hash-1",
    policyVersion: AGENT_POLICY_V1,
    requiresApproval: true,
    state: "awaiting_approval",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    target: {
      entityType: "booking_request",
      entityId: "booking-1",
      recordVersion: "rv1:1",
      source: { channel: "web" }
    }
  });
}

describe("agent-action.service tenant scope (FS-10)", () => {
  it("rejects cross-tenant approve attempts without mutating the action", async () => {
    const tenantA = fakeDb.seedCompany({ name: "Tenant A", slug: "tenant-a" });
    const tenantB = fakeDb.seedCompany({ name: "Tenant B", slug: "tenant-b" });
    const action = seedAwaitingAction(tenantA.id);
    const reviewer = fakeDb.seedUser({
      companyId: tenantB.id,
      email: "owner-b@example.com",
      firstName: "Bob",
      lastName: "Owner"
    });

    await expect(
      agentActionService.approveAgentAction(tenantB.id, action.id, reviewer.id)
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });

    const stored = fakeDb.getTestState().agentActions.find((row) => row.id === action.id);
    expect(stored?.state).toBe("awaiting_approval");
    expect(stored?.reviewerId).toBeNull();
  });

  it("approves when companyId matches the stored action", async () => {
    const tenant = fakeDb.seedCompany({ name: "Tenant A", slug: "tenant-a" });
    const action = seedAwaitingAction(tenant.id);
    const reviewer = fakeDb.seedUser({
      companyId: tenant.id,
      email: "owner@example.com",
      firstName: "Ava",
      lastName: "Owner"
    });

    const approved = await agentActionService.approveAgentAction(tenant.id, action.id, reviewer.id);

    expect(approved.state).toBe("approved");
    expect(approved.reviewerId).toBe(reviewer.id);

    const approvalEvent = fakeDb
      .getTestState()
      .activityEvents.find((event) => event.eventType === "agent.proposal_approved");
    const payload = approvalEvent?.payload as { audit?: Record<string, unknown> } | undefined;
    expect(payload?.audit).toMatchObject({
      auditSchemaVersion: "agent-activity-audit-v1",
      lifecycle: "proposal_approved",
      loyaltyRemindersDryRun: true
    });
  });

  it("company-scoped update predicates do not match another tenant's action id", async () => {
    const tenantA = fakeDb.seedCompany({ name: "Tenant A", slug: "tenant-a-scope" });
    const tenantB = fakeDb.seedCompany({ name: "Tenant B", slug: "tenant-b-scope" });
    const action = seedAwaitingAction(tenantA.id);

    const { agentActions: agentActionsTable, db } = fakeDb;

    await db
      .update(agentActionsTable)
      .set({ state: "approved", reviewerId: "attacker", updatedAt: new Date() })
      .where((row) => row.id === action.id && row.deletedAt === null);

    let stored = fakeDb.getTestState().agentActions.find((row) => row.id === action.id);
    expect(stored?.state).toBe("approved");

    if (stored) {
      stored.state = "awaiting_approval";
      stored.reviewerId = null;
    }

    await db
      .update(agentActionsTable)
      .set({ state: "approved", reviewerId: "safe", updatedAt: new Date() })
      .where(
        (row) => row.id === action.id && row.companyId === tenantB.id && row.deletedAt === null
      );

    stored = fakeDb.getTestState().agentActions.find((row) => row.id === action.id);
    expect(stored?.state).toBe("awaiting_approval");
    expect(stored?.reviewerId).toBeNull();
  });
});
