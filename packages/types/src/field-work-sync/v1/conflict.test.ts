import { describe, expect, it } from "vitest";

import { buildRecordVersionV1 } from "../../agent-control-plane/v1/entity-ref.js";

import {
  buildFieldWorkSyncVersionConflict,
  resolveFieldWorkSyncClientOperationReplay,
  validateJobTaskBaseRecordVersion
} from "./conflict.js";

describe("resolveFieldWorkSyncClientOperationReplay", () => {
  it("returns duplicate when payload hash matches an applied operation", () => {
    const decision = resolveFieldWorkSyncClientOperationReplay({
      storedPayloadHash: "abc",
      incomingPayloadHash: "abc",
      storedOutcome: "applied"
    });

    expect(decision).toEqual({ action: "duplicate" });
  });

  it("rejects when payload hash differs for the same clientOperationId", () => {
    const decision = resolveFieldWorkSyncClientOperationReplay({
      storedPayloadHash: "abc",
      incomingPayloadHash: "def",
      storedOutcome: "applied"
    });

    expect(decision).toEqual({
      action: "reject",
      message: "clientOperationId reused with a different payload"
    });
  });

  it("replays a prior conflict outcome when payload matches", () => {
    const decision = resolveFieldWorkSyncClientOperationReplay({
      storedPayloadHash: "abc",
      incomingPayloadHash: "abc",
      storedOutcome: "conflict"
    });

    expect(decision).toEqual({ action: "replay_stored", outcome: "conflict" });
  });
});

describe("validateJobTaskBaseRecordVersion", () => {
  it("accepts a job_task token for the expected task id", () => {
    const taskId = "task-1";
    const version = buildRecordVersionV1("job_task", taskId, new Date("2026-01-01T00:00:00.000Z"));
    expect(validateJobTaskBaseRecordVersion(version, taskId)).toEqual({ ok: true });
  });

  it("rejects mismatched entity targets", () => {
    const version = buildRecordVersionV1("job", "job-1", new Date("2026-01-01T00:00:00.000Z"));
    expect(validateJobTaskBaseRecordVersion(version, "task-1")).toEqual({
      ok: false,
      message: "baseRecordVersion must target the job task being updated"
    });
  });
});

describe("buildFieldWorkSyncVersionConflict", () => {
  it("builds a conflict payload for API persistence", () => {
    const built = buildFieldWorkSyncVersionConflict("rv1:job:j1:2026-01-01T00:00:00.000Z", "stale");
    expect(built.outcome).toBe("conflict");
    expect(built.resultPayload.conflict.liveRecordVersion).toContain("j1");
  });
});
