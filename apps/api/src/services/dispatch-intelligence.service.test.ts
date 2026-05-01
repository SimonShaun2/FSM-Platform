import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

const { addQueueJob, redisDelMock, redisGetMock, redisSetMock } = vi.hoisted(() => ({
  addQueueJob: vi.fn(),
  redisDelMock: vi.fn(async () => 1),
  redisGetMock: vi.fn(async () => null),
  redisSetMock: vi.fn(async () => "OK")
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
  },
  redisConnection: {
    get: redisGetMock,
    set: redisSetMock,
    del: redisDelMock
  }
}));

type DispatchIntelligenceModule = typeof import("./dispatch-intelligence.service.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");

let dispatchIntelligence: DispatchIntelligenceModule;
let fakeDb: FakeDbModule;

beforeAll(async () => {
  dispatchIntelligence = await import("./dispatch-intelligence.service.js");
  fakeDb = await import("../test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
  addQueueJob.mockReset();
  redisDelMock.mockClear();
  redisGetMock.mockClear();
  redisSetMock.mockClear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-01T15:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function createCompanyContext() {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const actor = fakeDb.seedUser({
    companyId: company.id,
    email: "owner@example.com",
    firstName: "Ava",
    lastName: "Stone",
    role: "owner"
  });

  return { company, actor };
}

function seedJobGraph(companyId: string) {
  const customer = fakeDb.seedCustomer({
    companyId,
    firstName: "Helen",
    lastName: "Park",
    phone: "555-0100",
    email: "helen@example.com"
  });
  const property = fakeDb.seedProperty({
    companyId,
    customerId: customer.id,
    addressLine1: "456 Market St",
    city: "Tulsa",
    state: "OK",
    zip: "74103"
  });
  const asset = fakeDb.seedAsset({
    companyId,
    customerId: customer.id,
    propertyId: property.id,
    name: "Carrier Roof Unit",
    assetType: "hvac"
  });
  const job = fakeDb.seedJob({
    companyId,
    customerId: customer.id,
    propertyId: property.id,
    assetId: asset.id,
    title: "HVAC repair",
    description: "Cooling issue on rooftop unit",
    type: "service_call",
    priority: "high",
    status: "lead"
  });

  return { customer, property, asset, job };
}

describe("dispatch intelligence scoring helpers", () => {
  it("returns 25 for an exact zip match and 0 otherwise", () => {
    expect(dispatchIntelligence.calculateZipMatchScore(["74103"], "74103")).toBe(25);
    expect(dispatchIntelligence.calculateZipMatchScore(["74133"], "74103")).toBe(0);
  });

  it("scores skill overlap from 0 to 25", () => {
    expect(dispatchIntelligence.calculateSkillsMatchScore(["Commercial HVAC", "Electrical"], ["hvac", "electrical"])).toBe(25);
    expect(dispatchIntelligence.calculateSkillsMatchScore(["Plumbing"], ["hvac", "electrical"])).toBe(0);
  });

  it("prefers lower utilization", () => {
    expect(dispatchIntelligence.calculateUtilizationScore(120, 480)).toBeGreaterThan(
      dispatchIntelligence.calculateUtilizationScore(420, 480)
    );
  });

  it("rewards exact gap fits and penalizes oversized slots", () => {
    expect(dispatchIntelligence.calculateGapFitScore({ durationMinutes: 120 }, 120)).toBe(25);
    expect(dispatchIntelligence.calculateGapFitScore({ durationMinutes: 240 }, 120)).toBe(10);
    expect(dispatchIntelligence.calculateGapFitScore(null, 120)).toBe(0);
  });
});

describe("dispatch intelligence service", () => {
  it("returns a score above 75 for a technician with zip match, skill match, and an exact gap", async () => {
    const { company } = createCompanyContext();
    const { customer, property, job } = seedJobGraph(company.id);
    const strongTech = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Maria",
      lastName: "Chen",
      phone: "555-0101",
      skills: ["HVAC", "Cooling", "Repair", "Service"],
      serviceZipCodes: ["74103"],
      hoursPerDay: "8"
    });
    const otherTech = fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Devon",
      lastName: "Wright",
      phone: "555-0102",
      skills: ["Plumbing"],
      serviceZipCodes: ["74133"],
      hoursPerDay: "8"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      propertyId: property.id,
      technicianId: strongTech.id,
      title: "Morning slot",
      status: "scheduled",
      scheduledStart: new Date("2026-05-01T13:00:00.000Z"),
      scheduledEnd: new Date("2026-05-01T15:00:00.000Z")
    });
    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      propertyId: property.id,
      technicianId: strongTech.id,
      title: "Afternoon slot",
      status: "scheduled",
      scheduledStart: new Date("2026-05-01T17:00:00.000Z"),
      scheduledEnd: new Date("2026-05-01T20:00:00.000Z")
    });
    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      propertyId: property.id,
      technicianId: otherTech.id,
      title: "Busy elsewhere",
      status: "scheduled",
      scheduledStart: new Date("2026-05-01T13:00:00.000Z"),
      scheduledEnd: new Date("2026-05-01T21:00:00.000Z")
    });

    const response = await dispatchIntelligence.getAutoFitSuggestions({
      companyId: company.id,
      jobId: job.id,
      date: "2026-05-01"
    });

    expect(response.message).toBeNull();
    expect(response.suggestions).toHaveLength(1);
    expect(response.suggestions[0]?.technicianId).toBe(strongTech.id);
    expect(response.suggestions[0]?.score).toBeGreaterThan(75);
    expect(response.suggestions[0]?.scoreBreakdown.zipMatch).toBe(25);
    expect(response.suggestions[0]?.scoreBreakdown.skillsMatch).toBe(25);
    expect(response.suggestions[0]?.scoreBreakdown.gapFitScore).toBe(25);
    expect(response.suggestions[0]?.reasoningText).toMatch(/covers this zip/i);
  });

  it("returns an empty array when no technicians are available on that date", async () => {
    const { company } = createCompanyContext();
    const { job } = seedJobGraph(company.id);
    fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Priya",
      lastName: "Shah",
      phone: "555-0103",
      serviceZipCodes: ["74103"],
      skills: ["HVAC"],
      availableDays: ["sat"],
      status: "active"
    });
    fakeDb.seedTechnician({
      companyId: company.id,
      firstName: "Luis",
      lastName: "Ortega",
      phone: "555-0104",
      serviceZipCodes: ["74103"],
      skills: ["HVAC"],
      status: "inactive"
    });

    const response = await dispatchIntelligence.getAutoFitSuggestions({
      companyId: company.id,
      jobId: job.id,
      date: "2026-05-01"
    });

    expect(response.suggestions).toEqual([]);
    expect(response.message).toMatch(/no active technicians are available/i);
  });
});
