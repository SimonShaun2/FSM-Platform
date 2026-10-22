import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { EXPORT_QUEUE_JOB_NAMES } from "@fsm/types";

import { closeTestApp } from "../../test-support/close-test-app.js";
import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

const { addExportsQueueJob } = vi.hoisted(() => ({
  addExportsQueueJob: vi.fn()
}));

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/jobs", () => ({
  exportsQueue: {
    add: addExportsQueueJob
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
  addExportsQueueJob.mockReset();
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await closeTestApp(app);
});

function createAuthContext(role: "owner" | "admin" | "technician" = "owner") {
  const company = fakeDb.seedCompany({
    name: "Acme HVAC",
    slug: "acme-hvac",
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}-${company.id}@example.com`,
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

describe("data export routes (FS-89)", () => {
  it("POST /data-exports enqueues async job and emits export.requested", async () => {
    const owner = createAuthContext("owner");

    const response = await request(app.server)
      .post("/api/v1/data-exports")
      .set("Authorization", owner.authorization)
      .send({ format: "json" });

    expect(response.status).toBe(201);
    expect(response.body.dataExport.status).toBe("pending");
    expect(response.body.dataExport.manifestVersion).toBe("fsm.data-export.v1");
    expect(addExportsQueueJob).toHaveBeenCalledWith(
      EXPORT_QUEUE_JOB_NAMES.tenantDataExport,
      expect.objectContaining({
        companyId: owner.company.id,
        requestedById: owner.user.id
      }),
      expect.objectContaining({
        jobId: expect.stringMatching(/^tenant-export:/)
      })
    );

    expect(
      fakeDb.getTestState().activityEvents.some(
        (event) => event.companyId === owner.company.id && event.eventType === "export.requested"
      )
    ).toBe(true);
  });

  it("GET /data-exports/:id returns NOT_FOUND for cross-tenant access", async () => {
    const ownerA = createAuthContext("owner");
    const ownerB = createAuthContext("owner");
    const session = fakeDb.seedDataExportSession({
      companyId: ownerA.company.id,
      status: "completed",
      fileUrl: "https://r2.test/export.json",
      fileName: "tenant-export.json",
      expiresAt: new Date(Date.now() + 86_400_000)
    });

    const response = await request(app.server)
      .get(`/api/v1/data-exports/${session.id}`)
      .set("Authorization", ownerB.authorization);

    expect(response.status).toBe(404);
  });

  it("GET /data-exports/:id/download records export.downloaded for completed exports", async () => {
    const owner = createAuthContext("owner");
    const session = fakeDb.seedDataExportSession({
      companyId: owner.company.id,
      status: "completed",
      fileUrl: "https://r2.test/export.json",
      fileName: "tenant-export.json",
      expiresAt: new Date(Date.now() + 86_400_000)
    });

    const response = await request(app.server)
      .get(`/api/v1/data-exports/${session.id}/download`)
      .set("Authorization", owner.authorization);

    expect(response.status).toBe(200);
    expect(response.body.dataExport.fileUrl).toBe("https://r2.test/export.json");

    expect(
      fakeDb.getTestState().activityEvents.some(
        (event) => event.companyId === owner.company.id && event.eventType === "export.downloaded"
      )
    ).toBe(true);
  });

  it("GET /data-exports/manifest returns versioned field manifest", async () => {
    const owner = createAuthContext("owner");

    const response = await request(app.server)
      .get("/api/v1/data-exports/manifest")
      .set("Authorization", owner.authorization);

    expect(response.status).toBe(200);
    expect(response.body.manifest.version).toBe("fsm.data-export.v1");
    expect(response.body.manifest.entities.customers.excludedFields).toContain("stripeCustomerId");
  });
});
