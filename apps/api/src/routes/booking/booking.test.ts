import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  aiQueue: {
    add: vi.fn()
  },
  invoicesQueue: {
    add: vi.fn()
  },
  notificationsQueue: {
    add: vi.fn()
  }
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;

beforeAll(async () => {
  buildAppModule = await import("../../app.js");
  fakeDb = await import("../../test-support/fake-db.js");
  tokens = await import("../../lib/tokens.js");
});

beforeEach(async () => {
  fakeDb.resetTestState();
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function createAuthContext(role: "owner" | "admin" | "dispatcher" = "owner") {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}@example.com`,
    firstName: "Ava",
    lastName: "Stone",
    role
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return {
    company,
    user,
    authorization: `Bearer ${accessToken}`
  };
}

describe("booking settings routes", () => {
  it("GET /booking-settings/check-slug validates uniqueness across companies", async () => {
    const owner = createAuthContext("owner");
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac",
      timezone: "America/Chicago"
    });

    fakeDb.seedBookingSettings({
      companyId: otherCompany.id,
      bookingSlug: "busy-schedule"
    });

    const availableResponse = await request(app.server)
      .get("/api/v1/booking-settings/check-slug?slug=acme-booking")
      .set("Authorization", owner.authorization);

    const takenResponse = await request(app.server)
      .get("/api/v1/booking-settings/check-slug?slug=busy-schedule")
      .set("Authorization", owner.authorization);

    expect(availableResponse.status).toBe(200);
    expect(availableResponse.body.available).toBe(true);
    expect(availableResponse.body.slug).toBe("acme-booking");
    expect(takenResponse.status).toBe(200);
    expect(takenResponse.body.available).toBe(false);
  });

  it("PATCH /booking-settings saves appearance and review-link settings", async () => {
    const dispatcher = createAuthContext("dispatcher");

    const response = await request(app.server)
      .patch("/api/v1/booking-settings")
      .set("Authorization", dispatcher.authorization)
      .send({
        bookingSlug: "acme-booking",
        tagline: "Book the right tech without the callback chaos.",
        customReviewUrl: "https://reviews.example.com/acme",
        notificationEmail: "dispatch@acme.example"
      });

    expect(response.status).toBe(200);
    expect(response.body.settings.bookingSlug).toBe("acme-booking");
    expect(response.body.settings.tagline).toBe("Book the right tech without the callback chaos.");
    expect(response.body.settings.customReviewUrl).toBe("https://reviews.example.com/acme");
    expect(response.body.settings.notificationEmail).toBe("dispatch@acme.example");
  });
});
