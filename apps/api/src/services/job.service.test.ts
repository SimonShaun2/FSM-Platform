import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

const { addQueueJob } = vi.hoisted(() => ({
  addQueueJob: vi.fn()
}));

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  aiQueue: {
    add: addQueueJob
  }
}));

type JobServiceModule = typeof import("./job.service.js");
type JobStateMachineModule = typeof import("../lib/job-state-machine.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let jobService: JobServiceModule;
let stateMachine: JobStateMachineModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  jobService = await import("./job.service.js");
  stateMachine = await import("../lib/job-state-machine.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
  addQueueJob.mockReset();
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

function seedJobGraph(companyId: string) {
  const customer = fakeDb.seedCustomer({
    companyId,
    firstName: "Chris",
    lastName: "Pine",
    lifetimeValue: "100.00",
    totalJobs: 2
  });
  const property = fakeDb.seedProperty({
    companyId,
    customerId: customer.id,
    addressLine1: "101 Main St",
    city: "Tulsa",
    state: "OK",
    zip: "74103",
    accessNotes: "Use side gate"
  });
  const asset = fakeDb.seedAsset({
    companyId,
    customerId: customer.id,
    propertyId: property.id,
    name: "Main HVAC Unit",
    assetType: "hvac"
  });
  const technician = fakeDb.seedTechnician({
    companyId,
    firstName: "Taylor",
    lastName: "Tech",
    phone: "555-0100",
    totalJobsCompleted: 4
  });

  return { customer, property, asset, technician };
}

describe("job state machine", () => {
  it("canTransition returns true for valid transitions and false for invalid transitions", () => {
    expect(stateMachine.canTransition("lead", "scheduled")).toBe(true);
    expect(stateMachine.canTransition("lead", "paid")).toBe(false);
  });

  it("transition returns the next status or throws CONFLICT with the current status", () => {
    expect(stateMachine.transition("scheduled", "dispatched")).toBe("dispatched");

    expect(() => stateMachine.transition("lead", "paid")).toThrowError(/lead to paid/i);
  });

  it("getAvailableTransitions excludes the rescheduled event pseudo-status", () => {
    expect(stateMachine.getAvailableTransitions("scheduled")).toEqual([
      "dispatched",
      "on_hold",
      "cancelled"
    ]);
  });
});

describe("job.service", () => {
  it("createJob succeeds and emits job.created", async () => {
    const { company, actor } = createAdminContext();
    const { customer, property, asset, technician } = seedJobGraph(company.id);

    const result = await jobService.createJob(company.id, actor.id, {
      customerId: customer.id,
      propertyId: property.id,
      assetId: asset.id,
      technicianId: technician.id,
      title: "Spring Maintenance",
      tags: ["pm"]
    });

    expect(result.jobNumber).toBe("JOB-0001");
    expect(result.status).toBe("lead");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.created");
  });

  it("createJob rejects cross-tenant customers and property/customer mismatches", async () => {
    const { company, actor } = createAdminContext();
    const otherCompany = fakeDb.seedCompany({
      name: "Other HVAC",
      slug: "other-hvac"
    });
    const otherCustomer = fakeDb.seedCustomer({
      companyId: otherCompany.id,
      firstName: "Other",
      lastName: "Customer"
    });
    const { customer } = seedJobGraph(company.id);
    const otherProperty = fakeDb.seedProperty({
      companyId: company.id,
      customerId: customer.id,
      addressLine1: "202 Elm St",
      city: "Tulsa",
      state: "OK",
      zip: "74104"
    });
    const unrelatedCustomer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Jamie",
      lastName: "Mismatch"
    });

    await expect(
      jobService.createJob(company.id, actor.id, {
        customerId: otherCustomer.id,
        title: "Cross Tenant"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });

    await expect(
      jobService.createJob(company.id, actor.id, {
        customerId: unrelatedCustomer.id,
        propertyId: otherProperty.id,
        title: "Bad Property"
      })
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });
  });

  it("transitionStatus succeeds for valid transitions and throws CONFLICT for invalid ones", async () => {
    const { company, actor } = createAdminContext();
    const { customer } = seedJobGraph(company.id);
    const job = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      status: "lead",
      title: "New Lead"
    });

    const updated = await jobService.transitionStatus(company.id, actor.id, job.id, "scheduled");

    expect(updated.status).toBe("scheduled");
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.scheduled");

    await expect(
      jobService.transitionStatus(company.id, actor.id, job.id, "paid")
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
      fields: {
        currentStatus: "scheduled",
        nextStatus: "paid"
      }
    });
  });

  it("assignTechnician updates the job and any existing schedule slot", async () => {
    const { company, actor } = createAdminContext();
    const { customer, technician } = seedJobGraph(company.id);
    const replacementTechnician = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Robin",
      lastName: "Route",
      phone: "555-0101"
    });
    const job = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      scheduledStart: new Date("2026-04-28T14:00:00.000Z"),
      scheduledEnd: new Date("2026-04-28T15:00:00.000Z"),
      title: "Assigned Job"
    });
    const slot = fakeDb.seedScheduleSlot({
      companyId: company.id,
      technicianId: technician.id,
      jobId: job.id,
      startTime: new Date("2026-04-28T14:00:00.000Z"),
      endTime: new Date("2026-04-28T15:00:00.000Z")
    });

    const updated = await jobService.assignTechnician(company.id, actor.id, job.id, replacementTechnician.id);

    expect(updated.technicianId).toBe(replacementTechnician.id);
    expect(fakeDb.getTestState().scheduleSlots.find((row) => row.id === slot.id)?.technicianId).toBe(
      replacementTechnician.id
    );

    const otherCompany = fakeDb.seedCompany({
      name: "Other Co",
      slug: "other-co"
    });
    const crossTenantTechnician = fakeDb.seedTechnician({
      companyId: otherCompany.id,
      firstName: "Cross",
      lastName: "Tenant",
      phone: "555-0102"
    });

    await expect(
      jobService.assignTechnician(company.id, actor.id, job.id, crossTenantTechnician.id)
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND
    });
  });

  it("scheduleJob creates slots when needed, skips them without a technician, and emits rescheduled when appropriate", async () => {
    const { company, actor } = createAdminContext();
    const { customer, technician } = seedJobGraph(company.id);
    const unscheduledJob = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      title: "No Tech Yet",
      status: "lead"
    });
    const scheduledJob = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      technicianId: technician.id,
      title: "Already Scheduled",
      status: "scheduled",
      scheduledStart: new Date("2026-04-28T15:00:00.000Z"),
      scheduledEnd: new Date("2026-04-28T16:00:00.000Z")
    });

    const firstSchedule = await jobService.scheduleJob(company.id, actor.id, unscheduledJob.id, {
      scheduledStart: "2026-04-29T13:00:00.000Z",
      scheduledEnd: "2026-04-29T14:30:00.000Z"
    });

    expect(firstSchedule.status).toBe("scheduled");
    expect(fakeDb.getTestState().scheduleSlots).toHaveLength(0);
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.scheduled");

    const rescheduled = await jobService.scheduleJob(company.id, actor.id, scheduledJob.id, {
      scheduledStart: "2026-04-30T13:00:00.000Z",
      scheduledEnd: "2026-04-30T14:00:00.000Z"
    });

    expect(rescheduled.scheduledStart?.toISOString()).toBe("2026-04-30T13:00:00.000Z");
    expect(fakeDb.getTestState().scheduleSlots).toHaveLength(1);
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.rescheduled");
  });

  it("completeJob updates customer, technician, and asset fields, enqueues AI work, and rolls back on transaction failures", async () => {
    const { company, actor } = createAdminContext();
    const { customer, asset, technician } = seedJobGraph(company.id);
    const job = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      assetId: asset.id,
      technicianId: technician.id,
      title: "Complete Me",
      status: "in_progress",
      invoiceTotal: "250.00"
    });

    const completed = await jobService.completeJob(company.id, actor.id, job.id, {
      completionNotes: "All set"
    });

    const today = new Date().toISOString().slice(0, 10);
    const stateAfterSuccess = fakeDb.getTestState();

    expect(completed.status).toBe("completed");
    expect(stateAfterSuccess.customers.find((row) => row.id === customer.id)?.lifetimeValue).toBe("350.00");
    expect(stateAfterSuccess.customers.find((row) => row.id === customer.id)?.totalJobs).toBe(3);
    expect(stateAfterSuccess.customers.find((row) => row.id === customer.id)?.lastServiceDate).toBe(today);
    expect(stateAfterSuccess.customers.find((row) => row.id === customer.id)?.firstServiceDate).toBe(today);
    expect(stateAfterSuccess.technicians.find((row) => row.id === technician.id)?.totalJobsCompleted).toBe(5);
    expect(stateAfterSuccess.assets.find((row) => row.id === asset.id)?.lastServiceDate).toBe(today);
    expect(addQueueJob).toHaveBeenCalledWith(
      "evaluate-revenue-opportunities",
      {
        companyId: company.id,
        jobId: job.id,
        customerId: customer.id
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        }
      }
    );

    const rollbackJob = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      assetId: asset.id,
      technicianId: technician.id,
      title: "Rollback Me",
      status: "in_progress",
      invoiceTotal: "75.00"
    });
    const originalUpdate = fakeDb.db.update;
    const updateSpy = vi
      .spyOn(fakeDb.db, "update")
      .mockImplementation((table) => {
        if (table === fakeDb.assets) {
          throw new Error("asset update failed");
        }

        return originalUpdate.call(fakeDb.db, table as never);
      });

    await expect(
      jobService.completeJob(company.id, actor.id, rollbackJob.id, {
        completionNotes: "Should rollback"
      })
    ).rejects.toThrow("asset update failed");

    updateSpy.mockRestore();

    const rolledBackState = fakeDb.getTestState();
    expect(rolledBackState.jobs.find((row) => row.id === rollbackJob.id)?.status).toBe("in_progress");
    expect(rolledBackState.customers.find((row) => row.id === customer.id)?.totalJobs).toBe(3);
  });

  it("addNote creates a note and emits job.updated", async () => {
    const { company, actor } = createAdminContext();
    const { customer } = seedJobGraph(company.id);
    const job = fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      title: "Note Job"
    });

    const note = await jobService.addNote(company.id, actor.id, job.id, {
      content: "Customer requested afternoon arrival"
    });

    expect(note.content).toBe("Customer requested afternoon arrival");
    expect(fakeDb.getTestState().jobNotes).toHaveLength(1);
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.updated");
  });
});
