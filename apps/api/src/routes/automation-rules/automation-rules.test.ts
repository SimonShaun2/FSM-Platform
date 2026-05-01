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
  aiQueue: {
    add: vi.fn()
  },
  invoicesQueue: {
    add: vi.fn()
  },
  notificationsQueue: {
    add: vi.fn()
  }
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;

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

function createAuthContext(role: "owner" | "admin" | "dispatcher" | "office" = "owner") {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}@example.com`,
    firstName: "Ava",
    lastName: "Stone",
    role
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return {
    company,
    user,
    authorization: `Bearer ${accessToken}`
  };
}

describe("automation rule routes", () => {
  it("GET /automation-rules returns the company rules for allowed roles", async () => {
    const dispatcher = createAuthContext("dispatcher");

    const response = await request(app.server)
      .get("/api/v1/automation-rules")
      .set("Authorization", dispatcher.authorization);

    expect(response.status).toBe(200);
    expect(response.body.rules.length).toBeGreaterThan(0);
    expect(response.body.rules.some((rule: { ruleType: string }) => rule.ruleType === "estimate_follow_up")).toBe(true);
  });

  it("PATCH /automation-rules/:id updates a rule for owners and blocks office users", async () => {
    const owner = createAuthContext("owner");
    const office = createAuthContext("office");

    const listResponse = await request(app.server)
      .get("/api/v1/automation-rules")
      .set("Authorization", owner.authorization);
    const ruleId = listResponse.body.rules[0]?.id as string;

    const successResponse = await request(app.server)
      .patch(`/api/v1/automation-rules/${ruleId}`)
      .set("Authorization", owner.authorization)
      .send({
        isEnabled: false
      });

    const forbiddenResponse = await request(app.server)
      .patch(`/api/v1/automation-rules/${ruleId}`)
      .set("Authorization", office.authorization)
      .send({
        isEnabled: false
      });

    expect(successResponse.status).toBe(200);
    expect(successResponse.body.rule.isEnabled).toBe(false);
    expect(forbiddenResponse.status).toBe(403);
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("company.updated");
  });
});
