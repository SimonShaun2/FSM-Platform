import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { closeTestApp } from "../../test-support/close-test-app.js";
import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

const { addImportsQueueJob, downloadFileMock } = vi.hoisted(() => ({
  addImportsQueueJob: vi.fn(),
  downloadFileMock: vi.fn()
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
  agreementsQueue: { add: vi.fn() },
  aiQueue: { add: vi.fn() },
  importsQueue: { add: addImportsQueueJob },
  invoicesQueue: { add: vi.fn() },
  notificationsQueue: { add: vi.fn() }
}));

vi.mock("@fsm/config/storage", () => ({
  downloadFile: downloadFileMock,
  getFileKeyFromUrl: (fileUrl: string) => fileUrl.replace("https://r2.test/", "")
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;

const SAMPLE_CSV = `firstName,lastName,email,phone
Jane,Doe,jane@example.com,5551234567
`;

beforeAll(async () => {
  buildAppModule = await import("../../app.js");
  fakeDb = await import("../../test-support/fake-db.js");
  tokens = await import("../../lib/tokens.js");
});

beforeEach(async () => {
  fakeDb.resetTestState();
  addImportsQueueJob.mockReset();
  downloadFileMock.mockReset();
  downloadFileMock.mockResolvedValue(Buffer.from(SAMPLE_CSV, "utf8"));
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await closeTestApp(app);
});

function createAuthContext(role: "owner" | "admin" = "owner") {
  const company = fakeDb.seedCompany({
    name: "Migrate Co",
    slug: `migrate-${String(Math.random()).slice(2, 8)}`,
    timezone: "America/Chicago"
  });
  const user = fakeDb.seedUser({
    companyId: company.id,
    email: `${role}@migrate.test`,
    firstName: "Owner",
    lastName: "User",
    role
  });
  const accessToken = tokens.generateAccessToken({
    userId: user.id,
    companyId: company.id,
    role: user.role
  });

  return { company, user, authorization: `Bearer ${accessToken}` };
}

describe("migrate onboarding wizard API", () => {
  it("runs steps 1-5 with resumable session and dedupe operator actions", async () => {
    const { company, authorization } = createAuthContext("owner");

    fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "5551234567"
    });

    const createResponse = await request(app.server)
      .post("/api/v1/migrate/onboarding/sessions")
      .set("Authorization", authorization)
      .send({ resumeActive: false })
      .expect(201);

    const bundleId = createResponse.body.id as string;
    expect(createResponse.body.wizardStep).toBe(1);

    await request(app.server)
      .patch(`/api/v1/migrate/onboarding/sessions/${bundleId}/source`)
      .set("Authorization", authorization)
      .send({ sourceSystem: "jobber" })
      .expect(200)
      .expect((response) => {
        expect(response.body.wizardStep).toBe(2);
        expect(response.body.stepState.sourceSystem).toBe("jobber");
      });

    const importSession = fakeDb.seedImportSession({
      companyId: company.id,
      fileName: "customers.csv",
      fileUrl: "https://r2.test/imports/customers.csv",
      status: "preview",
      entityType: "customers",
      columnMappings: {
        firstName: "firstName",
        lastName: "lastName",
        email: "email",
        phone: "phone"
      }
    });

    await request(app.server)
      .patch(`/api/v1/migrate/onboarding/sessions/${bundleId}/files`)
      .set("Authorization", authorization)
      .send({
        files: [
          {
            importSessionId: importSession.id,
            entityType: "customers",
            fileName: "customers.csv"
          }
        ]
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.wizardStep).toBe(3);
      });

    await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundleId}/confirm-mappings`)
      .set("Authorization", authorization)
      .send({})
      .expect(200)
      .expect((response) => {
        expect(response.body.wizardStep).toBe(4);
      });

    const dedupePreview = await request(app.server)
      .get(`/api/v1/migrate/onboarding/sessions/${bundleId}/dedupe-preview`)
      .set("Authorization", authorization)
      .expect(200);

    expect(dedupePreview.body.totalDuplicateRows).toBe(1);
    const collisionKey = dedupePreview.body.collisions[0].collisionKey as string;

    await request(app.server)
      .patch(`/api/v1/migrate/onboarding/sessions/${bundleId}/dedupe-decisions`)
      .set("Authorization", authorization)
      .send({
        decisions: [{ collisionKey, action: "update_existing" }]
      })
      .expect(200);

    await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundleId}/acknowledge-preview`)
      .set("Authorization", authorization)
      .send({})
      .expect(200)
      .expect((response) => {
        expect(response.body.wizardStep).toBe(5);
      });

    const commitResponse = await request(app.server)
      .post(`/api/v1/migrate/onboarding/sessions/${bundleId}/commit`)
      .set("Authorization", authorization)
      .send({})
      .expect(200);

    expect(commitResponse.body.status).toBe("committing");
    expect(addImportsQueueJob).toHaveBeenCalled();
    expect(fakeDb.getTestState().activityEvents.some((event) => event.eventType === "import.bundle.commit_started")).toBe(
      true
    );
  });

  it("resumes the active bundle when resumeActive is true", async () => {
    const { company, user, authorization } = createAuthContext("owner");

    const bundle = fakeDb.seedImportBundle({
      companyId: company.id,
      createdById: user.id,
      wizardStep: 2,
      stepState: { files: [], sourceSystem: "qbo" }
    });

    const response = await request(app.server)
      .post("/api/v1/migrate/onboarding/sessions")
      .set("Authorization", authorization)
      .send({ resumeActive: true })
      .expect(201);

    expect(response.body.id).toBe(bundle.id);
    expect(response.body.wizardStep).toBe(2);
  });

  it("rejects cross-tenant bundle access", async () => {
    const companyA = fakeDb.seedCompany({ name: "Tenant A", slug: "tenant-a" });
    const companyB = fakeDb.seedCompany({ name: "Tenant B", slug: "tenant-b" });
    const userB = fakeDb.seedUser({
      companyId: companyB.id,
      email: "owner@b.test",
      firstName: "B",
      lastName: "Owner",
      role: "owner"
    });

    const bundleA = fakeDb.seedImportBundle({ companyId: companyA.id, wizardStep: 1, stepState: { files: [] } });

    const accessTokenB = tokens.generateAccessToken({
      userId: userB.id,
      companyId: companyB.id,
      role: userB.role
    });

    const response = await request(app.server)
      .get(`/api/v1/migrate/onboarding/sessions/${bundleA.id}`)
      .set({ Authorization: `Bearer ${accessTokenB}` })
      .expect(404);

    expect(response.body.error).toBe(ErrorCode.NOT_FOUND);
  });
});
