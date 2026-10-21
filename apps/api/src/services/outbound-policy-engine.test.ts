import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

import { ErrorCode } from "@fsm/types";

import { authorizeAgentActionExecution } from "./outbound-policy-engine.service.js";

type FakeDbModule = typeof import("../test-support/fake-db.js");

let fakeDb: FakeDbModule;

beforeAll(async () => {
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

describe("outbound-policy-engine (FS-13)", () => {
  it("denies cross-tenant agent execution via resource company mismatch", async () => {
    const company = fakeDb.seedCompany({ name: "Tenant A", slug: "tenant-a" });
    const booking = fakeDb.seedBookingRequest({
      companyId: company.id,
      firstName: "A",
      lastName: "B",
      phone: "5551112222",
      addressLine1: "1 St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      smsConsentAppointments: true
    });

    const decision = await authorizeAgentActionExecution({
      companyId: company.id,
      actorId: "user-1",
      actorType: "user",
      actionType: "message.send_proposed",
      parameters: { channel: "sms", workflow: "revenue.inquiry_response" },
      target: {
        contractVersion: "1.0.0",
        entityType: "booking_request",
        entityId: booking.id,
        companyId: "00000000-0000-4000-8000-0000000000aa",
        observedAt: "2026-10-10T12:00:00.000Z",
        recordVersion: "rv1:1"
      },
      requiresApproval: true,
      state: "approved"
    });

    expect(decision.allowed).toBe(false);
    expect(decision.errorCode).toBe(ErrorCode.NOT_FOUND);
    expect(decision.policyVersion).toBeTruthy();
    expect(decision.reason.length).toBeGreaterThan(0);
  });

  it("denies forged identity when asserted company disagrees with session tenant", async () => {
    const company = fakeDb.seedCompany({ name: "Tenant B", slug: "tenant-b" });

    const decision = await authorizeAgentActionExecution({
      companyId: company.id,
      actorId: "user-1",
      actorType: "user",
      assertedCompanyId: "forged-tenant",
      actionType: "message.send_proposed",
      parameters: {
        channel: "sms",
        consentScope: "appointment",
        consentSnapshot: {
          consentScope: "appointment",
          capturedAt: "2026-10-10T12:00:00.000Z",
          consentVersion: 1,
          currentConsentVersion: 1,
          appointmentOptIn: true,
          marketingOptIn: false,
          revokedAt: null
        }
      },
      target: {
        contractVersion: "1.0.0",
        entityType: "customer",
        entityId: "00000000-0000-4000-8000-000000000099",
        companyId: company.id,
        observedAt: "2026-10-10T12:00:00.000Z",
        recordVersion: "rv1:1"
      },
      requiresApproval: true,
      state: "approved"
    });

    expect(decision.allowed).toBe(false);
    expect(decision.failureCode).toBe("FORGED_IDENTITY");
    expect(decision.errorCode).toBe(ErrorCode.FORBIDDEN);
  });

  it("denies stale consent snapshots on agent execute", async () => {
    const company = fakeDb.seedCompany({ name: "Tenant C", slug: "tenant-c" });

    const decision = await authorizeAgentActionExecution({
      companyId: company.id,
      actorId: "user-1",
      actorType: "user",
      actionType: "message.send_proposed",
      parameters: {
        channel: "sms",
        consentSnapshot: {
          consentScope: "marketing",
          capturedAt: "2026-10-01T12:00:00.000Z",
          consentVersion: 1,
          currentConsentVersion: 4,
          appointmentOptIn: true,
          marketingOptIn: true,
          revokedAt: null
        }
      },
      target: {
        contractVersion: "1.0.0",
        entityType: "customer",
        entityId: "00000000-0000-4000-8000-000000000088",
        companyId: company.id,
        observedAt: "2026-10-10T12:00:00.000Z",
        recordVersion: "rv1:1"
      },
      requiresApproval: true,
      state: "approved"
    });

    expect(decision.allowed).toBe(false);
    expect(decision.failureCode).toBe("STALE_CONSENT");
    expect(decision.errorCode).toBe(ErrorCode.CONSENT_REQUIRED);
  });

  it("denies unauthorized sends when approval is still required", async () => {
    const company = fakeDb.seedCompany({ name: "Tenant D", slug: "tenant-d" });

    const decision = await authorizeAgentActionExecution({
      companyId: company.id,
      actorId: "user-1",
      actorType: "user",
      actionType: "message.send_proposed",
      parameters: {
        channel: "sms",
        consentSnapshot: {
          consentScope: "appointment",
          capturedAt: "2026-10-10T12:00:00.000Z",
          consentVersion: 2,
          currentConsentVersion: 2,
          appointmentOptIn: true,
          marketingOptIn: true,
          revokedAt: null
        }
      },
      target: {
        contractVersion: "1.0.0",
        entityType: "customer",
        entityId: "00000000-0000-4000-8000-000000000077",
        companyId: company.id,
        observedAt: "2026-10-10T12:00:00.000Z",
        recordVersion: "rv1:1"
      },
      requiresApproval: true,
      state: "awaiting_approval"
    });

    expect(decision.allowed).toBe(false);
    expect(decision.failureCode).toBe("UNAUTHORIZED_SEND");
    expect(decision.errorCode).toBe(ErrorCode.POLICY_DENIED);
  });
});
