import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

type FakeDbModule = typeof import("../test-support/fake-db.js");

let fakeDb: FakeDbModule;
let getImportSessionIngestProgress: typeof import("./import-ingest-progress.service.js").getImportSessionIngestProgress;
let getMigrateOnboardingIngestProgress: typeof import("./import-ingest-progress.service.js").getMigrateOnboardingIngestProgress;

beforeAll(async () => {
  fakeDb = await import("../test-support/fake-db.js");
  ({ getImportSessionIngestProgress, getMigrateOnboardingIngestProgress } = await import(
    "./import-ingest-progress.service.js"
  ));
});

beforeEach(() => {
  fakeDb.resetTestState();
});

describe("import-ingest-progress.service", () => {
  it("returns chunk progress for an import session", async () => {
    const company = fakeDb.seedCompany({ name: "Progress Co", slug: "progress-co" });
    const session = fakeDb.seedImportSession({
      companyId: company.id,
      fileName: "customers.csv",
      fileUrl: "https://r2.test/1",
      status: "importing",
      progress: {
        entityType: "customers",
        chunksTotal: 2,
        chunksDone: 1,
        rowsOk: 400,
        rowsFailed: 2
      }
    });

    const response = await getImportSessionIngestProgress(company.id, session.id);

    expect(response.chunk).toEqual({
      entityType: "customers",
      chunksTotal: 2,
      chunksDone: 1,
      rowsOk: 400,
      rowsFailed: 2
    });
  });

  it("aggregates bundle ingest progress across linked sessions", async () => {
    const company = fakeDb.seedCompany({ name: "Bundle Progress Co", slug: "bundle-progress" });
    const bundle = fakeDb.seedImportBundle({
      companyId: company.id,
      stepState: {
        sourceSystem: "jobber",
        files: [
          {
            importSessionId: "11111111-1111-1111-1111-111111111111",
            entityType: "customers",
            fileName: "customers.csv",
            mimeType: "text/csv",
            byteSize: 100
          }
        ]
      }
    });

    const sessionA = fakeDb.seedImportSession({
      id: "11111111-1111-1111-1111-111111111111",
      companyId: company.id,
      importBundleId: bundle.id,
      fileName: "customers.csv",
      fileUrl: "https://r2.test/a",
      status: "importing",
      entityType: "customers",
      progress: {
        entityType: "customers",
        chunksTotal: 2,
        chunksDone: 1,
        rowsOk: 100,
        rowsFailed: 0
      }
    });

    fakeDb.seedImportSession({
      companyId: company.id,
      importBundleId: bundle.id,
      fileName: "jobs.csv",
      fileUrl: "https://r2.test/b",
      status: "importing",
      entityType: "jobs",
      progress: {
        entityType: "jobs",
        chunksTotal: 3,
        chunksDone: 2,
        rowsOk: 200,
        rowsFailed: 1
      }
    });

    const response = await getMigrateOnboardingIngestProgress(company.id, bundle.id);

    expect(response.progress.filesTotal).toBe(1);
    expect(response.progress.chunksTotal).toBe(5);
    expect(response.progress.chunksCommitted).toBe(3);
    expect(response.sessions).toHaveLength(2);
    expect(response.sessions.find((row) => row.importSessionId === sessionA.id)?.chunk?.chunksDone).toBe(1);
  });
});
