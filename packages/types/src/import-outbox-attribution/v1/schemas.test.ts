import { describe, expect, it } from "vitest";

import {
  AdapterOperationV1Schema,
  AttributionV1Schema,
  buildAdapterIdempotencyKey
} from "./index.js";

describe("import-outbox-attribution v1 schemas", () => {
  it("parses AttributionV1 with import provenance", () => {
    const parsed = AttributionV1Schema.parse({
      schemaVersion: 1,
      segment: "imported",
      provenance: {
        adapterId: "manual_csv_v1",
        externalRef: "session-row-42",
        importSessionId: "11111111-1111-4111-8111-111111111111"
      },
      entityRefs: [{ entityType: "customer", entityId: "22222222-2222-4222-8222-222222222222" }]
    });

    expect(parsed.provenance.adapterId).toBe("manual_csv_v1");
  });

  it("rejects bookingRequestId inside provenance (entityRefs only)", () => {
    expect(() =>
      AttributionV1Schema.parse({
        schemaVersion: 1,
        segment: "unknown",
        provenance: {
          adapterId: "public_booking_v1",
          externalRef: "BR-1001",
          bookingRequestId: "33333333-3333-4333-8333-333333333333"
        },
        entityRefs: []
      })
    ).toThrow();
  });

  it("builds stable adapter idempotency keys", () => {
    expect(buildAdapterIdempotencyKey("manual_csv_v1", "row-9")).toBe("manual_csv_v1:row-9");
  });

  it("parses AdapterOperationV1 envelope", () => {
    const correlationId = "44444444-4444-4444-8444-444444444444";
    const parsed = AdapterOperationV1Schema.parse({
      schemaVersion: 1,
      companyId: "55555555-5555-4555-8555-555555555555",
      kind: "csv_import",
      adapterId: "manual_csv_v1",
      idempotencyKey: "manual_csv_v1:row-9",
      correlationId,
      attribution: {
        schemaVersion: 1,
        segment: "imported",
        provenance: {
          adapterId: "manual_csv_v1",
          externalRef: "row-9",
          importSessionId: "11111111-1111-4111-8111-111111111111"
        },
        entityRefs: []
      },
      payload: { rowNumber: 9 },
      status: "pending",
      attemptCount: 0
    });

    expect(parsed.correlationId).toBe(correlationId);
  });
});
