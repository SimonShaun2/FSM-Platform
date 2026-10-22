import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

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

const redisDelMock = vi.hoisted(() => vi.fn(async () => 0));

vi.mock("@fsm/jobs", () => ({
  notificationsQueue: {
    add: vi.fn(async () => undefined)
  },
  redisConnection: {
    del: redisDelMock
  }
}));

type SchedulingAgentModule = typeof import("./scheduling-agent.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let schedulingAgent: SchedulingAgentModule;
let fakeDb: FakeDbModule;

const SLOT_START = "2026-05-12T13:00:00.000Z";
const SLOT_END = "2026-05-12T15:00:00.000Z";

beforeAll(async () => {
  schedulingAgent = await import("./scheduling-agent.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function seedSchedulingFixture() {
  const company = fakeDb.seedCompany({
    name: "Acme Clean",
    slug: "acme-clean",
    timezone: "America/Denver"
  });
  fakeDb.seedBookingSettings({
    companyId: company.id,
    bookingSlug: "acme-clean",
    isEnabled: true,
    availableHoursStart: 8,
    availableHoursEnd: 17,
    availableDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    slotDuration: 2,
    maxAdvanceDays: 14
  });
  const dispatcher = fakeDb.seedUser({
    companyId: company.id,
    email: "dispatch@example.com",
    firstName: "Di",
    lastName: "Spatch",
    role: "dispatcher"
  });
  const technician = fakeDb.seedTechnician({
    companyId: company.id,
    userId: dispatcher.id,
    firstName: "Tess",
    lastName: "Tech",
    phone: "555-1000",
    serviceZipCodes: ["78701"],
    skills: ["residential_cleaning"]
  });
  const booking = fakeDb.seedBookingRequest({
    companyId: company.id,
    firstName: "Jamie",
    lastName: "Rivera",
    phone: "555-0101",
    addressLine1: "1 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    serviceCategory: "residential_cleaning",
    status: "pending",
    referenceNumber: "BK-FS23-001"
  });

  return { company, dispatcher, technician, booking };
}

describe("scheduling agent options and confirmations (FS-23)", () => {
  it("returns options with company time zone, window, duration, travel buffer, and skills metadata", async () => {
    const { company, booking } = seedSchedulingFixture();

    const result = await schedulingAgent.listSchedulingOptionsForBookingRequest(company.id, booking.id, {
      startDate: "2026-05-12"
    });

    expect(result.timeZone).toBe("America/Denver");
    expect(result.options.length).toBeGreaterThan(0);
    expect(result.options[0]).toMatchObject({
      travelBufferMinutes: schedulingAgent.SCHEDULING_TRAVEL_BUFFER_MINUTES,
      skillsMatch: true
    });
    expect(result.options[0]?.durationMinutes).toBeGreaterThan(0);
    expect(result.commitmentRecorded).toBe(false);
  });

  it("returns no_open_windows when travel buffer consumes remaining capacity", async () => {
    const { company, technician, booking } = seedSchedulingFixture();
    const settings = fakeDb.getTestState().bookingSettings.find((row) => row.companyId === company.id);
    if (settings) {
      settings.maxAdvanceDays = 1;
    }

    fakeDb.seedScheduleSlot({
      companyId: company.id,
      technicianId: technician.id,
      startTime: new Date("2026-05-12T08:00:00.000Z"),
      endTime: new Date("2026-05-12T17:00:00.000Z"),
      isConfirmed: true
    });

    const result = await schedulingAgent.listSchedulingOptionsForBookingRequest(company.id, booking.id, {
      startDate: "2026-05-12"
    });

    expect(result.options).toHaveLength(0);
    expect(result.noAvailability?.code).toBe("no_open_windows");
  });

  it("returns no_skill_match when crew skills do not satisfy the booking", async () => {
    const { company, technician, booking } = seedSchedulingFixture();
    technician.skills = ["hvac"];

    const result = await schedulingAgent.listSchedulingOptionsForBookingRequest(company.id, booking.id, {
      startDate: "2026-05-12"
    });

    expect(result.options).toHaveLength(0);
    expect(result.noAvailability?.code).toBe("no_skill_match");
  });

  it("rejects confirmation without an active hold (premature commitment)", async () => {
    const { company, dispatcher, technician, booking } = seedSchedulingFixture();

    await expect(
      schedulingAgent.confirmSchedulingOptionForBookingRequest(company.id, dispatcher.id, booking.id, {
        technicianId: technician.id,
        scheduledStart: SLOT_START,
        scheduledEnd: SLOT_END
      })
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });

  it("records confirmation in Renvani SoR after a matching hold and blocks double booking", async () => {
    const { company, dispatcher, technician, booking } = seedSchedulingFixture();

    const options = await schedulingAgent.listSchedulingOptionsForBookingRequest(company.id, booking.id, {
      startDate: "2026-05-12"
    });
    const selected = options.options.find((option) => option.technicianId === technician.id);

    expect(selected).toBeDefined();

    await schedulingAgent.selectSchedulingOptionForBookingRequest(company.id, dispatcher.id, booking.id, {
      technicianId: selected!.technicianId,
      scheduledStart: selected!.scheduledStart,
      scheduledEnd: selected!.scheduledEnd
    });

    const confirmed = await schedulingAgent.confirmSchedulingOptionForBookingRequest(
      company.id,
      dispatcher.id,
      booking.id,
      {
        technicianId: selected!.technicianId,
        scheduledStart: selected!.scheduledStart,
        scheduledEnd: selected!.scheduledEnd
      }
    );

    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.jobId).toBeTruthy();

    const otherBooking = fakeDb.seedBookingRequest({
      companyId: company.id,
      firstName: "Other",
      lastName: "Guest",
      phone: "555-0199",
      addressLine1: "2 Main St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      status: "pending",
      referenceNumber: "BK-FS23-002"
    });

    await expect(
      schedulingAgent.selectSchedulingOptionForBookingRequest(company.id, dispatcher.id, otherBooking.id, {
        technicianId: selected!.technicianId,
        scheduledStart: selected!.scheduledStart,
        scheduledEnd: selected!.scheduledEnd
      })
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });
});
