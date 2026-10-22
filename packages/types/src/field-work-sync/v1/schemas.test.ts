import { describe, expect, it } from "vitest";

import { buildRecordVersionV1 } from "../../agent-control-plane/v1/entity-ref.js";
import { SubmitFieldWorkSyncBatchBodySchema } from "./schemas.js";

describe("field work sync v1 schemas", () => {
  it("accepts a minimal batch with note append", () => {
    const jobId = "11111111-1111-4111-8111-111111111111";
    const parsed = SubmitFieldWorkSyncBatchBodySchema.safeParse({
      contractVersion: "1.0.0",
      deviceId: "ipad-field-01",
      batchClientId: "batch-local-1",
      operations: [
        {
          sequence: 1,
          clientOperationId: "op-note-1",
          jobId,
          type: "job.note.append",
          payload: { content: "Arrived on site", isInternal: true }
        }
      ]
    });

    expect(parsed.success).toBe(true);
  });

  it("requires baseRecordVersion for status updates", () => {
    const jobId = "11111111-1111-4111-8111-111111111111";
    const rv = buildRecordVersionV1("job", jobId, new Date("2026-01-01T00:00:00.000Z"));
    const parsed = SubmitFieldWorkSyncBatchBodySchema.safeParse({
      contractVersion: "1.0.0",
      deviceId: "ipad-field-01",
      batchClientId: "batch-local-2",
      operations: [
        {
          sequence: 1,
          clientOperationId: "op-status-1",
          jobId,
          type: "job.status.update",
          baseRecordVersion: rv,
          payload: { toStatus: "in_progress" }
        }
      ]
    });

    expect(parsed.success).toBe(true);
  });
});
