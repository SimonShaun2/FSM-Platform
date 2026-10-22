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
  aiQueue: { add: vi.fn() },
  agreementsQueue: { add: vi.fn() },
  importsQueue: { add: vi.fn() },
  invoicesQueue: { add: vi.fn() },
  notificationsQueue: { add: vi.fn() },
  webhooksQueue: { add: vi.fn() },
  redisConnection: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => "OK"),
    del: vi.fn(async () => 1)
  }
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: Awaited<ReturnType<BuildAppModule["buildApp"]>>;

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

describe("GET /api/v1/reporting/job-sources", () => {
  it("returns tenant-scoped channel summary for authenticated users", async () => {
    const company = fakeDb.seedCompany({ name: "Report Co", slug: "report-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@report-co.test",
      firstName: "Owner",
      lastName: "One",
      role: "owner"
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Casey",
      lastName: "Client",
      leadSource: "website"
    });

    fakeDb.seedJob({
      companyId: company.id,
      customerId: customer.id,
      jobNumber: "JOB-2001",
      title: "Owned web job",
      status: "completed",
      leadSource: "website",
      scheduledStart: new Date("2026-10-05T12:00:00.000Z"),
      amountPaid: "150.00"
    });

    const accessToken = tokens.generateAccessToken({
      userId: user.id,
      companyId: company.id,
      role: user.role
    });

    const response = await request(app.server)
      .get("/api/v1/reporting/job-sources")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.totals.bookedJobCount).toBe(1);
    expect(response.body.totals.revenue).toBe("150.00");
    expect(response.body.channels).toHaveLength(5);
    expect(response.body.period.dateInterpretation).toBe("company_local_days");
    expect(response.body.totals.unknownAttributionDefinition).toContain("leadSource");
    expect(response.body.channels[0]).not.toHaveProperty("jobIds");
  });

  it("returns 403 for technician users", async () => {
    const company = fakeDb.seedCompany({ name: "Role Co", slug: "role-co" });
    const technician = fakeDb.seedUser({
      companyId: company.id,
      email: "tech@role-co.test",
      firstName: "Tech",
      lastName: "User",
      role: "technician"
    });

    const accessToken = tokens.generateAccessToken({
      userId: technician.id,
      companyId: company.id,
      role: technician.role
    });

    const response = await request(app.server)
      .get("/api/v1/reporting/job-sources")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);

    expect(response.body.error).toBe("FORBIDDEN");
  });

  it("does not include another tenant's jobs in the summary", async () => {
    const companyA = fakeDb.seedCompany({ name: "Iso A", slug: "iso-a" });
    const companyB = fakeDb.seedCompany({ name: "Iso B", slug: "iso-b" });
    const userB = fakeDb.seedUser({
      companyId: companyB.id,
      email: "owner@iso-b.test",
      firstName: "Owner",
      lastName: "B",
      role: "owner"
    });
    const customerA = fakeDb.seedCustomer({
      companyId: companyA.id,
      firstName: "Other",
      lastName: "Tenant",
      leadSource: "website"
    });
    const customerB = fakeDb.seedCustomer({
      companyId: companyB.id,
      firstName: "Mine",
      lastName: "Tenant",
      leadSource: "website"
    });

    fakeDb.seedJob({
      companyId: companyA.id,
      customerId: customerA.id,
      jobNumber: "JOB-OTHER",
      title: "Other tenant job",
      status: "completed",
      leadSource: "website",
      scheduledStart: new Date("2026-10-05T12:00:00.000Z"),
      amountPaid: "999.00"
    });

    fakeDb.seedJob({
      companyId: companyB.id,
      customerId: customerB.id,
      jobNumber: "JOB-MINE",
      title: "My job",
      status: "completed",
      leadSource: "website",
      scheduledStart: new Date("2026-10-05T12:00:00.000Z"),
      amountPaid: "75.00"
    });

    const accessToken = tokens.generateAccessToken({
      userId: userB.id,
      companyId: companyB.id,
      role: userB.role
    });

    const response = await request(app.server)
      .get("/api/v1/reporting/job-sources")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.totals.bookedJobCount).toBe(1);
    expect(response.body.totals.revenue).toBe("75.00");
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app.server)
      .get("/api/v1/reporting/job-sources")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .expect(401);

    expect(response.body.error).toBe("UNAUTHORIZED");
  });

  it("returns 400 VALIDATION_ERROR when the range exceeds 366 days", async () => {
    const company = fakeDb.seedCompany({ name: "Range Co", slug: "range-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@range-co.test",
      firstName: "Owner",
      lastName: "Range",
      role: "owner"
    });

    const accessToken = tokens.generateAccessToken({
      userId: user.id,
      companyId: company.id,
      role: user.role
    });

    const response = await request(app.server)
      .get("/api/v1/reporting/job-sources")
      .query({ startDate: "2024-01-01", endDate: "2025-01-01" })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("366");
  });

  it("returns 400 VALIDATION_ERROR when startDate is after endDate", async () => {
    const company = fakeDb.seedCompany({ name: "Order Co", slug: "order-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@order-co.test",
      firstName: "Owner",
      lastName: "Order",
      role: "owner"
    });

    const accessToken = tokens.generateAccessToken({
      userId: user.id,
      companyId: company.id,
      role: user.role
    });

    const response = await request(app.server)
      .get("/api/v1/reporting/job-sources")
      .query({ startDate: "2026-10-31", endDate: "2026-10-01" })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("startDate");
  });
});
