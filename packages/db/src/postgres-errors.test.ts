import { describe, expect, it } from "vitest";

import { isRetryablePostgresError } from "./postgres-errors.js";

describe("isRetryablePostgresError", () => {
  it("recognizes PostgreSQL deadlock and serialization codes", () => {
    expect(isRetryablePostgresError({ code: "40P01" })).toBe(true);
    expect(isRetryablePostgresError({ code: "40001" })).toBe(true);
    expect(isRetryablePostgresError({ code: "55P03" })).toBe(true);
  });

  it("rejects non-retryable errors", () => {
    expect(isRetryablePostgresError({ code: "23505" })).toBe(false);
    expect(isRetryablePostgresError(new Error("validation failed"))).toBe(false);
  });

  it("matches deadlock wording in messages", () => {
    expect(isRetryablePostgresError(new Error("deadlock detected"))).toBe(true);
  });
});
