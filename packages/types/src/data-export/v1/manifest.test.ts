import { describe, expect, it } from "vitest";

import { DATA_EXPORT_MANIFEST_V1, DATA_EXPORT_MANIFEST_VERSION } from "./manifest.js";

describe("DATA_EXPORT_MANIFEST_V1", () => {
  it("keeps a stable version string and entity keys", () => {
    expect(DATA_EXPORT_MANIFEST_V1.version).toBe(DATA_EXPORT_MANIFEST_VERSION);
    expect(Object.keys(DATA_EXPORT_MANIFEST_V1.entities).sort()).toEqual(
      [
        "activity_events",
        "assets",
        "company",
        "customers",
        "estimate_items",
        "estimates",
        "invoice_items",
        "invoices",
        "jobs",
        "payments",
        "product_catalog",
        "properties",
        "users"
      ].sort()
    );
  });

  it("documents payment provider identifiers as excluded", () => {
    expect(DATA_EXPORT_MANIFEST_V1.entities.payments.excludedFields).toContain("stripePaymentIntentId");
    expect(DATA_EXPORT_MANIFEST_V1.entities.customers.excludedFields).toContain("stripeCustomerId");
  });
});
