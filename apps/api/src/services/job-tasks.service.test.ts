import { randomUUID } from "node:crypto";

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

type JobTasksServiceModule = typeof import("./job-tasks.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let jobTasksService: JobTasksServiceModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  jobTasksService = await import("./job-tasks.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

function createContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac"
  });
  const actor = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner"
  });
  const customer = fakeDb.seedCustomer({
    companyId: company.id,
    firstName: "Chris",
    lastName: "Pine"
  });
  const technician = fakeDb.seedTechnician({
    companyId: company.id,
    firstName: "Taylor",
    lastName: "Tech",
    phone: "555-0100"
  });
  const job = fakeDb.seedJob({
    companyId: company.id,
    customerId: customer.id,
    title: "Maintenance Job"
  });

  return { company, actor, customer, technician, job };
}

describe("job-tasks.service", () => {
  it("listTasks returns tasks sorted by sortOrder", async () => {
    const { company, job } = createContext();

    fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "Second",
      sortOrder: 2
    });
    fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "First",
      sortOrder: 1
    });

    const tasks = await jobTasksService.listTasks(company.id, job.id);

    expect(tasks.map((task) => task.title)).toEqual(["First", "Second"]);
  });

  it("createTask creates a task and assigns the next sort order by default", async () => {
    const { company, job, technician } = createContext();

    fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "Existing",
      sortOrder: 1
    });

    const task = await jobTasksService.createTask(company.id, job.id, {
      assignedToId: technician.id,
      title: "New Task"
    });

    expect(task.assignedToId).toBe(technician.id);
    expect(task.sortOrder).toBe(2);
  });

  it("updateTask updates editable fields and emits job.task_completed when status becomes completed", async () => {
    const { company, job, technician } = createContext();
    const task = fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "Original Task"
    });

    const updated = await jobTasksService.updateTask(company.id, job.id, task.id, {
      assignedToId: technician.id,
      title: "Updated Task",
      status: "completed",
      notes: "Completed on site"
    });

    expect(updated.title).toBe("Updated Task");
    expect(updated.status).toBe("completed");
    expect(updated.completedAt).not.toBeNull();
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.task_completed");
  });

  it("completeTask marks the task complete, stores completedById, and emits job.task_completed", async () => {
    const { company, actor, job } = createContext();
    const task = fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "Checklist Item"
    });

    const completed = await jobTasksService.completeTask(company.id, job.id, task.id, actor.id);

    expect(completed.status).toBe("completed");
    expect(completed.completedById).toBe(actor.id);
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("job.task_completed");
  });

  it("deleteTask soft deletes the task", async () => {
    const { company, job } = createContext();
    const task = fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "Delete Me"
    });

    await jobTasksService.deleteTask(company.id, job.id, task.id);

    expect(fakeDb.getTestState().jobTasks.find((row) => row.id === task.id)?.deletedAt).not.toBeNull();
  });

  it("reorderTasks updates task sort order and rejects unknown ids", async () => {
    const { company, job } = createContext();
    const first = fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "First",
      sortOrder: 0
    });
    const second = fakeDb.seedJobTask({
      companyId: company.id,
      jobId: job.id,
      title: "Second",
      sortOrder: 1
    });

    await jobTasksService.reorderTasks(company.id, job.id, [second.id, first.id]);

    expect(fakeDb.getTestState().jobTasks.find((row) => row.id === second.id)?.sortOrder).toBe(0);
    expect(fakeDb.getTestState().jobTasks.find((row) => row.id === first.id)?.sortOrder).toBe(1);

    await expect(
      jobTasksService.reorderTasks(company.id, job.id, [randomUUID(), first.id])
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT
    });
  });
});
