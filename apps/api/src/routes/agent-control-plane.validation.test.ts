import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: Awaited<ReturnType<BuildAppModule["buildApp"]>>;

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

function ownerToken(companyId: string, userId: string, role: string): string {
  return tokens.generateAccessToken({ userId, companyId, role });
}

describe("agent control plane API strict Zod validation", () => {
  it("POST /tenant-context/resolve rejects unknown body keys", async () => {
    const company = fakeDb.seedCompany({ name: "Strict Co", slug: "strict-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@strict-co.test",
      firstName: "O",
      lastName: "Wner",
      role: "owner"
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "C",
      lastName: "1",
      leadSource: "web"
    });

    const response = await request(app.server)
      .post("/api/v1/tenant-context/resolve")
      .set("Authorization", `Bearer ${ownerToken(company.id, user.id, user.role)}`)
      .send({
        entityType: "customer",
        entityId: customer.id,
        includeRelated: true
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });

  it("GET /agent-actions rejects unknown query keys", async () => {
    const company = fakeDb.seedCompany({ name: "Strict Co 2", slug: "strict-co-2" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner2@strict-co.test",
      firstName: "O",
      lastName: "2",
      role: "owner"
    });

    const response = await request(app.server)
      .get("/api/v1/agent-actions")
      .query({ state: "awaiting_approval", unexpected: "1" })
      .set("Authorization", `Bearer ${ownerToken(company.id, user.id, user.role)}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });

  it("POST /revenue/inquiries/:id/response-draft rejects unknown body keys", async () => {
    const company = fakeDb.seedCompany({ name: "Strict Co 3", slug: "strict-co-3" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner3@strict-co.test",
      firstName: "O",
      lastName: "3",
      role: "owner"
    });
    const bookingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    const response = await request(app.server)
      .post(`/api/v1/revenue/inquiries/${bookingId}/response-draft`)
      .set("Authorization", `Bearer ${ownerToken(company.id, user.id, user.role)}`)
      .send({
        idempotencyKey: "idem-key-12345678",
        draftType: "qualification_reply"
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });
});
