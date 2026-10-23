import { describe, expect, it } from "vitest";

import {
  buildPresetColumnMapping,
  inferImportVendorPresetForSession,
  inferImportVendorPresetFromHeaders
} from "./import-vendor-presets.js";

describe("import-vendor-presets", () => {
  it("infers Jobber from typical export headers", () => {
    expect(
      inferImportVendorPresetFromHeaders([
        "First Name",
        "Last Name",
        "Email",
        "Mobile Phone",
        "Street",
        "City",
        "State",
        "ZIP"
      ])
    ).toBe("jobber");
  });

  it("builds column mapping for matched headers", () => {
    const mapping = buildPresetColumnMapping(["Customer Email", "Customer Phone"], "housecall_pro");
    expect(mapping).toEqual({
      "Customer Email": "email",
      "Customer Phone": "phone"
    });
  });

  it("infers QuickBooks customer export", () => {
    expect(
      inferImportVendorPresetFromHeaders(
        ["Customer display name", "Primary Email", "Primary Phone", "Billing City", "Billing State"],
        "customers"
      )
    ).toBe("quickbooks_customers");
  });

  it("infers QuickBooks invoice export when entity is invoices", () => {
    expect(
      inferImportVendorPresetForSession(
        ["Invoice No", "Customer Name", "Invoice Date", "Due Date", "Balance"],
        "invoices"
      )
    ).toBe("quickbooks_invoices");
  });
});
