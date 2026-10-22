import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./client.js", () => {
  const transaction = vi.fn();
  return {
    db: { transaction }
  };
});

import { db } from "./client.js";
import { runTransactionWithRetry } from "./transactions.js";

describe("runTransactionWithRetry", () => {
  afterEach(() => {
    vi.mocked(db.transaction).mockReset();
    vi.unstubAllEnvs();
  });

  it("retries on retryable errors and succeeds", async () => {
    const transactionMock = vi.mocked(db.transaction);
    transactionMock
      .mockRejectedValueOnce({ code: "40P01" })
      .mockImplementationOnce(async (callback) => callback(db as never));

    const result = await runTransactionWithRetry(async () => "ok", {
      maxRetries: 2,
      baseDelayMs: 1
    });

    expect(result).toBe("ok");
    expect(transactionMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry validation failures", async () => {
    const transactionMock = vi.mocked(db.transaction);
    transactionMock.mockRejectedValueOnce(new Error("validation failed"));

    await expect(
      runTransactionWithRetry(async () => "ok", { maxRetries: 3, baseDelayMs: 1 })
    ).rejects.toThrow("validation failed");
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });
});
