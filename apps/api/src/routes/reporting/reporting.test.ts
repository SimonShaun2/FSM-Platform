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
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app.server)
      .get("/api/v1/reporting/job-sources")
      .query({ startDate: "2026-10-01", endDate: "2026-10-31" })
      .expect(401);

    expect(response.body.error).toBe("UNAUTHORIZED");
  });
});
