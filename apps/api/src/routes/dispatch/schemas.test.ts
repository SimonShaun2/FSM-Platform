import { describe, expect, it } from "vitest";

import { DispatchDateQuerySchema, DispatchStreamDateQuerySchema } from "./schemas.js";

describe("dispatch query schemas", () => {
  it("DispatchDateQuerySchema rejects access_token (non-stream routes)", () => {
    const result = DispatchDateQuerySchema.safeParse({
      date: "2026-10-15",
      access_token: "jwt"
    });
    expect(result.success).toBe(false);
  });

  it("DispatchStreamDateQuerySchema accepts date and access_token", () => {
    const result = DispatchStreamDateQuerySchema.safeParse({
      date: "2026-10-15",
      access_token: "jwt"
    });
    expect(result.success).toBe(true);
  });
});
