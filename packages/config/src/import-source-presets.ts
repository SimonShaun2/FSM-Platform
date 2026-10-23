/**
 * FS-MIGRATE M1 — export presets for incumbent FSM + QuickBooks (CSV export only).
 */

export type ImportSourcePresetId =
  | "jobber"
  | "jobber_price_book"
  | "housecall_pro"
  | "service_titan"
  | "service_fusion"
  | "service_fusion_price_book"
  | "quickbooks_customers"
  | "quickbooks_desktop_customers"
  | "quickbooks_desktop_items"
  | "quickbooks_items"
  | "quickbooks_invoices"
  | "generic";

export type ImportPresetEntityHint = "customers" | "products" | "invoices";

export interface ImportSourcePreset {
  id: ImportSourcePresetId;
  entity: ImportPresetEntityHint;
  label: string;
  headerAliases: Record<string, string>;
}

const normalizeHeader = (header: string): string => header.trim().toLowerCase();

export const IMPORT_SOURCE_PRESETS: ImportSourcePreset[] = [
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
    // Quirks: customer list export uses "Customer Name" or split first/last; service site is
    // "Service Address" (not billing). Multi-file bundles also ship jobs/invoices separately —
    // this preset only seeds the customers.csv column map (M1).
    id: "service_fusion",
    entity: "customers",
    label: "Service Fusion",
    headerAliases: {
      "customer name": "firstName",
      "contact name": "firstName",
      "first name": "firstName",
      "last name": "lastName",
      email: "email",
      "email address": "email",
      phone: "phone",
      "mobile phone": "phone",
      "service address": "addressLine1",
      "address 1": "addressLine1",
      city: "city",
      state: "state",
      zip: "zip",
      "postal code": "zip"
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
    // Quirks: Desktop customer exports use "Customer" / "Bill To *" columns (not QBO "Billing *").
    // "E-mail" and "Main Phone" are common; IIF exports may differ — extend aliases when golden fixtures land.
    id: "quickbooks_desktop_customers",
    entity: "customers",
    label: "QuickBooks Desktop (customers)",
    headerAliases: {
      "customer": "firstName",
      "customer name": "firstName",
      "name": "firstName",
      "contact": "firstName",
      "e-mail": "email",
      email: "email",
      phone: "phone",
      "main phone": "phone",
      "bill to 1": "addressLine1",
      "bill to line 1": "addressLine1",
      "bill to city": "city",
      "bill to state": "state",
      "bill to zip": "zip"
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

export function inferImportSourcePresetFromHeaders(
  headers: string[],
  entityHint: ImportPresetEntityHint = "customers"
): ImportSourcePresetId | null {
  if (headers.length === 0) {
    return null;
  }

  const normalizedHeaders = new Set(headers.map(normalizeHeader));
  let best: { id: ImportSourcePresetId; score: number } | null = null;

  for (const preset of IMPORT_SOURCE_PRESETS) {
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

export function inferImportSourcePresetForSession(
  headers: string[],
  importEntityType: string
): ImportSourcePresetId | null {
  return inferImportSourcePresetFromHeaders(headers, entityHintFromImportEntityType(importEntityType));
}

export function buildPresetColumnMapping(
  headers: string[],
  presetId: ImportSourcePresetId
): Record<string, string> {
  const preset =
    IMPORT_SOURCE_PRESETS.find((entry) => entry.id === presetId) ??
    IMPORT_SOURCE_PRESETS.find((entry) => entry.id === "generic");

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
