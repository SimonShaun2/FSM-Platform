import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv } from "../../test-support/env-setup.js";

setupTestEnv();

const uploadFileMock = vi.hoisted(() => vi.fn());

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
  notificationsQueue: { add: vi.fn() }
}));

vi.mock("../../lib/storage.js", () => ({
  uploadFile: uploadFileMock
}));

vi.mock("sharp", () => ({
  default: () => ({
    resize: () => ({
      webp: () => ({
        toBuffer: async () => Buffer.from("webp-thumb")
      })
    })
  })
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
  uploadFileMock.mockReset();
  uploadFileMock.mockImplementation(async (key: string) => ({
    url: `https://files.example/${key}`,
    key
  }));
  app = await buildAppModule.buildApp();
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

function authForCompany(companyId: string, userId: string, role: "owner" | "admin" | "dispatcher" = "owner") {
  const accessToken = tokens.generateAccessToken({
    userId,
    companyId,
    role
  });
  return `Bearer ${accessToken}`;
}

describe("FS-85 attachments API tenant access", () => {
  it("returns 404 on cross-tenant delete and does not leak metadata via list", async () => {
    const companyA = fakeDb.seedCompany({ name: "A", slug: "fs85-route-a" });
    const companyB = fakeDb.seedCompany({ name: "B", slug: "fs85-route-b" });
    const userA = fakeDb.seedUser({
      companyId: companyA.id,
      email: "a-route@fs85.example",
      firstName: "A",
      lastName: "User",
      role: "owner"
    });
    const userB = fakeDb.seedUser({
      companyId: companyB.id,
      email: "b-route@fs85.example",
      firstName: "B",
      lastName: "User",
      role: "owner"
    });
    const customerB = fakeDb.seedCustomer({
      companyId: companyB.id,
      firstName: "B",
      lastName: "Cust",
      email: "cust@b.example"
    });
    const jobB = fakeDb.seedJob({
      companyId: companyB.id,
      customerId: customerB.id,
      title: "B job",
      status: "scheduled"
    });
    const attachmentB = fakeDb.seedFileAttachment({
      companyId: companyB.id,
      entityType: "job",
      entityId: jobB.id,
      jobId: jobB.id,
      customerId: customerB.id,
      uploadedById: userB.id,
      fileName: "private.txt",
      fileUrl: `https://files.example/attachments/${companyB.id}/private.txt`,
      mimeType: "text/plain"
    });

    const listAsA = await request(app.server)
      .get(`/api/v1/attachments?entityType=job&entityId=${jobB.id}`)
      .set("Authorization", authForCompany(companyA.id, userA.id));

    expect(listAsA.status).toBe(200);
    expect(listAsA.body.data).toHaveLength(0);

    const deleteAsA = await request(app.server)
      .delete(`/api/v1/attachments/${attachmentB.id}`)
      .set("Authorization", authForCompany(companyA.id, userA.id));

    expect(deleteAsA.status).toBe(404);

    const stillThere = fakeDb.getTestState().fileAttachments.find((row) => row.id === attachmentB.id);
    expect(stillThere?.deletedAt).toBeNull();
  });

  it("returns 404 when uploading against another tenant's job entity", async () => {
    const companyA = fakeDb.seedCompany({ name: "A2", slug: "fs85-route-a2" });
    const companyB = fakeDb.seedCompany({ name: "B2", slug: "fs85-route-b2" });
    const userA = fakeDb.seedUser({
      companyId: companyA.id,
      email: "a2@fs85.example",
      firstName: "A2",
      lastName: "User",
      role: "owner"
    });
    const customerB = fakeDb.seedCustomer({
      companyId: companyB.id,
      firstName: "B2",
      lastName: "Cust",
      email: "cust2@b.example"
    });
    const jobB = fakeDb.seedJob({
      companyId: companyB.id,
      customerId: customerB.id,
      title: "B2 job",
      status: "scheduled"
    });

    const uploadAsA = await request(app.server)
      .post("/api/v1/attachments")
      .set("Authorization", authForCompany(companyA.id, userA.id))
      .field("entityType", "job")
      .field("entityId", jobB.id)
      .attach("file", Buffer.from("x"), {
        filename: "x.txt",
        contentType: "text/plain"
      });

    expect(uploadAsA.status).toBe(404);
    expect(uploadFileMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated attachment list", async () => {
    const response = await request(app.server).get(
      "/api/v1/attachments?entityType=job&entityId=550e8400-e29b-41d4-a716-446655440000"
    );

    expect(response.status).toBe(401);
  });
});
