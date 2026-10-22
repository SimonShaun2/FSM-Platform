import { describe, expect, it } from "vitest";

import {
  buildDefaultEnqueueJobOptions,
  buildDefaultWorkerOptions,
  fsmDefaultJobAttempts,
  fsmRetainFailedJobsForDlq
} from "./queue-policy.js";

describe("FS-81 queue retry policy", () => {
  it("applies bounded attempts and exponential backoff for enqueued jobs", () => {
    const options = buildDefaultEnqueueJobOptions();

    expect(options.attempts).toBe(fsmDefaultJobAttempts);
    expect(options.backoff).toEqual({
      type: "exponential",
      delay: 5000
    });
  });

  it("retains failed jobs for dead-letter visibility by default", () => {
    const options = buildDefaultEnqueueJobOptions();

    expect(fsmRetainFailedJobsForDlq).toBe(true);
    expect(options.removeOnFail).toBe(false);
  });

  it("allows callers to override enqueue options without dropping DLQ retention", () => {
    const options = buildDefaultEnqueueJobOptions({
      attempts: 3,
      jobId: "deterministic-job-id"
    });

    expect(options.attempts).toBe(3);
    expect(options.jobId).toBe("deterministic-job-id");
    expect(options.removeOnFail).toBe(false);
  });

  it("configures worker concurrency and redis connection defaults", () => {
    const options = buildDefaultWorkerOptions();

    expect(options.concurrency).toBe(5);
    expect(options.connection).toBeDefined();
    expect(options.prefix).toBe("fsm");
  });
});
