import { afterEach, describe, expect, it, vi } from "vitest";

import { runWithPostgresRetry } from "./postgres-retry.js";

describe("runWithPostgresRetry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retries retryable errors until success", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce({ code: "40001" })
      .mockResolvedValueOnce("done");

    const result = await runWithPostgresRetry(operation, { maxRetries: 2, baseDelayMs: 1 });

    expect(result).toBe("done");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("stops retrying after max attempts", async () => {
    const operation = vi.fn().mockRejectedValue({ code: "40P01" });

    await expect(runWithPostgresRetry(operation, { maxRetries: 1, baseDelayMs: 1 })).rejects.toEqual({ code: "40P01" });
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
