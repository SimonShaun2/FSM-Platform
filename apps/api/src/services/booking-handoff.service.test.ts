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

type BookingHandoffServiceModule = typeof import("./booking-handoff.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let bookingHandoffService: BookingHandoffServiceModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  bookingHandoffService = await import("./booking-handoff.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function seedPendingBooking(companyId: string) {
  return fakeDb.seedBookingRequest({
    companyId,
    firstName: "Jamie",
    lastName: "Rivera",
    phone: "555-0101",
    addressLine1: "1 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    status: "pending"
  });
}

describe("booking-handoff.service", () => {
  it("initiateBookingHandoff creates pending handoff without confirming booking", async () => {
    const company = fakeDb.seedCompany({ name: "Acme HVAC", slug: "acme-hvac" });
    const actor = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      firstName: "Ava",
      lastName: "Stone",
      role: "owner"
    });
    const booking = seedPendingBooking(company.id);

    const handoff = await bookingHandoffService.initiateBookingHandoff(company.id, actor.id, booking.id, {
      targetSystem: "ServiceTitan",
      operatorNotes: "Call dispatch after hours"
    });

    expect(handoff.status).toBe("pending_external");
    expect(handoff.targetSystem).toBe("ServiceTitan");
    expect(handoff.bookingRequestId).toBe(booking.id);

    const refreshed = fakeDb.getTestState().bookingRequests.find((row) => row.id === booking.id);
    expect(refreshed?.status).toBe("pending");

    const events = fakeDb.getTestState().activityEvents.filter((event) => event.eventType === "booking.handoff_initiated");
    expect(events).toHaveLength(1);
  });

  it("reconcileBookingHandoff records external success without confirming booking", async () => {
    const company = fakeDb.seedCompany({ name: "Acme HVAC", slug: "acme-hvac" });
    const actor = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@example.com",
      firstName: "Ava",
      lastName: "Stone",
      role: "owner"
    });
    const booking = seedPendingBooking(company.id);
    const handoff = await bookingHandoffService.initiateBookingHandoff(company.id, actor.id, booking.id, {
      targetSystem: "Housecall Pro"
    });

    const reconciled = await bookingHandoffService.reconcileBookingHandoff(
      company.id,
      actor.id,
      booking.id,
      handoff.id,
      { outcome: "succeeded", externalReference: "HCP-99881" }
    );

    expect(reconciled.status).toBe("succeeded");
    expect(reconciled.externalReference).toBe("HCP-99881");

    const refreshed = fakeDb.getTestState().bookingRequests.find((row) => row.id === booking.id);
    expect(refreshed?.status).toBe("pending");
  });

  it("rejects a second pending handoff for the same booking request", async () => {
    const company = fakeDb.seedCompany({ name: "Acme HVAC", slug: "acme-hvac" });
    const actor = fakeDb.seedUser({
      companyId: company.id,
      email: "dispatcher@example.com",
      firstName: "Dee",
      lastName: "Patch",
      role: "dispatcher"
    });
    const booking = seedPendingBooking(company.id);

    await bookingHandoffService.initiateBookingHandoff(company.id, actor.id, booking.id, {
      targetSystem: "Jobber"
    });

    await expect(
      bookingHandoffService.initiateBookingHandoff(company.id, actor.id, booking.id, {
        targetSystem: "Jobber"
      })
    ).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
  });
});
