import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/src/lib/api";
import { publicApi, resolvePublicApiBase } from "@/src/lib/public-api";

describe("resolvePublicApiBase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty string in the browser for same-origin rewrite", () => {
    vi.stubGlobal("window", {} as Window);

    expect(resolvePublicApiBase()).toBe("");
  });

  it("returns API_URL on the server for direct API fetch", () => {
    vi.stubGlobal("window", undefined);
    vi.stubEnv("API_URL", "http://api.internal:3001/");

    expect(resolvePublicApiBase()).toBe("http://api.internal:3001");
  });
});

describe("publicApi path security", () => {
  it("rejects traversal segments before fetch", async () => {
    await expect(publicApi.get("/api/v1/public/booking/../secrets")).rejects.toMatchObject({
      status: 400,
      payload: { error: "VALIDATION_ERROR" }
    } satisfies Partial<ApiError>);
  });
});
