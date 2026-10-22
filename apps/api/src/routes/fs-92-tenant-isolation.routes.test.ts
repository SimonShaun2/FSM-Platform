/**
 * FS-92 — API route negative tests for tenant isolation (Pair 3 / Dev E).
 * Synthetic tenants A and B; unauthenticated + cross-tenant read/write denied.
 */
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";
import {
  assertTenantIsolationNotFound,
  assertUnauthorized,
  createSyntheticTenantAuth,
  seedSyntheticTenantBFixtures,
  TENANT_B_PROBE_EMAIL
} from "../test-support/synthetic-tenants.js";

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

type BuildAppModule = typeof import("../app.js");
type FakeDbModule = typeof import("../test-support/fake-db.js");
type TokensModule = typeof import("../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;

beforeAll(async () => {
  buildAppModule = await import("../app.js");
  fakeDb = await import("../test-support/fake-db.js");
  tokens = await import("../lib/tokens.js");
});

beforeEach(async () => {
  fakeDb.resetTestState();
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

describe("FS-92 tenant isolation — API routes", () => {
  const protectedReads: Array<{ label: string; path: (fixtures: ReturnType<typeof seedSyntheticTenantBFixtures>) => string }> =
    [
      { label: "customer", path: (f) => `/api/v1/customers/${f.customer.id}` },
      { label: "job", path: (f) => `/api/v1/jobs/${f.job.id}` },
      { label: "estimate", path: (f) => `/api/v1/estimates/${f.estimate.id}` },
      { label: "invoice", path: (f) => `/api/v1/invoices/${f.invoice.id}` },
      { label: "import session", path: (f) => `/api/v1/imports/${f.importSession.id}` }
    ];

  const protectedWrites: Array<{
    label: string;
    method: "patch" | "delete" | "post";
    path: (fixtures: ReturnType<typeof seedSyntheticTenantBFixtures>) => string;
    body?: Record<string, unknown>;
  }> = [
    {
      label: "customer patch",
      method: "patch",
      path: (f) => `/api/v1/customers/${f.customer.id}`,
      body: { displayName: "Hijack attempt" }
    },
    {
      label: "customer delete",
      method: "delete",
      path: (f) => `/api/v1/customers/${f.customer.id}`
    },
    {
      label: "job patch",
      method: "patch",
      path: (f) => `/api/v1/jobs/${f.job.id}`,
      body: { title: "Hijack attempt" }
    },
    {
      label: "import rollback",
      method: "post",
      path: (f) => `/api/v1/imports/${f.importSession.id}/rollback`
    }
  ];

  it("denies unauthenticated reads on representative tenant paths", async () => {
    const tenantB = createSyntheticTenantAuth(fakeDb, tokens, "B");
    const fixtures = seedSyntheticTenantBFixtures(fakeDb, tenantB.company.id);

    for (const route of protectedReads) {
      const response = await request(app.server).get(route.path(fixtures));
      assertUnauthorized(response);
    }

    const listResponse = await request(app.server).get("/api/v1/customers");
    assertUnauthorized(listResponse);
  });

  it("denies unauthenticated writes on representative tenant paths", async () => {
    const tenantB = createSyntheticTenantAuth(fakeDb, tokens, "B");
    const fixtures = seedSyntheticTenantBFixtures(fakeDb, tenantB.company.id);

    for (const route of protectedWrites) {
      const agent = request(app.server);
      const response =
        route.method === "patch"
          ? await agent.patch(route.path(fixtures)).send(route.body ?? {})
          : route.method === "delete"
            ? await agent.delete(route.path(fixtures))
            : await agent.post(route.path(fixtures)).send(route.body ?? {});

      assertUnauthorized(response);
    }
  });

  it("denies cross-tenant reads with NOT_FOUND and no tenant B probe leakage", async () => {
    const tenantA = createSyntheticTenantAuth(fakeDb, tokens, "A");
    const tenantB = createSyntheticTenantAuth(fakeDb, tokens, "B");
    const fixturesB = seedSyntheticTenantBFixtures(fakeDb, tenantB.company.id);

    fakeDb.seedCustomer({
      companyId: tenantA.company.id,
      firstName: "Visible",
      lastName: "TenantA",
      email: "visible-a@fs92.test"
    });

    for (const route of protectedReads) {
      const response = await request(app.server)
        .get(route.path(fixturesB))
        .set("Authorization", tenantA.authorization);

      assertTenantIsolationNotFound(response);
    }
  });

  it("denies cross-tenant writes with NOT_FOUND and no tenant B probe leakage", async () => {
    const tenantA = createSyntheticTenantAuth(fakeDb, tokens, "A");
    const tenantB = createSyntheticTenantAuth(fakeDb, tokens, "B");
    const fixturesB = seedSyntheticTenantBFixtures(fakeDb, tenantB.company.id);

    for (const route of protectedWrites) {
      const path = route.path(fixturesB);
      const response =
        route.method === "patch"
          ? await request(app.server)
              .patch(path)
              .set("Authorization", tenantA.authorization)
              .send(route.body ?? {})
          : route.method === "delete"
            ? await request(app.server)
                .delete(path)
                .set("Authorization", tenantA.authorization)
            : await request(app.server)
                .post(path)
                .set("Authorization", tenantA.authorization)
                .send(route.body ?? {});

      assertTenantIsolationNotFound(response);
    }
  });

  it("lists only same-tenant customers and allows authorized same-tenant read", async () => {
    const tenantA = createSyntheticTenantAuth(fakeDb, tokens, "A");
    const tenantB = createSyntheticTenantAuth(fakeDb, tokens, "B");
    const fixturesB = seedSyntheticTenantBFixtures(fakeDb, tenantB.company.id);

    const customerA = fakeDb.seedCustomer({
      companyId: tenantA.company.id,
      firstName: "Allowed",
      lastName: "Reader",
      email: "allowed-a@fs92.test"
    });

    const listResponse = await request(app.server)
      .get("/api/v1/customers?page=1&limit=50")
      .set("Authorization", tenantA.authorization);

    expect(listResponse.status).toBe(200);
    const ids = (listResponse.body.data as Array<{ id: string }>).map((row) => row.id);
    expect(ids).toContain(customerA.id);
    expect(ids).not.toContain(fixturesB.customer.id);
    const emails = JSON.stringify(listResponse.body);
    expect(emails).not.toContain(TENANT_B_PROBE_EMAIL);

    const getResponse = await request(app.server)
      .get(`/api/v1/customers/${customerA.id}`)
      .set("Authorization", tenantA.authorization);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.customer.id).toBe(customerA.id);
  });

  it("rejects cross-tenant job create when customerId belongs to tenant B", async () => {
    const tenantA = createSyntheticTenantAuth(fakeDb, tokens, "A");
    const tenantB = createSyntheticTenantAuth(fakeDb, tokens, "B");
    const fixturesB = seedSyntheticTenantBFixtures(fakeDb, tenantB.company.id);

    const response = await request(app.server)
      .post("/api/v1/jobs")
      .set("Authorization", tenantA.authorization)
      .send({
        customerId: fixturesB.customer.id,
        title: "Cross-tenant create attempt",
        type: "service",
        priority: "normal"
      });

    expect([404, 400]).toContain(response.status);
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain(TENANT_B_PROBE_EMAIL);
  });
});
