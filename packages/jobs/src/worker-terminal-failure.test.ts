import type { Job } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forwardJobToDeadLetter } from "./dead-letter-queue.js";
import { handleWorkerJobFailed } from "./worker-terminal-failure.js";

vi.mock("./dead-letter-queue.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./dead-letter-queue.js")>();
  return {
    ...actual,
    forwardJobToDeadLetter: vi.fn().mockResolvedValue(undefined)
  };
});

function mockJob(attemptsMade: number, attempts = 5): Job<Record<string, unknown>> {
  return {
    id: "99",
    name: "work",
    data: { companyId: "11111111-1111-4111-8111-111111111111" },
    attemptsMade,
    opts: { attempts }
  } as Job<Record<string, unknown>>;
}

describe("handleWorkerJobFailed", () => {
  beforeEach(() => {
    vi.mocked(forwardJobToDeadLetter).mockClear();
  });

  it("does nothing when job is missing", async () => {
    await handleWorkerJobFailed("fsm:notifications", undefined, new Error("fail"));

    expect(forwardJobToDeadLetter).not.toHaveBeenCalled();
  });

  it("does not forward while retries remain", async () => {
    await handleWorkerJobFailed(
      "fsm:notifications",
      mockJob(2, 5),
      new Error("transient")
    );

    expect(forwardJobToDeadLetter).not.toHaveBeenCalled();
  });

  it("forwards to DLQ when attempts are exhausted", async () => {
    const job = mockJob(5, 5);
    const error = new Error("permanent");

    await handleWorkerJobFailed("fsm:notifications", job, error);

    expect(forwardJobToDeadLetter).toHaveBeenCalledOnce();
    expect(forwardJobToDeadLetter).toHaveBeenCalledWith("fsm:notifications", job, error);
  });
});
