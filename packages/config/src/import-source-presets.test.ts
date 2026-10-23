import { describe, expect, it } from "vitest";

import {
  buildPresetColumnMapping,
  inferImportSourcePresetForSession,
  inferImportSourcePresetFromHeaders
} from "./import-source-presets.js";

describe("import-source-presets", () => {
  it("infers Service Fusion from typical export headers", () => {
    expect(
      inferImportSourcePresetFromHeaders([
        "Customer Name",
        "Email Address",
        "Mobile Phone",
        "Service Address",
        "City",
        "State",
        "ZIP"
      ])
    ).toBe("service_fusion");
  });

  it("infers QuickBooks Desktop customer export", () => {
    expect(
      inferImportSourcePresetFromHeaders(
        ["Customer", "E-mail", "Main Phone", "Bill To 1", "Bill To City", "Bill To State"],
        "customers"
      )
    ).toBe("quickbooks_desktop_customers");
  });

  it("builds column mapping for matched headers", () => {
    const mapping = buildPresetColumnMapping(["Customer Email", "Customer Phone"], "housecall_pro");
    expect(mapping).toEqual({
      "Customer Email": "email",
      "Customer Phone": "phone"
    });
  });

  it("infers preset for import session entity type", () => {
    expect(
      inferImportSourcePresetForSession(
        ["Invoice No", "Customer Name", "Invoice Date", "Due Date", "Total", "Balance"],
        "invoices"
      )
    ).toBe("quickbooks_invoices");
  });
});
