import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyLegacyEstimateGetPath,
  isEstimateApprovalTokenShape,
  isRfc4122UuidSegment,
  resolveLegacyEstimateGetRecovery
} from "./legacy-estimate-route";

const STAFF_UUID = "550e8400-e29b-41d4-a716-446655440000";
const LEGACY_TOKEN = "abcdefghijklmnopqrstuvwxyz012345";

describe("classifyLegacyEstimateGetPath", () => {
  it("treats staff UUID paths as authenticated estimate detail (not legacy)", () => {
    expect(classifyLegacyEstimateGetPath(`/estimates/${STAFF_UUID}`)).toEqual({ kind: "staff-estimate" });
  });

  it("does not classify /estimates/new as legacy", () => {
    expect(classifyLegacyEstimateGetPath("/estimates/new")).toEqual({ kind: "reserved" });
  });

  it("rejects random short non-uuid segments without calling API", () => {
    expect(classifyLegacyEstimateGetPath("/estimates/not-a-token")).toEqual({ kind: "invalid-token-shape" });
  });

  it("classifies legacy approval token shape", () => {
    expect(classifyLegacyEstimateGetPath(`/estimates/${LEGACY_TOKEN}`)).toEqual({
      kind: "legacy-token",
      token: LEGACY_TOKEN
    });
  });
});

describe("isEstimateApprovalTokenShape", () => {
  it("matches base64url tokens produced for estimates", () => {
    expect(isEstimateApprovalTokenShape(LEGACY_TOKEN)).toBe(true);
    expect(isRfc4122UuidSegment(STAFF_UUID)).toBe(true);
    expect(isEstimateApprovalTokenShape(STAFF_UUID)).toBe(false);
  });
});

describe("resolveLegacyEstimateGetRecovery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("307 target only when public API validation succeeds (D3)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ estimate: {} }), { status: 200 }));

    const result = await resolveLegacyEstimateGetRecovery(`/estimates/${LEGACY_TOKEN}`, "http://localhost:3001");

    expect(result).toEqual({ action: "redirect-approve", token: LEGACY_TOKEN });
  });

  it("rewrites to /approve for shaped but invalid/expired tokens (same UX as public page)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404 }));

    const result = await resolveLegacyEstimateGetRecovery(`/estimates/${LEGACY_TOKEN}`, "http://localhost:3001");

    expect(result).toEqual({ action: "rewrite-approve", token: LEGACY_TOKEN });
  });

  it("returns not-found for malformed segments", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await resolveLegacyEstimateGetRecovery("/estimates/guess", "http://localhost:3001");

    expect(result).toEqual({ action: "not-found" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("continues normal auth for staff UUID paths", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await resolveLegacyEstimateGetRecovery(`/estimates/${STAFF_UUID}`, "http://localhost:3001");

    expect(result).toEqual({ action: "continue" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails closed when public API is unreachable (no blind redirect)", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const result = await resolveLegacyEstimateGetRecovery(`/estimates/${LEGACY_TOKEN}`, "http://localhost:3001");

    expect(result).toEqual({ action: "rewrite-approve", token: LEGACY_TOKEN });
  });
});
