import jwt from "jsonwebtoken";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "@fsm/config";

import { generateBookingHoldToken } from "../../../lib/booking-hold-token.js";
import { resetPublicBookingRateLimitStateForTests } from "./rate-limit-state.js";
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

const AFTERNOON_START = "2026-04-28T12:00:00.000Z";
const AFTERNOON_END = "2026-04-28T17:00:00.000Z";
const OFF_WINDOW_START = "2026-04-28T13:00:00.000Z";
const OFF_WINDOW_END = "2026-04-28T15:00:00.000Z";

function seedPublicHoldFixture(referenceNumber = "BK-20260428-testref01") {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  fakeDb.seedBookingSettings({
    companyId: company.id,
    bookingSlug: "acme-hvac",
    isEnabled: true,
    availableDays: ["tue"],
    availableHoursStart: 8,
    availableHoursEnd: 17
  });
  const technician = fakeDb.seedTechnician({
    companyId: company.id,
    firstName: "Taylor",
    lastName: "Tech",
    phone: "555-0101",
    serviceZipCodes: ["74103"]
  });
  const booking = fakeDb.seedBookingRequest({
    companyId: company.id,
    firstName: "Jamie",
    lastName: "Stone",
    phone: "555-0200",
    addressLine1: "500 Oak Ave",
    city: "Tulsa",
    state: "OK",
    zip: "74103",
    status: "pending",
    referenceNumber
  });

  const holdToken = generateBookingHoldToken({
    companyId: company.id,
    bookingRequestId: booking.id,
    referenceNumber
  });

  return { company, technician, booking, holdToken, referenceNumber };
}

function slotHoldPath(slug: string, ref: string): string {
  return `/api/v1/public/booking/${slug}/requests/${ref}/slot-hold`;
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

describe("public booking slot-hold security", () => {
  it("returns 400 when holdToken is missing", async () => {
    const { technician, referenceNumber } = seedPublicHoldFixture();

    const response = await request(app.server)
      .post(slotHoldPath("acme-hvac", referenceNumber))
      .send({
        technicianId: technician.id,
        scheduledStart: AFTERNOON_START,
        scheduledEnd: AFTERNOON_END
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });

  it("returns 403 when hold token does not match booking reference", async () => {
    const { technician, booking, referenceNumber } = seedPublicHoldFixture();
    const wrongRefToken = generateBookingHoldToken({
      companyId: booking.companyId,
      bookingRequestId: booking.id,
      referenceNumber: "BK-OTHER-REFERENCE"
    });

    const response = await request(app.server)
      .post(slotHoldPath("acme-hvac", referenceNumber))
      .send({
        holdToken: wrongRefToken,
        technicianId: technician.id,
        scheduledStart: AFTERNOON_START,
        scheduledEnd: AFTERNOON_END
      });

    expect(response.status).toBe(403);
  });

  it("returns 401 for an expired hold token", async () => {
    const { technician, booking, referenceNumber } = seedPublicHoldFixture();
    const expiredToken = jwt.sign(
      {
        companyId: booking.companyId,
        bookingRequestId: booking.id,
        referenceNumber,
        tokenType: "booking_hold"
      },
      env.JWT_SECRET,
      { expiresIn: -60 }
    );

    const response = await request(app.server)
      .post(slotHoldPath("acme-hvac", referenceNumber))
      .send({
        holdToken: expiredToken,
        technicianId: technician.id,
        scheduledStart: AFTERNOON_START,
        scheduledEnd: AFTERNOON_END
      });

    expect(response.status).toBe(401);
  });

  it("returns 401 for a tampered hold token", async () => {
    const { technician, holdToken, referenceNumber } = seedPublicHoldFixture();
    const tampered =
      holdToken.slice(0, -1) + (holdToken.endsWith("a") ? "b" : "a");

    const response = await request(app.server)
      .post(slotHoldPath("acme-hvac", referenceNumber))
      .send({
        holdToken: tampered,
        technicianId: technician.id,
        scheduledStart: AFTERNOON_START,
        scheduledEnd: AFTERNOON_END
      });

    expect(response.status).toBe(401);
  });

  it("returns 409 when the slot is outside published availability windows", async () => {
    const { technician, holdToken, referenceNumber } = seedPublicHoldFixture();

    const response = await request(app.server)
      .post(slotHoldPath("acme-hvac", referenceNumber))
      .send({
        holdToken,
        technicianId: technician.id,
        scheduledStart: OFF_WINDOW_START,
        scheduledEnd: OFF_WINDOW_END
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("CONFLICT");
  });

  it("returns 409 when booking zip is outside the service area", async () => {
    const { technician, holdToken, referenceNumber } = seedPublicHoldFixture();
    technician.serviceZipCodes = ["99999"];

    const response = await request(app.server)
      .post(slotHoldPath("acme-hvac", referenceNumber))
      .send({
        holdToken,
        technicianId: technician.id,
        scheduledStart: AFTERNOON_START,
        scheduledEnd: AFTERNOON_END
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("CONFLICT");
  });

  it("returns 429 on the 16th slot-hold attempt for the same reference", async () => {
    const { referenceNumber } = seedPublicHoldFixture();
    const path = slotHoldPath("acme-hvac", referenceNumber);

    for (let attempt = 1; attempt <= 15; attempt += 1) {
      const response = await request(app.server).post(path).send({});
      expect(response.status).not.toBe(429);
    }

    const limited = await request(app.server).post(path).send({});
    expect(limited.status).toBe(429);
    expect(limited.body.error).toBe("RATE_LIMITED");
    expect(limited.body.message).toContain("booking reference");
  });

  it("holds a slot when token, zip, and availability are valid", async () => {
    const { technician, holdToken, referenceNumber } = seedPublicHoldFixture();

    const response = await request(app.server)
      .post(slotHoldPath("acme-hvac", referenceNumber))
      .send({
        holdToken,
        technicianId: technician.id,
        scheduledStart: AFTERNOON_START,
        scheduledEnd: AFTERNOON_END
      });

    expect(response.status).toBe(200);
    expect(response.body.bookingRequest.status).toBe("pending");
    expect(response.body.hold.scheduledStart).toBe(AFTERNOON_START);
  });
});
