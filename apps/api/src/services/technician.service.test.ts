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

type TechnicianServiceModule = typeof import("./technician.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let technicianService: TechnicianServiceModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  technicianService = await import("./technician.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function createAdminContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const actor = fakeDb.seedUser({
    companyId: company.id,
    email: "admin@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "admin"
  });

  return { company, actor };
}

describe("technician.service", () => {
  it("listTechnicians paginates and filters by status and skills", async () => {
    const { company } = createAdminContext();

    fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Alice",
      lastName: "Active",
      phone: "555-0100",
      status: "active",
      skills: ["hvac", "maintenance"],
      totalJobsCompleted: 10
    });
    fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Ben",
      lastName: "Backup",
      phone: "555-0101",
      status: "inactive",
      skills: ["plumbing"],
      totalJobsCompleted: 4
    });
    fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Cara",
      lastName: "Crew",
      phone: "555-0102",
      status: "active",
      skills: ["electrical"],
      totalJobsCompleted: 8
    });

    const result = await technicianService.listTechnicians(company.id, {
      status: "active",
      skills: ["hvac", "electrical"],
      sortBy: "totalJobsCompleted",
      sortOrder: "desc",
      page: 1,
      limit: 1
    });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.firstName).toBe("Alice");
  });

  it("getTechnician returns detail with todayJobCount", async () => {
    const { company } = createAdminContext();
    const technician = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Taylor",
      lastName: "Tech",
      phone: "555-0110",
      totalJobsCompleted: 12
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Chris",
      lastName: "Pine"
    });
    const now = new Date();

    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "scheduled",
      scheduledStart: now
    });
    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "in_progress",
      scheduledStart: now
    });
    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "cancelled",
      scheduledStart: now
    });

    const result = await technicianService.getTechnician(company.id, technician.id);

    expect(result.todayJobCount).toBe(2);
    expect(result.activeJobCount).toBe(1);
  });

  it("getTechnician throws NOT_FOUND for unknown or cross-tenant ids", async () => {
    const { company } = createAdminContext();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac"
    });
    const otherTechnician = fakeDb.seedTechnician({
      companyId: otherCompany.id,
      firstName: "Other",
      lastName: "Tech",
      phone: "555-0199"
    });

    await expect(technicianService.getTechnician(company.id, "missing-tech")).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
    await expect(technicianService.getTechnician(company.id, otherTechnician.id)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
  });

  it("createTechnician succeeds without a linked user", async () => {
    const { company, actor } = createAdminContext();

    const result = await technicianService.createTechnician(company.id, actor.id, {
      firstName: "Jamie",
      lastName: "Jones",
      phone: "555-0200",
      skills: ["hvac"]
    });

    expect(result.userId).toBeNull();
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("technician.created");
  });

  it("createTechnician links a valid technician user", async () => {
    const { company, actor } = createAdminContext();
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "tech@example.com",
      firstName: "Jamie",
      lastName: "Jones",
      role: "technician"
    });

    const result = await technicianService.createTechnician(company.id, actor.id, {
      firstName: "Jamie",
      lastName: "Jones",
      phone: "555-0201",
      userId: user.id
    });

    const storedUser = fakeDb.getTestState().users.find((row) => row.id === user.id);
    expect(result.userId).toBe(user.id);
    expect(storedUser?.technicianId).toBe(result.id);
  });

  it("createTechnician rejects a user from a different company", async () => {
    const { company, actor } = createAdminContext();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-company"
    });
    const user = fakeDb.seedUser({
      companyId: otherCompany.id,
      email: "tech@example.com",
      firstName: "Other",
      lastName: "User",
      role: "technician"
    });

    await expect(
      technicianService.createTechnician(company.id, actor.id, {
        firstName: "Jamie",
        lastName: "Jones",
        phone: "555-0202",
        userId: user.id
      })
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
  });

  it("updateTechnician updates allowed fields and preserves computed fields", async () => {
    const { company, actor } = createAdminContext();
    const technician = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Taylor",
      lastName: "Tech",
      phone: "555-0300",
      totalJobsCompleted: 17,
      avgJobDurationMinutes: 95
    });

    const result = await technicianService.updateTechnician(company.id, actor.id, technician.id, {
      firstName: "Updated",
      notes: "Prefers west side calls"
    });

    expect(result.firstName).toBe("Updated");
    expect(result.notes).toBe("Prefers west side calls");
    expect(result.totalJobsCompleted).toBe(17);
    expect(result.avgJobDurationMinutes).toBe(95);
  });

  it("deleteTechnician soft deletes, unlinks the user, and preserves jobs", async () => {
    const { company, actor } = createAdminContext();
    const linkedUser = fakeDb.seedUser({
      companyId: company.id,
      email: "linked-tech@example.com",
      firstName: "Link",
      lastName: "User",
      role: "technician"
    });
    const technician = fakeDb.seedTechnician({
      companyId: company.id,
      userId: linkedUser.id,
      firstName: "Taylor",
      lastName: "Tech",
      phone: "555-0301"
    });
    linkedUser.technicianId = technician.id;
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Chris",
      lastName: "Pine"
    });
    const job = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "scheduled"
    });

    await technicianService.deleteTechnician(company.id, actor.id, technician.id);

    const state = fakeDb.getTestState();
    expect(state.technicians.find((row) => row.id === technician.id)?.deletedAt).toBeInstanceOf(Date);
    expect(state.users.find((row) => row.id === linkedUser.id)?.technicianId).toBeNull();
    expect(state.jobs.find((row) => row.id === job.id)?.deletedAt).toBeNull();
  });

  it("getTechnicianAvailability returns grouped days and rejects ranges over 30 days", async () => {
    const { company } = createAdminContext();
    const technician = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Avery",
      lastName: "Avail",
      phone: "555-0400",
      hoursPerDay: "8"
    });

    fakeDb.seedScheduleSlot({
      companyId: company.id,
      technicianId: technician.id,
      startTime: new Date("2026-04-10T14:00:00.000Z"),
      endTime: new Date("2026-04-10T15:30:00.000Z"),
      isConfirmed: true
    });
    fakeDb.seedScheduleSlot({
      companyId: company.id,
      technicianId: technician.id,
      startTime: new Date("2026-04-12T16:00:00.000Z"),
      endTime: new Date("2026-04-12T17:00:00.000Z"),
      isBlockedTime: true,
      blockReason: "Training"
    });

    const result = await technicianService.getTechnicianAvailability(
      company.id,
      technician.id,
      "2026-04-10",
      "2026-04-12"
    );

    expect(result.days).toHaveLength(3);
    expect(result.days[0]?.totalBookedMinutes).toBe(90);
    expect(result.days[1]?.slots).toHaveLength(0);
    expect(result.days[2]?.slots[0]?.blockReason).toBe("Training");

    await expect(
      technicianService.getTechnicianAvailability(company.id, technician.id, "2026-04-01", "2026-05-15")
    ).rejects.toThrow();
  });

  it("getTechnicianPerformance returns technician stats plus last30Days from jobs", async () => {
    const { company } = createAdminContext();
    const technician = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Parker",
      lastName: "Perform",
      phone: "555-0500",
      totalJobsCompleted: 44,
      avgJobDurationMinutes: 92,
      estimateCloseRate: "0.4800",
      avgTicketValue: "325.00"
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Chris",
      lastName: "Pine"
    });
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 86_400_000);
    const fortyDaysAgo = new Date(now.getTime() - 40 * 86_400_000);

    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "completed",
      invoiceTotal: "100.00",
      actualEnd: tenDaysAgo
    });
    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "completed",
      invoiceTotal: "300.00",
      actualEnd: now
    });
    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      status: "completed",
      invoiceTotal: "900.00",
      actualEnd: fortyDaysAgo
    });

    const result = await technicianService.getTechnicianPerformance(company.id, technician.id);

    expect(result.totalJobsCompleted).toBe(44);
    expect(result.last30Days.jobsCompleted).toBe(2);
    expect(result.last30Days.revenue).toBe("400.00");
    expect(result.last30Days.avgTicket).toBe("200.00");
  });

  it("linkUserToTechnician succeeds and rejects bad link states", async () => {
    const { company, actor } = createAdminContext();
    const technician = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Link",
      lastName: "Target",
      phone: "555-0600"
    });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "tech@example.com",
      firstName: "Link",
      lastName: "User",
      role: "technician"
    });

    const result = await technicianService.linkUserToTechnician(company.id, actor.id, technician.id, user.id);

    expect(result.userId).toBe(user.id);
    expect(fakeDb.getTestState().users.find((row) => row.id === user.id)?.technicianId).toBe(technician.id);

    const otherTechnician = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Other",
      lastName: "Target",
      phone: "555-0601"
    });
    const alreadyLinkedUser = fakeDb.seedUser({
      companyId: company.id,
      email: "linked@example.com",
      firstName: "Already",
      lastName: "Linked",
      role: "technician",
      technicianId: otherTechnician.id
    });

    await expect(
      technicianService.linkUserToTechnician(company.id, actor.id, technician.id, alreadyLinkedUser.id)
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });

    const officeUser = fakeDb.seedUser({
      companyId: company.id,
      email: "office@example.com",
      firstName: "Office",
      lastName: "User",
      role: "office"
    });

    await expect(
      technicianService.linkUserToTechnician(company.id, actor.id, otherTechnician.id, officeUser.id)
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });
  });
});
