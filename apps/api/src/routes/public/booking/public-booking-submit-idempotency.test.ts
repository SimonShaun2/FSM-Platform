import { randomUUID } from "node:crypto";

import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { resetPublicBookingRateLimitStateForTests } from "../../../lib/public-booking-rate-limit.js";
import { setupTestEnv } from "../../../test-support/env-setup.js";

setupTestEnv();

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  notificationsQueue: {
    add: vi.fn(async () => undefined)
  },
  redisConnection: {
    del: vi.fn(async () => 0)
  }
}));

type BuildAppModule = typeof import("../../../app.js");
type FakeDbModule = typeof import("../../../test-support/fake-db.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let app: AppInstance;

function seedPublicSubmitFixture() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });

  fakeDb.seedBookingSettings({
    companyId: company.id,
    bookingSlug: "acme-hvac",
    isEnabled: true,
    autoConfirm: false
  });

  fakeDb.seedTechnician({
    companyId: company.id,
    firstName: "Taylor",
    lastName: "Tech",
    phone: "555-0101",
    serviceZipCodes: ["74103"]
  });

  return company;
}

function submitBody(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Jamie",
    lastName: "Stone",
    phone: "555-0200",
    email: "jamie@example.com",
    addressLine1: "500 Oak Ave",
    city: "Tulsa",
    state: "OK",
    zip: "74103",
    urgency: "this_week",
    preferredWindow: "afternoon",
    smsConsentAppointments: false,
    smsConsentMarketing: false,
    ...overrides
  };
}

beforeAll(async () => {
  buildAppModule = await import("../../../app.js");
  fakeDb = await import("../../../test-support/fake-db.js");
});

beforeEach(async () => {
  fakeDb.resetTestState();
  resetPublicBookingRateLimitStateForTests();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-28T14:00:00.000Z"));
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
  vi.useRealTimers();
});

describe("public booking submit idempotency (FS-38)", () => {
  it("replays the same Idempotency-Key with 200 and the same reference number", async () => {
    seedPublicSubmitFixture();
    const idempotencyKey = randomUUID();
    const body = submitBody();

    const first = await request(app.server)
      .post("/api/v1/public/booking/acme-hvac/submit?src=google")
      .set("Idempotency-Key", idempotencyKey)
      .send(body);

    const second = await request(app.server)
      .post("/api/v1/public/booking/acme-hvac/submit?src=google")
      .set("Idempotency-Key", idempotencyKey)
      .send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.bookingRequest.referenceNumber).toBe(first.body.bookingRequest.referenceNumber);
  });

  it("returns 409 when the same Idempotency-Key is reused with a different payload", async () => {
    seedPublicSubmitFixture();
    const idempotencyKey = randomUUID();

    const first = await request(app.server)
      .post("/api/v1/public/booking/acme-hvac/submit")
      .set("Idempotency-Key", idempotencyKey)
      .send(submitBody());

    const mismatch = await request(app.server)
      .post("/api/v1/public/booking/acme-hvac/submit")
      .set("Idempotency-Key", idempotencyKey)
      .send(submitBody({ phone: "555-0999" }));

    expect(first.status).toBe(201);
    expect(mismatch.status).toBe(409);
    expect(mismatch.body.error).toBe("CONFLICT");
    expect(mismatch.body.message).toMatch(/different payload/i);
    expect(mismatch.body.fields).toEqual({ reason: "idempotency_payload_mismatch" });
  });
});
