import type { Job } from "bullmq";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { buildImportChunkIdempotencyKey } from "@fsm/jobs";

import { setupTestEnv } from "../../../api/src/test-support/env-setup.js";

setupTestEnv();

const { downloadFileMock, getFileKeyFromUrlMock } = vi.hoisted(() => ({
  downloadFileMock: vi.fn(),
  getFileKeyFromUrlMock: vi.fn(),
}));

vi.mock("drizzle-orm", async () => {
  const helper = await import("../../../api/src/test-support/fake-db.js");
  return helper.createDrizzleModuleMock();
});

vi.mock("@fsm/db", async () => {
  const helper = await import("../../../api/src/test-support/fake-db.js");
  return helper.createDbModuleMock();
});

vi.mock("@fsm/config/storage", () => ({
  downloadFile: downloadFileMock,
  getFileKeyFromUrl: getFileKeyFromUrlMock,
}));

type ImportChunkCommitModule = typeof import("./import-chunk-commit.processor.js");
type FakeDbModule = typeof import("../../../api/src/test-support/fake-db.js");

let importChunkCommitProcessor: ImportChunkCommitModule;
let fakeDb: FakeDbModule;

const companyId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const importSessionId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const csvBuffer = Buffer.from(
  [
    "vendor_id,first_name,last_name,email",
    "cust-1,Ada,Lovelace,ada@example.com",
    "cust-2,Grace,Hopper,grace@example.com",
  ].join("\n"),
  "utf8",
);

beforeAll(async () => {
  importChunkCommitProcessor = await import("./import-chunk-commit.processor.js");
  fakeDb = await import("../../../api/src/test-support/fake-db.js");
});

beforeEach(() => {
  fakeDb.resetTestState();
  downloadFileMock.mockReset();
  getFileKeyFromUrlMock.mockReset();
  getFileKeyFromUrlMock.mockImplementation((fileUrl: string) => fileUrl);
  downloadFileMock.mockResolvedValue(csvBuffer);
});

function createJob(data: Record<string, unknown>) {
  const updateProgress = vi.fn(async () => undefined);

  return {
    job: {
      id: "job-import-chunk-commit",
      name: "import-chunk-commit",
      data,
      updateProgress,
    } as unknown as Job<Record<string, unknown>>,
    updateProgress,
  };
}

function seedSession() {
  return fakeDb.seedImportSession({
    id: importSessionId,
    companyId,
    entityType: "customers",
    status: "importing",
    fileName: "customers.csv",
    fileUrl: "imports/customers.csv",
    columnMappings: {
      vendor_id: "sourceId",
      first_name: "firstName",
      last_name: "lastName",
      email: "email",
    },
  });
}

describe("import-chunk-commit.processor", () => {
  it("commits a customer chunk with lineage upsert and session progress", async () => {
    seedSession();

    const idempotencyKey = buildImportChunkIdempotencyKey(importSessionId, "customers", 0);
    const { job, updateProgress } = createJob({
      companyId,
      importSessionId,
      sourceSystem: "jobber",
      entityType: "customers",
      chunkIndex: 0,
      chunksTotal: 1,
      cursor: { rowOffset: 0 },
      idempotencyKey,
      rowWindow: { start: 0, end: 2 },
    });

    await importChunkCommitProcessor.handleImportChunkCommit(job);

    const testState = fakeDb.getTestState();
    expect(testState.customers).toHaveLength(2);
    expect(testState.customers[0]?.sourceSystem).toBe("jobber");
    expect(testState.customers[0]?.sourceId).toBe("cust-1");
    expect(testState.importChunkRuns).toHaveLength(1);
    expect(testState.importChunkRuns[0]?.status).toBe("completed");
    expect(testState.importSessions[0]?.status).toBe("completed");
    expect(testState.importSessions[0]?.progress).toMatchObject({
      chunksDone: 1,
      chunksTotal: 1,
      rowsOk: 2,
    });
    expect(updateProgress).toHaveBeenCalledWith(100);
  });

  it("is idempotent when the same chunk is re-queued after completion", async () => {
    seedSession();

    const idempotencyKey = buildImportChunkIdempotencyKey(importSessionId, "customers", 0);
    const payload = {
      companyId,
      importSessionId,
      sourceSystem: "jobber",
      entityType: "customers",
      chunkIndex: 0,
      chunksTotal: 1,
      cursor: { rowOffset: 0 },
      idempotencyKey,
      rowWindow: { start: 0, end: 1 },
    };

    await importChunkCommitProcessor.handleImportChunkCommit(createJob(payload).job);
    await importChunkCommitProcessor.handleImportChunkCommit(createJob(payload).job);

    const testState = fakeDb.getTestState();
    expect(testState.customers).toHaveLength(1);
    expect(testState.importChunkRuns).toHaveLength(1);
    expect(testState.importSessions[0]?.progress).toMatchObject({ chunksDone: 1, rowsOk: 1 });
  });

  it("upserts existing customers by source lineage without duplicating rows", async () => {
    seedSession();
    fakeDb.seedCustomer({
      companyId,
      firstName: "Old",
      lastName: "Name",
      sourceSystem: "jobber",
      sourceId: "cust-1",
    });

    const idempotencyKey = buildImportChunkIdempotencyKey(importSessionId, "customers", 0);
    await importChunkCommitProcessor.handleImportChunkCommit(
      createJob({
        companyId,
        importSessionId,
        sourceSystem: "jobber",
        entityType: "customers",
        chunkIndex: 0,
        chunksTotal: 1,
        cursor: {},
        idempotencyKey,
        rowWindow: { start: 0, end: 1 },
      }).job,
    );

    const testState = fakeDb.getTestState();
    expect(testState.customers).toHaveLength(1);
    expect(testState.customers[0]?.firstName).toBe("Ada");
  });
});
