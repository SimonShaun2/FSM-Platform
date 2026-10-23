/**
 * MVP migration: CSV exports from incumbent FSM + QuickBooks (export-only — no API sync).
 * Used to seed column mappings before / alongside AI mapping in the import worker.
 */

export type ImportVendorPresetId =
  | "jobber"
  | "housecall_pro"
  | "service_titan"
  | "quickbooks_customers"
  | "quickbooks_items"
  | "quickbooks_invoices"
  | "generic";

/** Aligns with planned import entity uploads (customers shipped; items/invoices P0b/c). */
export type ImportPresetEntityHint = "customers" | "products" | "invoices";

export interface ImportVendorPreset {
  id: ImportVendorPresetId;
  entity: ImportPresetEntityHint;
  label: string;
  headerAliases: Record<string, string>;
}

const normalizeHeader = (header: string): string => header.trim().toLowerCase();

export const IMPORT_VENDOR_PRESETS: ImportVendorPreset[] = [
  {
    id: "jobber",
    entity: "customers",
    label: "Jobber",
    headerAliases: {
      "first name": "firstName",
      "last name": "lastName",
      email: "email",
      phone: "phone",
      "mobile phone": "phone",
      "property name": "addressLine1",
      street: "addressLine1",
      city: "city",
      state: "state",
      zip: "zip",
      "postal code": "zip"
    }
  },
  {
    id: "housecall_pro",
    entity: "customers",
    label: "Housecall Pro",
    headerAliases: {
      "customer first name": "firstName",
      "customer last name": "lastName",
      "customer email": "email",
      "customer phone": "phone",
      "service address": "addressLine1",
      city: "city",
      state: "state",
      zip: "zip"
    }
  },
  {
    id: "service_titan",
    entity: "customers",
    label: "ServiceTitan",
    headerAliases: {
      name: "firstName",
      "customer name": "firstName",
      email: "email",
      phone: "phone",
      address: "addressLine1",
      city: "city",
      state: "state",
      zip: "zip"
    }
  },
  {
    id: "quickbooks_customers",
    entity: "customers",
    label: "QuickBooks Online (customers)",
    headerAliases: {
      "customer display name": "firstName",
      "display name": "firstName",
      "company name": "firstName",
      "first name": "firstName",
      "last name": "lastName",
      "primary email": "email",
      email: "email",
      "primary phone": "phone",
      phone: "phone",
      "billing address line 1": "addressLine1",
      "shipping address line 1": "addressLine1",
      "billing city": "city",
      "billing state": "state",
      "billing zip": "zip"
    }
  },
  {
    id: "quickbooks_items",
    entity: "products",
    label: "QuickBooks Online (products & services)",
    headerAliases: {
      name: "name",
      "product/service name": "name",
      sku: "sku",
      type: "type",
      "sales description": "description",
      description: "description",
      "sales price/rate": "unitPrice",
      price: "unitPrice"
    }
  },
  {
    id: "quickbooks_invoices",
    entity: "invoices",
    label: "QuickBooks Online (invoices)",
    headerAliases: {
      "invoice no": "invoiceNumber",
      "invoice number": "invoiceNumber",
      "customer name": "customerName",
      "invoice date": "issuedAt",
      "due date": "dueAt",
      total: "total",
      balance: "balanceDue",
      amount: "total",
      "payment date": "paidAt",
      "payment method": "paymentMethod"
    }
  },
  {
    id: "generic",
    entity: "customers",
    label: "Generic CSV",
    headerAliases: {
      firstname: "firstName",
      "first name": "firstName",
      lastname: "lastName",
      "last name": "lastName",
      email: "email",
      phone: "phone",
      address: "addressLine1",
      city: "city",
      state: "state",
      zip: "zip"
    }
  }
];

function entityHintFromImportEntityType(entityType: string): ImportPresetEntityHint {
  if (entityType === "invoices") {
    return "invoices";
  }

  if (entityType === "estimates" || entityType === "jobs") {
    return "customers";
  }

  return "customers";
}

export function inferImportVendorPresetFromHeaders(
  headers: string[],
  entityHint: ImportPresetEntityHint = "customers"
): ImportVendorPresetId | null {
  if (headers.length === 0) {
    return null;
  }

  const normalizedHeaders = new Set(headers.map(normalizeHeader));
  let best: { id: ImportVendorPresetId; score: number } | null = null;

  for (const preset of IMPORT_VENDOR_PRESETS) {
    if (preset.id === "generic" || preset.entity !== entityHint) {
      continue;
    }

    const aliasKeys = Object.keys(preset.headerAliases).map(normalizeHeader);
    const score = aliasKeys.filter((key) => normalizedHeaders.has(key)).length;

    if (score >= 3 && (!best || score > best.score)) {
      best = { id: preset.id, score };
    }
  }

  return best?.id ?? null;
}

export function inferImportVendorPresetForSession(
  headers: string[],
  importEntityType: string
): ImportVendorPresetId | null {
  return inferImportVendorPresetFromHeaders(headers, entityHintFromImportEntityType(importEntityType));
}

export function buildPresetColumnMapping(
  headers: string[],
  presetId: ImportVendorPresetId
): Record<string, string> {
  const preset =
    IMPORT_VENDOR_PRESETS.find((entry) => entry.id === presetId) ??
    IMPORT_VENDOR_PRESETS.find((entry) => entry.id === "generic");

  if (!preset) {
    return {};
  }

  const mapping: Record<string, string> = {};

  for (const header of headers) {
    const field = preset.headerAliases[normalizeHeader(header)];
    if (field) {
      mapping[header] = field;
    }
  }

  return mapping;
}
