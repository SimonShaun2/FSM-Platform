import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { closeTestApp } from "../../test-support/close-test-app.js";
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
  await closeTestApp(app);
});

function probeOpenSse(
  path: string,
  options?: { authorization?: string }
): Promise<{ statusCode: number; contentType: string }> {
  return new Promise((resolve, reject) => {
    let req = request(app.server).get(path).buffer(false);

    if (options?.authorization) {
      req = req.set("Authorization", options.authorization);
    }

    req.on("response", (res) => {
      resolve({
        statusCode: res.statusCode ?? 0,
        contentType: res.headers["content-type"] ?? ""
      });
      res.destroy();
    });

    req.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ECONNRESET") {
        return;
      }
      reject(error);
    });

    req.end();
  });
}

describe("GET /dispatch/stream", () => {
  it("returns 401 without credentials on stream", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/dispatch/stream?date=2026-10-15"
    });
    expect(response.statusCode).toBe(401);
  });

  it("accepts access_token query param and authenticates (not rejected by strict date schema)", async () => {
    const company = fakeDb.seedCompany({ name: "Stream Co", slug: "stream-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@stream-co.test",
      firstName: "O",
      lastName: "Wner",
      role: "owner"
    });
    const accessToken = tokens.generateAccessToken({
      userId: user.id,
      companyId: company.id,
      role: user.role
    });

    const path = `/api/v1/dispatch/stream?date=2026-10-15&access_token=${encodeURIComponent(accessToken)}`;

    const withQueryToken = await probeOpenSse(path);
    expect(withQueryToken.statusCode).toBe(200);
    expect(withQueryToken.contentType).toContain("text/event-stream");

    const withHeader = await probeOpenSse("/api/v1/dispatch/stream?date=2026-10-15", {
      authorization: `Bearer ${accessToken}`
    });
    expect(withHeader.statusCode).toBe(200);
    expect(withHeader.contentType).toContain("text/event-stream");
  });

  it("rejects unknown query keys on stream route", async () => {
    const company = fakeDb.seedCompany({ name: "Strict Co", slug: "strict-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@strict-co.test",
      firstName: "O",
      lastName: "Wner",
      role: "owner"
    });
    const accessToken = tokens.generateAccessToken({
      userId: user.id,
      companyId: company.id,
      role: user.role
    });

    const response = await request(app.server).get(
      `/api/v1/dispatch/stream?date=2026-10-15&access_token=${encodeURIComponent(accessToken)}&extra=1`
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });
});
