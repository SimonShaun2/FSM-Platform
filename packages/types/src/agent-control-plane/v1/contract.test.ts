import { describe, expect, it } from "vitest";

import { AppError, ErrorCode } from "../../errors.js";
import { getHttpStatusForErrorCode } from "../../error-http.js";
import { AGENT_CONTROL_PLANE_ERROR_CODES } from "./agent-errors.js";
import {
  buildRecordVersionV1,
  isStaleRecordVersion,
  parseRecordVersionV1
} from "./entity-ref.js";
import { assertIdempotencyPayloadMatches } from "./idempotency.js";

describe("ADR-FS-3 U5 ErrorCode HTTP mapping", () => {
  it("maps POLICY_DENIED to 403", () => {
    expect(getHttpStatusForErrorCode(ErrorCode.POLICY_DENIED)).toBe(403);
  });

  it("maps CONSENT_REQUIRED to 409", () => {
    expect(getHttpStatusForErrorCode(ErrorCode.CONSENT_REQUIRED)).toBe(409);
  });

  it("maps CONFLICT to 409", () => {
    expect(getHttpStatusForErrorCode(ErrorCode.CONFLICT)).toBe(409);
  });
});

describe("agent control plane error code constants", () => {
  it("binds NT-06 stale recordVersion to CONFLICT", () => {
    expect(AGENT_CONTROL_PLANE_ERROR_CODES.staleRecordVersion).toBe(ErrorCode.CONFLICT);
  });

  it("binds NT-03 idempotency mismatch to CONFLICT", () => {
    expect(AGENT_CONTROL_PLANE_ERROR_CODES.idempotencyPayloadMismatch).toBe(ErrorCode.CONFLICT);
  });

  it("binds NT-07 and NT-11 to POLICY_DENIED", () => {
    expect(AGENT_CONTROL_PLANE_ERROR_CODES.toolNotAllowed).toBe(ErrorCode.POLICY_DENIED);
    expect(AGENT_CONTROL_PLANE_ERROR_CODES.moneyStateWithoutApproval).toBe(ErrorCode.POLICY_DENIED);
  });

  it("binds NT-08 to CONSENT_REQUIRED", () => {
    expect(AGENT_CONTROL_PLANE_ERROR_CODES.consentRequired).toBe(ErrorCode.CONSENT_REQUIRED);
  });
});

describe("rv1 recordVersion (U4)", () => {
  const updatedAt = new Date("2026-10-20T12:00:00.000Z");

  it("builds rv1:{entityType}:{entityId}:{iso} tokens", () => {
    const token = buildRecordVersionV1("job", "550e8400-e29b-41d4-a716-446655440000", updatedAt);
    expect(token).toBe(
      "rv1:job:550e8400-e29b-41d4-a716-446655440000:2026-10-20T12:00:00.000Z"
    );
  });

  it("parses valid rv1 tokens", () => {
    const token = buildRecordVersionV1("customer", "abc", updatedAt);
    expect(parseRecordVersionV1(token)).toEqual({
      entityType: "customer",
      entityId: "abc",
      updatedAtIso: "2026-10-20T12:00:00.000Z"
    });
  });

  it("detects stale recordVersion for NT-06", () => {
    const atResolve = buildRecordVersionV1("job", "id-1", updatedAt);
    const atExecute = buildRecordVersionV1("job", "id-1", new Date("2026-10-20T12:00:01.000Z"));
    expect(isStaleRecordVersion(atResolve, atExecute)).toBe(true);
    expect(isStaleRecordVersion(atResolve, atResolve)).toBe(false);
  });
});

describe("idempotency NT-03", () => {
  it("throws CONFLICT when payload fingerprint differs", () => {
    try {
      assertIdempotencyPayloadMatches("fp-a", {
        companyId: "c1",
        idempotencyKey: "k1",
        payloadFingerprint: "fp-b"
      });
      expect.fail("expected AppError");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCode.CONFLICT);
    }
  });
});
