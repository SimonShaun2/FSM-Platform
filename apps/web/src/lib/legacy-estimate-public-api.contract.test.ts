import { afterEach, describe, expect, it, vi } from "vitest";

import { isPublicEstimateTokenValid } from "./legacy-estimate-route";

const LEGACY_TOKEN = "abcdefghijklmnopqrstuvwxyz012345";

describe("legacy GET public API contract (FS-36 D3)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates tokens with GET /api/v1/public/estimates/:token (no auth headers)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ estimate: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const valid = await isPublicEstimateTokenValid("http://localhost:3001", LEGACY_TOKEN);

    expect(valid).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3001/api/v1/public/estimates/${encodeURIComponent(LEGACY_TOKEN)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      }
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.headers).not.toHaveProperty("Authorization");
  });

  it("treats non-2xx public API responses as invalid (no redirect eligibility)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404 }))
    );

    const valid = await isPublicEstimateTokenValid("http://localhost:3001", LEGACY_TOKEN);

    expect(valid).toBe(false);
  });
});
