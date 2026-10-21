/**
 * FS-11 acceptance — data import contract (one-way CSV / import_sessions).
 * Contract doc: docs/contracts/fsm.data-import.v1.md
 */
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@fsm/types";

import { closeTestApp } from "../../test-support/close-test-app.js";
import { setupTestEnv } from "../../test-support/env-setup.js";
import { CSV_IMPORT_FILE_TOO_LARGE_MESSAGE, CSV_IMPORT_MAX_FILE_SIZE_BYTES } from "./upload-limits.js";

setupTestEnv();

const { addImportsQueueJob, uploadCsvToR2Mock } = vi.hoisted(() => ({
  addImportsQueueJob: vi.fn(),
  uploadCsvToR2Mock: vi.fn()
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
  importsQueue: { add: addImportsQueueJob }
}));

vi.mock("../../services/file-upload.service.js", () => ({
  uploadCsvToR2: uploadCsvToR2Mock
}));

type BuildAppModule = typeof import("../../app.js");
type FakeDbModule = typeof import("../../test-support/fake-db.js");
type TokensModule = typeof import("../../lib/tokens.js");
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;

const OVERSIZED_CSV_BUFFER = Buffer.alloc(CSV_IMPORT_MAX_FILE_SIZE_BYTES + 1, 0x61);

beforeAll(async () => {
  buildAppModule = await import("../../app.js");
  fakeDb = await import("../../test-support/fake-db.js");
  tokens = await import("../../lib/tokens.js");
});

beforeEach(async () => {
  fakeDb.resetTestState();
  addImportsQueueJob.mockReset();
  uploadCsvToR2Mock.mockReset();
  uploadCsvToR2Mock.mockResolvedValue({
    fileUrl: "https://r2.test/fsm-bucket/imports/test/customers.csv",
    fileKey: "imports/test/customers.csv"
  });
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await closeTestApp(app);
});

function authFor(companyId: string, userId: string, role: "owner" | "admin" = "owner") {
  const token = tokens.generateAccessToken({ userId, companyId, role });
  return `Bearer ${token}`;
}

describe("FS-11 data import contract", () => {
  it("FS-11-AC-01 happy ingest — upload enqueues mapping and emits import.started", async () => {
    const company = fakeDb.seedCompany({ name: "Sparkle", slug: "sparkle" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@sparkle.test",
      firstName: "Maya",
      lastName: "Ortiz",
      role: "owner"
    });

    const response = await request(app.server)
      .post("/api/v1/imports")
      .set("Authorization", authFor(company.id, user.id))
      .attach("file", Buffer.from("First Name,Email\nKim,kim@example.com"), {
        filename: "customers.csv",
        contentType: "text/csv"
      });

    expect(response.status).toBe(201);
    expect(response.body.importSession.status).toBe("uploaded");
    expect(addImportsQueueJob).toHaveBeenCalledWith(
      "map-csv-columns",
      expect.objectContaining({ companyId: company.id }),
      expect.any(Object)
    );
    expect(fakeDb.getTestState().activityEvents.some((e) => e.eventType === "import.started")).toBe(true);
  });

  it("FS-11-AC-02 collected row errors — GET /errors returns validation array", async () => {
    const company = fakeDb.seedCompany({ name: "Sparkle", slug: "sparkle-2" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "admin@sparkle.test",
      firstName: "A",
      lastName: "B",
      role: "admin"
    });
    const session = fakeDb.seedImportSession({
      companyId: company.id,
      fileName: "customers.csv",
      fileUrl: "https://r2.test/1",
      status: "preview",
      validationErrors: [
        { row: 3, field: "email", message: "Invalid email", value: "bad" }
      ]
    });

    const response = await request(app.server)
      .get(`/api/v1/imports/${session.id}/errors`)
      .set("Authorization", authFor(company.id, user.id));

    expect(response.status).toBe(200);
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].row).toBe(3);
  });

  it("FS-11-AC-03 rollback traceability — rollback soft-deletes importSessionId-tagged rows", async () => {
    const company = fakeDb.seedCompany({ name: "Sparkle", slug: "sparkle-3" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@sparkle.test",
      firstName: "Maya",
      lastName: "Ortiz",
      role: "owner"
    });
    const session = fakeDb.seedImportSession({
      companyId: company.id,
      fileName: "customers.csv",
      fileUrl: "https://r2.test/1",
      status: "completed"
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Kim",
      lastName: "Lee",
      importSessionId: session.id
    });

    const response = await request(app.server)
      .post(`/api/v1/imports/${session.id}/rollback`)
      .set("Authorization", authFor(company.id, user.id))
      .send();

    expect(response.status).toBe(200);
    expect(response.body.importSession.status).toBe("rolled_back");
    expect(fakeDb.getTestState().customers.find((c) => c.id === customer.id)?.deletedAt).not.toBeNull();
    expect(fakeDb.getTestState().activityEvents.at(-1)?.eventType).toBe("import.rolled_back");
  });

  it("FS-11-AC-04 tenant isolation — other company cannot read session", async () => {
    const companyA = fakeDb.seedCompany({ name: "A", slug: "company-a" });
    const companyB = fakeDb.seedCompany({ name: "B", slug: "company-b" });
    const userB = fakeDb.seedUser({
      companyId: companyB.id,
      email: "owner@b.test",
      firstName: "B",
      lastName: "Owner",
      role: "owner"
    });
    const sessionA = fakeDb.seedImportSession({
      companyId: companyA.id,
      fileName: "secret.csv",
      fileUrl: "https://r2.test/a",
      status: "preview"
    });

    const response = await request(app.server)
      .get(`/api/v1/imports/${sessionA.id}`)
      .set("Authorization", authFor(companyB.id, userB.id));

    expect(response.status).toBe(404);
  });

  it("FS-11-AC-05 operator retry path — preview session can start import", async () => {
    const company = fakeDb.seedCompany({ name: "Sparkle", slug: "sparkle-5" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@sparkle.test",
      firstName: "Maya",
      lastName: "Ortiz",
      role: "owner"
    });
    const session = fakeDb.seedImportSession({
      companyId: company.id,
      fileName: "customers.csv",
      fileUrl: "https://r2.test/1",
      status: "preview"
    });

    const response = await request(app.server)
      .post(`/api/v1/imports/${session.id}/start`)
      .set("Authorization", authFor(company.id, user.id))
      .send({ duplicateActions: {} });

    expect(response.status).toBe(200);
    expect(response.body.importSession.status).toBe("importing");
  });

  it("FS-11-AC-06 formula injection — GET /errors returns sanitized cell values", async () => {
    const company = fakeDb.seedCompany({ name: "Sparkle", slug: "sparkle-6" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@sparkle.test",
      firstName: "Maya",
      lastName: "Ortiz",
      role: "owner"
    });
    const session = fakeDb.seedImportSession({
      companyId: company.id,
      fileName: "customers.csv",
      fileUrl: "https://r2.test/1",
      status: "preview",
      validationErrors: [
        { row: 2, field: "email", message: "Suspicious", value: "=cmd|' /C calc'!A0" }
      ]
    });

    const response = await request(app.server)
      .get(`/api/v1/imports/${session.id}/errors`)
      .set("Authorization", authFor(company.id, user.id));

    expect(response.status).toBe(200);
    expect(response.body.errors[0].value).toBe("'=cmd|' /C calc'!A0");
  });

  it("FS-11-AC-07 upload size — POST /imports returns 413 when CSV exceeds 10MB", async () => {
    const company = fakeDb.seedCompany({ name: "Sparkle", slug: "sparkle-7" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "owner@sparkle.test",
      firstName: "Maya",
      lastName: "Ortiz",
      role: "owner"
    });

    const response = await request(app.server)
      .post("/api/v1/imports")
      .set("Authorization", authFor(company.id, user.id))
      .attach("file", OVERSIZED_CSV_BUFFER, {
        filename: "huge.csv",
        contentType: "text/csv"
      });

    expect(response.status).toBe(413);
    expect(response.body.error).toBe(ErrorCode.VALIDATION_ERROR);
    expect(response.body.message).toBe(CSV_IMPORT_FILE_TOO_LARGE_MESSAGE);
    expect(addImportsQueueJob).not.toHaveBeenCalled();
  });

  it("FS-11-AC-08 tenant isolation — rollback, errors, and start are NOT_FOUND cross-tenant", async () => {
    const companyA = fakeDb.seedCompany({ name: "A", slug: "company-a-8" });
    const companyB = fakeDb.seedCompany({ name: "B", slug: "company-b-8" });
    const userB = fakeDb.seedUser({
      companyId: companyB.id,
      email: "owner@b.test",
      firstName: "B",
      lastName: "Owner",
      role: "owner"
    });
    const sessionA = fakeDb.seedImportSession({
      companyId: companyA.id,
      fileName: "secret.csv",
      fileUrl: "https://r2.test/a",
      status: "completed",
      validationErrors: [{ row: 1, field: "email", message: "x", value: "y" }]
    });
    const previewA = fakeDb.seedImportSession({
      companyId: companyA.id,
      fileName: "preview.csv",
      fileUrl: "https://r2.test/p",
      status: "preview"
    });

    const rollback = await request(app.server)
      .post(`/api/v1/imports/${sessionA.id}/rollback`)
      .set("Authorization", authFor(companyB.id, userB.id))
      .send();
    const errors = await request(app.server)
      .get(`/api/v1/imports/${sessionA.id}/errors`)
      .set("Authorization", authFor(companyB.id, userB.id));
    const start = await request(app.server)
      .post(`/api/v1/imports/${previewA.id}/start`)
      .set("Authorization", authFor(companyB.id, userB.id))
      .send({ duplicateActions: {} });

    expect(rollback.status).toBe(404);
    expect(errors.status).toBe(404);
    expect(start.status).toBe(404);
  });
});
