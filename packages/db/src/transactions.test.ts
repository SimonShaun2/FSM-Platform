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
    vi.stubEnv("DATABASE_TRANSACTION_MAX_RETRIES", "2");
    vi.stubEnv("DATABASE_TRANSACTION_RETRY_BASE_MS", "1");

    const transactionMock = vi.mocked(db.transaction);
    transactionMock
      .mockRejectedValueOnce({ code: "40P01" })
      .mockImplementationOnce(async (callback) => callback(db as never));

    const result = await runTransactionWithRetry(async () => "ok");

    expect(result).toBe("ok");
    expect(transactionMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry validation failures", async () => {
    vi.stubEnv("DATABASE_TRANSACTION_MAX_RETRIES", "3");

    const transactionMock = vi.mocked(db.transaction);
    transactionMock.mockRejectedValueOnce(new Error("validation failed"));

    await expect(runTransactionWithRetry(async () => "ok")).rejects.toThrow("validation failed");
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });
});
