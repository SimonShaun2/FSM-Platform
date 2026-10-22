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

vi.mock("@fsm/jobs", () => ({
  notificationsQueue: { add: vi.fn(async () => undefined) },
  aiQueue: { add: vi.fn() },
  agreementsQueue: { add: vi.fn() },
  importsQueue: { add: vi.fn() },
  invoicesQueue: { add: vi.fn() },
  webhooksQueue: { add: vi.fn() },
  redisConnection: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => "OK"),
    del: vi.fn(async () => 1)
  }
}));

type BookingServiceModule = typeof import("./booking.service.js");
type IntakeModule = typeof import("./revenue-inquiry-intake.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let bookingService: BookingServiceModule;
let intakeService: IntakeModule;
let fakeDb: FakeDbModule;

const actor = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", type: "user" as const, name: "Inbox test" };

beforeAll(async () => {
  bookingService = await import("./booking.service.js");
  intakeService = await import("./revenue-inquiry-intake.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function seedCompanyWithActor() {
  const company = fakeDb.seedCompany({ name: "Inbox Co", slug: "inbox-co" });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@inbox-co.test",
    firstName: "O",
    lastName: "wner",
    role: "owner"
  });
  return { company, userId: user.id };
}

describe("email-only inbox inquiry customer matching (FS-17 / Isaac CHANGES)", () => {
  it("creates separate customers for two email-only leads (no placeholder phone merge)", async () => {
    const { company } = seedCompanyWithActor();
    const sharedInboxFields = {
      addressLine1: "Inbox intake",
      city: "Pending",
      state: "XX",
      zip: "00000",
      customerNotes: "Need service",
      source: "direct" as const
    };

    await bookingService.createCompanyScopedInquiryBooking(
      company.id,
      {
        firstName: "alpha",
        lastName: "lead",
        phone: "",
        email: "alpha.lead@example.com",
        ...sharedInboxFields
      },
      actor
    );

    await bookingService.createCompanyScopedInquiryBooking(
      company.id,
      {
        firstName: "beta",
        lastName: "lead",
        phone: "",
        email: "beta.lead@example.com",
        ...sharedInboxFields
      },
      actor
    );

    const customers = fakeDb.getTestState().customers;
    expect(customers).toHaveLength(2);
    expect(customers.map((row) => row.email).sort()).toEqual(["alpha.lead@example.com", "beta.lead@example.com"]);
    expect(customers.every((row) => row.phone === null)).toBe(true);
  });

  it("intakeInboxInquiry does not assign placeholder phone for email channel", async () => {
    const { company, userId } = seedCompanyWithActor();

    await intakeService.intakeInboxInquiry(company.id, userId, {
      inboxChannel: "email",
      externalMessageId: "msg-001",
      fromAddress: "inbox.lead@example.com",
      subject: "Help",
      bodyText: "My AC is out",
      adapterAttributionVerified: false
    });

    await intakeService.intakeInboxInquiry(company.id, userId, {
      inboxChannel: "email",
      externalMessageId: "msg-002",
      fromAddress: "other.lead@example.com",
      subject: "Quote",
      bodyText: "Need a quote",
      adapterAttributionVerified: false
    });

    const customers = fakeDb.getTestState().customers;
    expect(customers).toHaveLength(2);
    expect(customers.some((row) => row.phone === "+10000000000")).toBe(false);
  });
});
