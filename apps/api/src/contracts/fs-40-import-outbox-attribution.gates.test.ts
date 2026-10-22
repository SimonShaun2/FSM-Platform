/**
 * FS-40 contract gates — import, internal outbox, attribution.
 * Contract: docs/contracts/fsm.control-plane.import-outbox-attribution.v1.0.0.md
 *
 * Tests are intentionally skipped until FS-11 / FS-15 / FS-29 are Ready and
 * `integration_outbox` lands (FS-3 ADR). They document the negative matrix only.
 */
import { describe, it } from "vitest";

describe.skip("FS-40 import-outbox-attribution gates (blocked — FS-11/15/29)", () => {
  it("CSV-G01 — duplicate idempotencyKey with same payload is a no-op", () => {});
  it("CSV-G02 — partial CSV execute collects row errors", () => {});
  it("CSV-G07 — rollback soft-deletes all rows for importSessionId", () => {});
  it("CSV-G08 — cross-tenant import session returns NOT_FOUND", () => {});
  it("BK-G01 — public booking submit honors Idempotency-Key replay", () => {});
  it("BK-G04 — booking lifecycle shares one correlationId", () => {});
  it("OB-G01 — outbound outbox retries until dead", () => {});
  it("OB-G05 — lastError redacted in activity_events payload", () => {});
  it("P-01 — bookingRequestId only appears in entityRefs, not provenance", () => {});
  it("P-12 — idempotency keys never derived from PII", () => {});
});
