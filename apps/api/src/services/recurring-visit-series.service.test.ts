import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@fsm/db";

import { setupTestEnv } from "../test-support/env-setup.js";
import {
  ensureRecurringVisitSeriesForMaintenancePlan,
  generateRecurringVisitOccurrences,
  getRecurringVisitSeriesForCompany
} from "./recurring-visit-series.service.js";

setupTestEnv();

vi.mock("drizzle-orm", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

type FakeDbModule = typeof import("../test-support/fake-db.js");

let fakeDb: FakeDbModule;

beforeAll(async () => {
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
});

describe("recurring visit series service (FS-59)", () => {
  it("generates N occurrences for a tenant series", async () => {
    const company = fakeDb.seedCompany({ name: "Acme", slug: "acme", timezone: "America/New_York" });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Sam",
      lastName: "Lee"
    });
    const plan = fakeDb.seedMaintenancePlan({
      companyId: company.id,
      customerId: customer.id,
      status: "active",
      frequency: "monthly",
      startDate: "2026-01-01"
    });
    const visit = fakeDb.seedMaintenanceVisit({
      companyId: company.id,
      maintenancePlanId: plan.id,
      scheduledDate: "2026-03-01"
    });

    const series = await ensureRecurringVisitSeriesForMaintenancePlan(
      company.id,
      plan,
      visit,
      db
    );

    const first = await generateRecurringVisitOccurrences(company.id, series.id, 4, db);
    expect(first.inserted).toBe(4);
    expect(first.totalActive).toBe(4);

    const second = await generateRecurringVisitOccurrences(company.id, series.id, 4, db);
    expect(second.inserted).toBe(0);
    expect(second.totalActive).toBe(4);

    const occurrences = fakeDb.getTestState().recurringVisitOccurrences;
    expect(occurrences.every((row) => row.companyId === company.id)).toBe(true);
    expect(occurrences.map((row) => row.occurrenceIndex).sort()).toEqual([0, 1, 2, 3]);
  });

  it("does not return series across tenants", async () => {
    const companyA = fakeDb.seedCompany({ name: "Acme", slug: "acme-a" });
    const companyB = fakeDb.seedCompany({ name: "Beta", slug: "beta-b" });
    const customer = fakeDb.seedCustomer({
      companyId: companyA.id,
      firstName: "Sam",
      lastName: "Lee"
    });
    const plan = fakeDb.seedMaintenancePlan({
      companyId: companyA.id,
      customerId: customer.id,
      status: "active"
    });
    const visit = fakeDb.seedMaintenanceVisit({
      companyId: companyA.id,
      maintenancePlanId: plan.id,
      scheduledDate: "2026-03-01"
    });

    const series = await ensureRecurringVisitSeriesForMaintenancePlan(
      companyA.id,
      plan,
      visit,
      db
    );

    const crossTenant = await getRecurringVisitSeriesForCompany(companyB.id, series.id, db);
    expect(crossTenant).toBeNull();
  });
});
