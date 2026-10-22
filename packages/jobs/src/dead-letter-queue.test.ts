import type { Job } from "bullmq";
import { describe, expect, it } from "vitest";

import { QUEUE_PLATFORM_CONTRACT_VERSION } from "@fsm/types";

import {
  buildDeadLetterEnvelope,
  buildDeadLetterQueueName,
  isJobExhausted
} from "./dead-letter-job.js";

function mockJob(partial: {
  id: string;
  name: string;
  data: Record<string, unknown>;
  attemptsMade: number;
  attempts?: number;
}): Job<Record<string, unknown>> {
  return {
    id: partial.id,
    name: partial.name,
    data: partial.data,
    attemptsMade: partial.attemptsMade,
    opts: { attempts: partial.attempts ?? 5 }
  } as Job<Record<string, unknown>>;
}

describe("isJobExhausted", () => {
  it("returns false while attempts remain", () => {
    const job = mockJob({
      id: "1",
      name: "work",
      data: {},
      attemptsMade: 2,
      attempts: 5
    });

    expect(isJobExhausted(job)).toBe(false);
  });

  it("returns true when attemptsMade reaches configured attempts", () => {
    const job = mockJob({
      id: "1",
      name: "work",
      data: {},
      attemptsMade: 5,
      attempts: 5
    });

    expect(isJobExhausted(job)).toBe(true);
  });

  it("defaults to one attempt when opts.attempts is missing", () => {
    const job = mockJob({
      id: "1",
      name: "work",
      data: {},
      attemptsMade: 1
    });
    job.opts = {};

    expect(isJobExhausted(job)).toBe(true);
  });
});

describe("buildDeadLetterEnvelope", () => {
  it("builds a contract-shaped envelope with optional companyId", () => {
    const companyId = "11111111-1111-4111-8111-111111111111";
    const job = mockJob({
      id: "job-42",
      name: "send-sms",
      data: { companyId, foo: "bar" },
      attemptsMade: 5,
      attempts: 5
    });

    const envelope = buildDeadLetterEnvelope("fsm:notifications", job, new Error("timeout"));

    expect(envelope.contractVersion).toBe(QUEUE_PLATFORM_CONTRACT_VERSION);
    expect(envelope.sourceQueue).toBe("fsm:notifications");
    expect(envelope.sourceJobId).toBe("job-42");
    expect(envelope.jobName).toBe("send-sms");
    expect(envelope.companyId).toBe(companyId);
    expect(envelope.payload).toEqual({ companyId, foo: "bar" });
    expect(envelope.attemptsMade).toBe(5);
    expect(envelope.failureClass).toBe("transient");
    expect(envelope.errorMessage).toBe("timeout");
    expect(envelope.failedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("omits companyId when payload is not tenant-scoped", () => {
    const job = mockJob({
      id: "2",
      name: "nightly",
      data: { scope: "system" },
      attemptsMade: 3,
      attempts: 3
    });

    const envelope = buildDeadLetterEnvelope("fsm:ai", job, new Error("boom"));

    expect(envelope.companyId).toBeUndefined();
    expect(envelope.failureClass).toBe("unknown");
  });
});

describe("buildDeadLetterQueueName", () => {
  it("suffixes the source queue with -dlq", () => {
    expect(buildDeadLetterQueueName("fsm:notifications")).toBe("fsm:notifications-dlq");
  });
});
