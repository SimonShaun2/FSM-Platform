/**
 * FS-85 — tenant-safe media/document storage API negatives (Pair 3 / Sofia).
 */
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MemoryObjectStorageProvider, setObjectStorageProviderForTests } from "@fsm/config/object-storage";

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
type AppInstance = Awaited<ReturnType<BuildAppModule["buildApp"]>>;

const TENANT_B_PROBE_FILE = "fs85-tenant-b-secret.pdf";

let buildAppModule: BuildAppModule;
let fakeDb: FakeDbModule;
let tokens: TokensModule;
let app: AppInstance;
let memoryStorage: MemoryObjectStorageProvider;

function authFor(companyId: string, userId: string, role: "owner" | "admin" = "owner") {
  const accessToken = tokens.generateAccessToken({ userId, companyId, role });
  return `Bearer ${accessToken}`;
}

beforeAll(async () => {
  buildAppModule = await import("../app.js");
  fakeDb = await import("../test-support/fake-db.js");
  tokens = await import("../lib/tokens.js");
});

beforeEach(async () => {
  fakeDb.resetTestState();
  memoryStorage = new MemoryObjectStorageProvider();
  setObjectStorageProviderForTests(memoryStorage);
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  setObjectStorageProviderForTests(null);
  await app.close();
});

describe("FS-85 tenant-safe media routes", () => {
  it("denies unauthenticated signed URL minting", async () => {
    const company = fakeDb.seedCompany({ name: "Co", slug: "co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "u@fs85.test",
      firstName: "U",
      lastName: "1",
      role: "owner"
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "C",
      lastName: "1",
      email: "c@fs85.test"
    });
    const attachment = fakeDb.seedFileAttachment({
      companyId: company.id,
      entityType: "customer",
      entityId: customer.id,
      fileName: TENANT_B_PROBE_FILE,
      fileUrl: "memory-object://attachments/tenant-b/secret.pdf",
      uploadedById: user.id
    });

    const download = await request(app.server).get(`/api/v1/attachments/${attachment.id}/download-url`);
    expect(download.status).toBe(401);
    expect(download.body.error).toBe("UNAUTHORIZED");

    const upload = await request(app.server).post("/api/v1/attachments/upload-url").send({
      entityType: "customer",
      entityId: customer.id,
      fileName: "ok.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1024
    });
    expect(upload.status).toBe(401);
  });

  it("denies cross-tenant download-url minting with NOT_FOUND", async () => {
    const companyA = fakeDb.seedCompany({ name: "Tenant A", slug: "tenant-a-fs85" });
    const userA = fakeDb.seedUser({
      companyId: companyA.id,
      email: "a@fs85.test",
      firstName: "A",
      lastName: "Owner",
      role: "owner"
    });
    const companyB = fakeDb.seedCompany({ name: "Tenant B", slug: "tenant-b-fs85" });
    const userB = fakeDb.seedUser({
      companyId: companyB.id,
      email: "b@fs85.test",
      firstName: "B",
      lastName: "Owner",
      role: "owner"
    });
    const customerB = fakeDb.seedCustomer({
      companyId: companyB.id,
      firstName: "Secret",
      lastName: "Customer",
      email: "secret-b@fs85.test"
    });
    const objectKey = `attachments/${companyB.id}/${TENANT_B_PROBE_FILE}`;
    const stored = await memoryStorage.putObject(objectKey, Buffer.from("secret"), "application/pdf");
    const attachmentB = fakeDb.seedFileAttachment({
      companyId: companyB.id,
      entityType: "customer",
      entityId: customerB.id,
      fileName: TENANT_B_PROBE_FILE,
      fileUrl: stored.reference,
      uploadedById: userB.id
    });

    const response = await request(app.server)
      .get(`/api/v1/attachments/${attachmentB.id}/download-url`)
      .set("Authorization", authFor(companyA.id, userA.id));

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("NOT_FOUND");
    expect(JSON.stringify(response.body)).not.toContain(TENANT_B_PROBE_FILE);
    expect(JSON.stringify(response.body)).not.toContain("secret-b@fs85.test");
  });

  it("mints tenant-scoped upload URLs only for authorized entities", async () => {
    const company = fakeDb.seedCompany({ name: "Upload Co", slug: "upload-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "upload@fs85.test",
      firstName: "Up",
      lastName: "Loader",
      role: "owner"
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "Cust",
      lastName: "One",
      email: "cust@fs85.test"
    });

    const ok = await request(app.server)
      .post("/api/v1/attachments/upload-url")
      .set("Authorization", authFor(company.id, user.id))
      .send({
        entityType: "customer",
        entityId: customer.id,
        fileName: "field-photo.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 2048
      });

    expect(ok.status).toBe(201);
    expect(ok.body.upload.objectKey).toContain(`attachments/${company.id}/`);
    memoryStorage.validateSignedUrl(ok.body.upload.url, "upload");

    const crossTenantEntity = await request(app.server)
      .post("/api/v1/attachments/upload-url")
      .set("Authorization", authFor(company.id, user.id))
      .send({
        entityType: "customer",
        entityId: "00000000-0000-4000-8000-000000000099",
        fileName: "bad.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 100
      });

    expect(crossTenantEntity.status).toBe(404);
  });

  it("rejects disallowed mime types and oversized upload intents", async () => {
    const company = fakeDb.seedCompany({ name: "Validate Co", slug: "validate-co" });
    const user = fakeDb.seedUser({
      companyId: company.id,
      email: "val@fs85.test",
      firstName: "Val",
      lastName: "1",
      role: "owner"
    });
    const customer = fakeDb.seedCustomer({
      companyId: company.id,
      firstName: "C",
      lastName: "2",
      email: "c2@fs85.test"
    });

    const badMime = await request(app.server)
      .post("/api/v1/attachments/upload-url")
      .set("Authorization", authFor(company.id, user.id))
      .send({
        entityType: "customer",
        entityId: customer.id,
        fileName: "virus.exe",
        mimeType: "application/x-msdownload",
        fileSizeBytes: 100
      });
    expect(badMime.status).toBe(400);

    const tooLarge = await request(app.server)
      .post("/api/v1/attachments/upload-url")
      .set("Authorization", authFor(company.id, user.id))
      .send({
        entityType: "customer",
        entityId: customer.id,
        fileName: "big.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 50 * 1024 * 1024 + 1
      });
    expect(tooLarge.status).toBe(400);
  });

  it("expires memory signed URLs after TTL", async () => {
    const signed = await memoryStorage.createSignedDownloadUrl("attachments/demo/file.pdf", 1);
    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });
    expect(() => memoryStorage.validateSignedUrl(signed.url, "download")).toThrow(/expired/i);
  });
});
