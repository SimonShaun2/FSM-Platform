import { describe, expect, it } from "vitest";

import { ErrorCode } from "@fsm/types";

import {
  assertFetchUrlAllowedForScan,
  normalizeGrowthCheckTargetUrl
} from "./ssrf-allowlist.js";

describe("growth-check SSRF allowlist", () => {
  it("rejects localhost and private network hosts", () => {
    expect(() => normalizeGrowthCheckTargetUrl("http://127.0.0.1")).toThrowError(
      expect.objectContaining({ code: ErrorCode.FORBIDDEN })
    );
    expect(() => normalizeGrowthCheckTargetUrl("https://192.168.0.5")).toThrowError(
      expect.objectContaining({ code: ErrorCode.FORBIDDEN })
    );
  });

  it("allows public https targets", () => {
    const url = normalizeGrowthCheckTargetUrl("https://example-cleaning.com");
    expect(url.hostname).toBe("example-cleaning.com");
  });

  it("blocks cross-origin fetch paths", () => {
    const origin = normalizeGrowthCheckTargetUrl("https://example-cleaning.com");
    expect(() => assertFetchUrlAllowedForScan(origin, "https://evil.example/phish")).toThrowError(
      expect.objectContaining({ code: ErrorCode.FORBIDDEN })
    );
  });

  it("allows relative paths on the same origin", () => {
    const origin = normalizeGrowthCheckTargetUrl("https://example-cleaning.com");
    const resolved = assertFetchUrlAllowedForScan(origin, "/contact");
    expect(resolved.href).toBe("https://example-cleaning.com/contact");
  });
});
